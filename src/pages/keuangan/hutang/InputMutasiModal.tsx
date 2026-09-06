import { useState, useMemo } from 'react';
import { useHutangStore, type KategoriHutang, KATEGORI_HUTANG_LABELS } from '../../../store/hutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import { useCoaStore } from '../../../store/coaStore';
import Modal from '../../../components/ui/Modal';
import { ArrowLeftRight, Info } from 'lucide-react';

interface InputMutasiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  proyekId: '',
  kategori: '' as KategoriHutang | '',
  kodePembantuId: '',
  kodePembantuBaru: '',
  tanggal: '',
  jenisMutasi: 'kredit' as 'debit' | 'kredit',
  nominal: '',
  akunCoaId: '',
  uraian: '',
  referensi: '',
  lampiran: '',
  // Antar proyek
  proyekLawanId: '',
  // Lahan — jatuh tempo optional
  tanggalJatuhTempo: '',
};

type FormErrors = Partial<Record<keyof typeof EMPTY_FORM, string>>;

export default function InputMutasiModal({ isOpen, onClose }: InputMutasiModalProps) {
  const { kodePembantus, addKodePembantu, addMutasi } = useHutangStore();
  const { items: proyeks } = useProyekStore();
  const { items: akuns } = useCoaStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [createNewKp, setCreateNewKp] = useState(false);

  // Filter kode pembantu by proyek + kategori
  const filteredKp = useMemo(() => {
    if (!form.proyekId || !form.kategori) return [];
    return kodePembantus.filter(
      (kp) => kp.proyekId === form.proyekId && kp.kategori === form.kategori
    );
  }, [kodePembantus, form.proyekId, form.kategori]);

  // Reset form
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setCreateNewKp(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.proyekId) e.proyekId = 'Proyek wajib dipilih';
    if (!form.kategori) e.kategori = 'Kategori hutang wajib dipilih';
    if (!createNewKp && !form.kodePembantuId && filteredKp.length > 0)
      e.kodePembantuId = 'Kode pembantu wajib dipilih';
    if (createNewKp && !form.kodePembantuBaru.trim())
      e.kodePembantuBaru = 'Nama pihak wajib diisi';
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi';
    if (!form.nominal || Number(form.nominal) <= 0) e.nominal = 'Nominal harus lebih dari 0';
    if (!form.uraian.trim()) e.uraian = 'Uraian wajib diisi';
    if (form.kategori === 'antar_proyek' && !form.proyekLawanId)
      e.proyekLawanId = 'Proyek pemberi pinjaman wajib dipilih';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Create new kode pembantu if needed
    let kpId = form.kodePembantuId;
    if (createNewKp || filteredKp.length === 0) {
      kpId = addKodePembantu({
        nama: form.kodePembantuBaru.trim(),
        proyekId: form.proyekId,
        kategori: form.kategori as KategoriHutang,
      });
    }

    addMutasi({
      proyekId: form.proyekId,
      kodePembantuId: kpId,
      kategori: form.kategori as KategoriHutang,
      tanggal: form.tanggal,
      uraian: form.uraian.trim(),
      jenisMutasi: form.jenisMutasi,
      nominal: Number(form.nominal),
      akunCoaId: form.akunCoaId || undefined,
      referensi: form.referensi.trim() || undefined,
      lampiran: form.lampiran || undefined,
      proyekLawanId: form.kategori === 'antar_proyek' ? form.proyekLawanId : undefined,
    });

    handleClose();
  };

  const isAntarProyek = form.kategori === 'antar_proyek';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Input mutasi hutang"
      size="lg"
      footer={
        <>
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Simpan mutasi
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Row: Proyek + Kategori */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proyek <span className="text-red-500">*</span>
            </label>
            <select
              value={form.proyekId}
              onChange={(e) => setForm({ ...form, proyekId: e.target.value, kodePembantuId: '', proyekLawanId: '' })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.proyekId ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">— Pilih proyek —</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
            {errors.proyekId && <p className="mt-1 text-xs text-red-500">{errors.proyekId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori hutang <span className="text-red-500">*</span>
            </label>
            <select
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriHutang, kodePembantuId: '' })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.kategori ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">— Pilih kategori —</option>
              {(Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[]).map((k) => (
                <option key={k} value={k}>{KATEGORI_HUTANG_LABELS[k]}</option>
              ))}
            </select>
            {errors.kategori && <p className="mt-1 text-xs text-red-500">{errors.kategori}</p>}
          </div>
        </div>

        {/* Antar proyek info banner */}
        {isAntarProyek && (
          <div className="flex items-start gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
            <ArrowLeftRight className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-700">
              Sistem otomatis mencatat piutang di proyek lawan. Tidak perlu input ulang di sisi pemberi pinjaman.
            </p>
          </div>
        )}

        {/* Antar proyek: Proyek pemberi pinjaman */}
        {isAntarProyek && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proyek pemberi pinjaman <span className="text-red-500">*</span>
            </label>
            <select
              value={form.proyekLawanId}
              onChange={(e) => setForm({ ...form, proyekLawanId: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.proyekLawanId ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">— Pilih proyek pemberi —</option>
              {proyeks
                .filter((p) => p.id !== form.proyekId)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
            </select>
            {errors.proyekLawanId && <p className="mt-1 text-xs text-red-500">{errors.proyekLawanId}</p>}
          </div>
        )}

        {/* Kode Pembantu — existing or new */}
        {form.proyekId && form.kategori && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode pembantu (pihak) <span className="text-red-500">*</span>
            </label>
            {filteredKp.length > 0 && !createNewKp ? (
              <>
                <select
                  value={form.kodePembantuId}
                  onChange={(e) => setForm({ ...form, kodePembantuId: e.target.value })}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.kodePembantuId ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">— Pilih pihak —</option>
                  {filteredKp.map((kp) => (
                    <option key={kp.id} value={kp.id}>{kp.nama}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCreateNewKp(true)}
                  className="mt-1 text-xs text-indigo-600 hover:underline"
                >
                  + Tambah pihak baru
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={form.kodePembantuBaru}
                  onChange={(e) => setForm({ ...form, kodePembantuBaru: e.target.value })}
                  placeholder="Nama pihak baru (mis: Bank BRI, PT XYZ)"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.kodePembantuBaru ? 'border-red-400' : 'border-gray-300'}`}
                />
                {filteredKp.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCreateNewKp(false)}
                    className="mt-1 text-xs text-gray-500 hover:underline"
                  >
                    ← Pilih dari daftar existing
                  </button>
                )}
              </>
            )}
            {errors.kodePembantuId && <p className="mt-1 text-xs text-red-500">{errors.kodePembantuId}</p>}
            {errors.kodePembantuBaru && <p className="mt-1 text-xs text-red-500">{errors.kodePembantuBaru}</p>}
          </div>
        )}

        {/* Tanggal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.tanggal ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.tanggal && <p className="mt-1 text-xs text-red-500">{errors.tanggal}</p>}
        </div>

        {/* Row: Jenis Mutasi + Nominal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis mutasi <span className="text-red-500">*</span>
            </label>
            <select
              value={form.jenisMutasi}
              onChange={(e) => setForm({ ...form, jenisMutasi: e.target.value as 'debit' | 'kredit' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="kredit">Penambahan hutang (kredit)</option>
              <option value="debit">Pengurangan hutang (debit)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nominal <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value })}
              placeholder="0"
              min={0}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.nominal ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.nominal && <p className="mt-1 text-xs text-red-500">{errors.nominal}</p>}
          </div>
        </div>

        {/* Akun COA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Akun COA</label>
          <select
            value={form.akunCoaId}
            onChange={(e) => setForm({ ...form, akunCoaId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">— Pilih akun (opsional) —</option>
            {akuns.map((a) => (
              <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>
            ))}
          </select>
        </div>

        {/* Uraian */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Uraian <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.uraian}
            onChange={(e) => setForm({ ...form, uraian: e.target.value })}
            placeholder="Keterangan transaksi"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.uraian ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.uraian && <p className="mt-1 text-xs text-red-500">{errors.uraian}</p>}
        </div>

        {/* Lampiran bukti */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lampiran bukti</label>
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
            <Info className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">
              Unggah bukti transfer atau dokumen pendukung
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              (Fitur upload tersedia saat backend sudah siap)
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
