import { useMemo, useState, useEffect } from 'react';
import { PiArrowsClockwise, PiReceipt, PiFileText, PiCheckCircle, PiHourglassMedium } from 'react-icons/pi';
import { usePiutangStore, TIPE_TRANSAKSI_LABELS, type StatusBast, type TipeTransaksi, type KavlingTagihan } from '../../store/piutangStore';
import { fetchApi } from '../../lib/api';
import { useProyekStore } from '../../store/proyekStore';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import Panel, { TableScroll } from '../../components/ui/Panel';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Money from '../../components/ui/Money';
import Notice from '../../components/ui/Notice';
import EmptyState from '../../components/ui/EmptyState';
import ExportButton from '../../components/ui/ExportButton';
import { StatGrid, StatTile } from '../../components/ui/StatTile';
import { buildFilename } from '../../utils/exportUtils';
import { bulanIni, formatBulan, formatRupiah } from '../../utils/format';
import JadwalRealisasiModal from './piutang/JadwalRealisasiModal';

const dibayarOf = (kv: KavlingTagihan) => kv.periodeAngsuran.reduce((s, p) => s + p.dibayar, 0);
const sisaOf = (kv: KavlingTagihan) => Math.max(0, kv.nilaiSppr - dibayarOf(kv));

export default function PiutangPage() {
  const { items, fetchItems } = usePiutangStore();
  const { items: proyeks } = useProyekStore();

  useEffect(() => {
    fetchItems();
    useProyekStore.getState().fetch();
  }, [fetchItems]);

  const [selectedProyek, setSelectedProyek] = useState('');
  const [selectedBast, setSelectedBast] = useState<StatusBast | 'semua'>('belum_bast');
  const [selectedTipe, setSelectedTipe] = useState<TipeTransaksi | ''>('');
  const [selectedKavlingId, setSelectedKavlingId] = useState<string | null>(null);

  // Simulasi integrasi Podo Rukun Track sampai API tersedia
  const [apiError, setApiError] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  const periode = formatBulan(bulanIni());
  const getProyekNama = (id: string) => proyeks.find((p) => p.id === id)?.nama ?? id;

  const filteredItems = useMemo(
    () =>
      items.filter(
        (kv) =>
          (!selectedProyek || kv.proyekId === selectedProyek) &&
          (selectedBast === 'semua' || kv.statusBast === selectedBast) &&
          (!selectedTipe || kv.tipeTransaksi === selectedTipe),
      ),
    [items, selectedProyek, selectedBast, selectedTipe],
  );

  const totals = filteredItems.reduce(
    (acc, kv) => ({ nilai: acc.nilai + kv.nilaiSppr, dibayar: acc.dibayar + dibayarOf(kv), sisa: acc.sisa + sisaOf(kv) }),
    { nilai: 0, dibayar: 0, sisa: 0 },
  );

  const handleSinkron = async () => {
    setSyncLoading(true);
    setApiError(false);
    try {
      const res = await fetchApi('/sinkron/jalankan', { method: 'POST' });
      if (!res.ok) throw new Error('Gagal sinkronisasi');

      await fetchItems();
      setSyncedAt(new Date());
    } catch {
      setApiError(true);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Tagihan user"
        description={`Kavling belum serah terima, ${periode}`}
        actions={
          <Button variant="primary" icon={PiArrowsClockwise} loading={syncLoading} onClick={handleSinkron}>
            Sinkron Podorukun Track
          </Button>
        }
      />

      <PageBody>
        {apiError && (
          <Notice
            tone="danger"
            title="Data Podo Rukun Track gagal dimuat"
            action={
              <Button size="sm" onClick={handleSinkron}>
                Coba lagi
              </Button>
            }
          >
            API tidak merespons. Angka di bawah adalah data terakhir yang tersimpan, jangan dibaca sebagai lunas.
          </Notice>
        )}
        {syncedAt && !apiError && (
          <Notice tone="positive">
            Tersinkron dengan Podo Rukun Track pukul {syncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.
          </Notice>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <div>
            <label htmlFor="p-proyek" className="field-label">Proyek</label>
            <select id="p-proyek" className="control" value={selectedProyek} onChange={(e) => setSelectedProyek(e.target.value)}>
              <option value="">Semua proyek</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-bast" className="field-label">Status serah terima</label>
            <select id="p-bast" className="control" value={selectedBast} onChange={(e) => setSelectedBast(e.target.value as StatusBast | 'semua')}>
              <option value="belum_bast">Belum BAST</option>
              <option value="sudah_bast">Sudah BAST</option>
              <option value="semua">Semua status</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="p-tipe" className="field-label">Tipe transaksi</label>
            <select id="p-tipe" className="control" value={selectedTipe} onChange={(e) => setSelectedTipe(e.target.value as TipeTransaksi | '')}>
              <option value="">Semua tipe</option>
              {(Object.keys(TIPE_TRANSAKSI_LABELS) as TipeTransaksi[]).map((t) => (
                <option key={t} value={t}>{TIPE_TRANSAKSI_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <StatGrid columns={3}>
          <StatTile color="#1e293b" icon={PiFileText} label="Nilai kontrak (SPPR)" value={formatRupiah(totals.nilai)} hint={`${filteredItems.length} kavling`} />
          <StatTile color="#0e6b45" icon={PiCheckCircle} label="Sudah dibayar" value={formatRupiah(totals.dibayar)} />
          <StatTile emphasis color="#047857" icon={PiHourglassMedium} label="Sisa tagihan" value={formatRupiah(totals.sisa)} />
        </StatGrid>

        <Notice>
          Sisa tagihan bersifat operasional dan belum diakui sebagai piutang di neraca. Saldo akuntansinya tercatat sebagai uang muka
          penjualan.
        </Notice>

        <Panel
          title="Tagihan per kavling"
          description="Klik baris untuk melihat jadwal angsuran dan realisasinya."
          flush
          actions={
            <ExportButton
              getColumns={() => [
                { header: 'Nama User', key: 'namaUser', width: 25 },
                { header: 'No. Kavling', key: 'nomorKavling', width: 15 },
                { header: 'Proyek', key: 'proyek', width: 20 },
                { header: 'Tipe Transaksi', key: 'tipe', width: 15 },
                { header: 'Nilai SPPR', key: 'nilaiSppr', isNumber: true, width: 18 },
                { header: 'Total Dibayar', key: 'dibayar', isNumber: true, width: 18 },
                { header: 'Sisa Tagihan', key: 'sisa', isNumber: true, width: 18 },
                { header: 'Status BAST', key: 'statusBast', width: 15 },
              ]}
              getData={() => [
                ...filteredItems.map((kv) => ({
                  namaUser: kv.namaUser,
                  nomorKavling: kv.nomorKavling,
                  proyek: getProyekNama(kv.proyekId),
                  tipe: TIPE_TRANSAKSI_LABELS[kv.tipeTransaksi],
                  nilaiSppr: kv.nilaiSppr,
                  dibayar: dibayarOf(kv),
                  sisa: sisaOf(kv),
                  statusBast: kv.statusBast === 'belum_bast' ? 'Belum BAST' : 'Sudah BAST',
                })),
                { namaUser: 'TOTAL', nomorKavling: '', proyek: '', tipe: '', nilaiSppr: totals.nilai, dibayar: totals.dibayar, sisa: totals.sisa, statusBast: '' },
              ]}
              opts={{
                namaLaporan: 'Laporan Tagihan User per Kavling (Pre-BAST)',
                proyek: selectedProyek ? getProyekNama(selectedProyek) : 'Semua Proyek',
                periode,
                filenameBase: buildFilename('Tagihan_User', selectedProyek ? getProyekNama(selectedProyek) : undefined, periode),
              }}
            />
          }
        >
          {filteredItems.length === 0 ? (
            <EmptyState
              compact
              icon={PiReceipt}
              title="Tidak ada tagihan untuk filter ini"
              description="Ubah proyek, status serah terima, atau tipe transaksi."
            />
          ) : (
            <TableScroll label="Tagihan per kavling">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">User / kavling</th>
                    <th scope="col">Tipe</th>
                    <th scope="col" className="num">Nilai SPPR</th>
                    <th scope="col" className="num">Dibayar</th>
                    <th scope="col" className="num">Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((kv) => {
                    const sisa = sisaOf(kv);
                    return (
                      <tr
                        key={kv.id}
                        data-clickable=""
                        tabIndex={0}
                        aria-label={`Jadwal angsuran ${kv.namaUser}, ${kv.nomorKavling}`}
                        onClick={() => setSelectedKavlingId(kv.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedKavlingId(kv.id);
                          }
                        }}
                      >
                        <td>
                          <p className="font-semibold text-ink">{kv.namaUser}</p>
                          <p className="mt-0.5 text-xs text-ink-3">
                            {kv.nomorKavling}, {getProyekNama(kv.proyekId)}
                          </p>
                        </td>
                        <td>
                          <Badge>{TIPE_TRANSAKSI_LABELS[kv.tipeTransaksi]}</Badge>
                        </td>
                        <td className="num"><Money value={kv.nilaiSppr} /></td>
                        <td className="num"><Money value={dibayarOf(kv)} /></td>
                        <td className="num font-semibold">
                          {sisa === 0 ? <Badge tone="positive">Lunas</Badge> : <Money value={sisa} className="text-ink" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total</td>
                    <td className="num"><Money value={totals.nilai} /></td>
                    <td className="num"><Money value={totals.dibayar} /></td>
                    <td className="num"><Money value={totals.sisa} /></td>
                  </tr>
                </tfoot>
              </table>
            </TableScroll>
          )}
        </Panel>
      </PageBody>

      <JadwalRealisasiModal kavlingId={selectedKavlingId} isOpen={selectedKavlingId !== null} onClose={() => setSelectedKavlingId(null)} />
    </>
  );
}
