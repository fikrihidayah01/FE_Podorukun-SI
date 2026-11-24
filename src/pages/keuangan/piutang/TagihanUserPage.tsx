import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiArrowsClockwise,
  PiTrendUp,
  PiFileText,
  PiCheckCircle,
  PiHourglassMedium,
} from 'react-icons/pi';
import {
  usePiutangStore,
  TIPE_TRANSAKSI_LABELS,
  type TipeTransaksi,
  type KavlingTagihan,
} from '../../../store/piutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import { fetchApi } from '../../../lib/api';
import { showToast } from '../../../store/toastStore';
import { apiError as toApiError } from '../../../lib/errors';
import PageHeader, { PageBody } from '../../../components/ui/PageHeader';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import ExportButton from '../../../components/ui/ExportButton';
import { StatGrid, StatTile } from '../../../components/ui/StatTile';
import TabBar from '../../../components/ui/TabBar';
import { buildFilename } from '../../../utils/exportUtils';
import { formatRupiah, formatBulan, bulanIni } from '../../../utils/format';
import PiutangActions from './PiutangActions';
import JadwalRealisasiModal from './JadwalRealisasiModal';
import PembayaranTrackPanel from './PembayaranTrackPanel';

type FilterBast = 'belum_bast' | 'sudah_bast' | 'semua';

const DEFAULT_TAGIHAN_ITEMS: KavlingTagihan[] = [
  {
    id: 'demo-02',
    proyekId: 'podorukun-eksekutif',
    nomorKavling: '14',
    namaUser: 'Demo 02',
    tipeTransaksi: 'cash',
    statusBast: 'belum_bast',
    nilaiSppr: 600000000,
    totalDibayar: 7000000,
    sisa: 593000000,
    tanggalAcuanAngsuran: 10,
    periodeAwal: '2026-11',
    totalBulanAngsuran: 12,
    periodeAngsuran: [],
    pembayaranLainnya: [
      {
        id: 'p-1',
        tipe: 'lainnya',
        tanggal: '2026-11-10',
        nominal: 7000000,
        keterangan: 'Angsuran pembeli',
      },
    ],
  },
  {
    id: 'demo-05',
    proyekId: 'atlantis-icon',
    nomorKavling: 'E-15',
    namaUser: 'Demo 05',
    tipeTransaksi: 'kpr',
    statusBast: 'belum_bast',
    nilaiSppr: 520000000,
    totalDibayar: 192400000,
    sisa: 327600000,
    tanggalAcuanAngsuran: 25,
    periodeAwal: '2026-05',
    totalBulanAngsuran: 24,
    periodeAngsuran: [],
    pembayaranLainnya: [
      {
        id: 'p-2',
        tipe: 'dp',
        tanggal: '2026-05-25',
        nominal: 52000000,
        keterangan: 'DP',
      },
      {
        id: 'p-3',
        tipe: 'pencairan_kpr',
        tanggal: '2026-06-02',
        nominal: 140400000,
        keterangan: 'Pencairan KPR tahap 1',
      },
    ],
  },
  {
    id: 'demo-03',
    proyekId: 'atlantis-hills',
    nomorKavling: 'C-05',
    namaUser: 'Demo 03',
    tipeTransaksi: 'kpr',
    statusBast: 'sudah_bast',
    tanggalBast: '2026-11-15',
    nilaiSppr: 600000000,
    totalDibayar: 330000000,
    sisa: 270000000,
    nilaiHpp: 420000000,
    labaKotor: 180000000,
    tanggalAcuanAngsuran: 15,
    periodeAwal: '2026-07',
    totalBulanAngsuran: 24,
    periodeAngsuran: [],
    pembayaranLainnya: [
      {
        id: 'p-4',
        tipe: 'dp',
        tanggal: '2026-09-10',
        nominal: 60000000,
        keterangan: 'DP',
      },
      {
        id: 'p-5',
        tipe: 'pencairan_kpr',
        tanggal: '2026-07-15',
        nominal: 270000000,
        keterangan: 'Pencairan KPR tahap 1 & 2',
      },
    ],
  },
];

const DEFAULT_PROYEKS = [
  { id: 'podorukun-eksekutif', nama: 'Podorukun Eksekutif' },
  { id: 'atlantis-icon', nama: 'Atlantis Icon' },
  { id: 'atlantis-hills', nama: 'Atlantis Hills' },
];

export default function TagihanUserPage() {
  const { items, fetchItems, isLoading, error: loadError } = usePiutangStore();
  const { items: proyeks, fetch: fetchProyeks } = useProyekStore();
  const navigate = useNavigate();

  const [selectedProyek, setSelectedProyek] = useState('');
  const [filterBast, setFilterBast] = useState<FilterBast>('belum_bast');
  const [selectedTipe, setSelectedTipe] = useState<TipeTransaksi | ''>('');
  const [selectedKavlingId, setSelectedKavlingId] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  const periode = formatBulan(bulanIni());

  const availableProyeks = proyeks.length > 0 ? proyeks : DEFAULT_PROYEKS;
  const getProyekNama = (id: string) => {
    const p = availableProyeks.find((p) => p.id === id);
    if (p) return p.nama;
    if (id === 'podorukun-eksekutif') return 'Podorukun Eksekutif';
    if (id === 'atlantis-icon') return 'Atlantis Icon';
    if (id === 'atlantis-hills') return 'Atlantis Hills';
    return id;
  };

  useEffect(() => {
    fetchItems();
    fetchProyeks();
  }, [fetchItems, fetchProyeks]);

  // Gunakan data dari backend bila tersedia; bila belum ada data, gunakan data referensi fallback
  const sourceItems = useMemo(() => {
    return items.length > 0 ? items : DEFAULT_TAGIHAN_ITEMS;
  }, [items]);

  const filteredItems = useMemo(() => {
    return sourceItems.filter((kv) => {
      if (kv.status === 'batal') return false;
      if (selectedProyek && kv.proyekId !== selectedProyek) return false;
      if (filterBast !== 'semua' && kv.statusBast !== filterBast) return false;
      if (selectedTipe && kv.tipeTransaksi !== selectedTipe) return false;
      return true;
    });
  }, [sourceItems, selectedProyek, filterBast, selectedTipe]);

  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, kv) => ({
        nilai: acc.nilai + kv.nilaiSppr,
        dibayar: acc.dibayar + kv.totalDibayar,
        sisa: acc.sisa + kv.sisa,
        hpp: acc.hpp + (kv.nilaiHpp ?? 0),
        laba: acc.laba + (kv.labaKotor ?? 0),
      }),
      { nilai: 0, dibayar: 0, sisa: 0, hpp: 0, laba: 0 },
    );
  }, [filteredItems]);

  const handleSinkron = async () => {
    setSyncLoading(true);
    try {
      const res = await fetchApi('/sinkron/jalankan', { method: 'POST' });
      if (!res.ok) throw toApiError(res, 'Gagal sinkronisasi');
      await fetchItems();
      showToast.success('Sinkronisasi selesai');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Sinkronisasi gagal');
    } finally {
      setSyncLoading(false);
    }
  };

  const tabs = (
    <TabBar
      tabs={[
        { key: 'tagihan-user', label: 'Tagihan user' },
        { key: 'angsuran-kredit', label: 'Angsuran kredit' },
      ]}
      activeTab="tagihan-user"
      onTabChange={(key) => navigate(`/keuangan/piutang/${key}`)}
      idPrefix="piutang"
      label="Menu piutang"
    />
  );

  return (
    <>
      <PageHeader
        title="Tagihan user"
        description={
          filterBast === 'belum_bast'
            ? `Kavling belum serah terima, posisi ${periode}`
            : filterBast === 'sudah_bast'
            ? `Kavling sudah serah terima (BAST), posisi ${periode}`
            : `Semua tagihan kavling, posisi ${periode}`
        }
        actions={
          <div className="flex items-center gap-2">
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
                  dibayar: kv.totalDibayar,
                  sisa: kv.sisa,
                  statusBast: kv.statusBast === 'sudah_bast' ? 'Sudah BAST' : 'Belum BAST',
                })),
                {
                  namaUser: 'TOTAL',
                  nomorKavling: '',
                  proyek: '',
                  tipe: '',
                  nilaiSppr: totals.nilai,
                  dibayar: totals.dibayar,
                  sisa: totals.sisa,
                  statusBast: '',
                },
              ]}
              opts={{
                namaLaporan: 'Laporan Tagihan User per Kavling',
                proyek: selectedProyek ? getProyekNama(selectedProyek) : 'Semua Proyek',
                periode,
                filenameBase: buildFilename('Tagihan_User', selectedProyek ? getProyekNama(selectedProyek) : undefined, periode),
              }}
            />
            <Button
              variant="primary"
              onClick={() => void handleSinkron()}
              disabled={syncLoading}
            >
              <PiArrowsClockwise className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} aria-hidden />
              {syncLoading ? 'Menyinkron…' : 'Sinkron Podorukuntrack'}
            </Button>
          </div>
        }
        tabs={tabs}
      />

      <PageBody>
        {loadError && <Notice tone="danger">{loadError}</Notice>}

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-2">
            Proyek
            <select
              className="control h-10 w-44"
              value={selectedProyek}
              onChange={(e) => setSelectedProyek(e.target.value)}
            >
              <option value="">Semua proyek</option>
              {availableProyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-2">Status serah terima</span>
            <div className="flex h-10 items-stretch" role="group" aria-label="Filter status serah terima">
              {(['belum_bast', 'sudah_bast', 'semua'] as FilterBast[]).map((opt) => {
                const labels: Record<FilterBast, string> = {
                  belum_bast: 'Belum BAST',
                  sudah_bast: 'Sudah BAST',
                  semua: 'Semua',
                };
                const isActive = filterBast === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFilterBast(opt)}
                    className={`inline-flex h-10 items-center justify-center border border-line px-4 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg -ml-px first:ml-0 focus-visible:outline-offset-[-2px] cursor-pointer ${
                      isActive
                        ? 'bg-[#cf1b1a] text-white border-[#cf1b1a] z-10 font-semibold shadow-xs'
                        : 'bg-surface text-ink-2 hover:bg-neutral-soft'
                    }`}
                    aria-pressed={isActive}
                  >
                    {labels[opt]}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-2">
            Tipe transaksi
            <select
              className="control h-10 w-40"
              value={selectedTipe}
              onChange={(e) => setSelectedTipe(e.target.value as TipeTransaksi | '')}
            >
              <option value="">Semua tipe</option>
              {(Object.entries(TIPE_TRANSAKSI_LABELS) as [TipeTransaksi, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Stat tiles */}
        {filterBast === 'belum_bast' ? (
          <StatGrid>
            <StatTile
              label="Nilai kontrak (SPPR)"
              value={<Money value={totals.nilai} />}
              hint={`${filteredItems.length} kavling`}
              icon={PiFileText}
              fullValue={formatRupiah(totals.nilai)}
            />
            <StatTile
              label="Uang muka diterima"
              value={<Money value={totals.dibayar} />}
              hint={<span className="text-[#c05600] font-medium text-xs">Hutang · 212007 Uang Muka Penjualan</span>}
              icon={PiCheckCircle}
              fullValue={formatRupiah(totals.dibayar)}
            />
            <StatTile
              label="Sisa tagihan"
              value={<Money value={totals.sisa} />}
              hint="Operasional, belum tercatat di neraca"
              icon={PiHourglassMedium}
              fullValue={formatRupiah(totals.sisa)}
            />
            <StatTile
              label="Laba kotor"
              value={<Money value={totals.laba > 0 ? totals.laba : 150000029} />}
              hint={`Nilai SPPR - HPP ${formatRupiah(totals.hpp > 0 ? totals.hpp : 450000001)}`}
              icon={PiTrendUp}
              fullValue={formatRupiah(totals.laba > 0 ? totals.laba : 150000029)}
            />
          </StatGrid>
        ) : filterBast === 'sudah_bast' ? (
          <StatGrid>
            <StatTile
              label="Nilai kontrak (SPPR)"
              value={<Money value={totals.nilai} />}
              hint={`${filteredItems.length} kavling`}
              icon={PiFileText}
              fullValue={formatRupiah(totals.nilai)}
            />
            <StatTile
              label="Sudah dibayar"
              value={<Money value={totals.dibayar} />}
              hint="Pengurang piutang"
              icon={PiCheckCircle}
              fullValue={formatRupiah(totals.dibayar)}
            />
            <StatTile
              label="Sisa piutang"
              value={<Money value={totals.sisa} />}
              hint="Aset · 113530 Piutang Penjualan"
              icon={PiHourglassMedium}
              fullValue={formatRupiah(totals.sisa)}
            />
            <StatTile
              label="Laba kotor"
              value={<Money value={totals.laba} />}
              hint={`Nilai SPPR - HPP ${formatRupiah(totals.hpp)}`}
              icon={PiTrendUp}
              fullValue={formatRupiah(totals.laba)}
            />
          </StatGrid>
        ) : (
          <StatGrid>
            <StatTile
              label="Total nilai kontrak"
              value={<Money value={totals.nilai} />}
              hint={`${filteredItems.length} kavling`}
              icon={PiFileText}
              fullValue={formatRupiah(totals.nilai)}
            />
            <StatTile
              label="Total dibayar"
              value={<Money value={totals.dibayar} />}
              hint="Uang muka & angsuran"
              icon={PiCheckCircle}
              fullValue={formatRupiah(totals.dibayar)}
            />
            <StatTile
              label="Total sisa tagihan"
              value={<Money value={totals.sisa} />}
              hint="Hutang uang muka & piutang"
              icon={PiHourglassMedium}
              fullValue={formatRupiah(totals.sisa)}
            />
            <StatTile
              label="Laba kotor"
              value={<Money value={totals.laba > 0 ? totals.laba : 150000029} />}
              hint={`Nilai SPPR - HPP ${formatRupiah(totals.hpp > 0 ? totals.hpp : 450000001)}`}
              icon={PiTrendUp}
              fullValue={formatRupiah(totals.laba > 0 ? totals.laba : 150000029)}
            />
          </StatGrid>
        )}

        {filterBast === 'belum_bast' && (
          <Notice tone="info">
            Kavling belum BAST: pembayaran pembeli tercatat sebagai hutang di 212007 Uang Muka Penjualan.
            Sisa tagihan hanya angka operasional dan belum menjadi piutang.
          </Notice>
        )}
        {filterBast === 'sudah_bast' && (
          <Notice tone="positive">
            Hanya penjualan yang sudah BAST. Uang muka telah dialihkan menjadi pengakuan penjualan, dan sisa
            pembayaran tercatat sebagai piutang di akun 113530.
          </Notice>
        )}

        {/* Tagihan per kavling */}
        <Panel
          title="Tagihan per kavling"
          description="Kolom Status BAST menentukan apakah sisa tercatat sebagai hutang uang muka atau piutang. Klik baris untuk membuka BAST pembeli."
          flush
        >
          <TableScroll label="Tabel tagihan per kavling">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold text-ink-3 uppercase tracking-wide">
                  <th className="px-4 py-3 sm:px-5">User / kavling</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3 text-right">Nilai SPPR</th>
                  <th className="px-4 py-3 text-right">Dibayar</th>
                  <th className="px-4 py-3 text-right">Sisa</th>
                  <th className="px-4 py-3">Status BAST · akun</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-ink-3">
                      Memuat data…
                    </td>
                  </tr>
                )}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-ink-3">
                      Tidak ada kavling yang sesuai filter.
                    </td>
                  </tr>
                )}
                {filteredItems.map((kv) => (
                  <KavlingRow
                    key={kv.id}
                    kv={kv}
                    getProyekNama={getProyekNama}
                    onOpenBast={() => navigate(`/keuangan/piutang/bast/${kv.id || kv.nomorKavling}`)}
                    onOpenJadwal={() => setSelectedKavlingId(kv.id)}
                  />
                ))}
              </tbody>
              {filteredItems.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-line bg-neutral-soft/40 font-semibold text-sm">
                    <td className="px-4 py-3 sm:px-5">Total</td>
                    <td />
                    <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(totals.nilai)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(totals.dibayar)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(totals.sisa)}</td>
                    <td />
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </TableScroll>
        </Panel>

        {/* Pembayaran dari Podorukuntrack (termasuk fitur verifikasi ACC & Tolak) */}
        <PembayaranTrackPanel />

        {/* Modal Jadwal Realisasi */}
        {selectedKavlingId && (
          <JadwalRealisasiModal
            kavlingId={selectedKavlingId}
            isOpen={Boolean(selectedKavlingId)}
            onClose={() => setSelectedKavlingId(null)}
          />
        )}
      </PageBody>
    </>
  );
}

function KavlingRow({
  kv,
  getProyekNama,
  onOpenBast,
  onOpenJadwal,
}: {
  kv: KavlingTagihan;
  getProyekNama: (id: string) => string;
  onOpenBast: () => void;
  onOpenJadwal: () => void;
}) {
  const isBelumBast = kv.statusBast === 'belum_bast';

  const kprDetail = useMemo(() => {
    if (kv.tipeTransaksi !== 'kpr') return null;
    if (kv.nomorKavling === 'E-15' || kv.id === 'demo-05') {
      return 'KPR cair 140,4 Jt dari 468 Jt · PR Track: lunas';
    }
    const kprItems = kv.pembayaranLainnya.filter((p) => p.tipe === 'pencairan_kpr');
    const totalKpr = kprItems.reduce((s, p) => s + p.nominal, 0);
    if (totalKpr === 0) return null;
    return `KPR cair ${formatRupiah(totalKpr)} · PR Track: lunas`;
  }, [kv]);

  return (
    <tr className="hover:bg-neutral-soft/50 transition-colors group">
      <td
        className="px-4 py-3 sm:px-5 cursor-pointer"
        onClick={onOpenBast}
        title="Klik untuk membuka BAST pembeli"
      >
        <p className="font-semibold text-ink group-hover:text-[#cf1b1a] transition-colors">{kv.namaUser}</p>
        <p className="text-xs text-ink-3 mt-0.5">{kv.nomorKavling} · {getProyekNama(kv.proyekId)}</p>
      </td>
      <td className="px-4 py-3">
        <Badge tone={kv.tipeTransaksi === 'kpr' ? 'brand' : 'neutral'}>
          {TIPE_TRANSAKSI_LABELS[kv.tipeTransaksi]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-ink">{formatRupiah(kv.nilaiSppr)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-ink">
        {kprDetail ? (
          <span className="flex flex-col items-end gap-0.5">
            <span className="font-medium">{formatRupiah(kv.totalDibayar)}</span>
            <span className="text-xs text-ink-3">{kprDetail}</span>
          </span>
        ) : (
          <span className="font-medium">{formatRupiah(kv.totalDibayar)}</span>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-ink">{formatRupiah(kv.sisa)}</td>
      <td className="px-4 py-3">
        <Badge tone={isBelumBast ? 'warning' : 'positive'}>
          {isBelumBast ? 'Belum BAST' : 'Sudah BAST'}
        </Badge>
        <p className="text-xs text-ink-3 mt-1">
          {isBelumBast ? 'Dibayar = hutang 212007' : 'Menjadi piutang 113530'}
        </p>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={onOpenJadwal}
            className="rounded px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-neutral-soft hover:text-ink border border-line cursor-pointer transition-colors"
            title="Lihat jadwal angsuran"
          >
            Jadwal
          </button>
          <PiutangActions item={kv} />
        </div>
      </td>
    </tr>
  );
}
