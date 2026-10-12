import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
interface Entry { id: string; noDokumen: string; jenis: string; status: string; berlaku: boolean; alasan: string | null }
interface Assignment { assignmentId?: string; id: string; kavlingId?: string; unitId?: string; namaPembeli?: string }
export default function LegalHistoryPanel({ id, isFinal, proyekId, unitId, assignmentId, reload }: { id: string; isFinal: boolean; proyekId: string; unitId: string; assignmentId?: string; reload: () => Promise<void> }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<Entry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState('');
  const [open, setOpen] = useState(false);
  const [alasan, setAlasan] = useState('');
  const [biaya, setBiaya] = useState('0');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchApi(`/dokumen/${id}/riwayat`); const body = await res.json(); if (!res.ok) throw new Error(body.message); if (!cancelled) setHistory(body.data);
        if (!assignmentId && !isFinal) {
          const result = await fetchApi(`/dokumen/penjualan-tersedia?proyekId=${proyekId}`); const data = await result.json(); if (!result.ok) throw new Error(data.message); if (!cancelled) setAssignments(data.data);
        }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat riwayat'); }
    })();
    return () => { cancelled = true; };
  }, [id, assignmentId, isFinal, proyekId]);
  const save = async (adendum: boolean) => {
    setBusy(true); setError('');
    try {
      const res = await fetchApi(`/dokumen/${id}${adendum ? '/adendum' : ''}`, { method: adendum ? 'POST' : 'PATCH', body: JSON.stringify(adendum ? { alasan, biayaPindah: Number(biaya), tanggal } : { assignmentId: selected }) });
      const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal menyimpan');
      await reload(); setOpen(false); if (adendum) navigate(`/keuangan/legal/${body.data.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setBusy(false); }
  };
  return <section className="mx-4 my-4 rounded-lg border border-line bg-surface p-4 sm:mx-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Riwayat SPPR dan adendum</h2>{isFinal && history.some((h) => h.id === id && h.berlaku) && <Button onClick={() => setOpen(true)}>Buat adendum</Button>}</div>
    {error && <p role="alert" className="my-3 text-red-600">{error}</p>}
    <ul className="mt-3 space-y-2">{history.map((h) => <li key={h.id}><Link className="underline" to={`/keuangan/legal/${h.id}`}>{h.noDokumen}</Link> — {h.jenis}, {h.status}{h.berlaku ? ', berlaku' : ''}{h.alasan ? ': ' + h.alasan : ''}</li>)}</ul>
    {!assignmentId && !isFinal && <div className="mt-4 flex flex-wrap gap-3"><label>Hubungkan penjualan PR Track<select className="control" value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Pilih penjualan</option>{assignments.filter((a) => (a.kavlingId || a.unitId) === unitId).map((a) => <option key={a.id} value={a.assignmentId || a.id}>{a.namaPembeli || a.id}</option>)}</select></label><Button disabled={!selected || busy} onClick={() => void save(false)}>Simpan hubungan</Button></div>}
    <Modal isOpen={open} onClose={() => { if (!busy) setOpen(false); }} title="Buat adendum" footer={<Button variant="primary" disabled={busy || !alasan.trim()} onClick={() => void save(true)}>Buat draft adendum</Button>}><div className="space-y-4">{error && <p role="alert" className="text-red-600">{error}</p>}<label>Alasan<textarea className="control" value={alasan} onChange={(e) => setAlasan(e.target.value)} /></label><label>Tanggal<input className="control" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></label><label>Biaya pindah kavling<input className="control" type="number" min="0" step="0.01" value={biaya} onChange={(e) => setBiaya(e.target.value)} /></label><p>Edit draft yang dibuat, sesuaikan jadwal, lalu finalisasi.</p></div></Modal>
  </section>;
}
