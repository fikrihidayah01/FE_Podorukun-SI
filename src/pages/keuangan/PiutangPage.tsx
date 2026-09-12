import { useState, useMemo } from 'react';
import {
  MdSync,
  MdWarning,
  MdInfo,
  MdDescription,
  MdCheckCircle,
  MdAccountBalanceWallet,
} from 'react-icons/md';
import {
  usePiutangStore,
  TIPE_TRANSAKSI_LABELS,
  TIPE_TRANSAKSI_COLOR,
  type StatusBast,
  type TipeTransaksi,
} from '../../store/piutangStore';
import { useProyekStore } from '../../store/proyekStore';
import ExportButton from '../../components/ui/ExportButton';
import { buildFilename } from '../../utils/exportUtils';
import JadwalRealisasiModal from './piutang/JadwalRealisasiModal';

// ── Helpers ───────────────────────────────────────────────────

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatRupiahShort(n: number) {
  if (n >= 1_000_000_000)
    return `Rp ${(n / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;
  if (n >= 1_000_000)
    return `Rp ${(n / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
  return formatRupiah(n);
}

function getCurrentPeriode() {
  const now = new Date();
  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${bulanNames[now.getMonth()]} ${now.getFullYear()}`;
}

// ── Component ─────────────────────────────────────────────────

export default function PiutangPage() {
  const { items } = usePiutangStore();
  const { items: proyeks } = useProyekStore();

  // Filters
  const [selectedProyek, setSelectedProyek] = useState('');
  const [selectedBast, setSelectedBast] = useState<StatusBast | 'semua'>('belum_bast');
  const [selectedTipe, setSelectedTipe] = useState<TipeTransaksi | ''>('');

  // Modal
  const [selectedKavlingId, setSelectedKavlingId] = useState<string | null>(null);

  // API simulation state
  const [apiError, setApiError] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const periode = getCurrentPeriode();

  // ── Filtered items ──────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return items.filter((kv) => {
      if (selectedProyek && kv.proyekId !== selectedProyek) return false;
      if (selectedBast !== 'semua' && kv.statusBast !== selectedBast) return false;
      if (selectedTipe && kv.tipeTransaksi !== selectedTipe) return false;
      return true;
    });
  }, [items, selectedProyek, selectedBast, selectedTipe]);

  // ── Totals ──────────────────────────────────────────────────
  const totalNilaiKontrak = useMemo(
    () => filteredItems.reduce((sum, kv) => sum + kv.nilaiSppr, 0),
    [filteredItems]
  );

  const totalDibayar = useMemo(
    () =>
      filteredItems.reduce((sum, kv) => {
        const dibayar = kv.periodeAngsuran.reduce((s, p) => s + p.dibayar, 0);
        return sum + dibayar;
      }, 0),
    [filteredItems]
  );

  const totalSisa = useMemo(
    () =>
      filteredItems.reduce((sum, kv) => {
        const dibayar = kv.periodeAngsuran.reduce((s, p) => s + p.dibayar, 0);
        return sum + Math.max(0, kv.nilaiSppr - dibayar);
      }, 0),
    [filteredItems]
  );

  function getRowDibayar(kv: (typeof items)[0]) {
    return kv.periodeAngsuran.reduce((s, p) => s + p.dibayar, 0);
  }

  function getRowSisa(kv: (typeof items)[0]) {
    const dibayar = getRowDibayar(kv);
    return Math.max(0, kv.nilaiSppr - dibayar);
  }

  function getProyekNama(proyekId: string) {
    return proyeks.find((p) => p.id === proyekId)?.nama ?? proyekId;
  }

  function handleSinkron() {
    setSyncLoading(true);
    setTimeout(() => {
      setSyncLoading(false);
      alert('Data Podo Rukun Track berhasil disinkronkan.');
    }, 800);
  }

  return (
    <div className="flex flex-col flex-1">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 md:px-8 md:py-5 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tagihan user</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kavling belum serah terima · {periode}
          </p>
        </div>
      </div>

      {/* ── Page Content ─────────────────────────────────────── */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ── API Error State Banner (Requirement) ─────────────── */}
      {apiError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <MdWarning className="h-5 w-5 mt-0.5 shrink-0 text-red-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Gagal memuat data dari Podo Rukun Track</p>
            <p className="mt-0.5 text-xs text-red-700">
              API tidak merespons. Angka yang tampil tidak dapat disalahartikan sebagai lunas.
            </p>
          </div>
          <button
            onClick={() => setApiError(false)}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ── Main Summary & Filter White Card ───────────── */}
        {/* ── 3 Filters wrapped in #FCFBFC box with stroke ────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Proyek */}
            <select
              value={selectedProyek}
              onChange={(e) => setSelectedProyek(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Semua proyek</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>

            {/* Status BAST */}
            <select
              value={selectedBast}
              onChange={(e) => setSelectedBast(e.target.value as StatusBast | 'semua')}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="belum_bast">Belum BAST</option>
              <option value="sudah_bast">Sudah BAST</option>
              <option value="semua">Semua status</option>
            </select>

            {/* Tipe Transaksi */}
            <select
              value={selectedTipe}
              onChange={(e) => setSelectedTipe(e.target.value as TipeTransaksi | '')}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Semua tipe</option>
              <option value="cash">Cash</option>
              <option value="kpr">KPR</option>
              <option value="in_house">In house</option>
            </select>
          </div>

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
                  dibayar: getRowDibayar(kv),
                  sisa: getRowSisa(kv),
                  statusBast: kv.statusBast === 'belum_bast' ? 'Belum BAST' : 'Sudah BAST',
                })),
                {
                  namaUser: 'TOTAL',
                  nomorKavling: '',
                  proyek: '',
                  tipe: '',
                  nilaiSppr: totalNilaiKontrak,
                  dibayar: totalDibayar,
                  sisa: totalSisa,
                  statusBast: '',
                },
              ]}
              opts={{
                namaLaporan: 'Laporan Tagihan User per Kavling (Pre-BAST)',
                proyek: selectedProyek ? getProyekNama(selectedProyek) : 'Semua Proyek',
                periode,
                filenameBase: buildFilename(
                  'Tagihan_User',
                  selectedProyek ? getProyekNama(selectedProyek) : undefined,
                  periode
                ),
              }}
            />

            <button
              onClick={handleSinkron}
              disabled={syncLoading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <MdSync className={`h-4 w-4 text-white ${syncLoading ? 'animate-spin' : ''}`} />
              Sinkron Podo Rukun Track
            </button>
          </div>
        </div>

        {/* ── 3 Summary Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">

          {/* NILAI KONTRAK */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-4 md:p-5 flex flex-col gap-3 shadow-sm transition-all">
            {/* Radial blur layer di pojok kanan bawah */}
            <div
              className="pointer-events-none absolute -bottom-30 -right-10 h-44 w-44 rounded-full blur-2xl bg-indigo-500/30"
              aria-hidden="true"
            />

            {/* Title + Icon */}
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-lg font-bold text-indigo-600">Nilai Kontrak</p>
              <MdDescription className="h-8 w-8 text-indigo-600" />
            </div>

            {/* Nominal */}
            <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-2xl md:text-3xl font-bold text-indigo-600 truncate leading-tight">
                {formatRupiahShort(totalNilaiKontrak)}
              </span>
            </div>
          </div>

          {/* SUDAH DIBAYAR */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-4 md:p-5 flex flex-col gap-3 shadow-sm transition-all">
            {/* Radial blur layer di pojok kanan bawah */}
            <div
              className="pointer-events-none absolute -bottom-30 -right-10 h-44 w-44 rounded-full blur-2xl bg-emerald-500/30"
              aria-hidden="true"
            />

            {/* Title + Icon */}
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-lg font-bold text-emerald-600">Sudah Dibayar</p>
              <MdCheckCircle className="h-8 w-8 text-emerald-600" />
            </div>

            {/* Nominal */}
            <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-2xl md:text-3xl font-bold text-emerald-600 truncate leading-tight">
                {formatRupiahShort(totalDibayar)}
              </span>
            </div>
          </div>

          {/* SISA TAGIHAN */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-4 md:p-5 flex flex-col gap-3 shadow-sm transition-all">
            {/* Radial blur layer di pojok kanan bawah */}
            <div
              className="pointer-events-none absolute -bottom-30 -right-10 h-44 w-44 rounded-full blur-2xl bg-amber-500/30"
              aria-hidden="true"
            />

            {/* Title + Icon */}
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-lg font-bold text-amber-600">Sisa Tagihan</p>
              <MdAccountBalanceWallet className="h-8 w-8 text-amber-600" />
            </div>

            {/* Nominal */}
            <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-2xl md:text-3xl font-bold text-amber-600 truncate leading-tight">
                {formatRupiahShort(totalSisa)}
              </span>
            </div>
          </div>
        </div>

      {/* ── Info Banner (Accounting Note) ────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
        <MdInfo className="h-5 w-5 mt-0.5 shrink-0 text-sky-600" />
        <p className="text-xs sm:text-sm text-sky-800">
          Sisa tagihan bersifat operasional, belum diakui sebagai piutang di neraca. Saldo akuntansi tercatat sebagai uang muka penjualan.
        </p>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                User / kavling
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tipe
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nilai SPPR
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Dibayar
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Sisa
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  Tidak ada data tagihan user yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((kv) => {
                const dibayar = getRowDibayar(kv);
                const sisa = getRowSisa(kv);

                return (
                  <tr
                    key={kv.id}
                    onClick={() => setSelectedKavlingId(kv.id)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* User / Kavling */}
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{kv.namaUser}</p>
                      <p className="text-xs text-gray-500">
                        {kv.nomorKavling} · {getProyekNama(kv.proyekId)}
                      </p>
                    </td>

                    {/* Tipe Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-medium ${TIPE_TRANSAKSI_COLOR[kv.tipeTransaksi]}`}
                      >
                        {TIPE_TRANSAKSI_LABELS[kv.tipeTransaksi]}
                      </span>
                    </td>

                    {/* Nilai SPPR */}
                    <td className="px-5 py-3.5 text-left font-medium text-gray-900">
                      {formatRupiah(kv.nilaiSppr)}
                    </td>

                    {/* Dibayar */}
                    <td className="px-5 py-3.5 text-left text-gray-700">
                      {formatRupiah(dibayar)}
                    </td>

                    {/* Sisa */}
                    <td className="px-5 py-3.5 text-left font-semibold">
                      {sisa === 0 ? (
                        <span className="text-emerald-600 font-bold">Rp 0</span>
                      ) : (
                        <span className="text-gray-900">{formatRupiah(sisa)}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* ── Jadwal vs Realisasi Modal ────────────────────────── */}
      <JadwalRealisasiModal
        kavlingId={selectedKavlingId}
        isOpen={selectedKavlingId !== null}
        onClose={() => setSelectedKavlingId(null)}
      />
    </div>
  );
}
