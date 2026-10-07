import { useMemo, useState } from 'react';
import { useHutangStore, type KategoriHutang, KATEGORI_HUTANG_LABELS } from '../../../store/hutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import { useCoaStore } from '../../../store/coaStore';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Notice from '../../../components/ui/Notice';

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
  proyekLawanId: '',
};

type FormErrors = Partial<Record<keyof typeof EMPTY_FORM, string>>;

export default function InputMutasiModal({ isOpen, onClose }: InputMutasiModalProps) {
  const { kodePembantus, addKodePembantu, addMutasi } = useHutangStore();
  const { items: proyeks } = useProyekStore();
  const { items: akuns } = useCoaStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [createNewKp, setCreateNewKp] = useState(false);

  const filteredKp = useMemo(() => {
    if (!form.proyekId || !form.kategori) return [];
    return kodePembantus.filter((kp) => kp.proyekId === form.proyekId && kp.kategori === form.kategori);
  }, [kodePembantus, form.proyekId, form.kategori]);

  const pihakBaru = createNewKp || filteredKp.length === 0;
  const isAntarProyek = form.kategori === 'antar_proyek';

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setCreateNewKp(false);
    onClose();
  };

  const validate = () => {
    const e: FormErrors = {};
    if (!form.proyekId) e.proyekId = 'Pilih proyek.';
    if (!form.kategori) e.kategori = 'Pilih kategori hutang.';
    if (form.proyekId && form.kategori) {
      if (!pihakBaru && !form.kodePembantuId) e.kodePembantuId = 'Pilih pihak, atau tambahkan pihak baru.';
      if (pihakBaru && !form.kodePembantuBaru.trim()) e.kodePembantuBaru = 'Tulis nama pihak.';
    }
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi.';
    if (!form.nominal || Number(form.nominal) <= 0) e.nominal = 'Nominal harus lebih dari 0.';
    if (!form.uraian.trim()) e.uraian = 'Uraian wajib diisi.';
    if (isAntarProyek && !form.proyekLawanId) e.proyekLawanId = 'Pilih proyek pemberi pinjaman.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const kpId = pihakBaru
      ? await addKodePembantu({ nama: form.kodePembantuBaru.trim(), proyekId: form.proyekId, kategori: form.kategori as KategoriHutang })
      : form.kodePembantuId;

    await addMutasi({
      proyekId: form.proyekId,
      kodePembantuId: kpId,
      kategori: form.kategori as KategoriHutang,
      tanggal: form.tanggal,
      uraian: form.uraian.trim(),
      jenisMutasi: form.jenisMutasi,
      nominal: Number(form.nominal),
      akunCoaId: form.akunCoaId || undefined,
      referensi: form.referensi.trim() || undefined,
      proyekLawanId: isAntarProyek ? form.proyekLawanId : undefined,
    });
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Input mutasi hutang"
      description="Mutasi langsung masuk ke saldo berjalan kode pembantu yang dipilih"
      size="lg"
      footer={
        <>
          <Button onClick={handleClose}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit}>
            Simpan mutasi
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Proyek" required error={errors.proyekId}>
            <select
              className="control"
              value={form.proyekId}
              onChange={(e) => setForm({ ...form, proyekId: e.target.value, kodePembantuId: '', proyekLawanId: '' })}
            >
              <option value="">Pilih proyek</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </Field>
          <Field label="Kategori hutang" required error={errors.kategori}>
            <select
              className="control"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriHutang, kodePembantuId: '' })}
            >
              <option value="">Pilih kategori</option>
              {(Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[]).map((k) => (
                <option key={k} value={k}>{KATEGORI_HUTANG_LABELS[k]}</option>
              ))}
            </select>
          </Field>
        </div>

        {isAntarProyek && (
          <>
            <Notice>Piutang di proyek pemberi pinjaman dicatat otomatis, jadi tidak perlu input ulang di sisi sana.</Notice>
            <Field label="Proyek pemberi pinjaman" required error={errors.proyekLawanId}>
              <select className="control" value={form.proyekLawanId} onChange={(e) => setForm({ ...form, proyekLawanId: e.target.value })}>
                <option value="">Pilih proyek</option>
                {proyeks
                  .filter((p) => p.id !== form.proyekId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
              </select>
            </Field>
          </>
        )}

        {form.proyekId && form.kategori && (
          <div>
            {!pihakBaru ? (
              <Field label="Kode pembantu (pihak)" required error={errors.kodePembantuId}>
                <select className="control" value={form.kodePembantuId} onChange={(e) => setForm({ ...form, kodePembantuId: e.target.value })}>
                  <option value="">Pilih pihak</option>
                  {filteredKp.map((kp) => (
                    <option key={kp.id} value={kp.id}>{kp.nama}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field
                label="Nama pihak baru"
                required
                error={errors.kodePembantuBaru}
                hint={filteredKp.length === 0 ? 'Belum ada pihak untuk proyek dan kategori ini, jadi pihak baru akan dibuat.' : undefined}
              >
                <input
                  className="control"
                  value={form.kodePembantuBaru}
                  onChange={(e) => setForm({ ...form, kodePembantuBaru: e.target.value })}
                  placeholder="Contoh: Bank BRI, PT Sumber Rejeki"
                />
              </Field>
            )}
            {filteredKp.length > 0 && (
              <button
                type="button"
                onClick={() => setCreateNewKp((v) => !v)}
                className="mt-1.5 rounded text-[13px] font-semibold text-brand-700 hover:underline"
              >
                {createNewKp ? 'Pilih dari daftar pihak' : 'Tambah pihak baru'}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Tanggal" required error={errors.tanggal}>
            <input type="date" className="control" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </Field>
          <Field label="Jenis mutasi" required>
            <select
              className="control"
              value={form.jenisMutasi}
              onChange={(e) => setForm({ ...form, jenisMutasi: e.target.value as 'debit' | 'kredit' })}
            >
              <option value="kredit">Bertambah (kredit)</option>
              <option value="debit">Berkurang (debit)</option>
            </select>
          </Field>
          <Field label="Nominal" required error={errors.nominal}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="control control-num"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value })}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Akun COA" optional>
          <select className="control" value={form.akunCoaId} onChange={(e) => setForm({ ...form, akunCoaId: e.target.value })}>
            <option value="">Pilih akun</option>
            {akuns.map((a) => (
              <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Uraian" required error={errors.uraian}>
            <input className="control" value={form.uraian} onChange={(e) => setForm({ ...form, uraian: e.target.value })} placeholder="Contoh: Angsuran lahan kavling A-08" />
          </Field>
          <Field label="No. referensi" optional>
            <input className="control" value={form.referensi} onChange={(e) => setForm({ ...form, referensi: e.target.value })} placeholder="Contoh: BKK/2026/09/031" />
          </Field>
        </div>

        <p className="rounded-lg border border-dashed border-line-strong/60 px-4 py-3 text-[13px] text-ink-3">
          Lampiran bukti transfer belum bisa diunggah. Fitur ini menyusul setelah penyimpanan file di backend siap.
        </p>
      </div>
    </Modal>
  );
}
