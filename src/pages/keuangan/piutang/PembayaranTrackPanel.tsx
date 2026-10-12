import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../../lib/api';
import { usePiutangStore } from '../../../store/piutangStore';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
interface Payment { id: string; tanggal: string; jenis: string; nominal: number; statusProses: string; alasan: string | null; jurnalId: string | null; nomorJurnal: string | null; jurnalStatus: string | null }
export default function PembayaranTrackPanel() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const load = async () => { const res = await fetchApi('/pembayaran-track'); const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal memuat pembayaran'); setRows(body.data); };
  useEffect(() => { void load().catch((err) => setError(err.message)); }, []);
  const process = async (id?: string) => {
    setBusy(true); setError('');
    try { const res = await fetchApi(`/pembayaran-track/${id ? id + '/proses' : 'proses'}`, { method: 'POST' }); const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal memproses pembayaran'); await load(); await usePiutangStore.getState().fetchItems(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Gagal memproses pembayaran'); }
    finally { setBusy(false); }
  };
  return <Panel title="Pembayaran dari PR Track" description="Periksa pembayaran menunggu, gagal validasi, atau perlu ditinjau." actions={<Button disabled={busy} onClick={() => void process()}>Proses pembayaran menunggu</Button>}>
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
    <label className="mb-4 block">Status<select className="control" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua</option>{['belum_diproses', 'menunggu', 'gagal_validasi', 'perlu_ditinjau', 'dijurnal'].map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}</select></label>
    <TableScroll label="Status pembayaran"><table className="tbl"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Nominal</th><th>Status</th><th>Keterangan</th><th>Aksi</th></tr></thead><tbody>{rows.filter((r) => !status || r.statusProses === status).map((r) => <tr key={r.id}><td>{r.tanggal}</td><td>{r.jenis}</td><td><Money value={r.nominal} /></td><td>{r.statusProses.replaceAll('_', ' ')}</td><td>{r.alasan || '—'}{r.jurnalId && <Link className="block underline" to="/keuangan/jurnal">{r.nomorJurnal} ({r.jurnalStatus})</Link>}</td><td><Button disabled={busy} onClick={() => void process(r.id)}>Proses ulang</Button></td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-4 text-ink-2">Belum ada pembayaran tersinkron.</p>}</TableScroll>
  </Panel>;
}
