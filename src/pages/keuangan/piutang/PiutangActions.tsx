import { useState } from 'react';
import { fetchApi } from '../../../lib/api';
import { usePiutangStore, type KavlingTagihan } from '../../../store/piutangStore';
import { useCoaStore } from '../../../store/coaStore';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import TagihanModal from './TagihanModal';
export default function PiutangActions({ item }: { item: KavlingTagihan }) {
  const [action, setAction] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [nominal, setNominal] = useState('0');
  const [alasan, setAlasan] = useState('');
  const [akunKasId, setAkunKasId] = useState('');
  const [noBukti, setNoBukti] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tagihanOpen, setTagihanOpen] = useState(false);
  const akuns = useCoaStore((s) => s.items);
  const labels: Record<string, string> = { bast: 'Catat BAST', batal: 'Batalkan penjualan', cashback: 'Cashback KPR', admin: 'Admin KPR' };
  const submit = async () => {
    setBusy(true); setError('');
    try {
      const kpr = ['cashback', 'admin'].includes(action);
      const payload = action === 'bast' ? { tanggal, nilaiHpp: Number(nominal) } : action === 'batal' ? { tanggal, potongan: Number(nominal), alasan } : { jenis: action, tanggal, nominal: Number(nominal), akunKasId, noBukti };
      const res = await fetchApi(`/piutang/${item.id}/${kpr ? 'biaya-kpr' : action}`, { method: 'POST', body: JSON.stringify(payload) });
      const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal menyimpan');
      await usePiutangStore.getState().fetchItems(); setAction('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan'); }
    finally { setBusy(false); }
  };
  return <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex flex-wrap gap-2">
    <Button onClick={() => setTagihanOpen(true)}>Tagihan</Button>
    {item.status !== 'batal' && Object.entries(labels).filter(([key]) => item.statusBast === 'belum_bast' || !['bast', 'batal'].includes(key)).filter(([key]) => item.tipeTransaksi === 'kpr' || !['cashback', 'admin'].includes(key)).map(([key, label]) => <Button key={key} onClick={() => { setAction(key); setError(''); setNominal('0'); void useCoaStore.getState().fetch(); }}>{label}</Button>)}
    {item.status === 'batal' && <span>Dibatalkan</span>}
    <Modal isOpen={Boolean(action)} onClose={() => { if (!busy) setAction(''); }} title={labels[action] || ''} footer={<><Button disabled={busy} onClick={() => setAction('')}>Batal</Button><Button variant={action === 'batal' ? 'danger' : 'primary'} disabled={busy} onClick={() => void submit()}>{busy ? 'Menyimpan…' : 'Konfirmasi'}</Button></>}>
      <div className="space-y-4">{error && <p role="alert" className="text-red-600">{error}</p>}<label className="block">Tanggal<input className="control" type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></label><label className="block">{action === 'bast' ? 'Nilai HPP' : action === 'batal' ? 'Potongan pengembalian' : 'Nominal'}<input className="control" type="number" min="0" step="0.01" value={nominal} onChange={(e) => setNominal(e.target.value)} /></label>
      {action === 'batal' && <><p>Penjualan dibatalkan dan sisa pembayaran menjadi hutang pengembalian sesuai pembukuan.</p><label>Alasan<textarea className="control" value={alasan} onChange={(e) => setAlasan(e.target.value)} /></label></>}
      {['cashback', 'admin'].includes(action) && <><label>Akun kas/bank<select className="control" value={akunKasId} onChange={(e) => setAkunKasId(e.target.value)}><option value="">Pilih akun</option>{akuns.filter((a) => a.isKasBank && a.status === 'aktif').map((a) => <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>)}</select></label><label>No. bukti<input className="control" value={noBukti} onChange={(e) => setNoBukti(e.target.value)} /></label><p>Setelah disimpan, unggah bukti dan posting melalui Jurnal Umum.</p></>}
      </div>
    </Modal>
    {tagihanOpen && <TagihanModal item={item} isOpen={tagihanOpen} onClose={() => setTagihanOpen(false)} />}
  </div>;
}
