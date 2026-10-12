import { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api';
import { useCoaStore } from '../../store/coaStore';
import Button from '../../components/ui/Button';
import Panel from '../../components/ui/Panel';
interface Mapping { kunci: string; label: string; akunId: string | null }
export default function CoaTabAkunSistem() {
  const akuns = useCoaStore((s) => s.items);
  const [rows, setRows] = useState<Mapping[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [saved, setSaved] = useState('');
  useEffect(() => {
    void (async () => {
      try { const res = await fetchApi('/akun-sistem'); const body = await res.json(); if (!res.ok) throw new Error(body.message); setRows(body.data); }
      catch (err) { setError(err instanceof Error ? err.message : 'Gagal memuat akun sistem'); }
    })();
  }, []);
  const leaf = akuns.filter((a) => a.status === 'aktif' && !akuns.some((child) => child.akunIndukId === a.id));
  const save = async (row: Mapping) => {
    setBusy(row.kunci); setError(''); setSaved('');
    try {
      const res = await fetchApi(`/akun-sistem/${row.kunci}`, { method: 'PUT', body: JSON.stringify({ akunId: row.akunId }) });
      const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal menyimpan akun sistem');
      setSaved(row.label + ' berhasil disimpan.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setBusy(''); }
  };
  return <Panel title="Akun sistem" description="Pilih akun untuk jurnal otomatis penjualan, pembayaran, dan pembatalan.">
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}{saved && <p role="status" className="mb-4 text-ink-2">{saved}</p>}
    <div className="space-y-4">{rows.map((row) => <div className="flex flex-wrap items-end gap-3" key={row.kunci}><label className="min-w-64 flex-1"><span className="field-label">{row.label}</span><select className="control" value={row.akunId || ''} disabled={Boolean(busy)} onChange={(e) => setRows((prev) => prev.map((item) => item.kunci === row.kunci ? { ...item, akunId: e.target.value } : item))}><option value="">Belum diatur</option>{leaf.map((a) => <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>)}</select></label><Button disabled={!row.akunId || Boolean(busy)} onClick={() => void save(row)}>{busy === row.kunci ? 'Menyimpan…' : 'Simpan'}</Button></div>)}</div>
  </Panel>;
}
