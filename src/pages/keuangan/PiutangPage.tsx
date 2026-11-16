import { useMemo, useState, useEffect } from 'react';
import { PiArrowsClockwise, PiReceipt, PiFileText, PiCheckCircle, PiHourglassMedium, PiTrendUp } from 'react-icons/pi';
import { usePiutangStore, TIPE_TRANSAKSI_LABELS, type TipeTransaksi, type KavlingTagihan } from '../../store/piutangStore';
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
import { bulanIni, formatBulan, formatRupiah, formatTanggal } from '../../utils/format';
import PiutangActions from './piutang/PiutangActions';
import PembayaranTrackPanel from './piutang/PembayaranTrackPanel';
import JadwalRealisasiModal from './piutang/JadwalRealisasiModal';
import { apiError as toApiError } from '../../lib/errors';

const dibayarOf = (kv: KavlingTagihan) => kv.totalDibayar;
const sisaOf = (kv: KavlingTagihan) => kv.sisa;

export default function PiutangPage() {
  const { items, fetchItems, isLoading, error: loadError } = usePiutangStore();
  const { items: proyeks } = useProyekStore();

  useEffect(() => {
    fetchItems();
    useProyekStore.getState().fetch();
  }, [fetchItems]);

  const [selectedProyek, setSelectedProyek] = useState('');
  const [selectedTipe, setSelectedTipe] = useState<TipeTransaksi | ''>('');
  const [selectedKavlingId, setSelectedKavlingId] = useState<string | null>(null);

  const [apiError, setApiError] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  const periode = formatBulan(bulanIni());
  const getProyekNama = (id: string) => proyeks.find((p) => p.id === id)?.nama ?? id;

  const filteredItems = useMemo(
    () =>
      items.filter(
        (kv) =>
          kv.status !== 'batal' &&
          (!selectedProyek || kv.proyekId === selectedProyek) &&
          // Piutang hanya penjualan yang sudah BAST; yang belum ada di Hutang > Penjualan unit.
          kv.statusBast === 'sudah_bast' &&
          (!selectedTipe || kv.tipeTransaksi === selectedTipe),
      ),
    [items, selectedProyek, selectedTipe],
  );

  const totals = filteredItems.reduce(
    (acc, kv) => ({
      nilai: acc.nilai + kv.nilaiSppr,
      dibayar: acc.dibayar + dibayarOf(kv),
      sisa: acc.sisa + sisaOf(kv),
      hpp: acc.hpp + (kv.nilaiHpp ?? 0),
      laba: acc.laba + (kv.labaKotor ?? 0),
    }),
    { nilai: 0, dibayar: 0, sisa: 0, hpp: 0, laba: 0 },
  );

  const handleSinkron = async () => {
    setSyncLoading(true);
    setApiError(false);
    setSyncErrorMessage('');
    try {
      const res = await fetchApi('/sinkron/jalankan', { method: 'POST' });
      if (!res.ok) throw toApiError(res, 'Gagal sinkronisasi');

      await fetchItems();
      setSyncedAt(new Date());
    } catch (err: any) {
      setApiError(true);
      setSyncErrorMessage(err.message || 'API tidak merespons atau sinkronisasi gagal.');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Piutang user"
        description={`Kavling sudah serah terima (BAST), posisi ${periode}`}
        actions={
          <Button variant="primary" icon={PiArrowsClockwise} loading={syncLoading} onClick={handleSinkron}>
            Sinkron Podorukuntrack
          </Button>
        }
      />

      <PageBody>
        {loadError && (
          <Notice
            tone="danger"
            title="Data tagihan gagal dimuat"
            action={
              <Button size="sm" onClick={() => void fetchItems()}>
                Muat ulang
              </Button>
            }
          >
            {loadError}. Angka di bawah bisa kosong atau belum terbaru.
          </Notice>
        )}
        {apiError && (
          <Notice
            tone="danger"
            title="Sinkronisasi Podo Rukun Track Gagal"
            action={
              <Button size="sm" onClick={handleSinkron}>
                Coba lagi
              </Button>
            }
          >
            {syncErrorMessage || 'API tidak merespons. Angka di bawah adalah data terakhir yang tersimpan, jangan dibaca sebagai lunas.'}
          </Notice>
        )}
        {syncedAt && !apiError && (
          <Notice tone="positive">
            Tersinkron dengan Podo Rukun Track pukul {syncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.
          </Notice>
        )}

        <div className="grid grid-cols-2 gap-3 lg:max-w-2xl">
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
            <label htmlFor="p-tipe" className="field-label">Tipe transaksi</label>
            <select id="p-tipe" className="control" value={selectedTipe} onChange={(e) => setSelectedTipe(e.target.value as TipeTransaksi | '')}>
              <option value="">Semua tipe</option>
              {(Object.keys(TIPE_TRANSAKSI_LABELS) as TipeTransaksi[]).map((t) => (
                <option key={t} value={t}>{TIPE_TRANSAKSI_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <StatGrid>
          <StatTile color="#1e293b" icon={PiFileText} label="Nilai kontrak (SPPR)" value={formatRupiah(totals.nilai)} hint={`${filteredItems.length} kavling`} />
          <StatTile color="#0e6b45" icon={PiCheckCircle} label="Sudah dibayar" value={formatRupiah(totals.dibayar)} />
          <StatTile emphasis color="#047857" icon={PiHourglassMedium} label="Sisa piutang" value={formatRupiah(totals.sisa)} />
          <StatTile
            color="#7c3aed"
            icon={PiTrendUp}
            label="Laba kotor"
            value={formatRupiah(totals.laba)}
            hint={`Nilai SPPR - HPP ${formatRupiah(totals.hpp)}`}
          />
        </StatGrid>

        <Notice>
          Hanya penjualan yang sudah BAST. Penjualan yang belum serah terima tercatat sebagai hutang di Hutang, tab Penjualan unit.
        </Notice>

        <Panel
          title="Piutang per kavling"
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
                { header: 'Sisa Piutang', key: 'sisa', isNumber: true, width: 18 },
                { header: 'Tanggal BAST', key: 'tanggalBast', width: 14 },
                { header: 'HPP', key: 'hpp', isNumber: true, width: 18 },
                { header: 'Laba Kotor', key: 'laba', isNumber: true, width: 18 },
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
                  tanggalBast: kv.tanggalBast ? formatTanggal(kv.tanggalBast) : '',
                  hpp: kv.nilaiHpp ?? 0,
                  laba: kv.labaKotor ?? 0,
                })),
                {
                  namaUser: 'TOTAL', nomorKavling: '', proyek: '', tipe: '', nilaiSppr: totals.nilai, dibayar: totals.dibayar, sisa: totals.sisa,
                  tanggalBast: '', hpp: totals.hpp, laba: totals.laba,
                },
              ]}
              opts={{
                namaLaporan: 'Laporan Piutang User per Kavling (Sudah BAST)',
                proyek: selectedProyek ? getProyekNama(selectedProyek) : 'Semua Proyek',
                periode,
                filenameBase: buildFilename('Piutang_User', selectedProyek ? getProyekNama(selectedProyek) : undefined, periode),
              }}
            />
          }
        >
          {isLoading && items.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-3">Memuat tagihan…</p>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              compact
              icon={PiReceipt}
              title="Tidak ada piutang untuk filter ini"
              description="Ubah proyek atau tipe transaksi. Penjualan belum BAST ada di Hutang, tab Penjualan unit."
            />
          ) : (
            <TableScroll label="Piutang per kavling">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">User / kavling</th>
                    <th scope="col">Tipe</th>
                    <th scope="col" className="num">Nilai SPPR</th>
                    <th scope="col" className="num">Dibayar</th>
                    <th scope="col" className="num">Sisa</th>
                    <th scope="col" className="num">HPP (BAST)</th>
                    <th scope="col" className="num">Laba kotor</th>
                    <th scope="col" className="w-14 text-center">Aksi</th>
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
                          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
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
                        <td className="num">
                          {kv.nilaiHpp ? <Money value={kv.nilaiHpp} /> : <Badge tone="warning">HPP belum diisi</Badge>}
                          {kv.tanggalBast && <p className="mt-0.5 text-xs text-ink-3">BAST {formatTanggal(kv.tanggalBast)}</p>}
                        </td>
                        <td className="num font-semibold">
                          {kv.labaKotor == null ? <span className="text-ink-3">-</span> : <Money value={kv.labaKotor} className="text-ink" />}
                        </td>
                        <td className="text-center">
                          <PiutangActions item={kv} />
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
                    <td className="num"><Money value={totals.hpp} /></td>
                    <td className="num"><Money value={totals.laba} /></td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </TableScroll>
          )}
        </Panel>
        <PembayaranTrackPanel />
      </PageBody>

      <JadwalRealisasiModal key={selectedKavlingId ?? 'tutup'} kavlingId={selectedKavlingId} isOpen={selectedKavlingId !== null} onClose={() => setSelectedKavlingId(null)} />
    </>
  );
}
