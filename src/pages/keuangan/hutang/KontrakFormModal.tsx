import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { useKontrakStore } from '../../../store/kontrakStore';
import { useCoaStore } from '../../../store/coaStore';
import { useProyekStore, type KavlingUnit } from '../../../store/proyekStore';
import { useHutangStore } from '../../../store/hutangStore';
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
  unitId: '',
  kavling: '',
  kontraktorId: '',
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
  const kodePembantus = useHutangStore((s) => s.kodePembantus);

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [kavlingList, setKavlingList] = useState<KavlingUnit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key: keyof typeof EMPTY, value: string) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (form.proyekId) {
      useProyekStore.getState().fetchKavling(form.proyekId).then((units) => {
        setKavlingList(units);
      });
    } else {
      setKavlingList([]);
    }
  }, [form.proyekId]);

  const kontraktorList = useMemo(
    () => kodePembantus.filter((kp) => kp.kategori === 'kontraktor' && (!form.proyekId || kp.proyekId === form.proyekId)),
    [kodePembantus, form.proyekId],
  );

  const persediaanAkuns = useMemo(
    () => akuns.filter((a) => a.kategori === 'aktiva' && a.status === 'aktif' && !akuns.some((child) => child.akunIndukId === a.id)),
    [akuns],
  );
  const hutangAkuns = useMemo(
    () => akuns.filter((a) => a.kategori === 'hutang' && a.status === 'aktif' && !akuns.some((child) => child.akunIndukId === a.id)),
    [akuns],
  );

  const pRab = Number(form.rab) || 0;
  const pNilai = Number(form.nilaiKontrak) || 0;
  const selisih = pRab - pNilai;

  const handleClose = () => {
    setForm(EMPTY);
    setError('');
    onClose();
  };

  const handleKavlingChange = (selectedId: string) => {
    const k = kavlingList.find((item) => item.id === selectedId);
    if (k) {
      setForm((f) => ({
        ...f,
        unitId: k.id,
        kavling: k.nomor,
        tipe: k.tipe || f.tipe,
      }));
    } else {
      setForm((f) => ({ ...f, unitId: selectedId }));
    }
  };

  const handleKontraktorChange = (selectedId: string) => {
    const kp = kontraktorList.find((item) => item.id === selectedId);
    if (kp) {
      setForm((f) => ({
        ...f,
        kontraktorId: kp.id,
        namaKontraktor: kp.nama,
      }));
    } else {
      setForm((f) => ({ ...f, kontraktorId: selectedId }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.proyekId) return setError('Pilih proyek.');
    if (!form.unitId && !form.kavling.trim()) return setError('Pilih atau isi kavling.');
    if (!form.namaKontraktor.trim()) return setError('Nama kontraktor wajib diisi.');
    if (!form.noSpk.trim()) return setError('No. SPK wajib diisi.');
    if (kontraks.some((k) => k.noSpk === form.noSpk.trim())) return setError('No. SPK ini sudah dipakai. Setiap SPK harus unik.');
    if (!form.tanggalSpk) return setError('Tanggal SPK wajib diisi.');
    if (pNilai <= 0) return setError('Nilai kontrak harus lebih dari 0.');
    if (pRab <= 0) return setError('Nilai RAB harus lebih dari 0.');
    if (!form.akunHutangId || !form.akunPersediaanId) return setError('Pilih akun hutang dan akun lawan untuk jurnal.');

    setIsSubmitting(true);
    setError('');
    try {
      await addKontrak({
        noSpk: form.noSpk.trim(),
        tanggalSpk: form.tanggalSpk,
        proyekId: form.proyekId,
        unitId: form.unitId || undefined,
        kavling: form.kavling.trim(),
        tipe: form.tipe.trim(),
        kontraktorId: form.kontraktorId || undefined,
        namaKontraktor: form.namaKontraktor.trim(),
        rab: pRab,
        nilaiKontrak: pNilai,
        keterangan: form.keterangan.trim(),
        akunPersediaanId: form.akunPersediaanId,
        akunHutangId: form.akunHutangId,
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kontrak');
    } finally {
      setIsSubmitting(false);
    }
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
          <Button variant="primary" type="submit" form="kontrak-form" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan dan buat jurnal'}
          </Button>
        </>
      }
    >
      <form id="kontrak-form" onSubmit={handleSubmit} className="space-y-5">
        <Notice tone="warning">Hutang diakui penuh saat SPK disimpan. Perubahan nilai setelah ini harus lewat adendum.</Notice>
        {error && <Notice tone="danger">{error}</Notice>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Proyek" required>
            <select
              className="control"
              value={form.proyekId}
              onChange={(e) => {
                set('proyekId', e.target.value);
                set('unitId', '');
                set('kavling', '');
              }}
            >
              <option value="">Pilih proyek</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </Field>

          <Field label="Kavling (Unit PR Track)" required>
            {kavlingList.length > 0 ? (
              <select
                className="control"
                value={form.unitId}
                onChange={(e) => handleKavlingChange(e.target.value)}
              >
                <option value="">Pilih kavling</option>
                {kavlingList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nomor} {k.tipe ? `(Tipe ${k.tipe})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="control"
                value={form.kavling}
                onChange={(e) => set('kavling', e.target.value)}
                placeholder="Pilih proyek terlebih dahulu"
              />
            )}
          </Field>

          <Field label="Kontraktor" required>
            {kontraktorList.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  className="control"
                  value={form.kontraktorId}
                  onChange={(e) => handleKontraktorChange(e.target.value)}
                >
                  <option value="">Pilih dari daftar rekanan</option>
                  {kontraktorList.map((kp) => (
                    <option key={kp.id} value={kp.id}>{kp.nama}</option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                className="control"
                value={form.namaKontraktor}
                onChange={(e) => set('namaKontraktor', e.target.value)}
                placeholder="Contoh: CV Karya Mandiri"
              />
            )}
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
            <input className="control" value={form.keterangan} onChange={(e) => set('keterangan', e.target.value)} placeholder="Catatan lingkup pekerjaan borongan" />
          </Field>
        </div>

        {pRab > 0 && pNilai > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-4 py-3 text-sm">
            <div>
              <span className="text-ink-2">RAB: </span>
              <span className="font-semibold text-ink">{formatRupiah(pRab)}</span>
              <span className="text-ink-2"> | Kontrak: </span>
              <span className="font-semibold text-ink">{formatRupiah(pNilai)}</span>
            </div>
            <div>
              <span className="text-ink-2">Selisih: </span>
              <span className={`font-semibold ${selisih >= 0 ? 'text-positive' : 'text-danger'}`}>
                {formatRupiah(Math.abs(selisih))} ({selisih >= 0 ? 'hemat' : 'melebihi RAB'})
              </span>
            </div>
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold text-ink">Pemetaan akun pembukuan</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Akun persediaan bangunan (debit)" required>
              <select className="control" value={form.akunPersediaanId} onChange={(e) => set('akunPersediaanId', e.target.value)}>
                <option value="">Pilih akun persediaan</option>
                {persediaanAkuns.map((a) => (
                  <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
                ))}
              </select>
            </Field>
            <Field label="Akun hutang kontraktor (kredit)" required>
              <select className="control" value={form.akunHutangId} onChange={(e) => set('akunHutangId', e.target.value)}>
                <option value="">Pilih akun hutang</option>
                {hutangAkuns.map((a) => (
                  <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
                ))}
              </select>
            </Field>
          </div>
        </fieldset>

        {pNilai > 0 && persediaan && hutang && (
          <JurnalPreview
            title="Pratinjau jurnal akrual SPK"
            rows={[
              { akun: `${persediaan.kodeAkun} - ${persediaan.namaAkun}`, debit: pNilai },
              { akun: `${hutang.kodeAkun} - ${hutang.namaAkun}`, kredit: pNilai },
            ]}
          />
        )}
      </form>
    </Modal>
  );
}
