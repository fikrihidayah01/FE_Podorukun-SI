import { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api';
import { usePiutangStore, type KavlingTagihan } from '../../../store/piutangStore';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import Field from '../../../components/ui/Field';
import Badge from '../../../components/ui/Badge';
import { TableScroll } from '../../../components/ui/Panel';

type Jenis = 'booking_fee' | 'uang_muka' | 'angsuran' | 'pencairan_kpr';
interface Tagihan { id: string; noUrut: number; tanggal: string; jumlah: number; jenis: Jenis; keterangan: string | null; aktif: boolean; dibayar: number; sisa: number; terkunci: boolean }
interface DaftarTagihan { billingEnabled: boolean; spprFinal: boolean; statusPenjualan: string; nilaiSppr: number; totalAktif: number; pembayaranHistoris: number; sisaPlafon: number; items: Tagihan[] }
interface Form { id?: string; noUrut: string; tanggal: string; jumlah: string; jenis: Jenis; keterangan: string; aktif: boolean }

const JENIS: Record<Jenis, string> = { booking_fee: 'Booking fee', uang_muka: 'Uang muka', angsuran: 'Angsuran', pencairan_kpr: 'Pencairan KPR' };
const today = () => new Date().toISOString().slice(0, 10);

/** Keuangan menetapkan nominal dan tenggat tagihan; PR Track hanya memilih tagihan ini saat mencatat pembayaran. */
export default function TagihanModal({ item, isOpen, onClose }: { item: KavlingTagihan; isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState<DaftarTagihan | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetchApi(`/piutang/${item.id}/tagihan`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Gagal memuat tagihan');
    setData(body.data);
  };
  useEffect(() => {
    if (!isOpen) return;
    setError(''); setForm(null);
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat tagihan'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item.id]);

  const bisaUbah = Boolean(data?.billingEnabled && data.spprFinal && data.statusPenjualan === 'aktif');
  const nextNoUrut = () => String(Math.max(0, ...(data?.items ?? []).map((t) => t.noUrut)) + 1);
  const openNew = () => { setFormError(''); setForm({ noUrut: nextNoUrut(), tanggal: today(), jumlah: '', jenis: 'angsuran', keterangan: '', aktif: true }); };
  const openEdit = (t: Tagihan) => { setFormError(''); setForm({ id: t.id, noUrut: String(t.noUrut), tanggal: t.tanggal, jumlah: String(t.jumlah), jenis: t.jenis, keterangan: t.keterangan ?? '', aktif: t.aktif }); };

  // Plafon yang tersisa bila form ini disimpan: tagihan yang sedang diedit tidak dihitung dua kali.
  const plafonForm = () => {
    if (!data || !form) return 0;
    const lama = form.id ? data.items.find((t) => t.id === form.id) : undefined;
    return data.sisaPlafon + (lama?.aktif ? lama.jumlah : 0);
  };

  const save = async (payload: Form) => {
    setBusy(true); setFormError('');
    try {
      const body = {
        ...(payload.id ? { id: payload.id } : {}),
        noUrut: Number(payload.noUrut), tanggal: payload.tanggal, jumlah: Number(payload.jumlah), jenis: payload.jenis,
        keterangan: payload.keterangan.trim() || undefined, aktif: payload.aktif,
      };
      const res = await fetchApi(`/piutang/${item.id}/tagihan`, { method: 'PUT', body: JSON.stringify(body) });
      const resBody = await res.json(); if (!res.ok) throw new Error(resBody.message || 'Gagal menyimpan tagihan');
      setForm(null);
      await load();
      await usePiutangStore.getState().fetchItems();
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Gagal menyimpan tagihan'); }
    finally { setBusy(false); }
  };

  const nonaktifkan = (t: Tagihan) => void save({ id: t.id, noUrut: String(t.noUrut), tanggal: t.tanggal, jumlah: String(t.jumlah), jenis: t.jenis, keterangan: t.keterangan ?? '', aktif: false });

  const jumlahInvalid = form ? !(Number(form.jumlah) > 0) || (form.aktif && Number(form.jumlah) > plafonForm()) : false;
  const formValid = form && Number(form.noUrut) >= 1 && form.tanggal && !jumlahInvalid;

  return <Modal isOpen={isOpen} onClose={() => { if (!busy) onClose(); }} size="xl" title="Tagihan rumah" description={`${item.nomorKavling} · ${item.namaUser}`}
    footer={<Button disabled={busy} onClick={onClose}>Tutup</Button>}>
    <div className="space-y-4">
      {error && <Notice tone="danger">{error}</Notice>}
      {data && !data.billingEnabled && <Notice tone="warning">Fitur tagihan SI belum diaktifkan. Tagihan hanya bisa dilihat.</Notice>}
      {data && data.billingEnabled && !bisaUbah && <Notice tone="warning">Tagihan hanya bisa diubah untuk penjualan aktif dengan SPPR final.</Notice>}
      {formError && !form && <Notice tone="danger">{formError}</Notice>}

      {data && <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-ink-3">Nilai SPPR</dt><dd className="font-semibold"><Money value={data.nilaiSppr} /></dd></div>
        <div><dt className="text-ink-3">Tagihan aktif</dt><dd className="font-semibold"><Money value={data.totalAktif} /></dd></div>
        <div><dt className="text-ink-3">Dibayar pada tagihan lama</dt><dd className="font-semibold"><Money value={data.pembayaranHistoris} /></dd></div>
        <div><dt className="text-ink-3">Sisa plafon</dt><dd className="font-semibold"><Money value={data.sisaPlafon} /></dd></div>
      </dl>}

      {data && <TableScroll label="Daftar tagihan"><table className="tbl"><thead><tr><th>No.</th><th>Jenis</th><th>Tenggat</th><th>Nominal</th><th>Dibayar</th><th>Sisa</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
        {data.items.map((t) => <tr key={t.id} className={t.aktif ? '' : 'text-ink-3'}>
          <td>{t.noUrut}</td>
          <td>{JENIS[t.jenis] ?? t.jenis}{t.keterangan && <span className="block text-xs text-ink-3">{t.keterangan}</span>}</td>
          <td>{t.tanggal}</td>
          <td><Money value={t.jumlah} /></td>
          <td><Money value={t.dibayar} /></td>
          <td><Money value={t.sisa} /></td>
          <td><div className="flex flex-wrap gap-1">
            <Badge tone={!t.aktif ? 'neutral' : t.sisa <= 0 ? 'positive' : 'brand'}>{!t.aktif ? 'Nonaktif' : t.sisa <= 0 ? 'Lunas' : 'Aktif'}</Badge>
            {t.terkunci && <Badge tone="warning">Ada pembayaran</Badge>}
          </div></td>
          <td>{bisaUbah && !t.terkunci && <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => openEdit(t)}>Ubah</Button>
            {t.aktif && <Button size="sm" variant="danger-ghost" disabled={busy} onClick={() => nonaktifkan(t)}>Nonaktifkan</Button>}
          </div>}</td>
        </tr>)}
      </tbody></table>{data.items.length === 0 && <p className="p-4 text-ink-2">Belum ada tagihan.</p>}</TableScroll>}

      {data && bisaUbah && !form && <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-3">Tagihan yang sudah menerima pembayaran tidak bisa diubah. Koreksi lewat jurnal balik atau adendum.</p>
        <Button variant="primary" disabled={busy || data.sisaPlafon <= 0} onClick={openNew}>Tambah tagihan</Button>
      </div>}

      {form && <div className="space-y-4 rounded-xl border border-line p-4">
        <h3 className="font-bold text-ink">{form.id ? 'Ubah tagihan' : 'Tagihan baru'}</h3>
        {formError && <Notice tone="danger">{formError}</Notice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="No. urut" required><input className="control" type="number" min="1" max="32767" value={form.noUrut} onChange={(e) => setForm({ ...form, noUrut: e.target.value })} /></Field>
          <Field label="Jenis" required><select className="control" value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as Jenis })}>{Object.entries(JENIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Tenggat" required><input className="control" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></Field>
          <Field label="Nominal" required error={form.jumlah && jumlahInvalid ? (Number(form.jumlah) > 0 ? 'Melebihi sisa plafon SPPR' : 'Nominal harus lebih dari 0') : undefined}
            hint={<>Maksimal <Money value={plafonForm()} /> agar total tidak melebihi nilai SPPR.</>}>
            <input className="control" type="number" min="0" step="0.01" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} />
          </Field>
          <Field label="Keterangan" optional className="sm:col-span-2"><input className="control" maxLength={100} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-ink-3">Tagihan dikirim ke PR Track dan langsung bisa dipilih saat mencatat pembayaran.</p>
        <div className="flex justify-end gap-2">
          <Button disabled={busy} onClick={() => setForm(null)}>Batal</Button>
          <Button variant="primary" disabled={busy || !formValid} onClick={() => void save(form)}>{busy ? 'Menyimpan…' : 'Simpan tagihan'}</Button>
        </div>
      </div>}
    </div>
  </Modal>;
}
