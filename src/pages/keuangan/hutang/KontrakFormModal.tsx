import React, { useState, useMemo } from 'react';
import { useKontrakStore } from '../../../store/kontrakStore';
import { useCoaStore } from '../../../store/coaStore';
import { useProyekStore } from '../../../store/proyekStore';
import Modal from '../../../components/ui/Modal';
import { MdWarning, MdCheck } from 'react-icons/md';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

interface KontrakFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KontrakFormModal({ isOpen, onClose }: KontrakFormModalProps) {
  const { kontraks, addKontrak } = useKontrakStore();
  const proyeks = useProyekStore((s) => s.items);
  const akuns = useCoaStore((s) => s.items);

  const persediaanAkuns = useMemo(() => akuns.filter((a) => a.kategori === 'aktiva' && a.namaAkun.toLowerCase().includes('persediaan')), [akuns]);
  const hutangAkuns = useMemo(() => akuns.filter((a) => a.kategori === 'hutang' && a.namaAkun.toLowerCase().includes('kontraktor')), [akuns]);

  const [form, setForm] = useState({
    proyekId: '',
    kavling: '',
    kontraktorId: '', // placeholder
    namaKontraktor: '',
    noSpk: '',
    tanggalSpk: '',
    tipe: '',
    nilaiKontrak: '',
    rab: '',
    keterangan: '',
    akunHutangId: '',
    akunPersediaanId: '',
  });
  const [error, setError] = useState('');

  const pRab = Number(form.rab) || 0;
  const pNilai = Number(form.nilaiKontrak) || 0;
  const selisih = pRab - pNilai; // Selisih positif = di bawah RAB (hemat)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.proyekId) return setError('Proyek dan Kavling wajib dipilih/diisi.');
    if (!form.kavling.trim()) return setError('Kavling wajib diisi.');
    if (!form.namaKontraktor.trim()) return setError('Nama kontraktor wajib diisi');
    if (!form.noSpk.trim()) return setError('No. SPK wajib diisi');
    if (kontraks.some((k) => k.noSpk === form.noSpk.trim())) return setError('No. SPK sudah digunakan (harus unik)');
    if (!form.tanggalSpk) return setError('Tanggal SPK wajib diisi');
    if (pNilai <= 0) return setError('Nilai kontrak harus lebih dari 0');
    if (pRab <= 0) return setError('Nilai RAB harus lebih dari 0');
    if (!form.akunHutangId || !form.akunPersediaanId) return setError('Akun Jurnal wajib dipilih');

    addKontrak({
      noSpk: form.noSpk.trim(),
      tanggalSpk: form.tanggalSpk,
      proyekId: form.proyekId,
      kavling: form.kavling.trim(),
      tipe: form.tipe.trim(),
      kontraktorId: crypto.randomUUID(), 
      namaKontraktor: form.namaKontraktor.trim(),
      rab: pRab,
      nilaiKontrak: pNilai,
      keterangan: form.keterangan.trim(),
      akunPersediaanId: form.akunPersediaanId,
      akunHutangId: form.akunHutangId,
    });

    setForm({
      proyekId: '', kavling: '', kontraktorId: '', namaKontraktor: '', noSpk: '', tanggalSpk: '', tipe: '', nilaiKontrak: '', rab: '', keterangan: '', akunHutangId: '', akunPersediaanId: '',
    });
    setError('');
    onClose();
  };

  const selectedPersediaan = akuns.find(a => a.id === form.akunPersediaanId);
  const selectedHutang = akuns.find(a => a.id === form.akunHutangId);
  
  const proyekTerpilih = proyeks.find(p => p.id === form.proyekId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah kontrak" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Subheader simulation since it's global modal */}
        <div className="flex gap-3 mb-2">
          <select value={form.proyekId} onChange={(e) => setForm({...form, proyekId: e.target.value})} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-1/2">
            <option value="">— Pilih Proyek —</option>
            {proyeks.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
          <input type="text" value={form.kavling} onChange={(e) => setForm({...form, kavling: e.target.value})} placeholder="Kavling (Mis: C3)" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-1/2" />
        </div>
        {(form.kavling || form.proyekId) && (
          <p className="text-sm text-gray-500 mt-[-10px] mb-4">
            Kavling {form.kavling || '...'} · {proyekTerpilih?.nama || '...'}
          </p>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-[#fffbeb] px-4 py-3 text-amber-900">
          <MdWarning className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm">
            Hutang diakui penuh saat SPK disimpan. Perubahan nilai setelah ini harus lewat adendum.
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Kontraktor</label>
            <input type="text" value={form.namaKontraktor} onChange={(e) => setForm({...form, namaKontraktor: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" placeholder="SK-0011 — CV Karya Mandiri" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">No. SPK</label>
            <input type="text" value={form.noSpk} onChange={(e) => setForm({...form, noSpk: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" placeholder="SPK/AH/2025/044" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Tanggal SPK</label>
            <input type="date" value={form.tanggalSpk} onChange={(e) => setForm({...form, tanggalSpk: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tipe rumah</label>
            <input type="text" value={form.tipe} onChange={(e) => setForm({...form, tipe: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" placeholder="94" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Nilai kontrak</label>
            <input type="number" value={form.nilaiKontrak} onChange={(e) => setForm({...form, nilaiKontrak: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" placeholder="347800000" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nilai RAB</label>
            <input type="number" value={form.rab} onChange={(e) => setForm({...form, rab: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" placeholder="352000000" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Keterangan</label>
            <input type="text" value={form.keterangan} onChange={(e) => setForm({...form, keterangan: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Pembangunan unit A-01 lengkap" />
          </div>
        </div>

        {(pRab > 0 && pNilai > 0) && (
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${selisih >= 0 ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {selisih >= 0 ? <MdCheck className="h-5 w-5" /> : <MdWarning className="h-5 w-5" />}
            <p>
              {selisih >= 0 
                ? `Di bawah RAB. Selisih ${formatRupiah(selisih)}.` 
                : `Di atas RAB (Overbudget). Selisih ${formatRupiah(Math.abs(selisih))}.`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Akun hutang</label>
            <select value={form.akunHutangId} onChange={(e) => setForm({...form, akunHutangId: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">— Pilih Akun —</option>
              {hutangAkuns.map(a => <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Akun lawan</label>
            <select value={form.akunPersediaanId} onChange={(e) => setForm({...form, akunPersediaanId: e.target.value})} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">— Pilih Akun —</option>
              {persediaanAkuns.map(a => <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>)}
            </select>
          </div>
        </div>

        {/* Pratinjau Jurnal */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3">Pratinjau jurnal</h4>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Akun</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Debit</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-3 text-gray-900">{selectedPersediaan ? `${selectedPersediaan.kodeAkun} — ${selectedPersediaan.namaAkun}` : '131010 — Persediaan kavling'}</td>
                  <td className="px-4 py-3 text-left text-gray-900">{pNilai > 0 ? formatRupiah(pNilai) : '—'}</td>
                  <td className="px-4 py-3 text-left text-gray-400">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">{selectedHutang ? `${selectedHutang.kodeAkun} — ${selectedHutang.namaAkun}` : '213010 — Hutang kontraktor'}</td>
                  <td className="px-4 py-3 text-left text-gray-400">—</td>
                  <td className="px-4 py-3 text-left text-gray-900">{pNilai > 0 ? formatRupiah(pNilai) : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors">Simpan dan buat jurnal</button>
        </div>
      </form>
    </Modal>
  );
}
