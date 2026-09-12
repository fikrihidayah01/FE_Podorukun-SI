import { useState, useMemo } from 'react';
import { useProyekStore } from '../../store/proyekStore';
import { useCoaStore, KATEGORI_AKUN_LABELS } from '../../store/coaStore';
import { useSaldoAwalStore } from '../../store/saldoAwalStore';
import { AlertTriangle, Info, Lock, Unlock } from 'lucide-react';

function formatRupiah(n: number) {
  if (n === 0) return 'Rp 0';
  return 'Rp ' + n.toLocaleString('id-ID');
}

export default function CoaTabSaldoAwal() {
  const proyeks = useProyekStore(s => s.items);
  const akuns = useCoaStore(s => s.items);
  const { periodes, getOrCreatePeriode, updateSaldo, tutupBuku } = useSaldoAwalStore();

  const [selectedProyekId, setSelectedProyekId] = useState<string>(proyeks[0]?.id || '');
  const [filterKategori, setFilterKategori] = useState<string>('all');

  const periode = useMemo(() => {
    if (!selectedProyekId) return null;
    return getOrCreatePeriode(selectedProyekId);
  }, [selectedProyekId, getOrCreatePeriode, periodes]);

  const activeAkuns = useMemo(() => {
    // Only show leaf accounts (no children) that are active
    const parentIds = new Set(akuns.map(a => a.akunIndukId).filter(Boolean));
    return akuns
      .filter(a => a.status === 'aktif' && !parentIds.has(a.id))
      .filter(a => filterKategori === 'all' || a.kategori === filterKategori)
      .sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun));
  }, [akuns, filterKategori]);

  const isTerbuka = periode?.status === 'terbuka';

  const getSaldo = (akunId: string) => {
    if (!periode) return { debit: 0, kredit: 0 };
    const s = periode.saldo.find(x => x.akunId === akunId);
    return s ? s : { debit: 0, kredit: 0 };
  };

  const totalDebit = useMemo(() => {
    if (!periode) return 0;
    return activeAkuns.reduce((sum, a) => sum + getSaldo(a.id).debit, 0);
  }, [periode, activeAkuns]);

  const totalKredit = useMemo(() => {
    if (!periode) return 0;
    return activeAkuns.reduce((sum, a) => sum + getSaldo(a.id).kredit, 0);
  }, [periode, activeAkuns]);

  const selisih = Math.abs(totalDebit - totalKredit);
  const isSeimbang = selisih === 0;

  const handleDebitChange = (akunId: string, val: string) => {
    if (!periode) return;
    const num = Number(val);
    const existing = getSaldo(akunId);
    updateSaldo(periode.id, akunId, isNaN(num) ? 0 : num, existing.kredit);
  };

  const handleKreditChange = (akunId: string, val: string) => {
    if (!periode) return;
    const num = Number(val);
    const existing = getSaldo(akunId);
    updateSaldo(periode.id, akunId, existing.debit, isNaN(num) ? 0 : num);
  };

  const handleTutupBuku = () => {
    if (!periode) return;
    if (!isSeimbang) {
      alert('Tidak dapat tutup buku karena saldo belum seimbang.');
      return;
    }
    if (confirm('Anda yakin ingin menutup periode ini? Saldo awal tidak dapat diubah lagi setelah ditutup.')) {
      tutupBuku(periode.id);
    }
  };

  if (!proyeks.length) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
        Silakan buat proyek terlebih dahulu untuk mengisi saldo awal.
      </div>
    );
  }

  const selectedProyek = proyeks.find(p => p.id === selectedProyekId);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Saldo Awal</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedProyek?.nama} • per {periode?.tanggalMulai ? new Date(periode.tanggalMulai).toLocaleDateString('id-ID') : '-'}
          </p>
        </div>
        <div>
          {isTerbuka ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
              <Unlock className="h-4 w-4" />
              Periode terbuka
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <Lock className="h-4 w-4" />
              Periode terkunci
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-blue-50 p-4 flex gap-3 text-blue-800 border border-blue-100 shadow-sm">
        <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-600" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Penting: Fungsi Saldo Awal</p>
          <p>
            Halaman ini digunakan <strong>hanya satu kali</strong> pada saat migrasi atau awal pembukuan untuk memasukkan saldo awal neraca proyek Anda. 
            Pastikan total Debit dan Kredit seimbang sebelum mengunci periode. Jika periode sudah ditutup (Terkunci), Anda tidak dapat lagi mengubah nominal saldo awal.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3 shadow-sm">
          <div className="w-full sm:w-72">
            <select
              value={selectedProyekId}
              onChange={(e) => setSelectedProyekId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              {proyeks.map(p => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-64">
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              <option value="all">Semua kategori</option>
              {Object.entries(KATEGORI_AKUN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {!isSeimbang && isTerbuka && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Saldo belum seimbang</p>
              <p className="text-sm text-red-700 mt-0.5">
                Selisih {formatRupiah(selisih)}. Periode belum dapat ditutup sampai debit dan kredit sama.
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200/70 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-32">Kode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nama Akun</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 w-48">Debit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 w-48">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {activeAkuns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Tidak ada akun yang ditampilkan.</td>
                </tr>
              ) : (
                activeAkuns.map((a) => {
                  const s = getSaldo(a.id);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{a.kodeAkun}</td>
                      <td className="px-4 py-3 text-gray-700">{a.namaAkun}</td>
                      <td className="px-4 py-2 text-right">
                        {isTerbuka ? (
                          <input
                            type="number"
                            value={s.debit || ''}
                            onChange={(e) => handleDebitChange(a.id, e.target.value)}
                            className="w-full text-right rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="0"
                            min="0"
                          />
                        ) : (
                          <span className="text-gray-700">{s.debit ? formatRupiah(s.debit) : '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isTerbuka ? (
                          <input
                            type="number"
                            value={s.kredit || ''}
                            onChange={(e) => handleKreditChange(a.id, e.target.value)}
                            className="w-full text-right rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="0"
                            min="0"
                          />
                        ) : (
                          <span className="text-gray-700">{s.kredit ? formatRupiah(s.kredit) : '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
              {/* Total Row */}
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                <td colSpan={2} className="px-4 py-4 text-left text-gray-800 uppercase tracking-wider text-xs">Total</td>
                <td className={`px-4 py-4 text-right ${isSeimbang ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatRupiah(totalDebit)}
                </td>
                <td className={`px-4 py-4 text-right ${isSeimbang ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatRupiah(totalKredit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {isTerbuka && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleTutupBuku}
              disabled={!isSeimbang}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              Tutup Buku Saldo Awal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
