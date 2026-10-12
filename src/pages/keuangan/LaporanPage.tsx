import { useEffect, useState } from 'react';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Money from '../../components/ui/Money';
import { fetchApi } from '../../lib/api';
import { useCoaStore } from '../../store/coaStore';
import { useProyekStore } from '../../store/proyekStore';

type ReportRow = Record<string, string | number | null>;
export default function LaporanPage() {
  const { items: akuns, fetch: fetchAkuns } = useCoaStore();
  const { items: proyeks, fetch: fetchProyeks } = useProyekStore();
  const [jenis, setJenis] = useState('saldo-akun');
  const [proyekId, setProyekId] = useState('');
  const [akunId, setAkunId] = useState('');
  const [dari, setDari] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [sampai, setSampai] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [meta, setMeta] = useState<{ saldoAwal?: number; saldoAkhir?: number }>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { void fetchAkuns(); void fetchProyeks(); }, [fetchAkuns, fetchProyeks]);
  const load = async () => {
    setError(''); setRows(null); setMeta({});
    if (jenis === 'buku-besar' && (!akunId || dari > sampai)) { setError('Pilih akun dan rentang tanggal yang benar.'); return; }
    setBusy(true);
    try {
      const query = new URLSearchParams();
      if (proyekId) query.set('proyekId', proyekId);
      if (jenis === 'buku-besar') { query.set('akunId', akunId); query.set('dari', dari); }
      if (jenis === 'saldo-kode-pembantu') query.set('bulan', sampai.slice(0, 7));
      else query.set('sampai', sampai);
      const res = await fetchApi(`/laporan/${jenis}?${query}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Gagal memuat laporan');
      setRows(jenis === 'saldo-kode-pembantu' ? body.data.map((row: { kodePembantu: { kode: string; nama: string }; saldoAwal: number; mutasiBulan: number; saldoAkhir: number }) => ({ ...row, kode: row.kodePembantu.kode, nama: row.kodePembantu.nama })) : body.data); setMeta(body.meta || {});
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal memuat laporan'); }
    finally { setBusy(false); }
  };
  const columns = jenis === 'saldo-akun' ? ['kodeAkun', 'namaAkun', 'saldoAwalDebit', 'saldoAwalKredit', 'mutasiDebit', 'mutasiKredit', 'saldo'] : jenis === 'buku-besar' ? ['tanggal', 'nomorJurnal', 'keterangan', 'debit', 'kredit', 'saldo'] : ['kode', 'nama', 'saldoAwal', 'mutasiBulan', 'saldoAkhir'];
  const labels: Record<string, string> = { kodeAkun: 'Kode akun', namaAkun: 'Nama akun', saldoAwalDebit: 'Awal debit', saldoAwalKredit: 'Awal kredit', mutasiDebit: 'Mutasi debit', mutasiKredit: 'Mutasi kredit', saldo: 'Saldo', tanggal: 'Tanggal', nomorJurnal: 'Nomor jurnal', keterangan: 'Keterangan', debit: 'Debit', kredit: 'Kredit', kode: 'Kode', nama: 'Nama', saldoAwal: 'Saldo awal', mutasiBulan: 'Mutasi bulan', saldoAkhir: 'Saldo akhir' };
  return <><PageHeader title="Laporan keuangan" description="Saldo akun, buku besar, dan saldo kode pembantu dari pembukuan backend" /><PageBody>
    <form className="mb-6 flex flex-wrap items-end gap-4" onSubmit={(event) => { event.preventDefault(); void load(); }}>
      <label>Jenis laporan<select className="control block" aria-label="Jenis laporan" value={jenis} onChange={(e) => { setJenis(e.target.value); setRows(null); }}><option value="saldo-akun">Neraca saldo</option><option value="buku-besar">Buku besar</option><option value="saldo-kode-pembantu">Saldo kode pembantu</option></select></label>
      <label>Proyek<select className="control block" aria-label="Proyek" value={proyekId} onChange={(e) => setProyekId(e.target.value)}><option value="">Semua proyek</option>{proyeks.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}</select></label>
      {jenis === 'buku-besar' && <><label>Akun<select className="control block" aria-label="Akun" required value={akunId} onChange={(e) => setAkunId(e.target.value)}><option value="">Pilih akun</option>{akuns.map((a) => <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>)}</select></label><label>Dari<input className="control block" type="date" required value={dari} onChange={(e) => setDari(e.target.value)} /></label></>}
      <label>{jenis === 'saldo-kode-pembantu' ? 'Bulan' : 'Sampai'}<input className="control block" required type={jenis === 'saldo-kode-pembantu' ? 'month' : 'date'} value={jenis === 'saldo-kode-pembantu' ? sampai.slice(0, 7) : sampai} onChange={(e) => setSampai(jenis === 'saldo-kode-pembantu' ? e.target.value + '-01' : e.target.value)} /></label><Button type="submit" variant="primary" disabled={busy}>{busy ? 'Memuat…' : 'Tampilkan'}</Button>
    </form>
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
    {rows && <><div className="mb-4 flex gap-6">{meta.saldoAwal !== undefined && <span>Saldo awal: <Money value={meta.saldoAwal} /></span>}{meta.saldoAkhir !== undefined && <span>Saldo akhir: <Money value={meta.saldoAkhir} /></span>}</div><div className="overflow-x-auto rounded-lg border border-line"><table className="w-full text-sm"><thead><tr>{columns.map((c) => <th className="p-3 text-left" key={c}>{labels[c]}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr className="border-t border-line" key={i}>{columns.map((c) => <td className="p-3" key={c}>{typeof row[c] === 'number' ? <Money value={row[c] as number} /> : String(row[c] ?? '—')}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <p className="p-6 text-ink-2">Tidak ada transaksi untuk filter ini.</p>}</div></>}
  </PageBody></>;
}
