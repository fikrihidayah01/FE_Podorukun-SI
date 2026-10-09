import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PiClockCounterClockwise, PiMagnifyingGlass } from 'react-icons/pi';
import { useHutangStore, KATEGORI_HUTANG_LABELS } from '../../../store/hutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import PageHeader, { PageBody } from '../../../components/ui/PageHeader';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import EmptyState from '../../../components/ui/EmptyState';
import ExportButton from '../../../components/ui/ExportButton';
import { buildFilename } from '../../../utils/exportUtils';
import { formatTanggal } from '../../../utils/format';
import { KATEGORI_HUTANG_HEX } from '../../../config/theme';

export default function DetailKodePembantuPage() {
  const { kodePembantuId } = useParams<{ kodePembantuId: string }>();
  const { kodePembantus, getMutasiByKodePembantu, fetchKodePembantus, fetchMutasiByKodePembantu, isLoading } = useHutangStore();

  useEffect(() => {
    useProyekStore.getState().fetch();
    fetchKodePembantus();
    if (kodePembantuId) {
      fetchMutasiByKodePembantu(kodePembantuId);
    }
  }, [kodePembantuId]);
  const { items: proyeks } = useProyekStore();

  const kp = kodePembantus.find((k) => k.id === kodePembantuId);
  const mutasis = kodePembantuId ? getMutasiByKodePembantu(kodePembantuId) : [];
  const proyekNama = proyeks.find((p) => p.id === kp?.proyekId)?.nama ?? '-';
  const back = { to: '/keuangan/hutang', label: 'Hutang' };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Kode pembantu" back={back} />
        <PageBody>
          <Panel>
            <div className="py-8 text-center text-sm text-ink-3">Memuat data pihak...</div>
          </Panel>
        </PageBody>
      </>
    );
  }

  if (!kp) {
    return (
      <>
        <PageHeader title="Kode pembantu" back={back} />
        <PageBody>
          <Panel>
            <EmptyState
              icon={PiMagnifyingGlass}
              title="Kode pembantu tidak ditemukan"
              description="Mungkin sudah dihapus atau tautannya salah. Kembali ke halaman Hutang untuk memilih pihak lain."
            />
          </Panel>
        </PageBody>
      </>
    );
  }

  const rows = mutasis.reduce<((typeof mutasis)[number] & { saldo: number })[]>((acc, m) => {
    const prev = acc.length ? acc[acc.length - 1].saldo : 0;
    acc.push({ ...m, saldo: prev + (m.jenisMutasi === 'kredit' ? m.nominal : -m.nominal) });
    return acc;
  }, []);
  const running = rows.length ? rows[rows.length - 1].saldo : 0;

  return (
    <>
      <PageHeader
        back={back}
        title={kp.nama}
        status={<Badge color={KATEGORI_HUTANG_HEX[kp.kategori]}>{KATEGORI_HUTANG_LABELS[kp.kategori]}</Badge>}
        description={`Kartu hutang, ${proyekNama}`}
        actions={
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-ink-3">Saldo akhir</p>
              <p className="text-xl font-bold text-ink">
                <Money value={running} />
              </p>
            </div>
          </div>
        }
      />

      <PageBody>
        <Panel
          title="Riwayat mutasi"
          description="Debit mengurangi hutang, kredit menambah hutang. Tanggal dalam format dd/mm/yyyy."
          flush
          actions={
            <ExportButton
              getColumns={() => [
                { header: 'Tanggal (dd/mm/yyyy)', key: 'tanggal', width: 16 },
                { header: 'Uraian', key: 'uraian', width: 35 },
                { header: 'Debit', key: 'debit', isNumber: true, width: 18 },
                { header: 'Kredit', key: 'kredit', isNumber: true, width: 18 },
                { header: 'Saldo Berjalan', key: 'saldo', isNumber: true, width: 20 },
              ]}
              getData={() =>
                rows.map((r) => ({
                  tanggal: formatTanggal(r.tanggal),
                  uraian: r.uraian,
                  debit: r.jenisMutasi === 'debit' ? r.nominal : null,
                  kredit: r.jenisMutasi === 'kredit' ? r.nominal : null,
                  saldo: r.saldo,
                }))
              }
              opts={{
                namaLaporan: `Kartu Hutang: ${kp.nama}`,
                proyek: proyekNama,
                filenameBase: buildFilename(`Kartu_Hutang_${kp.nama.replace(/\s+/g, '_')}`, proyekNama),
              }}
            />
          }
        >
          {rows.length === 0 ? (
            <EmptyState compact icon={PiClockCounterClockwise} title="Belum ada mutasi" description="Mutasi untuk pihak ini akan tercatat di sini setelah diinput atau diposting dari jurnal." />
          ) : (
            <TableScroll label={`Riwayat mutasi ${kp.nama}`}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Uraian</th>
                    <th scope="col" className="num">Debit</th>
                    <th scope="col" className="num">Kredit</th>
                    <th scope="col" className="num">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap tabular-nums">{formatTanggal(row.tanggal)}</td>
                      <td className="text-ink">{row.uraian}</td>
                      <td className="num">{row.jenisMutasi === 'debit' ? <Money value={row.nominal} /> : <span className="text-ink-3">-</span>}</td>
                      <td className="num">{row.jenisMutasi === 'kredit' ? <Money value={row.nominal} /> : <span className="text-ink-3">-</span>}</td>
                      <td className="num font-semibold text-ink"><Money value={row.saldo} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
