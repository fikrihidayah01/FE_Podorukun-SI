import React, { useState, useMemo } from 'react';
import { useKontrakStore, type Kontrak } from '../../../store/kontrakStore';
import { useProyekStore } from '../../../store/proyekStore';
import { MdKeyboardArrowDown, MdChevronRight, MdAdd, MdDescription, MdCheckCircle, MdAccountBalanceWallet } from 'react-icons/md';
import KontrakFormModal from './KontrakFormModal';
import AdendumFormModal from './AdendumFormModal';
import CatatPembayaranKontrakModal from './CatatPembayaranKontrakModal';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatRupiahShort(n: number) {
  if (n >= 1_000_000_000)
    return `Rp ${(n / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  if (n >= 1_000_000)
    return `Rp ${(n / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
  return formatRupiah(n);
}

function formatDateFullId(iso: string) {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function KontraktorTab() {
  const { kontraks, adendums, pembayarans } = useKontrakStore();
  const proyeks = useProyekStore((s) => s.items);

  const [selectedProyek, setSelectedProyek] = useState('');
  const [selectedKontraktor, setSelectedKontraktor] = useState('');
  
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [isKontrakModalOpen, setIsKontrakModalOpen] = useState(false);
  const [adendumKontrak, setAdendumKontrak] = useState<Kontrak | null>(null);
  const [bayarKontrak, setBayarKontrak] = useState<Kontrak | null>(null);

  // Derivasi data filter
  const allKontraktors = Array.from(new Set(kontraks.map(k => k.namaKontraktor)));

  const filteredKontraks = useMemo(() => {
    return kontraks.filter(k => {
      if (selectedProyek && k.proyekId !== selectedProyek) return false;
      if (selectedKontraktor && k.namaKontraktor !== selectedKontraktor) return false;
      return true;
    });
  }, [kontraks, selectedProyek, selectedKontraktor]);

  // Aggregate values
  let totalNilai = 0;
  let totalTerbayar = 0;
  let totalSisa = 0;

  const dataWithCalc = filteredKontraks.map(k => {
    const pRiwayat = pembayarans.filter(p => p.kontrakId === k.id);
    const aRiwayat = adendums.filter(a => a.kontrakId === k.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const nilaiTerkini = aRiwayat.length > 0 ? aRiwayat[0].nilaiBaru : k.nilaiKontrak;
    const terbayar = pRiwayat.reduce((sum, p) => sum + p.nominal, 0);
    const sisa = nilaiTerkini - terbayar;

    totalNilai += nilaiTerkini;
    totalTerbayar += terbayar;
    totalSisa += sisa;

    return { ...k, nilaiTerkini, terbayar, sisa, pRiwayat, aRiwayat };
  });

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full space-y-5">
      {/* Header toolbar wrapped in #FCFBFC box with stroke */}
      <div className="rounded-2xl py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-base font-bold text-gray-900">Monitoring hutang per kavling ke kontraktor</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProyek}
            onChange={(e) => setSelectedProyek(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Semua proyek</option>
            {proyeks.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
          <select
            value={selectedKontraktor}
            onChange={(e) => setSelectedKontraktor(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Semua kontraktor</option>
            {allKontraktors.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <button
            onClick={() => setIsKontrakModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-indigo-600 px-4 py-3 text-sm text-white font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <MdAdd className="h-4 w-4" />
            Tambah kontrak
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col justify-between shadow-sm">
          <div className="rounded-xl bg-white border border-gray-200 p-2.5 flex items-center justify-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shrink-0">
              <MdDescription className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              {formatRupiahShort(totalNilai)}
            </span>
          </div>
          <p className="mt-3 text-base font-bold text-gray-900 px-0.5">Nilai kontrak</p>
        </div>

        <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col justify-between shadow-sm">
          <div className="rounded-xl bg-white border border-gray-200 p-2.5 flex items-center justify-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shrink-0">
              <MdCheckCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              {formatRupiahShort(totalTerbayar)}
            </span>
          </div>
          <p className="mt-3 text-base font-bold text-gray-900 px-0.5">Sudah dibayar</p>
        </div>

        <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col justify-between shadow-sm">
          <div className="rounded-xl bg-white border border-gray-200 p-2.5 flex items-center justify-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shrink-0">
              <MdAccountBalanceWallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              {formatRupiahShort(totalSisa)}
            </span>
          </div>
          <p className="mt-3 text-base font-bold text-gray-900 px-0.5">Sisa dibayarkan</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Kavling</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Tipe</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Kontraktor</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Nilai kontrak</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Kas bon</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Sisa</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {dataWithCalc.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Tidak ada data.</td>
              </tr>
            ) : (
              dataWithCalc.map((row) => (
                <React.Fragment key={row.id}>
                  {/* Parent Row */}
                  <tr className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                    <td className="px-4 py-4 flex items-center gap-2">
                      <span className="text-gray-400">
                        {expandedRow === row.id ? <MdKeyboardArrowDown className="h-4 w-4" /> : <MdChevronRight className="h-4 w-4" />}
                      </span>
                      <span className="font-semibold text-gray-900">{row.kavling || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900">{row.tipe || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900">{row.namaKontraktor}</span>
                    </td>
                    <td className="px-4 py-4 text-left font-semibold text-gray-900">
                      {formatRupiah(row.nilaiTerkini)}
                    </td>
                    <td className="px-4 py-4 text-left font-semibold text-gray-900">
                      {formatRupiah(row.terbayar)}
                    </td>
                    <td className="px-4 py-4 text-left font-semibold text-gray-900">
                      {formatRupiah(row.sisa)}
                    </td>
                    <td className="px-4 py-4 text-left text-gray-600">
                      {row.keterangan || '—'}
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {expandedRow === row.id && (
                    <tr className="bg-[#fafafa] border-b border-gray-200">
                      <td colSpan={7} className="px-10 py-5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-gray-700">Riwayat kas bon</h4>
                          {row.status !== 'batal' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Yakin ingin membatalkan kontrak ini?')) {
                                  useKontrakStore.getState().cancelKontrak(row.id);
                                }
                              }} 
                              className="text-[11px] text-red-500 hover:underline"
                            >
                              Batalkan kontrak
                            </button>
                          )}
                        </div>
                        
                        {row.pRiwayat.length === 0 && row.aRiwayat.length === 0 ? (
                          <p className="text-sm text-gray-400 mb-6">Belum ada riwayat.</p>
                        ) : (
                          <div className="space-y-3 mb-6">
                            {row.aRiwayat.map(a => (
                              <div key={a.id} className="flex items-center justify-between text-sm border-b border-gray-200 pb-2">
                                <span className="text-gray-700">{formatDateFullId(a.tanggal)}</span>
                                <span className="text-gray-600 flex-1 ml-10">Adendum: {a.alasan}</span>
                                <span className="font-semibold text-amber-600">Nilai Baru: {formatRupiah(a.nilaiBaru)}</span>
                              </div>
                            ))}
                            {row.pRiwayat.map(p => (
                              <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-200 pb-2">
                                <span className="text-gray-700">{formatDateFullId(p.tanggal)}</span>
                                <span className="text-gray-600 flex-1 ml-10">{p.keterangan || p.noBukti}</span>
                                <span className="font-semibold text-gray-900">{formatRupiah(p.nominal)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {row.status !== 'batal' ? (
                          <div className="flex items-center gap-3">
                            <button onClick={() => setBayarKontrak(row)} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                              <MdAdd className="h-4 w-4" /> Catat pembayaran
                            </button>
                            <button onClick={() => setAdendumKontrak(row)} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                              <MdAdd className="h-4 w-4" /> Adendum
                            </button>
                          </div>
                        ) : (
                          <span className="w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-700">Kontrak Dibatalkan</span>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
          {/* Total Row */}
          {dataWithCalc.length > 0 && (
            <tfoot className="border-t border-gray-200 bg-white">
              <tr>
                <td colSpan={3} className="px-4 py-4 font-bold text-gray-900 text-sm text-left">Total</td>
                <td className="px-4 py-4 text-left font-bold text-gray-900 text-sm">{formatRupiah(totalNilai)}</td>
                <td className="px-4 py-4 text-left font-bold text-gray-900 text-sm">{formatRupiah(totalTerbayar)}</td>
                <td className="px-4 py-4 text-left font-bold text-gray-900 text-sm">{formatRupiah(totalSisa)}</td>
                <td className="px-4 py-4"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <KontrakFormModal isOpen={isKontrakModalOpen} onClose={() => setIsKontrakModalOpen(false)} />
      {adendumKontrak && <AdendumFormModal isOpen={true} kontrak={adendumKontrak} onClose={() => setAdendumKontrak(null)} />}
      {bayarKontrak && <CatatPembayaranKontrakModal isOpen={true} kontrak={bayarKontrak} onClose={() => setBayarKontrak(null)} />}
    </div>
  );
}
