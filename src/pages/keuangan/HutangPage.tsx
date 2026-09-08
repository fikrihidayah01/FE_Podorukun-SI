import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Landmark, Building2, CreditCard, AlertTriangle, Lock, Unlock, ExternalLink } from 'lucide-react';
import TabBar from '../../components/ui/TabBar';
import ExportButton from '../../components/ui/ExportButton';

import {
  useHutangStore,
  KATEGORI_HUTANG_LABELS,
  KATEGORI_HUTANG_COLOR,
  type KategoriHutang,
  type SaldoKodePembantu,
} from '../../store/hutangStore';
import { useProyekStore } from '../../store/proyekStore';
import { usePinjamanBankStore } from '../../store/pinjamanBankStore';

import { buildFilename } from '../../utils/exportUtils';
import InputMutasiModal from './hutang/InputMutasiModal';
import AntarProyekTab from './hutang/AntarProyekTab';
import PinjamanBankTab from './hutang/PinjamanBankTab';
import AgunanShmTab from './hutang/AgunanShmTab';
import KontraktorTab from './hutang/KontraktorTab';
import SaldoBerjalanDetailModal from './hutang/SaldoBerjalanDetailModal';

// ── Helpers ──────────────────────────────────────────────────
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



function getCurrentBulan() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatBulanLabel(bulan: string) {
  const [, m] = bulan.split('-');
  const names = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [y] = bulan.split('-');
  return `${names[Number(m)]} ${y}`;
}

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value: val, label: formatBulanLabel(val) });
  }
  return options;
}

// ── Main Component ───────────────────────────────────────────
export default function HutangPage() {
  const navigate = useNavigate();
  const { getSaldoPerKodePembantu, getTotalHutang, getTotalByKategori } = useHutangStore();
  const { items: proyeks } = useProyekStore();
  const { getDueReminders } = usePinjamanBankStore();

  // Filters
  const [selectedProyek, setSelectedProyek] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<KategoriHutang | ''>('');
  const [selectedBulan, setSelectedBulan] = useState(getCurrentBulan());

  // Period status: Terbuka / Terkunci (FE-06a)
  const [isPeriodeTerkunci, setIsPeriodeTerkunci] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('saldo');

  // Modals
  const [inputOpen, setInputOpen] = useState(false);
  const [selectedJurnalRow, setSelectedJurnalRow] = useState<SaldoKodePembantu | null>(null);

  const monthOptions = useMemo(getMonthOptions, []);

  // Computed data
  const saldoData = useMemo(() => {
    return getSaldoPerKodePembantu(
      selectedBulan,
      selectedProyek || undefined,
      (selectedKategori || undefined) as KategoriHutang | undefined
    );
  }, [getSaldoPerKodePembantu, selectedBulan, selectedProyek, selectedKategori]);

  const totalHutang = useMemo(() => getTotalHutang(selectedBulan), [getTotalHutang, selectedBulan]);
  const totalLahan = useMemo(() => getTotalByKategori(selectedBulan, 'lahan'), [getTotalByKategori, selectedBulan]);
  const totalBank = useMemo(() => getTotalByKategori(selectedBulan, 'bank'), [getTotalByKategori, selectedBulan]);
  const dueReminders = useMemo(() => getDueReminders(7), [getDueReminders]);

  const tabs = [
    { key: 'saldo', label: 'Saldo Berjalan' },
    { key: 'antar_proyek', label: 'Antar Proyek' },
    { key: 'pinjaman_bank', label: 'Pinjaman Bank' },
    { key: 'agunan', label: 'Dokumen Legal' },
    { key: 'kontraktor', label: 'Kontraktor' },
  ];



  return (
    <div className="space-y-6">
      {/* ── Page Header with Status Periode Indicator (FE-06a) ─ */}
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Hutang</h1>
            <button
              onClick={() => setIsPeriodeTerkunci(!isPeriodeTerkunci)}
              title="Klik untuk simulasi kunci/buka periode"
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors ${
                isPeriodeTerkunci
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isPeriodeTerkunci ? (
                <>
                  <Lock className="h-3 w-3" />
                  Periode Terkunci
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3" />
                  Periode Terbuka
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Periode {formatBulanLabel(selectedBulan)}
          </p>
        </div>

        <button
          onClick={() => setInputOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Input mutasi
        </button>
      </div>

      {/* ── Main Summary & Filter White Card ───────────── */}
      <div className="rounded-2xl bg-white p-4 md:p-5 shadow-sm w-full space-y-4">
        {/* ── 3 Filters wrapped in #FCFBFC box with stroke ────────────────────── */}
        <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3 md:p-3.5 flex flex-wrap items-center gap-3">
          <select
            value={selectedProyek}
            onChange={(e) => setSelectedProyek(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Semua proyek</option>
            {proyeks.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>

          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value as KategoriHutang | '')}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Semua kategori</option>
            {(Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[]).map((k) => (
              <option key={k} value={k}>{KATEGORI_HUTANG_LABELS[k]}</option>
            ))}
          </select>

          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* ── 4 Summary Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3 md:p-3.5 flex flex-col justify-between">
            <div className="rounded-xl bg-white border border-gray-200 p-2.5 flex items-center justify-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shrink-0">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {formatRupiahShort(totalHutang)}
              </span>
            </div>
            <p className="mt-3 text-base font-bold text-gray-900 px-0.5">Total hutang</p>
          </div>

          <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col justify-between">
            <div className="rounded-xl bg-white border border-gray-200 p-2.5 flex items-center justify-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {formatRupiahShort(totalLahan)}
              </span>
            </div>
            <p className="mt-3 text-base font-bold text-gray-900 px-0.5">Hutang lahan</p>
          </div>

          <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col justify-between">
            <div className="rounded-xl bg-white border border-gray-200 p-2.5 flex items-center justify-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shrink-0">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {formatRupiahShort(totalBank)}
              </span>
            </div>
            <p className="mt-3 text-base font-bold text-gray-900 px-0.5">Hutang bank</p>
          </div>

          <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col justify-between">
            <div className="rounded-xl bg-white border border-gray-200 p-2.5 flex items-center justify-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shrink-0">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-red-600 truncate">
                {dueReminders.length}
              </span>
            </div>
            <p className="mt-3 text-base font-bold text-gray-900 px-0.5">Jatuh tempo &le; 7 hari</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Tab Content ──────────────────────────────────────── */}
      {activeTab === 'saldo' && (
        <>
          <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full space-y-4">
          {/* Export toolbar */}
          <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-bold text-gray-900">
              {saldoData.length} kode pembantu &middot; Tabel baca saja
            </p>
            <ExportButton
              getColumns={() => [
                { header: 'Kode Pembantu', key: 'kodePembantu', width: 30 },
                { header: 'Proyek', key: 'proyek', width: 18 },
                { header: 'Kategori', key: 'kategori', width: 16 },
                { header: 'Saldo Awal', key: 'saldoAwal', isNumber: true, width: 18 },
                { header: 'Total Debit', key: 'totalDebit', isNumber: true, width: 18 },
                { header: 'Total Kredit', key: 'totalKredit', isNumber: true, width: 18 },
                { header: 'Mutasi', key: 'mutasiBulan', isNumber: true, width: 18 },
                { header: 'Saldo Akhir', key: 'saldoAkhir', isNumber: true, width: 18 },
              ]}
              getData={() => [
                ...saldoData.map((s) => ({
                  kodePembantu: s.kodePembantu.nama,
                  proyek: proyeks.find((p) => p.id === s.kodePembantu.proyekId)?.nama ?? '',
                  kategori: KATEGORI_HUTANG_LABELS[s.kodePembantu.kategori],
                  saldoAwal: s.saldoAwal,
                  totalDebit: s.totalDebit,
                  totalKredit: s.totalKredit,
                  mutasiBulan: s.mutasiBulan,
                  saldoAkhir: s.saldoAkhir,
                })),
                {
                  kodePembantu: 'TOTAL',
                  proyek: '',
                  kategori: '',
                  saldoAwal: saldoData.reduce((s, r) => s + r.saldoAwal, 0),
                  totalDebit: saldoData.reduce((s, r) => s + r.totalDebit, 0),
                  totalKredit: saldoData.reduce((s, r) => s + r.totalKredit, 0),
                  mutasiBulan: saldoData.reduce((s, r) => s + r.mutasiBulan, 0),
                  saldoAkhir: saldoData.reduce((s, r) => s + r.saldoAkhir, 0),
                },
              ]}
              opts={{
                namaLaporan: 'Laporan Hutang — Saldo Berjalan',
                proyek: proyeks.find((p) => p.id === selectedProyek)?.nama ?? 'Semua Proyek',
                periode: formatBulanLabel(selectedBulan),
                filenameBase: buildFilename(
                  'Saldo_Berjalan',
                  proyeks.find((p) => p.id === selectedProyek)?.nama,
                  formatBulanLabel(selectedBulan)
                ),
              }}
            />
          </div>

          {/* Saldo berjalan table (Read-only, click mutasi to see journals) */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Kode pembantu
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Kategori
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Saldo awal
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Mutasi (dari jurnal)
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Saldo akhir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {saldoData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada data hutang untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  saldoData.map((row) => {
                    const proyek = proyeks.find((p) => p.id === row.kodePembantu.proyekId);
                    return (
                      <tr
                        key={row.kodePembantu.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        {/* Clickable Kode Pembantu → Detail page */}
                        <td
                          onClick={() => navigate(`/keuangan/hutang/detail/${row.kodePembantu.id}`)}
                          className="px-4 py-3.5 cursor-pointer"
                        >
                          <p className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                            {row.kodePembantu.nama}
                          </p>
                          <p className="text-xs text-gray-400">{proyek?.nama ?? ''}</p>
                        </td>

                        {/* Kategori Badge */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-medium ${KATEGORI_HUTANG_COLOR[row.kodePembantu.kategori]}`}
                          >
                            {KATEGORI_HUTANG_LABELS[row.kodePembantu.kategori]}
                          </span>
                        </td>

                        {/* Saldo Awal */}
                        <td className="px-4 py-3.5 text-left text-gray-700">
                          {row.saldoAwal > 0 ? formatRupiah(row.saldoAwal) : '—'}
                        </td>

                        {/* Mutasi (Click opens jurnal pembentuk modal - FE-06a) */}
                        <td
                          onClick={() => setSelectedJurnalRow(row)}
                          className="px-4 py-3.5 text-left cursor-pointer"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJurnalRow(row);
                            }}
                            className={`group inline-flex items-center gap-1.5 text-sm transition-all cursor-pointer ${
                              row.mutasiBulan === 0
                                ? 'text-gray-400 hover:text-gray-600'
                                : row.mutasiBulan < 0
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-green-700 hover:text-green-900'
                            }`}
                            title="Klik untuk melihat rincian jurnal pembentuk mutasi"
                          >
                            <span className="group-hover:underline">
                              {row.mutasiBulan === 0
                                ? '—'
                                : formatRupiah(Math.abs(row.mutasiBulan))}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        </td>

                        {/* Saldo Akhir */}
                        <td className="px-4 py-3.5 text-left font-semibold text-gray-900">
                          {formatRupiah(row.saldoAkhir)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Separate White Card: Rekap per Kategori ── */}
        <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full space-y-4">
          <h3 className="text-base font-bold text-gray-900">Rekap per Kategori</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {(Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[]).map((kat) => {
              const total = saldoData
                .filter((s) => s.kodePembantu.kategori === kat)
                .reduce((sum, s) => sum + s.saldoAkhir, 0);

              // FE-06a: Show categories that have balance or standard categories
              if (total === 0 && !['ppn', 'lahan', 'pihak_ketiga', 'antar_proyek', 'bank'].includes(kat)) return null;

              return (
                <div key={kat} className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col justify-between">
                  <span
                    className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-semibold mb-2 ${KATEGORI_HUTANG_COLOR[kat]}`}
                  >
                    {KATEGORI_HUTANG_LABELS[kat]}
                  </span>
                  <p className="text-base font-bold text-gray-900">
                    {total === 0 ? 'Rp 0' : formatRupiahShort(total)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </>
      )}

      {activeTab === 'antar_proyek' && (
        <AntarProyekTab selectedProyekId={selectedProyek} selectedBulan={formatBulanLabel(selectedBulan)} />
      )}

      {activeTab === 'pinjaman_bank' && (
        <PinjamanBankTab selectedProyekId={selectedProyek} selectedBulan={formatBulanLabel(selectedBulan)} />
      )}

      {activeTab === 'agunan' && (
        <AgunanShmTab
          selectedProyekId={selectedProyek ? proyeks.find((p) => p.id === selectedProyek)?.nama : undefined}
          selectedBulan={formatBulanLabel(selectedBulan)}
        />
      )}

      {activeTab === 'kontraktor' && (
        <KontraktorTab />
      )}

      {/* ── Input Mutasi Modal ───────────────────────────────── */}
      <InputMutasiModal isOpen={inputOpen} onClose={() => setInputOpen(false)} />

      <SaldoBerjalanDetailModal
        isOpen={selectedJurnalRow !== null}
        onClose={() => setSelectedJurnalRow(null)}
        rowData={selectedJurnalRow}
        periodeLabel={formatBulanLabel(selectedBulan)}
        selectedBulan={selectedBulan}
        isPeriodeTerkunci={isPeriodeTerkunci}
      />
    </div>
  );
}
