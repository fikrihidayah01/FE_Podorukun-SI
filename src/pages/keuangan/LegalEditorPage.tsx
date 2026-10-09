import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PiArrowLeft, PiCheckCircle, PiPencilSimple, PiFileText, PiArrowsDownUp, PiTrash, PiPlus, PiLockKey, PiFilePdf, PiFileDoc, PiUploadSimple
} from 'react-icons/pi';
import { useDokumenLegalStore, type StatusDokumen, type BarisJadwal } from '../../store/dokumenLegalStore';
import { useMasterPtStore } from '../../store/masterPtStore';
import { useProyekStore } from '../../store/proyekStore';
import { usePustakaPasalStore } from '../../store/pustakaPasalStore';
import { usePiutangStore } from '../../store/piutangStore';
import Button, { IconButton } from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Notice from '../../components/ui/Notice';
import Modal from '../../components/ui/Modal';

// Dummy kavling
const DUMMY_KAVLING = [
  { id: 'kav-001', nomor: 'A-01', luas: 120, batasUtara: 'Jalan lingkungan', batasSelatan: 'Kavling A-02', batasBarat: 'Saluran drainase', batasTimur: 'Kavling A-08' },
  { id: 'kav-002', nomor: 'A-02', luas: 135, batasUtara: 'Kavling A-01', batasSelatan: 'Jalan lingkungan', batasBarat: 'Saluran drainase', batasTimur: 'Kavling A-09' },
  { id: 'kav-003', nomor: 'B-05', luas: 90, batasUtara: 'Fasum', batasSelatan: 'Jalan utama', batasBarat: 'Kavling B-04', batasTimur: 'Kavling B-06' },
  { id: 'kav-004', nomor: 'C-12', luas: 200, batasUtara: 'Jalan utama', batasSelatan: 'Lahan kosong', batasBarat: 'Kavling C-11', batasTimur: 'Pagar perumahan' },
];

const STATUS_OPT: { value: StatusDokumen; label: string; cls: string }[] = [
  { value: 'draft', label: 'Draft', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'final', label: 'Final', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'ditandatangani', label: 'Ditandatangani', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];


function tanggalDalamHuruf(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function hariDalamSeminggu(iso: string): string {
  if (!iso) return '';
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hari[new Date(iso).getDay()];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function LegalEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { items, fetch: fetchDokumen, updateDataUtama, updateStatus, updatePasalUtama, updatePasalField, removePasal, addPasal, reorderPasal, updateJadwalPembayaran, updateBarisJadwal } = useDokumenLegalStore();
  const { addFromLegal } = usePiutangStore();
  const { items: pts, fetch: fetchPts } = useMasterPtStore();
  const { items: proyeks } = useProyekStore();
  const { items: pustakaPasal, fetch: fetchPasals } = usePustakaPasalStore();

  useEffect(() => {
    fetchDokumen();
    fetchPts();
    fetchPasals();
  }, [fetchDokumen, fetchPts, fetchPasals]);

  const dokumen = items.find((d) => d.id === id);

  const [panelDataOpen, setPanelDataOpen] = useState(false);
  const [jadwalOpen, setJadwalOpen] = useState(false);
  const [finalisasiOpen, setFinalisasiOpen] = useState(false);
  const [sisipPasalOpen, setSisipPasalOpen] = useState(false);
  const [editPasalId, setEditPasalId] = useState<string | null>(null);
  
  // State for adding pasal
  const [pasalBaru, setPasalBaru] = useState({ judul: '', isi: '' });

  // State for Panel Data
  const [dataForm, setDataForm] = useState(dokumen ? {
    nama: dokumen.pembeli.nama,
    ttl: dokumen.pembeli.ttl,
    pekerjaan: dokumen.pembeli.pekerjaan,
    alamat: dokumen.pembeli.alamat,
    noKtp: dokumen.pembeli.noKtp,
    noHp: dokumen.pembeli.noHp,
    hargaAwal: String(dokumen.hargaAwal),
    bphtb: String(dokumen.bphtb),
    ajbBbn: String(dokumen.ajbBbn),
    uangMuka: String(dokumen.uangMuka),
    tanggalPerjanjian: dokumen.tanggalPerjanjian,
    fasilitasTambahan: dokumen.fasilitasTambahan ?? '',
  } : null);

  // State for Jadwal
  const [jadwalForm, setJadwalForm] = useState({
    tanggalAcuan: dokumen?.jadwalPembayaran?.tanggalAcuan ?? '4',
    nominalPerBulan: String(dokumen?.jadwalPembayaran?.nominalPerBulan ?? ''),
    tanggalMulai: dokumen?.jadwalPembayaran?.tanggalMulai ?? '',
    jatuhTempoTerakhir: dokumen?.jadwalPembayaran?.jatuhTempoTerakhir ?? '',
  });

  if (!dokumen || !dataForm) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <PiFileText className="h-12 w-12 text-ink-3" />
        <p className="text-ink-2">Dokumen tidak ditemukan.</p>
        <Link to="/keuangan/legal" className="text-sm font-semibold text-brand-600 hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const isFinal = dokumen.status === 'final' || dokumen.status === 'ditandatangani';

  const pt = pts.find((p) => p.id === dokumen.ptId);
  const perumahan = proyeks.find((p) => p.id === dokumen.perumahanId);
  const kavling = DUMMY_KAVLING.find((k) => k.id === dokumen.kavlingId);
  const hargaNett = dokumen.hargaAwal + dokumen.bphtb + dokumen.ajbBbn;
  const sisaKpr = hargaNett - dokumen.uangMuka;

  // Auto values calculation for locked text rendering
  const autoValues: Record<string, string> = {
    nama_pt: pt?.namaPt ?? '',
    nama_direktur: pt?.namaDirektur ?? '',
    ttl_direktur: pt?.ttl ?? '',
    pekerjaan_direktur: pt?.pekerjaan ?? '',
    alamat_pt: pt?.alamat ?? '',
    nama_pembeli: dokumen.pembeli.nama,
    ttl_pembeli: dokumen.pembeli.ttl,
    pekerjaan_pembeli: dokumen.pembeli.pekerjaan,
    alamat_pembeli: dokumen.pembeli.alamat,
    no_ktp_pembeli: dokumen.pembeli.noKtp,
    nama_perumahan: perumahan?.nama ?? '',
    no_kavling: kavling?.nomor ?? '',
    luas_kavling: kavling ? String(kavling.luas) : '',
    harga_nett: hargaNett.toLocaleString('id-ID'),
    harga_awal: dokumen.hargaAwal.toLocaleString('id-ID'),
    uang_muka: dokumen.uangMuka.toLocaleString('id-ID'),
    sisa_kpr: sisaKpr.toLocaleString('id-ID'),
    tanggal_perjanjian: dokumen.tanggalPerjanjian ? tanggalDalamHuruf(dokumen.tanggalPerjanjian) : '',
    hari_perjanjian: dokumen.tanggalPerjanjian ? hariDalamSeminggu(dokumen.tanggalPerjanjian) : '',
    fasilitas_tambahan: dokumen.fasilitasTambahan || '-',
  };

  const resolveNilai = (key: string, customFields: any[]): string => {
    if (autoValues[key] !== undefined) return autoValues[key];
    const custom = customFields.find(f => f.key === key);
    if (custom && custom.nilai) return custom.nilai;
    return `{${key}}`;
  };

  // Render text with badges for locked / resolved values
  const renderTeks = (teks: string, customFields: any[]) => {
    const parts = teks.split(/(\{.*?\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const key = part.slice(1, -1);
        const resolved = resolveNilai(key, customFields);
        return (
          <span key={i} className={`inline-flex items-center rounded bg-brand-50 px-1 py-0.5 font-medium text-brand-700`}>
            {resolved}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const simpanPanelData = () => {
    updateDataUtama(dokumen.id, {
      pembeli: {
        nama: dataForm.nama,
        ttl: dataForm.ttl,
        pekerjaan: dataForm.pekerjaan,
        alamat: dataForm.alamat,
        noKtp: dataForm.noKtp,
        noHp: dataForm.noHp,
      },
      hargaAwal: Number(dataForm.hargaAwal) || 0,
      bphtb: Number(dataForm.bphtb) || 0,
      ajbBbn: Number(dataForm.ajbBbn) || 0,
      uangMuka: Number(dataForm.uangMuka) || 0,
      tanggalPerjanjian: dataForm.tanggalPerjanjian,
      fasilitasTambahan: dataForm.fasilitasTambahan,
    });
    setPanelDataOpen(false);
  };

  const movePasal = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= dokumen.pasalDokumen.length) return;
    reorderPasal(dokumen.id, index, newIndex);
  };

  const handleSimpanSisipPasal = (pustakaId?: string) => {
    if (pustakaId) {
      const p = pustakaPasal.find(x => x.id === pustakaId);
      if (p) {
        addPasal(dokumen.id, {
          pustakaId: p.id,
          judul: p.judul,
          isi: p.isi,
          fields: p.fields.map(f => ({ ...f, nilai: '' })),
        });
      }
    } else {
      if (!pasalBaru.judul || !pasalBaru.isi) return;
      addPasal(dokumen.id, {
        judul: pasalBaru.judul,
        isi: pasalBaru.isi,
        fields: [],
      });
    }
    setPasalBaru({ judul: '', isi: '' });
    setSisipPasalOpen(false);
  };

  const hitungJadwal = () => {
    const start = new Date(jadwalForm.tanggalMulai);
    const end = new Date(jadwalForm.jatuhTempoTerakhir);
    const nominal = Number(jadwalForm.nominalPerBulan) || 0;
    const acuan = Number(jadwalForm.tanggalAcuan) || 1;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || nominal <= 0) return [];

    let current = new Date(start);
    const baris: BarisJadwal[] = [];
    let no = 1;

    // Set tanggal sesuai acuan di bulan mulai, atau biarkan jika bulan pertama ingin beda
    // Rencana: generate bulan demi bulan sampai end date
    while (current <= end) {
      const targetYear = current.getFullYear();
      const targetMonth = current.getMonth();
      const maxDays = getDaysInMonth(targetYear, targetMonth);
      const targetDate = Math.min(acuan, maxDays);
      
      const jadwalDate = new Date(targetYear, targetMonth, targetDate);
      
      baris.push({
        id: crypto.randomUUID(),
        tanggal: jadwalDate.toISOString().split('T')[0],
        jumlah: nominal,
        keterangan: `DP ${no}`,
      });

      no++;
      current.setMonth(current.getMonth() + 1);
    }
    return baris;
  };

  const simpanJadwal = () => {
    const baris = hitungJadwal();
    updateJadwalPembayaran(dokumen.id, {
      tanggalAcuan: jadwalForm.tanggalAcuan,
      nominalPerBulan: Number(jadwalForm.nominalPerBulan) || 0,
      tanggalMulai: jadwalForm.tanggalMulai,
      jatuhTempoTerakhir: jadwalForm.jatuhTempoTerakhir,
      baris,
    });
    setJadwalOpen(false);
  };

  const totalJadwal = dokumen.jadwalPembayaran?.baris.reduce((s, b) => s + b.jumlah, 0) || 0;
  const isJadwalMatch = totalJadwal === dokumen.uangMuka;

  const handleFinalisasi = () => {
    if (!dokumen.pembeli.nama || dokumen.hargaAwal <= 0 || !isJadwalMatch) return;
    updateStatus(dokumen.id, 'final');
    addFromLegal(dokumen);
    setFinalisasiOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-3 shadow-sm sm:px-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#0e7490]" aria-hidden />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/keuangan/legal')}
            className="flex items-center gap-1.5 rounded-md p-1.5 text-ink-2 hover:bg-gray-100"
          >
            <PiArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-ink">{dokumen.noDokumen}</p>
            <p className="text-xs text-ink-3">Kav {kavling?.nomor} &middot; {pt?.namaPt} &middot; {dokumen.tipeTransaksi.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${
            STATUS_OPT.find(s => s.value === dokumen.status)?.cls
          }`}>
            {STATUS_OPT.find(s => s.value === dokumen.status)?.label}
          </span>
          <Button variant="secondary" onClick={() => setPanelDataOpen(true)}>Panel data</Button>
          {!isFinal && <Button variant="primary" onClick={() => setFinalisasiOpen(true)}>Finalisasi</Button>}
          {isFinal && <Button variant="primary" onClick={() => setFinalisasiOpen(true)}>Ekspor & Status</Button>}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Notice tone="info" className="mb-6">
          <div className="flex items-center gap-2">
            <PiLockKey className="h-4 w-4 shrink-0 text-brand-600" />
            <p>Teks bertanda biru adalah data terkunci. Ubah lewat panel data, bukan diketik di badan dokumen.</p>
          </div>
        </Notice>

        {/* Kop / Pendahuluan */}
        <div className="mb-6 rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-lg font-bold text-ink uppercase tracking-wide">Surat Pernyataan Pembelian Rumah</h1>
            <div className="mt-2 flex justify-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 uppercase">{perumahan?.nama}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 uppercase">Kavling {kavling?.nomor}</span>
            </div>
          </div>

          <p className="leading-loose text-ink">
            Pada hari ini {renderTeks('{hari_perjanjian}', [])} tanggal {renderTeks('{tanggal_perjanjian}', [])}, 
            telah disepakati pemesanan tanah dan bangunan dengan luas tanah {renderTeks('{luas_kavling}', [])} m² 
            oleh {renderTeks('{nama_pembeli}', [])}.
          </p>
        </div>

        {/* Daftar Pasal */}
        <div className="space-y-4">
          {dokumen.pasalDokumen.map((pasal, idx) => (
            <div key={pasal.id} className="group relative rounded-2xl bg-white p-6 shadow-sm border border-transparent hover:border-gray-200">
              
              {/* Header Pasal */}
              <div className="mb-4 flex items-start justify-between">
                {editPasalId === pasal.id ? (
                  <input 
                    className="control font-semibold" 
                    value={pasal.judul} 
                    onChange={e => updatePasalUtama(dokumen.id, pasal.id, { judul: e.target.value })} 
                  />
                ) : (
                  <h2 className="text-base font-semibold text-ink">Pasal {idx + 1} — {pasal.judul}</h2>
                )}
                
                {/* Actions (hover) */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconButton icon={PiPencilSimple} label="Edit teks" onClick={() => setEditPasalId(editPasalId === pasal.id ? null : pasal.id)} disabled={isFinal} />
                  <div className="flex flex-col gap-0.5 px-1">
                    <button type="button" onClick={() => movePasal(idx, 'up')} disabled={idx === 0 || isFinal} className="text-ink-3 hover:text-ink disabled:opacity-30"><PiArrowsDownUp className="h-3 w-3" /></button>
                  </div>
                  <IconButton icon={PiTrash} label="Hapus pasal" tone="danger" onClick={() => removePasal(dokumen.id, pasal.id)} disabled={isFinal} />
                </div>
              </div>

              {/* Isi Pasal */}
              {editPasalId === pasal.id ? (
                <textarea 
                  className="control w-full min-h-[100px]" 
                  value={pasal.isi} 
                  onChange={e => updatePasalUtama(dokumen.id, pasal.id, { isi: e.target.value })}
                />
              ) : (
                <div className="leading-relaxed text-ink-2">
                  {renderTeks(pasal.isi, pasal.fields)}
                </div>
              )}

              {/* Input Fields Custom */}
              {pasal.fields.length > 0 && !isFinal && (
                <div className="mt-4 rounded-xl bg-subtle p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {pasal.fields.map(f => (
                    <Field key={f.id} label={f.label}>
                      <div className="flex items-center gap-2">
                        <input
                          type={f.tipe === 'angka' ? 'number' : 'text'}
                          className="control"
                          value={f.nilai}
                          onChange={e => updatePasalField(dokumen.id, pasal.id, f.key, e.target.value)}
                        />
                      </div>
                    </Field>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Jadwal Pembayaran Panel */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Jadwal angsuran uang muka</h2>
            {!isFinal && <Button variant="secondary" size="sm" onClick={() => setJadwalOpen(true)}>Atur jadwal</Button>}
          </div>
          
          {dokumen.jadwalPembayaran ? (
            <div>
              <p className="mb-3 text-sm text-ink-2">
                Angsuran dibayarkan setiap tanggal <span className="font-semibold text-ink">{dokumen.jadwalPembayaran.tanggalAcuan}</span> setiap bulannya.
              </p>
              
              {!isJadwalMatch && !isFinal && (
                <Notice tone="danger" className="mb-4">
                  Total jadwal (Rp {totalJadwal.toLocaleString('id-ID')}) tidak sesuai dengan Uang Muka (Rp {dokumen.uangMuka.toLocaleString('id-ID')}).
                </Notice>
              )}
              {isJadwalMatch && (
                <Notice tone="positive" className="mb-4">
                  {dokumen.jadwalPembayaran.baris.length} angsuran, total Rp {totalJadwal.toLocaleString('id-ID')}. Cocok dengan uang muka.
                </Notice>
              )}

              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-ink-3">
                  <tr>
                    <th className="py-2 font-medium">No</th>
                    <th className="py-2 font-medium">Tanggal</th>
                    <th className="py-2 font-medium text-right">Jumlah</th>
                    <th className="py-2 font-medium pl-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {dokumen.jadwalPembayaran.baris.map((b, i) => (
                    <tr key={b.id}>
                      <td className="py-2.5">{i + 1}</td>
                      <td className="py-2.5">{b.tanggal}</td>
                      <td className="py-2.5 text-right font-semibold">
                        {isFinal ? (
                          b.jumlah.toLocaleString('id-ID')
                        ) : (
                          <input 
                            type="number" 
                            className="w-28 rounded border-line px-2 py-1 text-right text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-100"
                            value={b.jumlah}
                            onChange={(e) => updateBarisJadwal(dokumen.id, b.id, Number(e.target.value) || 0)}
                          />
                        )}
                      </td>
                      <td className="py-2.5 pl-4">{b.keterangan}</td>
                    </tr>
                  ))}
                  <tr className="font-bold text-ink">
                    <td colSpan={2} className="py-3 text-right">Total</td>
                    <td className="py-3 text-right">Rp {totalJadwal.toLocaleString('id-ID')}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-ink-3">Belum ada jadwal yang terbentuk.</p>
          )}
        </div>

        {!isFinal && (
          <button 
            type="button" 
            onClick={() => setSisipPasalOpen(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line p-4 text-sm font-medium text-ink-2 hover:bg-subtle transition-colors"
          >
            <PiPlus className="h-4 w-4" /> Sisipkan pasal dari pustaka atau tulis baru
          </button>
        )}
      </div>

      {/* MODAL: Panel Data (Data Master & Harga) */}
      <Modal isOpen={panelDataOpen} onClose={() => setPanelDataOpen(false)} title="Panel Data Dokumen" size="xl">
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Data Pembeli</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap"><input className="control" value={dataForm.nama} onChange={e => setDataForm({...dataForm, nama: e.target.value})} disabled={isFinal}/></Field>
              <Field label="Tempat, Tanggal Lahir"><input className="control" value={dataForm.ttl} onChange={e => setDataForm({...dataForm, ttl: e.target.value})} disabled={isFinal}/></Field>
              <Field label="Pekerjaan"><input className="control" value={dataForm.pekerjaan} onChange={e => setDataForm({...dataForm, pekerjaan: e.target.value})} disabled={isFinal}/></Field>
              <Field label="No KTP"><input className="control" value={dataForm.noKtp} onChange={e => setDataForm({...dataForm, noKtp: e.target.value})} disabled={isFinal}/></Field>
              <Field label="Alamat" className="sm:col-span-2"><textarea className="control" rows={2} value={dataForm.alamat} onChange={e => setDataForm({...dataForm, alamat: e.target.value})} disabled={isFinal}/></Field>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Harga & Pembayaran</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Harga Awal"><input type="number" className="control tabular-nums" value={dataForm.hargaAwal} onChange={e => setDataForm({...dataForm, hargaAwal: e.target.value})} disabled={isFinal}/></Field>
              <Field label="Uang Muka"><input type="number" className="control tabular-nums" value={dataForm.uangMuka} onChange={e => setDataForm({...dataForm, uangMuka: e.target.value})} disabled={isFinal}/></Field>
              <Field label="BPHTB"><input type="number" className="control tabular-nums" value={dataForm.bphtb} onChange={e => setDataForm({...dataForm, bphtb: e.target.value})} disabled={isFinal}/></Field>
              <Field label="AJB + BBN"><input type="number" className="control tabular-nums" value={dataForm.ajbBbn} onChange={e => setDataForm({...dataForm, ajbBbn: e.target.value})} disabled={isFinal}/></Field>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Lain-lain</h3>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Tanggal Perjanjian"><input type="date" className="control" value={dataForm.tanggalPerjanjian} onChange={e => setDataForm({...dataForm, tanggalPerjanjian: e.target.value})} disabled={isFinal}/></Field>
              <Field label="Bonus / Fasilitas Tambahan"><textarea className="control" rows={3} value={dataForm.fasilitasTambahan} onChange={e => setDataForm({...dataForm, fasilitasTambahan: e.target.value})} placeholder="Tuliskan bonus tandon, kanopi, dsb jika ada." disabled={isFinal}/></Field>
            </div>
          </section>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={() => setPanelDataOpen(false)}>Tutup</Button>
          {!isFinal && <Button variant="primary" onClick={simpanPanelData}>Simpan data</Button>}
        </div>
      </Modal>

      {/* MODAL: Atur Jadwal */}
      <Modal isOpen={jadwalOpen} onClose={() => setJadwalOpen(false)} title="Jadwal angsuran uang muka" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Tanggal acuan">
              <select className="control" value={jadwalForm.tanggalAcuan} onChange={e => setJadwalForm(p => ({...p, tanggalAcuan: e.target.value}))}>
                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d)}>Setiap tanggal {d}</option>
                ))}
              </select>
            </Field>
            <Field label="Nominal per bulan">
              <input type="number" className="control tabular-nums" value={jadwalForm.nominalPerBulan} onChange={e => setJadwalForm(p => ({...p, nominalPerBulan: e.target.value}))} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mulai">
              <input type="date" className="control" value={jadwalForm.tanggalMulai} onChange={e => setJadwalForm(p => ({...p, tanggalMulai: e.target.value}))} />
            </Field>
            <Field label="Jatuh tempo terakhir">
              <input type="date" className="control" value={jadwalForm.jatuhTempoTerakhir} onChange={e => setJadwalForm(p => ({...p, jatuhTempoTerakhir: e.target.value}))} />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={() => setJadwalOpen(false)}>Batal</Button>
          <Button variant="primary" onClick={simpanJadwal}>Simpan jadwal</Button>
        </div>
      </Modal>

      {/* MODAL: Sisip Pasal */}
      <Modal isOpen={sisipPasalOpen} onClose={() => setSisipPasalOpen(false)} title="Sisipkan pasal">
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Dari Pustaka</h3>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-line bg-subtle p-2">
              {pustakaPasal.length === 0 ? <p className="text-sm text-ink-3">Kosong.</p> : pustakaPasal.map(p => (
                <button key={p.id} type="button" onClick={() => handleSimpanSisipPasal(p.id)} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100">
                  <span className="font-medium text-ink">{p.judul}</span>
                </button>
              ))}
            </div>
          </section>
          <hr className="border-line" />
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Tulis Baru</h3>
            <div className="space-y-3">
              <Field label="Judul"><input className="control" value={pasalBaru.judul} onChange={e => setPasalBaru(p => ({...p, judul: e.target.value}))}/></Field>
              <Field label="Isi"><textarea className="control" rows={3} value={pasalBaru.isi} onChange={e => setPasalBaru(p => ({...p, isi: e.target.value}))}/></Field>
              <Button onClick={() => handleSimpanSisipPasal()} disabled={!pasalBaru.judul || !pasalBaru.isi}>Sisipkan pasal baru</Button>
            </div>
          </section>
        </div>
      </Modal>

      {/* MODAL: Finalisasi & Ekspor */}
      <Modal isOpen={finalisasiOpen} onClose={() => setFinalisasiOpen(false)} title={isFinal ? 'Ekspor & Status' : 'Finalisasi Dokumen'} size="lg">
        {!isFinal ? (
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink">Kelengkapan</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><PiCheckCircle className={`h-5 w-5 ${dokumen.pembeli.nama ? 'text-green-600' : 'text-gray-300'}`} /> Data pembeli lengkap</li>
                <li className="flex items-center gap-2"><PiCheckCircle className={`h-5 w-5 ${dokumen.hargaAwal > 0 ? 'text-green-600' : 'text-gray-300'}`} /> Harga dan BPHTB terisi</li>
                <li className="flex items-center gap-2"><PiCheckCircle className={`h-5 w-5 ${isJadwalMatch ? 'text-green-600' : 'text-amber-500'}`} /> Jadwal cocok dengan uang muka</li>
                <li className="flex items-center gap-2"><PiCheckCircle className={`h-5 w-5 ${dokumen.pasalDokumen.length > 0 ? 'text-green-600' : 'text-gray-300'}`} /> {dokumen.pasalDokumen.length} pasal aktif</li>
              </ul>
            </section>
            <Notice tone="info">
              <strong className="block text-brand-800">Setelah difinalkan</strong>
              Kartu tagihan {dokumen.pembeli.nama || 'pembeli'} terbentuk di Piutang dengan nilai SPPR Rp {hargaNett.toLocaleString('id-ID')}. 
              Jadwal {dokumen.jadwalPembayaran?.baris.length || 0} angsuran menjadi acuan rekonsiliasi. Angka terkunci, perubahan berikutnya lewat adendum.
            </Notice>
            <div className="flex justify-end gap-3 pt-4 border-t border-line">
              <Button onClick={() => setFinalisasiOpen(false)}>Batal</Button>
              <Button variant="primary" onClick={handleFinalisasi} disabled={!dokumen.pembeli.nama || dokumen.hargaAwal <= 0 || !isJadwalMatch}>Finalkan dokumen</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink">Ekspor</h3>
              <div className="flex flex-wrap gap-3">
                <Button icon={PiFilePdf} onClick={() => window.print()}>Cetak PDF</Button>
                <Button icon={PiFileDoc}>Unduh Word</Button>
                <Button icon={PiUploadSimple} variant="secondary">Unggah scan bertanda tangan</Button>
              </div>
            </section>
            
            <section className="pt-4 border-t border-line">
              <h3 className="mb-3 text-sm font-semibold text-ink">Status Terkini</h3>
              <div className="flex items-center gap-3">
                <select className="control w-auto" value={dokumen.status} onChange={(e) => updateStatus(dokumen.id, e.target.value as StatusDokumen)}>
                  <option value="final">Final</option>
                  <option value="ditandatangani">Ditandatangani</option>
                </select>
                <span className="text-sm text-ink-3">Perubahan nilai uang dan jadwal memerlukan fitur Adendum di modul Piutang.</span>
              </div>
            </section>
          </div>
        )}
      </Modal>

    </div>
  );
}
