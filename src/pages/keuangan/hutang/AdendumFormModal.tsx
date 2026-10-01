import { useState, type FormEvent } from 'react';
import { PiUploadSimple } from 'react-icons/pi';
import { useKontrakStore, type Kontrak } from '../../../store/kontrakStore';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Notice from '../../../components/ui/Notice';
import Money from '../../../components/ui/Money';
import JurnalPreview from './JurnalPreview';

interface AdendumFormModalProps {
  kontrak: Kontrak;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdendumFormModal({ kontrak, isOpen, onClose }: AdendumFormModalProps) {
  const { addAdendum, adendums } = useKontrakStore();

  const [form, setForm] = useState({ noAdendum: '', tanggal: '', nilaiBaru: '', alasan: '' });
  const [lampiran, setLampiran] = useState<File | null>(null);
  const [error, setError] = useState('');

  const riwayat = adendums
    .filter((a) => a.kontrakId === kontrak.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const nilaiLama = riwayat.length > 0 ? riwayat[0].nilaiBaru : kontrak.nilaiKontrak;
  const pNilaiBaru = Number(form.nilaiBaru) || 0;
  const selisih = pNilaiBaru - nilaiLama;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.noAdendum.trim()) return setError('No. dokumen adendum wajib diisi.');
    if (!form.tanggal) return setError('Tanggal adendum wajib diisi.');
    if (pNilaiBaru <= 0) return setError('Nilai baru harus lebih dari 0.');
    if (selisih === 0) return setError('Nilai baru sama dengan nilai lama, jadi tidak ada yang perlu diadendum.');
    if (!form.alasan.trim()) return setError('Tuliskan alasan perubahan kontrak.');

    addAdendum({
      kontrakId: kontrak.id,
      noAdendum: form.noAdendum.trim(),
      tanggal: form.tanggal,
      nilaiLama,
      nilaiBaru: pNilaiBaru,
      alasan: form.alasan.trim(),
      lampiran: lampiran?.name,
    });
    onClose();
  };

  const showPreview = selisih !== 0 && pNilaiBaru > 0;
  const nilai = Math.abs(selisih);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adendum kontrak"
      description={`${kontrak.noSpk}, kavling ${kontrak.kavling}`}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" form="adendum-form">
            Simpan adendum
          </Button>
        </>
      }
    >
      <form id="adendum-form" onSubmit={handleSubmit} className="space-y-5">
        <Notice>
          Adendum mengubah sisa kontrak dan otomatis membentuk jurnal penyesuaian (persediaan terhadap hutang) sebesar selisih nilainya.
        </Notice>
        {error && <Notice tone="danger">{error}</Notice>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tanggal adendum" required>
            <input type="date" className="control" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </Field>
          <Field label="No. dokumen adendum" required>
            <input className="control" value={form.noAdendum} onChange={(e) => setForm({ ...form, noAdendum: e.target.value })} placeholder="Contoh: ADD/2026/06/001" />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-lg border border-line bg-subtle p-4 sm:grid-cols-2">
          <div>
            <p className="field-label">Nilai lama</p>
            <p className="flex min-h-10 items-center text-base font-bold text-ink">
              <Money value={nilaiLama} />
            </p>
          </div>
          <Field
            label="Nilai baru"
            required
            hint={
              showPreview ? (
                <span className={selisih > 0 ? 'font-semibold text-danger' : 'font-semibold text-positive'}>
                  {selisih > 0 ? 'Naik ' : 'Turun '}
                  <Money value={nilai} />
                </span>
              ) : undefined
            }
          >
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="control control-num font-semibold"
              value={form.nilaiBaru}
              onChange={(e) => setForm({ ...form, nilaiBaru: e.target.value })}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Alasan perubahan" required>
          <textarea rows={3} className="control" value={form.alasan} onChange={(e) => setForm({ ...form, alasan: e.target.value })} />
        </Field>

        <div>
          <p className="field-label">
            Lampiran dokumen <span className="font-normal text-ink-3">(opsional)</span>
          </p>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line-strong px-4 py-3.5 hover:bg-subtle focus-within:outline-2 focus-within:outline-brand-600">
            <PiUploadSimple className="h-5 w-5 shrink-0 text-ink-3" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm text-ink-2">
              {lampiran ? lampiran.name : 'Pilih file PDF atau Word'}
            </span>
            <span className="text-sm font-semibold text-brand-700">{lampiran ? 'Ganti' : 'Pilih file'}</span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx"
              onChange={(e) => e.target.files && setLampiran(e.target.files[0])}
            />
          </label>
        </div>

        {showPreview && (
          <JurnalPreview
            title="Pratinjau jurnal penyesuaian"
            rows={
              selisih > 0
                ? [
                    { akun: 'Persediaan / WIP', debit: nilai },
                    { akun: 'Hutang kontraktor', kredit: nilai },
                  ]
                : [
                    { akun: 'Hutang kontraktor', debit: nilai },
                    { akun: 'Persediaan / WIP', kredit: nilai },
                  ]
            }
          />
        )}
      </form>
    </Modal>
  );
}
