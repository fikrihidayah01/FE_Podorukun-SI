import { useMemo, useState, type FormEvent } from 'react';
import { useKontrakStore } from '../../../store/kontrakStore';
import { useCoaStore } from '../../../store/coaStore';
import { useProyekStore } from '../../../store/proyekStore';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Notice from '../../../components/ui/Notice';
import { formatRupiah } from '../../../utils/format';
import JurnalPreview from './JurnalPreview';

interface KontrakFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY = {
  proyekId: '',
  kavling: '',
  namaKontraktor: '',
  noSpk: '',
  tanggalSpk: '',
  tipe: '',
  nilaiKontrak: '',
  rab: '',
  keterangan: '',
  akunHutangId: '',
  akunPersediaanId: '',
};

export default function KontrakFormModal({ isOpen, onClose }: KontrakFormModalProps) {
  const { kontraks, addKontrak } = useKontrakStore();
  const proyeks = useProyekStore((s) => s.items);
  const akuns = useCoaStore((s) => s.items);

  const persediaanAkuns = useMemo(
    () => akuns.filter((a) => a.kategori === 'aktiva' && a.namaAkun.toLowerCase().includes('persediaan')),
    [akuns],
  );
  const hutangAkuns = useMemo(
    () => akuns.filter((a) => a.kategori === 'hutang' && a.namaAkun.toLowerCase().includes('kontraktor')),
    [akuns],
  );

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const set = (key: keyof typeof EMPTY, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const pRab = Number(form.rab) || 0;
  const pNilai = Number(form.nilaiKontrak) || 0;
  const selisih = pRab - pNilai;

  const handleClose = () => {
    setForm(EMPTY);
    setError('');
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.proyekId) return setError('Pilih proyek.');
    if (!form.kavling.trim()) return setError('Kavling wajib diisi.');
    if (!form.namaKontraktor.trim()) return setError('Nama kontraktor wajib diisi.');
    if (!form.noSpk.trim()) return setError('No. SPK wajib diisi.');
    if (kontraks.some((k) => k.noSpk === form.noSpk.trim())) return setError('No. SPK ini sudah dipakai. Setiap SPK harus unik.');
    if (!form.tanggalSpk) return setError('Tanggal SPK wajib diisi.');
    if (pNilai <= 0) return setError('Nilai kontrak harus lebih dari 0.');
    if (pRab <= 0) return setError('Nilai RAB harus lebih dari 0.');
    if (!form.akunHutangId || !form.akunPersediaanId) return setError('Pilih akun hutang dan akun lawan untuk jurnal.');

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
    handleClose();
  };

  const persediaan = akuns.find((a) => a.id === form.akunPersediaanId);
  const hutang = akuns.find((a) => a.id === form.akunHutangId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tambah kontrak"
      size="lg"
      footer={
        <>
          <Button onClick={handleClose}>Batal</Button>
          <Button variant="primary" type="submit" form="kontrak-form">
            Simpan dan buat jurnal
          </Button>
        </>
      }
    >
      <form id="kontrak-form" onSubmit={handleSubmit} className="space-y-5">
        <Notice tone="warning">Hutang diakui penuh saat SPK disimpan. Perubahan nilai setelah ini harus lewat adendum.</Notice>
        {error && <Notice tone="danger">{error}</Notice>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Proyek" required>
            <select className="control" value={form.proyekId} onChange={(e) => set('proyekId', e.target.value)}>
              <option value="">Pilih proyek</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </Field>
          <Field label="Kavling" required>
            <input className="control" value={form.kavling} onChange={(e) => set('kavling', e.target.value)} placeholder="Contoh: C3" />
          </Field>
          <Field label="Kontraktor" required>
            <input className="control" value={form.namaKontraktor} onChange={(e) => set('namaKontraktor', e.target.value)} placeholder="Contoh: CV Karya Mandiri" />
          </Field>
          <Field label="No. SPK" required>
            <input className="control" value={form.noSpk} onChange={(e) => set('noSpk', e.target.value)} placeholder="Contoh: SPK/AH/2025/044" />
          </Field>
          <Field label="Tanggal SPK" required>
            <input type="date" className="control" value={form.tanggalSpk} onChange={(e) => set('tanggalSpk', e.target.value)} />
          </Field>
          <Field label="Tipe rumah" optional>
            <input className="control" value={form.tipe} onChange={(e) => set('tipe', e.target.value)} placeholder="Contoh: 94" />
          </Field>
          <Field label="Nilai kontrak" required>
            <input type="number" inputMode="numeric" min={0} className="control control-num" value={form.nilaiKontrak} onChange={(e) => set('nilaiKontrak', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Nilai RAB" required>
            <input type="number" inputMode="numeric" min={0} className="control control-num" value={form.rab} onChange={(e) => set('rab', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Keterangan" optional className="sm:col-span-2">
            <input className="control" value={form.keterangan} onChange={(e) => set('keterangan', e.target.value)} placeholder="Contoh: Pembangunan unit A-01 lengkap" />
          </Field>
        </div>

        {pRab > 0 && pNilai > 0 && (
          <Notice tone={selisih >= 0 ? 'positive' : 'danger'}>
            {selisih >= 0
              ? `Di bawah RAB, selisih ${formatRupiah(selisih)}.`
              : `Melebihi RAB sebesar ${formatRupiah(Math.abs(selisih))}.`}
          </Notice>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Akun hutang" required>
            <select className="control" value={form.akunHutangId} onChange={(e) => set('akunHutangId', e.target.value)}>
              <option value="">Pilih akun</option>
              {hutangAkuns.map((a) => (
                <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
              ))}
            </select>
          </Field>
          <Field label="Akun lawan (persediaan)" required>
            <select className="control" value={form.akunPersediaanId} onChange={(e) => set('akunPersediaanId', e.target.value)}>
              <option value="">Pilih akun</option>
              {persediaanAkuns.map((a) => (
                <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
              ))}
            </select>
          </Field>
        </div>

        <JurnalPreview
          rows={[
            { akun: persediaan ? `${persediaan.kodeAkun} - ${persediaan.namaAkun}` : 'Persediaan kavling', debit: pNilai },
            { akun: hutang ? `${hutang.kodeAkun} - ${hutang.namaAkun}` : 'Hutang kontraktor', kredit: pNilai },
          ]}
        />
      </form>
    </Modal>
  );
}
