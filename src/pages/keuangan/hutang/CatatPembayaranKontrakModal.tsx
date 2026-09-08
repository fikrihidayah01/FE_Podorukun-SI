import { useState, useMemo } from 'react';
import { useKontrakStore, type Kontrak } from '../../../store/kontrakStore';
import { useCoaStore } from '../../../store/coaStore';
import Modal from '../../../components/ui/Modal';
import { Info } from 'lucide-react';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

interface CatatPembayaranKontrakModalProps {
  kontrak: Kontrak;
  isOpen: boolean;
  onClose: () => void;
}

export default function CatatPembayaranKontrakModal({ kontrak, isOpen, onClose }: CatatPembayaranKontrakModalProps) {
  const { pembayarans, adendums, addPembayaran } = useKontrakStore();
  const akuns = useCoaStore((s) => s.items);

  const kasBankAkuns = useMemo(() => {
    return akuns.filter(a => a.isKasBank);
  }, [akuns]);

  const [form, setForm] = useState({
    tanggal: '',
    nominal: '',
    akunKasId: '',
    noBukti: '',
    keterangan: '',
  });
  const [error, setError] = useState('');

  // Kalkulasi sisa
  const riwayatAdendum = adendums.filter(a => a.kontrakId === kontrak.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const nilaiTerkini = riwayatAdendum.length > 0 ? riwayatAdendum[0].nilaiBaru : kontrak.nilaiKontrak;
  
  const totalTerbayar = pembayarans.filter(p => p.kontrakId === kontrak.id).reduce((sum, p) => sum + p.nominal, 0);
  const sisaKontrak = nilaiTerkini - totalTerbayar;

  const pNominal = Number(form.nominal) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tanggal) return setError('Tanggal wajib diisi');
    if (!form.akunKasId) return setError('Akun kas / bank wajib dipilih');
    if (!form.noBukti.trim()) return setError('No. Bukti wajib diisi');
    if (pNominal <= 0) return setError('Nominal pembayaran harus lebih dari 0');
    if (pNominal > sisaKontrak) return setError(`Nominal pembayaran melebihi sisa kontrak (Maks: ${formatRupiah(sisaKontrak)})`);

    addPembayaran({
      kontrakId: kontrak.id,
      tanggal: form.tanggal,
      nominal: pNominal,
      akunKasId: form.akunKasId,
      noBukti: form.noBukti.trim(),
      keterangan: form.keterangan.trim() || undefined,
    });

    setForm({ tanggal: '', nominal: '', akunKasId: '', noBukti: '', keterangan: '' });
    setError('');
    onClose();
  };

  const selectedKas = akuns.find(a => a.id === form.akunKasId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Pembayaran Termin" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
          <Info className="h-5 w-5 mt-0.5 shrink-0 text-sky-600" />
          <p className="text-sm">
            Pembayaran ini akan dicatat sebagai 2 baris jurnal: mengurangi kewajiban (Hutang Kontraktor) dan mengurangi saldo Kas/Bank.
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}

        {/* Ringkasan Kontrak */}
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Nilai Kontrak</p>
            <p className="text-sm font-bold text-gray-900">{formatRupiah(nilaiTerkini)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Total Terbayar</p>
            <p className="text-sm font-bold text-gray-900">{formatRupiah(totalTerbayar)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Sisa Kontrak</p>
            <p className="text-sm font-bold text-gray-900">{formatRupiah(sisaKontrak)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bayar <span className="text-red-500">*</span></label>
            <input type="date" value={form.tanggal} onChange={(e) => setForm({...form, tanggal: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Pembayaran <span className="text-red-500">*</span></label>
            <input type="number" value={form.nominal} onChange={(e) => setForm({...form, nominal: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="0" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Akun Kas / Bank (Kredit) <span className="text-red-500">*</span></label>
            <select value={form.akunKasId} onChange={(e) => setForm({...form, akunKasId: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">— Pilih Akun —</option>
              {kasBankAkuns.map(a => <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Bukti Transaksi <span className="text-red-500">*</span></label>
            <input type="text" value={form.noBukti} onChange={(e) => setForm({...form, noBukti: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Contoh: BKK/2026/06/014" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <input type="text" value={form.keterangan} onChange={(e) => setForm({...form, keterangan: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Contoh: Pembayaran Termin 1" />
          </div>

          {/* Pratinjau Jurnal */}
          {pNominal > 0 && (
            <div className="sm:col-span-2 border-t border-gray-200 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Pratinjau Jurnal Pembayaran</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Akun</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Debit</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr>
                      <td className="px-4 py-2 text-gray-700">Hutang Kontraktor</td>
                      <td className="px-4 py-2 text-left">{formatRupiah(pNominal)}</td>
                      <td className="px-4 py-2 text-left text-gray-400">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">{selectedKas ? `${selectedKas.kodeAkun} — ${selectedKas.namaAkun}` : 'Kas / Bank'}</td>
                      <td className="px-4 py-2 text-left text-gray-400">—</td>
                      <td className="px-4 py-2 text-left">{formatRupiah(pNominal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300">Batal</button>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Simpan Pembayaran</button>
        </div>
      </form>
    </Modal>
  );
}
