import { useEffect, useState } from 'react';
import { useProyekStore } from '../../store/proyekStore';
import { useCoaStore } from '../../store/coaStore';
import { useHutangStore } from '../../store/hutangStore';
import { useSaldoAwalStore, type SaldoAkun } from '../../store/saldoAwalStore';
import { fetchApi } from '../../lib/api';
import Panel, { TableScroll } from '../../components/ui/Panel';
import Button from '../../components/ui/Button';
import Money from '../../components/ui/Money';
import Notice from '../../components/ui/Notice';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function CoaTabSaldoAwal() {
  const { items: proyeks, fetch: fetchProyeks } = useProyekStore();
  const { items: akuns, fetch: fetchAkuns } = useCoaStore();
  const { kodePembantus, fetchKodePembantus } = useHutangStore();
  const { periodes, fetchSaldoAwal, tutupBuku } = useSaldoAwalStore();
  const [proyekId, setProyekId] = useState('');
  const [rows, setRows] = useState<SaldoAkun[]>([]);
  const [tanggal, setTanggal] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const periode = periodes[proyekId];
  const locked = periode?.status === 'terkunci';
  useEffect(() => { void fetchProyeks(); void fetchAkuns(); void fetchKodePembantus(); }, [fetchProyeks, fetchAkuns, fetchKodePembantus]);
  useEffect(() => { if (!proyekId && proyeks.length) setProyekId(proyeks[0].id); }, [proyekId, proyeks]);
  useEffect(() => {
    if (!proyekId) return;
    let cancelled = false;
    setBusy(true); setError('');
    void fetchSaldoAwal(proyekId).then((data) => { if (!cancelled) { setRows(data.saldo.map((r) => ({ ...r }))); setTanggal(data.tanggalMulai || ''); setDirty(false); } }).catch((err) => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [proyekId, fetchSaldoAwal]);
  const leaf = akuns.filter((a) => a.status === 'aktif' && !akuns.some((child) => child.akunIndukId === a.id));
  const debit = rows.reduce((s, r) => s + Math.round(r.debit * 100), 0) / 100;
  const kredit = rows.reduce((s, r) => s + Math.round(r.kredit * 100), 0) / 100;
  const change = (index: number, patch: Partial<SaldoAkun>) => { setRows((prev) => prev.map((row, i) => i === index ? { ...row, ...patch } : row)); setDirty(true); };
  const save = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetchApi(`/saldo-awal/${proyekId}`, { method: 'PUT', body: JSON.stringify({ tanggalMulai: tanggal, saldo: rows }) });
      const body = await res.json(); if (!res.ok) throw new Error(body.errors?.join(' ') || body.message || 'Gagal menyimpan saldo awal');
      const data = await fetchSaldoAwal(proyekId); setRows(data.saldo); setDirty(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setBusy(false); }
  };
  return <>
    <Notice title="Saldo awal per proyek">Catat satu baris untuk setiap pasangan akun dan kode pembantu. Simpan seluruh perubahan sebelum mengunci saldo awal.</Notice>
    <Panel title={locked ? 'Saldo awal terkunci' : 'Saldo awal'} actions={<div className="flex gap-2"><Button disabled={busy || locked || !proyekId || !dirty} onClick={() => void save()}>Simpan</Button><Button variant="primary" disabled={busy || locked || dirty || debit !== kredit || !periode?.id} onClick={() => setConfirm(true)}>Kunci saldo awal</Button></div>}>
      <div className="mb-4 flex flex-wrap gap-4"><label>Proyek<select className="control" disabled={busy || dirty} value={proyekId} onChange={(e) => setProyekId(e.target.value)}><option value="">Pilih proyek</option>{proyeks.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}</select></label><label>Tanggal mulai<input className="control" type="date" value={tanggal} disabled={busy || locked} onChange={(e) => { setTanggal(e.target.value); setDirty(true); }} /></label></div>
      {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
      {dirty && <p className="mb-3 text-ink-2">Ada perubahan yang belum disimpan. Simpan sebelum berpindah proyek.</p>}
      <TableScroll label="Saldo awal"><table className="tbl"><thead><tr><th>Akun</th><th>Kode pembantu</th><th>Debit</th><th>Kredit</th><th>Aksi</th></tr></thead><tbody>{rows.map((row, i) => <tr key={i}><td><select className="control" disabled={busy || locked} value={row.akunId} onChange={(e) => change(i, { akunId: e.target.value })}><option value="">Pilih akun</option>{leaf.map((a) => <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}{a.wajibKodePembantu ? ' (wajib kode pembantu)' : ''}</option>)}</select></td><td><select className="control" disabled={busy || locked} value={row.kodePembantuId || ''} onChange={(e) => change(i, { kodePembantuId: e.target.value || null })}><option value="">Tanpa kode pembantu</option>{kodePembantus.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</select></td>{(['debit', 'kredit'] as const).map((side) => <td key={side}><input aria-label={`${side} baris ${i + 1}`} className="control control-num" type="number" min="0" step="0.01" disabled={busy || locked} value={row[side]} onChange={(e) => change(i, { [side]: Number(e.target.value) })} /></td>)}<td><Button disabled={busy || locked} onClick={() => { setRows((prev) => prev.filter((_, n) => n !== i)); setDirty(true); }}>Hapus</Button></td></tr>)}</tbody><tfoot><tr><td colSpan={2}>Total seluruh baris</td><td><Money value={debit} /></td><td><Money value={kredit} /></td><td>{debit === kredit ? 'Seimbang' : 'Belum seimbang'}</td></tr></tfoot></table></TableScroll>
      {!locked && <Button className="mt-4" disabled={busy || !proyekId} onClick={() => { setRows((prev) => [...prev, { akunId: '', kodePembantuId: null, debit: 0, kredit: 0 }]); setDirty(true); }}>Tambah baris</Button>}
    </Panel>
    <ConfirmDialog isOpen={confirm} onClose={() => setConfirm(false)} onConfirm={() => tutupBuku(proyekId)} title="Kunci saldo awal" message="Saldo awal tidak dapat diubah setelah dikunci. Lanjutkan?" confirmLabel="Kunci" isDestructive={false} />
  </>;
}
