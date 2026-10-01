import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PiArrowLeft, PiCheckCircle, PiPencilSimple, PiFileText,
} from 'react-icons/pi';
import { useDokumenLegalStore, type StatusDokumen } from '../../store/dokumenLegalStore';
import { useMasterPtStore } from '../../store/masterPtStore';
import { useProyekStore } from '../../store/proyekStore';
import { usePustakaPasalStore } from '../../store/pustakaPasalStore';
import { useTemplateDokumenStore } from '../../store/templateDokumenStore';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Notice from '../../components/ui/Notice';

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
  { value: 'ditandatangani', label: 'Ditandatangani', cls: 'bg-green-50 text-green-700 border-green-200' },
];

function tanggalDalamHuruf(iso: string): string {
  const d = new Date(iso);
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function hariDalamSeminggu(iso: string): string {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hari[new Date(iso).getDay()];
}

export default function LegalEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { items, updateNilaiFields, updateStatus } = useDokumenLegalStore();
  const { items: pts } = useMasterPtStore();
  const { items: proyeks } = useProyekStore();
  const { items: pasals } = usePustakaPasalStore();
  const { items: templates } = useTemplateDokumenStore();

  const dokumen = items.find((d) => d.id === id);

  const [saved, setSaved] = useState(false);
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});

  if (!dokumen) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <PiFileText className="h-12 w-12 text-ink-3" />
        <p className="text-ink-2">Dokumen tidak ditemukan.</p>
        <Link to="/keuangan/legal" className="text-sm font-semibold text-indigo-600 hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const pt = pts.find((p) => p.id === dokumen.ptId);
  const perumahan = proyeks.find((p) => p.id === dokumen.perumahanId);
  const kavling = DUMMY_KAVLING.find((k) => k.id === dokumen.kavlingId);
  const hargaNett = dokumen.hargaAwal + dokumen.bphtb + dokumen.ajbBbn;
  const sisaKpr = hargaNett - dokumen.uangMuka;

  const template = templates.find((t) => t.ptId === dokumen.ptId && t.tipeTransaksi === dokumen.tipeTransaksi);
  const pasalList = (template?.pasalIds ?? dokumen.pasalIds)
    .map((pid) => pasals.find((p) => p.id === pid))
    .filter(Boolean);

  // Kumpulkan nilai field: dari dokumen + edit lokal
  const nilaiFields = { ...dokumen.nilaiFields, ...editingFields };

  // Nilai otomatis dari master data
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
  };

  const resolveNilai = (key: string): string =>
    autoValues[key] ?? nilaiFields[key] ?? `{${key}}`;

  const renderIsi = (isi: string): string =>
    isi.replace(/\{(\w+)\}/g, (_, k) => resolveNilai(k));

  const handleFieldChange = (compositeKey: string, value: string) => {
    setEditingFields((prev) => ({ ...prev, [compositeKey]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateNilaiFields(dokumen.id, editingFields);
    setEditingFields({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleStatusChange = (s: StatusDokumen) => {
    updateStatus(dokumen.id, s);
  };

  const statusObj = STATUS_OPT.find((s) => s.value === dokumen.status);

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Header bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-3 shadow-sm sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/keuangan/legal')}
          className="flex items-center gap-1.5 rounded-md p-1.5 text-ink-2 hover:bg-gray-100"
          aria-label="Kembali ke daftar"
        >
          <PiArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{dokumen.noDokumen}</p>
          <p className="truncate text-xs text-ink-3">{dokumen.pembeli.nama || 'Belum ada data pembeli'}</p>
        </div>

        {/* Status toggle */}
        <div className="flex items-center gap-2">
          <select
            className="control control-sm"
            value={dokumen.status}
            onChange={(e) => handleStatusChange(e.target.value as StatusDokumen)}
          >
            {STATUS_OPT.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {statusObj && (
            <span className={`hidden rounded-md border px-2 py-0.5 text-xs font-semibold sm:inline-flex ${statusObj.cls}`}>
              {statusObj.label}
            </span>
          )}
        </div>

        <Button
          variant="primary"
          icon={saved ? PiCheckCircle : PiPencilSimple}
          onClick={handleSave}
          disabled={Object.keys(editingFields).length === 0}
        >
          {saved ? 'Tersimpan' : 'Simpan'}
        </Button>
      </div>

      <div className="mx-auto max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:flex lg:items-start">
        {/* Panel kiri — data dari master */}
        <aside className="mb-6 w-full rounded-2xl bg-white p-5 shadow-sm lg:mb-0 lg:w-72 lg:shrink-0">
          <p className="mb-4 text-sm font-semibold text-ink">Data dari master</p>

          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">PT</dt>
              <dd className="mt-0.5 text-sm text-ink">{pt?.namaPt ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Direktur</dt>
              <dd className="mt-0.5 text-sm text-ink">{pt?.namaDirektur ?? '-'}</dd>
              <dd className="text-xs text-ink-3">{pt?.ttl ?? ''}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Perumahan</dt>
              <dd className="mt-0.5 text-sm text-ink">{perumahan?.nama ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Kavling</dt>
              <dd className="mt-0.5 text-sm text-ink">{kavling?.nomor ?? '-'} ({kavling?.luas ?? '-'} m²)</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Batas kavling</dt>
              <dd className="mt-0.5 space-y-0.5 text-xs text-ink-2">
                <div>Utara: {kavling?.batasUtara ?? '-'}</div>
                <div>Selatan: {kavling?.batasSelatan ?? '-'}</div>
                <div>Barat: {kavling?.batasBarat ?? '-'}</div>
                <div>Timur: {kavling?.batasTimur ?? '-'}</div>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Pembeli</dt>
              <dd className="mt-0.5 text-sm text-ink">{dokumen.pembeli.nama || '-'}</dd>
              <dd className="text-xs text-ink-3">{dokumen.pembeli.ttl}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Tipe transaksi</dt>
              <dd className="mt-0.5">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
                  dokumen.tipeTransaksi === 'Cash' ? 'bg-green-50 text-green-700 border-green-200'
                  : dokumen.tipeTransaksi === 'KPR' ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>{dokumen.tipeTransaksi}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Harga nett</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums text-ink">
                Rp {hargaNett.toLocaleString('id-ID')}
              </dd>
              <dd className="text-xs text-ink-3">
                Awal: Rp {dokumen.hargaAwal.toLocaleString('id-ID')} + BPHTB: Rp {dokumen.bphtb.toLocaleString('id-ID')}
              </dd>
              {dokumen.tipeTransaksi === 'KPR' && (
                <dd className="text-xs text-ink-3">Sisa KPR: Rp {sisaKpr.toLocaleString('id-ID')}</dd>
              )}
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Tanggal perjanjian</dt>
              <dd className="mt-0.5 text-sm text-ink">
                {dokumen.tanggalPerjanjian
                  ? `${hariDalamSeminggu(dokumen.tanggalPerjanjian)}, ${tanggalDalamHuruf(dokumen.tanggalPerjanjian)}`
                  : '-'}
              </dd>
            </div>
          </dl>
        </aside>

        {/* Panel kanan — editor pasal */}
        <main className="flex-1 space-y-4">
          {Object.keys(editingFields).length > 0 && (
            <Notice tone="warning">Ada perubahan yang belum disimpan. Klik Simpan untuk menyimpannya.</Notice>
          )}

          {pasalList.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <PiFileText className="mx-auto h-10 w-10 text-ink-3" aria-hidden />
              <p className="mt-3 text-sm font-medium text-ink">Tidak ada pasal dalam template ini.</p>
              <p className="mt-1 text-xs text-ink-3">Pergi ke Master PT untuk menambah pasal ke template.</p>
            </div>
          ) : (
            pasalList.map((pasal, idx) => {
              if (!pasal) return null;
              const isiRendered = renderIsi(pasal.isi);

              // Field yang perlu diisi manual (bukan auto)
              const manualFields = pasal.fields.filter((f) => !autoValues[f.key] && autoValues[f.key] !== '');

              return (
                <div key={pasal.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Pasal {idx + 1}</p>
                  <p className="mb-3 text-base font-semibold text-ink">{pasal.judul}</p>

                  {/* Preview teks dengan placeholder terisi */}
                  <div className="mb-4 rounded-lg border border-line bg-subtle p-4 text-sm leading-relaxed text-ink-2">
                    {isiRendered}
                  </div>

                  {/* Input untuk field yang belum otomatis */}
                  {manualFields.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {manualFields.map((field) => {
                        const compositeKey = `${pasal.id}_${field.key}`;
                        const currentVal = editingFields[compositeKey] ?? nilaiFields[compositeKey] ?? '';
                        return (
                          <Field key={field.id} label={field.label}>
                            {field.tipe === 'tanggal' ? (
                              <input
                                type="date"
                                className="control control-sm"
                                value={currentVal}
                                onChange={(e) => handleFieldChange(compositeKey, e.target.value)}
                              />
                            ) : field.tipe === 'angka' ? (
                              <input
                                type="number"
                                inputMode="numeric"
                                className="control control-sm tabular-nums"
                                value={currentVal}
                                onChange={(e) => handleFieldChange(compositeKey, e.target.value)}
                                placeholder="0"
                              />
                            ) : (
                              <input
                                type="text"
                                className="control control-sm"
                                value={currentVal}
                                onChange={(e) => handleFieldChange(compositeKey, e.target.value)}
                              />
                            )}
                          </Field>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
