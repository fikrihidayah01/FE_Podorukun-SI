import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../../lib/api';
import { usePiutangStore } from '../../../store/piutangStore';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import Modal from '../../../components/ui/Modal';
import Notice from '../../../components/ui/Notice';
import Badge, { type Tone } from '../../../components/ui/Badge';

interface Payment {
  id: string; tanggal: string; jenis: string; nominal: number; statusProses: string; alasan: string | null;
  jurnalId: string | null; nomorJurnal: string | null; jurnalStatus: string | null;
  keputusanSi: 'terima' | 'tolak' | null; siJadwalId: string | null; rekeningTujuan: string | null; buktiUrl: string | null; isDeleted: boolean;
  tagihan: Tagihan | null;
}
interface Tagihan { id: string; noUrut: number; tanggal: string; jenis: string; keterangan: string | null; aktif: boolean; jumlah: number; terpakai: number; sisa: number; milikPenjualan: boolean }
type Keputusan = 'terima' | 'tolak';

const STATUS = ['belum_diproses', 'menunggu', 'gagal_validasi', 'perlu_ditinjau', 'ditolak', 'dijurnal', 'historis'];
// historis: pembayaran sebelum saldo awal proyek, dialokasikan tanpa jurnal (cutoff Opsi A).
const STATUS_TONE: Record<string, Tone> = { dijurnal: 'positive', historis: 'neutral', ditolak: 'danger', gagal_validasi: 'danger', perlu_ditinjau: 'warning', menunggu: 'warning' };
// Pembayaran lama dari PR Track bisa tanpa jenis (null); jangan sampai satu baris menjatuhkan halaman.
const label = (s: string | null | undefined) => (s ? s.replaceAll('_', ' ') : '—');

// Track mengirim bukti sebagai URL tunggal atau array JSON; hanya tautan https yang ditampilkan.
function buktiLinks(raw: string | null): string[] {
  if (!raw) return [];
  let list: unknown = raw;
  try { list = JSON.parse(raw); } catch { /* URL tunggal */ }
  return (Array.isArray(list) ? list : [list]).map(String).filter((u) => /^https:\/\//i.test(u));
}

// Peringatan yang sama dengan penolakan backend saat terima, supaya Keuangan tahu sebelum menekan tombol.
function masalahTagihan(p: Payment): string | null {
  const t = p.tagihan;
  if (!t) return 'Tagihan pilihan tidak ditemukan di SI.';
  if (!t.aktif || !t.milikPenjualan) return 'Tagihan tidak aktif atau bukan milik penjualan pembayaran ini.';
  if (t.sisa <= 0) return 'Tagihan sudah lunas.';
  if (t.sisa !== p.nominal) return 'Nominal pembayaran tidak sama dengan sisa tagihan.';
  if (t.jenis !== p.jenis) return 'Jenis pembayaran tidak sesuai tagihan.';
  return null;
}

// Jurnal terposting hanya bisa diubah lewat jurnal balik; keputusan lain masih bisa diganti.
const terkunci = (p: Payment) => p.jurnalStatus === 'diposting';
const bisaDiverifikasi = (p: Payment) => Boolean(p.siJadwalId) && !p.isDeleted && !terkunci(p);

export default function PembayaranTrackPanel() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState<{ payment: Payment; keputusan: Keputusan } | null>(null);
  const [alasan, setAlasan] = useState('');
  const [dialogError, setDialogError] = useState('');

  const load = async () => { const res = await fetchApi('/pembayaran-track'); const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal memuat pembayaran'); setRows(body.data); };
  useEffect(() => { void load().catch((err) => setError(err.message)); }, []);
  const refresh = async () => { await load(); await usePiutangStore.getState().fetchItems(); };

  const process = async (id?: string) => {
    setBusy(true); setError('');
    try { const res = await fetchApi(`/pembayaran-track/${id ? id + '/proses' : 'proses'}`, { method: 'POST' }); const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal memproses pembayaran'); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Gagal memproses pembayaran'); }
    finally { setBusy(false); }
  };

  const openVerifikasi = (payment: Payment, keputusan: Keputusan) => { setTarget({ payment, keputusan }); setAlasan(''); setDialogError(''); };
  const closeVerifikasi = () => { if (!busy) setTarget(null); };
  const submitVerifikasi = async () => {
    if (!target) return;
    setBusy(true); setDialogError('');
    try {
      const payload = { keputusan: target.keputusan, ...(alasan.trim() ? { alasan: alasan.trim() } : {}) };
      const res = await fetchApi(`/pembayaran-track/${target.payment.id}/verifikasi`, { method: 'POST', body: JSON.stringify(payload) });
      const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal menyimpan keputusan');
      setTarget(null); await refresh();
    } catch (err) { setDialogError(err instanceof Error ? err.message : 'Gagal menyimpan keputusan'); }
    finally { setBusy(false); }
  };

  const tolak = target?.keputusan === 'tolak';
  const p = target?.payment;

  return <Panel title="Pembayaran dari PR Track" description="Verifikasi pengajuan berdasarkan tagihan, lalu periksa yang gagal validasi atau perlu ditinjau." actions={<Button disabled={busy} onClick={() => void process()}>Proses pembayaran menunggu</Button>}>
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
    <label className="mb-4 block">Status<select className="control" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua</option>{STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label>
    <TableScroll label="Status pembayaran"><table className="tbl"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Nominal</th><th>Status</th><th>Keterangan</th><th>Aksi</th></tr></thead><tbody>
      {rows.filter((r) => !status || r.statusProses === status).map((r) => <tr key={r.id}>
        <td>{r.tanggal}</td>
        <td>{label(r.jenis)}<span className="block text-xs text-ink-3">{r.siJadwalId ? 'Berdasarkan tagihan' : 'Legacy'}</span></td>
        <td><Money value={r.nominal} /></td>
        <td><Badge tone={STATUS_TONE[r.statusProses] ?? 'neutral'}>{label(r.statusProses)}</Badge>{r.keputusanSi && <span className="mt-1 block text-xs text-ink-3">Keputusan SI: {r.keputusanSi}</span>}</td>
        <td>{r.alasan || '—'}{r.jurnalId && <Link className="block underline" to="/keuangan/jurnal">{r.nomorJurnal} ({r.jurnalStatus})</Link>}{r.siJadwalId && terkunci(r) && <span className="block text-xs text-ink-3">Untuk mengubah keputusan, balik jurnal ini dulu.</span>}</td>
        <td><div className="flex flex-wrap gap-2">
          {bisaDiverifikasi(r) ? <>
            <Button size="sm" variant="primary" disabled={busy} onClick={() => openVerifikasi(r, 'terima')}>Terima</Button>
            <Button size="sm" variant="danger-ghost" disabled={busy} onClick={() => openVerifikasi(r, 'tolak')}>Tolak</Button>
          </> : !r.siJadwalId && <Button size="sm" disabled={busy} onClick={() => void process(r.id)}>Proses ulang</Button>}
        </div></td>
      </tr>)}
    </tbody></table>{rows.length === 0 && <p className="p-4 text-ink-2">Belum ada pembayaran tersinkron.</p>}</TableScroll>

    <Modal isOpen={target !== null} onClose={closeVerifikasi} title={tolak ? 'Tolak pembayaran' : 'Terima pembayaran'} description={p ? `${p.tanggal} · ${label(p.jenis)}` : undefined}
      footer={<><Button disabled={busy} onClick={closeVerifikasi}>Batal</Button><Button variant={tolak ? 'danger' : 'primary'} disabled={busy || (tolak && !alasan.trim())} onClick={() => void submitVerifikasi()}>{busy ? 'Menyimpan…' : tolak ? 'Tolak pembayaran' : 'Terima dan buat jurnal'}</Button></>}>
      {p && <div className="space-y-4">
        {dialogError && <Notice tone="danger">{dialogError}</Notice>}
        {!tolak && masalahTagihan(p) && <Notice tone="warning">{masalahTagihan(p)} Pembayaran ini akan ditolak sistem bila diterima.</Notice>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-ink-3">Tagihan</dt><dd>{p.tagihan ? <>Ke-{p.tagihan.noUrut} · {label(p.tagihan.jenis)}{p.tagihan.keterangan && ` · ${p.tagihan.keterangan}`}<span className="block text-xs text-ink-3">Tenggat {p.tagihan.tanggal}{!p.tagihan.aktif && ' · nonaktif'}</span></> : '—'}</dd>
          {p.tagihan && <>
            <dt className="text-ink-3">Nilai tagihan</dt><dd><Money value={p.tagihan.jumlah} /></dd>
            <dt className="text-ink-3">Sudah dibayar</dt><dd><Money value={p.tagihan.terpakai} /></dd>
            <dt className="text-ink-3">Sisa tagihan</dt><dd className="font-semibold"><Money value={p.tagihan.sisa} /></dd>
          </>}
          <dt className="text-ink-3">Nominal dibayar</dt><dd className="font-semibold"><Money value={p.nominal} /></dd>
          <dt className="text-ink-3">Rekening tujuan</dt><dd>{p.rekeningTujuan || '—'}</dd>
          <dt className="text-ink-3">Bukti</dt><dd>{buktiLinks(p.buktiUrl).length ? buktiLinks(p.buktiUrl).map((u, i) => <a key={u} className="block underline" href={u} target="_blank" rel="noreferrer">Bukti transfer {i + 1}</a>) : '—'}</dd>
        </dl>
        <p className="text-sm text-ink-2">{tolak
          ? 'Tagihan dibebaskan supaya customer bisa mengajukan ulang. Alasan dikirim ke PR Track.'
          : 'SI memeriksa nominal terhadap sisa tagihan, rekening kas/bank, dan jenis pembayaran sebelum membuat jurnal.'}</p>
        <label className="block">Alasan{tolak ? '' : ' (opsional)'}<textarea className="control" maxLength={1000} value={alasan} onChange={(e) => setAlasan(e.target.value)} /></label>
      </div>}
    </Modal>
  </Panel>;
}
