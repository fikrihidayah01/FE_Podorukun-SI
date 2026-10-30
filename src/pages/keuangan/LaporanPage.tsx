import { useEffect, useState } from 'react';
import { PiFileText, PiMagnifyingGlass } from 'react-icons/pi';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Money from '../../components/ui/Money';
import Panel, { TableScroll } from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';
import Notice from '../../components/ui/Notice';
import ExportButton from '../../components/ui/ExportButton';
import { fetchApi } from '../../lib/api';
import { useCoaStore } from '../../store/coaStore';
import { useProyekStore } from '../../store/proyekStore';

type ReportRow = Record<string, string | number | null>;

const REPORT_TITLES: Record<string, string> = {
  'saldo-akun': 'Neraca Saldo',
  'buku-besar': 'Buku Besar',
  'saldo-kode-pembantu': 'Saldo Kode Pembantu',
};

const NUMERIC_COLS = new Set([
  'saldoAwalDebit',
  'saldoAwalKredit',
  'mutasiDebit',
  'mutasiKredit',
  'saldo',
  'debit',
  'kredit',
  'saldoAwal',
  'mutasiBulan',
  'saldoAkhir',
]);

const LABELS: Record<string, string> = {
  kodeAkun: 'Kode akun',
  namaAkun: 'Nama akun',
  saldoAwalDebit: 'Awal debit',
  saldoAwalKredit: 'Awal kredit',
  mutasiDebit: 'Mutasi debit',
  mutasiKredit: 'Mutasi kredit',
  saldo: 'Saldo',
  tanggal: 'Tanggal',
  nomorJurnal: 'Nomor jurnal',
  keterangan: 'Keterangan',
  debit: 'Debit',
  kredit: 'Kredit',
  kode: 'Kode',
  nama: 'Nama',
  saldoAwal: 'Saldo awal',
  mutasiBulan: 'Mutasi bulan',
  saldoAkhir: 'Saldo akhir',
};

export default function LaporanPage() {
  const { items: akuns, fetch: fetchAkuns } = useCoaStore();
  const { items: proyeks, fetch: fetchProyeks } = useProyekStore();
  const [jenis, setJenis] = useState('saldo-akun');
  const [proyekId, setProyekId] = useState('');
  const [akunId, setAkunId] = useState('');
  const [dari, setDari] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [sampai, setSampai] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [meta, setMeta] = useState<{ saldoAwal?: number; saldoAkhir?: number }>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchAkuns();
    void fetchProyeks();
  }, [fetchAkuns, fetchProyeks]);

  const load = async () => {
    setError('');
    setRows(null);
    setMeta({});
    if (jenis === 'buku-besar' && (!akunId || dari > sampai)) {
      setError('Pilih akun dan rentang tanggal yang benar.');
      return;
    }
    setBusy(true);
    try {
      const query = new URLSearchParams();
      if (proyekId) query.set('proyekId', proyekId);
      if (jenis === 'buku-besar') {
        query.set('akunId', akunId);
        query.set('dari', dari);
      }
      if (jenis === 'saldo-kode-pembantu') {
        query.set('bulan', sampai.slice(0, 7));
      } else {
        query.set('sampai', sampai);
      }
      const res = await fetchApi(`/laporan/${jenis}?${query}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Gagal memuat laporan');
      setRows(
        jenis === 'saldo-kode-pembantu'
          ? body.data.map(
              (row: {
                kodePembantu: { kode: string; nama: string };
                saldoAwal: number;
                mutasiBulan: number;
                saldoAkhir: number;
              }) => ({
                ...row,
                kode: row.kodePembantu.kode,
                nama: row.kodePembantu.nama,
              }),
            )
          : body.data,
      );
      setMeta(body.meta || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
    } finally {
      setBusy(false);
    }
  };

  const columns =
    jenis === 'saldo-akun'
      ? ['kodeAkun', 'namaAkun', 'saldoAwalDebit', 'saldoAwalKredit', 'mutasiDebit', 'mutasiKredit', 'saldo']
      : jenis === 'buku-besar'
      ? ['tanggal', 'nomorJurnal', 'keterangan', 'debit', 'kredit', 'saldo']
      : ['kode', 'nama', 'saldoAwal', 'mutasiBulan', 'saldoAkhir'];

  const reportTitle = REPORT_TITLES[jenis] || 'Laporan keuangan';
  const selectedProyek = proyeks.find((p) => p.id === proyekId);

  return (
    <>
      <PageHeader
        title="Laporan keuangan"
        description="Saldo akun, buku besar, dan saldo kode pembantu dari pembukuan backend"
      />

      <PageBody>
        <form
          className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <div>
            <label htmlFor="f-jenis" className="field-label">
              Jenis laporan
            </label>
            <select
              id="f-jenis"
              className="control"
              aria-label="Jenis laporan"
              value={jenis}
              onChange={(e) => {
                setJenis(e.target.value);
                setRows(null);
              }}
            >
              <option value="saldo-akun">Neraca saldo</option>
              <option value="buku-besar">Buku besar</option>
              <option value="saldo-kode-pembantu">Saldo kode pembantu</option>
            </select>
          </div>

          <div>
            <label htmlFor="f-proyek" className="field-label">
              Proyek
            </label>
            <select
              id="f-proyek"
              className="control"
              aria-label="Proyek"
              value={proyekId}
              onChange={(e) => setProyekId(e.target.value)}
            >
              <option value="">Semua proyek</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>

          {jenis === 'buku-besar' && (
            <>
              <div>
                <label htmlFor="f-akun" className="field-label">
                  Akun
                </label>
                <select
                  id="f-akun"
                  className="control"
                  aria-label="Akun"
                  required
                  value={akunId}
                  onChange={(e) => setAkunId(e.target.value)}
                >
                  <option value="">Pilih akun</option>
                  {akuns.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.kodeAkun} — {a.namaAkun}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="f-dari" className="field-label">
                  Dari tanggal
                </label>
                <input
                  id="f-dari"
                  className="control"
                  type="date"
                  required
                  value={dari}
                  onChange={(e) => setDari(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="f-sampai" className="field-label">
              {jenis === 'saldo-kode-pembantu' ? 'Bulan' : 'Sampai tanggal'}
            </label>
            <input
              id="f-sampai"
              className="control"
              required
              type={jenis === 'saldo-kode-pembantu' ? 'month' : 'date'}
              value={jenis === 'saldo-kode-pembantu' ? sampai.slice(0, 7) : sampai}
              onChange={(e) =>
                setSampai(jenis === 'saldo-kode-pembantu' ? e.target.value + '-01' : e.target.value)
              }
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={busy}
              icon={PiMagnifyingGlass}
              className="w-full sm:w-auto"
            >
              {busy ? 'Memuat…' : 'Tampilkan'}
            </Button>
          </div>
        </form>

        {error && (
          <Notice tone="danger" className="mb-4">
            {error}
          </Notice>
        )}

        {rows && (
          <Panel
            title={reportTitle}
            description={
              meta.saldoAwal !== undefined || meta.saldoAkhir !== undefined ? (
                <span className="flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-2">
                  {meta.saldoAwal !== undefined && (
                    <span>
                      Saldo awal: <Money value={meta.saldoAwal} />
                    </span>
                  )}
                  {meta.saldoAkhir !== undefined && (
                    <span>
                      Saldo akhir: <Money value={meta.saldoAkhir} />
                    </span>
                  )}
                </span>
              ) : undefined
            }
            flush
            actions={
              <ExportButton
                opts={{
                  namaLaporan: reportTitle,
                  filenameBase: `laporan_${jenis}`,
                  proyek: selectedProyek?.nama ?? 'Semua Proyek',
                  periode:
                    jenis === 'saldo-kode-pembantu'
                      ? sampai.slice(0, 7)
                      : `${dari} s/d ${sampai}`,
                }}
                getColumns={() =>
                  columns.map((c) => ({
                    header: LABELS[c] || c,
                    key: c,
                    isNumber: NUMERIC_COLS.has(c),
                    width: NUMERIC_COLS.has(c) ? 18 : 22,
                  }))
                }
                getData={() => rows}
              />
            }
          >
            {rows.length === 0 ? (
              <EmptyState
                compact
                icon={PiFileText}
                title="Tidak ada transaksi untuk filter ini"
                description="Ubah parameter tanggal, proyek, atau akun untuk melihat mutasi lainnya."
              />
            ) : (
              <TableScroll label={reportTitle}>
                <table className="tbl">
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th
                          key={c}
                          scope="col"
                          className={NUMERIC_COLS.has(c) ? 'num' : ''}
                        >
                          {LABELS[c] || c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        {columns.map((c) => {
                          const val = row[c];
                          const isNum = NUMERIC_COLS.has(c);
                          return (
                            <td key={c} className={isNum ? 'num' : ''}>
                              {typeof val === 'number' ? (
                                <Money value={val} />
                              ) : (
                                String(val ?? '—')
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      {jenis === 'saldo-akun' && (
                        <>
                          <td colSpan={2}>Total</td>
                          <td className="num">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.saldoAwalDebit) || 0),
                                0,
                              )}
                            />
                          </td>
                          <td className="num">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.saldoAwalKredit) || 0),
                                0,
                              )}
                            />
                          </td>
                          <td className="num">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.mutasiDebit) || 0),
                                0,
                              )}
                            />
                          </td>
                          <td className="num">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.mutasiKredit) || 0),
                                0,
                              )}
                            />
                          </td>
                          <td className="num font-bold">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.saldo) || 0),
                                0,
                              )}
                            />
                          </td>
                        </>
                      )}
                      {jenis === 'buku-besar' && (
                        <>
                          <td colSpan={3}>Total</td>
                          <td className="num">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.debit) || 0),
                                0,
                              )}
                            />
                          </td>
                          <td className="num">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.kredit) || 0),
                                0,
                              )}
                            />
                          </td>
                          <td className="num font-bold">
                            <Money
                              value={
                                meta.saldoAkhir ??
                                (rows.length > 0
                                  ? Number(rows[rows.length - 1].saldo) || 0
                                  : 0)
                              }
                            />
                          </td>
                        </>
                      )}
                      {jenis === 'saldo-kode-pembantu' && (
                        <>
                          <td colSpan={2}>Total</td>
                          <td className="num">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.saldoAwal) || 0),
                                0,
                              )}
                            />
                          </td>
                          <td className="num">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.mutasiBulan) || 0),
                                0,
                              )}
                            />
                          </td>
                          <td className="num font-bold">
                            <Money
                              value={rows.reduce(
                                (s, r) => s + (Number(r.saldoAkhir) || 0),
                                0,
                              )}
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </TableScroll>
            )}
          </Panel>
        )}
      </PageBody>
    </>
  );
}
