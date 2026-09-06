import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Landmark, Building2, CreditCard, AlertTriangle } from 'lucide-react';
import TabBar from '../../components/ui/TabBar';
import { useHutangStore, KATEGORI_HUTANG_LABELS, KATEGORI_HUTANG_COLOR, type KategoriHutang } from '../../store/hutangStore';
import { useProyekStore } from '../../store/proyekStore';
import { usePinjamanBankStore } from '../../store/pinjamanBankStore';
import InputMutasiModal from './hutang/InputMutasiModal';
import AntarProyekTab from './hutang/AntarProyekTab';
import PinjamanBankTab from './hutang/PinjamanBankTab';
import AgunanShmTab from './hutang/AgunanShmTab';

// ── Helpers ──────────────────────────────────────────────────
function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatRupiahShort(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
  return formatRupiah(n);
}

function getCurrentBulan() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatBulanLabel(bulan: string) {
  const [y, m] = bulan.split('-');
  const names = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${names[Number(m)]} ${y}`;
}

// ── Month selector options ───────────────────────────────────
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
  const { getDueSoon } = usePinjamanBankStore();

  // Filters
  const [selectedProyek, setSelectedProyek] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<KategoriHutang | ''>('');
  const [selectedBulan, setSelectedBulan] = useState(getCurrentBulan());

  // Tabs
  const [activeTab, setActiveTab] = useState('saldo');

  // Modals
  const [inputOpen, setInputOpen] = useState(false);

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
  const dueSoon = useMemo(() => getDueSoon(7), [getDueSoon]);

  const tabs = [
    { key: 'saldo', label: 'Saldo Berjalan' },
    { key: 'antar_proyek', label: 'Antar Proyek' },
    { key: 'pinjaman_bank', label: 'Pinjaman Bank' },
    { key: 'agunan', label: 'Agunan / SHM' },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hutang</h1>
          <p className="text-sm text-gray-500 mt-0.5">Periode {formatBulanLabel(selectedBulan)}</p>
        </div>
        <button
          onClick={() => setInputOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Input mutasi
        </button>
      </div>

      {/* Due soon warning */}
      {dueSoon.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {dueSoon.length} pinjaman bank jatuh tempo ≤ 7 hari
            </p>
            <ul className="mt-1 space-y-0.5">
              {dueSoon.map((p) => (
                <li key={p.id} className="text-xs text-amber-700">
                  • {p.namaBank} — jatuh tempo {p.tanggalJatuhTempo}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 3 Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={selectedProyek}
          onChange={(e) => setSelectedProyek(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Semua proyek</option>
          {proyeks.map((p) => (
            <option key={p.id} value={p.id}>{p.nama}</option>
          ))}
        </select>

        <select
          value={selectedKategori}
          onChange={(e) => setSelectedKategori(e.target.value as KategoriHutang | '')}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Semua kategori</option>
          {(Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[]).map((k) => (
            <option key={k} value={k}>{KATEGORI_HUTANG_LABELS[k]}</option>
          ))}
        </select>

        <select
          value={selectedBulan}
          onChange={(e) => setSelectedBulan(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 4 Summary Cards */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Landmark className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-xs text-gray-500">Total hutang</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatRupiahShort(totalHutang)}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Building2 className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xs text-gray-500">Hutang lahan</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatRupiahShort(totalLahan)}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">Hutang bank</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatRupiahShort(totalBank)}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xs text-gray-500">Jatuh tempo ≤ 7 hari</p>
          </div>
          <p className="text-lg font-bold text-red-600">{dueSoon.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'saldo' && (
        <div>
          {/* Saldo berjalan table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Kode pembantu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Kategori</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Saldo awal</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Mutasi</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Saldo akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {saldoData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      Tidak ada data hutang untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  saldoData.map((row) => {
                    const proyek = proyeks.find((p) => p.id === row.kodePembantu.proyekId);
                    return (
                      <tr
                        key={row.kodePembantu.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/keuangan/hutang/detail/${row.kodePembantu.id}`)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{row.kodePembantu.nama}</p>
                          <p className="text-xs text-gray-400">{proyek?.nama ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${KATEGORI_HUTANG_COLOR[row.kodePembantu.kategori]}`}
                          >
                            {KATEGORI_HUTANG_LABELS[row.kodePembantu.kategori]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">
                          {row.saldoAwal > 0 ? formatRupiah(row.saldoAwal) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {row.mutasiBulan === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : row.mutasiBulan < 0 ? (
                            <span className="text-red-600">({formatRupiah(Math.abs(row.mutasiBulan))})</span>
                          ) : (
                            <span className="text-gray-700">{formatRupiah(row.mutasiBulan)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                          {formatRupiah(row.saldoAkhir)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Rekap per kategori */}
          {saldoData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Rekap per Kategori</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[]).map((kat) => {
                  const total = saldoData
                    .filter((s) => s.kodePembantu.kategori === kat)
                    .reduce((sum, s) => sum + s.saldoAkhir, 0);
                  if (total === 0) return null;
                  return (
                    <div key={kat} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium mb-1 ${KATEGORI_HUTANG_COLOR[kat]}`}>
                        {KATEGORI_HUTANG_LABELS[kat]}
                      </span>
                      <p className="text-sm font-bold text-gray-900">{formatRupiahShort(total)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'antar_proyek' && (
        <AntarProyekTab selectedProyekId={selectedProyek} />
      )}

      {activeTab === 'pinjaman_bank' && <PinjamanBankTab />}

      {activeTab === 'agunan' && <AgunanShmTab />}

      {/* Input mutasi modal */}
      <InputMutasiModal isOpen={inputOpen} onClose={() => setInputOpen(false)} />
    </div>
  );
}
