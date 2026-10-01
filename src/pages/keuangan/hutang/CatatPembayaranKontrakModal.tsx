import { useMemo, useState, type FormEvent } from 'react';
import { useKontrakStore, type Kontrak } from '../../../store/kontrakStore';
import { useCoaStore } from '../../../store/coaStore';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Notice from '../../../components/ui/Notice';
import Money from '../../../components/ui/Money';
import { formatRupiah } from '../../../utils/format';
import JurnalPreview from './JurnalPreview';

interface CatatPembayaranKontrakModalProps {
  kontrak: Kontrak;
  isOpen: boolean;
  onClose: () => void;
}

export default function CatatPembayaranKontrakModal({ kontrak, isOpen, onClose }: CatatPembayaranKontrakModalProps) {
  const { pembayarans, adendums, addPembayaran } = useKontrakStore();
  const akuns = useCoaStore((s) => s.items);
  const kasBankAkuns = useMemo(() => akuns.filter((a) => a.isKasBank), [akuns]);

  const [form, setForm] = useState({ tanggal: '', nominal: '', akunKasId: '', noBukti: '', keterangan: '' });
  const [error, setError] = useState('');

  const riwayatAdendum = adendums
    .filter((a) => a.kontrakId === kontrak.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const nilaiTerkini = riwayatAdendum.length > 0 ? riwayatAdendum[0].nilaiBaru : kontrak.nilaiKontrak;
  const totalTerbayar = pembayarans.filter((p) => p.kontrakId === kontrak.id).reduce((sum, p) => sum + p.nominal, 0);
  const sisaKontrak = nilaiTerkini - totalTerbayar;
  const pNominal = Number(form.nominal) || 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.tanggal) return setError('Tanggal bayar wajib diisi.');
    if (!form.akunKasId) return setError('Pilih akun kas atau bank.');
    if (!form.noBukti.trim()) return setError('No. bukti wajib diisi.');
    if (pNominal <= 0) return setError('Nominal pembayaran harus lebih dari 0.');
    if (pNominal > sisaKontrak) return setError(`Nominal melebihi sisa kontrak. Maksimal ${formatRupiah(sisaKontrak)}.`);

    addPembayaran({
      kontrakId: kontrak.id,
      tanggal: form.tanggal,
      nominal: pNominal,
      akunKasId: form.akunKasId,
      noBukti: form.noBukti.trim(),
      keterangan: form.keterangan.trim() || undefined,
    });
    onClose();
  };

  const kas = akuns.find((a) => a.id === form.akunKasId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat pembayaran termin"
      description={`${kontrak.namaKontraktor}, kavling ${kontrak.kavling}`}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" form="bayar-kontrak-form">
            Simpan pembayaran
          </Button>
        </>
      }
    >
      <form id="bayar-kontrak-form" onSubmit={handleSubmit} className="space-y-5">
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {[
            { label: 'Nilai kontrak', value: nilaiTerkini },
            { label: 'Sudah dibayar', value: totalTerbayar },
            { label: 'Sisa kontrak', value: sisaKontrak },
          ].map((r) => (
            <div key={r.label} className="bg-subtle px-4 py-3">
              <dt className="text-xs font-semibold text-ink-3">{r.label}</dt>
              <dd className="mt-1 text-sm font-bold text-ink">
                <Money value={r.value} />
              </dd>
            </div>
          ))}
        </dl>

        {error && <Notice tone="danger">{error}</Notice>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tanggal bayar" required>
            <input type="date" className="control" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </Field>
          <Field label="Nominal pembayaran" required hint={`Maksimal ${formatRupiah(sisaKontrak)}`}>
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
          <Field label="Akun kas / bank (kredit)" required>
            <select className="control" value={form.akunKasId} onChange={(e) => setForm({ ...form, akunKasId: e.target.value })}>
              <option value="">Pilih akun</option>
              {kasBankAkuns.map((a) => (
                <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
              ))}
            </select>
          </Field>
          <Field label="No. bukti transaksi" required>
            <input className="control" value={form.noBukti} onChange={(e) => setForm({ ...form, noBukti: e.target.value })} placeholder="Contoh: BKK/2026/06/014" />
          </Field>
          <Field label="Keterangan" optional className="sm:col-span-2">
            <input className="control" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Contoh: Pembayaran termin 1" />
          </Field>
        </div>

        <JurnalPreview
          title="Pratinjau jurnal pembayaran"
          rows={[
            { akun: 'Hutang kontraktor', debit: pNominal },
            { akun: kas ? `${kas.kodeAkun} - ${kas.namaAkun}` : 'Kas / bank', kredit: pNominal },
          ]}
        />
      </form>
    </Modal>
  );
}
