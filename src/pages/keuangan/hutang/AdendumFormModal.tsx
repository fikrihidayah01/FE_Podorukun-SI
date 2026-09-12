import { useState } from 'react';
import { useKontrakStore, type Kontrak } from '../../../store/kontrakStore';
import Modal from '../../../components/ui/Modal';
import { MdUploadFile, MdInfo } from 'react-icons/md';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

interface AdendumFormModalProps {
  kontrak: Kontrak;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdendumFormModal({ kontrak, isOpen, onClose }: AdendumFormModalProps) {
  const { addAdendum } = useKontrakStore();

  const [form, setForm] = useState({
    noAdendum: '',
    tanggal: '',
    nilaiBaru: '',
    alasan: '',
  });
  const [lampiranObj, setLampiranObj] = useState<File | null>(null);
  const [error, setError] = useState('');

  // Hitung nilai terakhir (setelah semua adendum jika ada)
  const allAdendums = useKontrakStore.getState().adendums.filter(a => a.kontrakId === kontrak.id);
  const nilaiLama = allAdendums.length > 0 
    ? allAdendums.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].nilaiBaru 
    : kontrak.nilaiKontrak;

  const pNilaiBaru = Number(form.nilaiBaru) || 0;
  const selisih = pNilaiBaru - nilaiLama;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.noAdendum.trim()) return setError('No. Adendum wajib diisi');
    if (!form.tanggal) return setError('Tanggal wajib diisi');
    if (pNilaiBaru <= 0) return setError('Nilai Baru harus lebih dari 0');
    if (selisih === 0) return setError('Nilai Baru tidak boleh sama dengan Nilai Lama');
    if (!form.alasan.trim()) return setError('Alasan perubahan kontrak wajib diisi');

    addAdendum({
      kontrakId: kontrak.id,
      noAdendum: form.noAdendum.trim(),
      tanggal: form.tanggal,
      nilaiLama,
      nilaiBaru: pNilaiBaru,
      alasan: form.alasan.trim(),
      lampiran: lampiranObj ? lampiranObj.name : undefined,
    });

    setForm({ noAdendum: '', tanggal: '', nilaiBaru: '', alasan: '' });
    setLampiranObj(null);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adendum Kontrak" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-900">
          <MdInfo className="h-5 w-5 mt-0.5 shrink-0 text-indigo-600" />
          <p className="text-sm">
            Adendum akan mengubah nilai sisa kontrak dan <strong>otomatis membentuk jurnal penyesuaian</strong> (Persediaan terhadap Hutang) sebesar selisih nilai.
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. SPK Rujukan</label>
            <input type="text" value={kontrak.noSpk} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Adendum <span className="text-red-500">*</span></label>
            <input type="date" value={form.tanggal} onChange={(e) => setForm({...form, tanggal: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Dokumen Adendum <span className="text-red-500">*</span></label>
            <input type="text" value={form.noAdendum} onChange={(e) => setForm({...form, noAdendum: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Contoh: ADD/2026/06/001" />
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4 sm:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nilai Lama</label>
              <input type="text" value={formatRupiah(nilaiLama)} disabled className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Baru <span className="text-red-500">*</span></label>
              <input type="number" value={form.nilaiBaru} onChange={(e) => setForm({...form, nilaiBaru: e.target.value})} className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-indigo-700" placeholder="0" />
            </div>
            {selisih !== 0 && pNilaiBaru > 0 && (
              <div className="col-span-2 text-sm font-medium px-3 py-2 rounded border bg-white border-gray-200">
                Selisih: <span className={selisih > 0 ? 'text-red-600' : 'text-emerald-600'}>
                  {selisih > 0 ? '+' : '-'} {formatRupiah(Math.abs(selisih))}
                </span>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Perubahan <span className="text-red-500">*</span></label>
            <textarea value={form.alasan} onChange={(e) => setForm({...form, alasan: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} placeholder="Penjelasan detail..." />
          </div>

          {/* Dummy Upload Lampiran */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lampiran Dokumen</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <MdUploadFile className="w-6 h-6 mb-2 text-gray-500" />
                <p className="text-xs text-gray-500">{lampiranObj ? lampiranObj.name : 'Klik untuk unggah dokumen (PDF/Word)'}</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files && setLampiranObj(e.target.files[0])} />
            </label>
          </div>

          {/* Pratinjau Jurnal Penyesuaian */}
          {selisih !== 0 && pNilaiBaru > 0 && (
            <div className="sm:col-span-2 border-t border-gray-200 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Pratinjau Jurnal Penyesuaian</h4>
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
                    {selisih > 0 ? (
                      <>
                        <tr>
                          <td className="px-4 py-2 text-gray-700">Persediaan / WIP</td>
                          <td className="px-4 py-2 text-left">{formatRupiah(Math.abs(selisih))}</td>
                          <td className="px-4 py-2 text-left text-gray-400">—</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-gray-700">Hutang Kontraktor</td>
                          <td className="px-4 py-2 text-left text-gray-400">—</td>
                          <td className="px-4 py-2 text-left">{formatRupiah(Math.abs(selisih))}</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td className="px-4 py-2 text-gray-700">Hutang Kontraktor</td>
                          <td className="px-4 py-2 text-left">{formatRupiah(Math.abs(selisih))}</td>
                          <td className="px-4 py-2 text-left text-gray-400">—</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-gray-700">Persediaan / WIP</td>
                          <td className="px-4 py-2 text-left text-gray-400">—</td>
                          <td className="px-4 py-2 text-left">{formatRupiah(Math.abs(selisih))}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300">Batal</button>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Simpan Adendum</button>
        </div>
      </form>
    </Modal>
  );
}
