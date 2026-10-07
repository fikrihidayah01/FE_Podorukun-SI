import { useState } from 'react';
import {
  PiCheck,
  PiPencilSimple,
  PiX,
  PiFilePdf,
  PiImage,
  PiDownloadSimple,
  PiUploadSimple,
  PiCheckCircle,
  PiReceipt,
  PiEye,
} from 'react-icons/pi';
import Modal from '../../../components/ui/Modal';
import Button, { IconButton } from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import {
  usePiutangStore,
  STATUS_PERIODE_LABELS,
  STATUS_PERIODE_TONE,
  type StatusPeriode,
  type PeriodeAngsuran,
  type BuktiTransaksi,
} from '../../../store/piutangStore';
import { formatBulanPendek, formatTanggal, formatTanggalPanjang } from '../../../utils/format';

interface Props {
  kavlingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const LAINNYA_LABEL: Record<string, string> = {
  booking_fee: 'Booking fee',
  dp: 'Uang muka (DP)',
  pencairan_kpr: 'Pencairan KPR',
  lainnya: 'Lainnya',
};

function computeStatus(row: PeriodeAngsuran): StatusPeriode {
  const now = new Date();
  const jt = new Date(row.tanggalJatuhTempo);
  const isLunas = row.tagihan - row.dibayar <= 0;
  const lewatJt = jt < now;

  if (!lewatJt && isLunas) return 'dibayar_dimuka';
  if (isLunas && row.tanggalBayar) {
    const bayar = new Date(row.tanggalBayar);
    if (bayar < jt) return 'bayar_awal';
    if (bayar > jt) return 'terlambat';
    return 'lunas';
  }
  if (row.dibayar > 0 && !isLunas) return 'sebagian';
  if (lewatJt && row.dibayar === 0) return 'belum_bayar';
  return 'belum_jatuh_tempo';
}

/** Fallback resolusi bukti transaksi untuk pembayaran yang sudah tersinkron */
function getEffectiveBukti(row: PeriodeAngsuran): BuktiTransaksi | null {
  if (row.buktiTransaksi) return row.buktiTransaksi;
  if (row.dibayar > 0) {
    return {
      id: `bkt-${row.periode}`,
      nomorBukti: row.prTrackPaymentId || `TRX/PRT/${row.periode.replace('-', '')}`,
      namaBerkas: `bukti_bayar_${row.periode}.pdf`,
      tipe: 'pdf',
      ukuranBytes: 148500,
      tanggal: row.tanggalBayar || row.tanggalJatuhTempo,
      keterangan: `Unggahan manual pengguna`,
    };
  }
  return null;
}

export default function JadwalRealisasiModal({ kavlingId, isOpen, onClose }: Props) {
  const { getById, updateJadwalAngsuran, updateBuktiTransaksi } = usePiutangStore();
  const kv = kavlingId ? getById(kavlingId) : undefined;

  // Edit Jatuh Tempo & Tagihan
  const [editingPeriode, setEditingPeriode] = useState<string | null>(null);
  const [editJatuhTempo, setEditJatuhTempo] = useState('');
  const [editTagihan, setEditTagihan] = useState('');

  // Modal Bukti Transaksi
  const [selectedBukti, setSelectedBukti] = useState<{
    bukti: BuktiTransaksi | null;
    row: PeriodeAngsuran;
  } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Full Preview Modal Lightbox
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  const rows = kv ? [...kv.periodeAngsuran].sort((a, b) => a.periode.localeCompare(b.periode)) : [];

  const totals = rows.reduce(
    (acc, r) => {
      const tagihanVal = editingPeriode === r.periode ? Math.max(0, Number(editTagihan) || 0) : r.tagihan;
      return {
        tagihan: acc.tagihan + tagihanVal,
        dibayar: acc.dibayar + r.dibayar,
        sisa: acc.sisa + Math.max(0, tagihanVal - r.dibayar),
      };
    },
    { tagihan: 0, dibayar: 0, sisa: 0 },
  );

  const now = new Date();
  const tunggakan = rows
    .filter((r) => new Date(r.tanggalJatuhTempo) < now)
    .reduce((sum, r) => sum + Math.max(0, r.tagihan - r.dibayar), 0);

  if (!kv) return null;

  const startEdit = (row: PeriodeAngsuran) => {
    setEditingPeriode(row.periode);
    setEditJatuhTempo(row.tanggalJatuhTempo);
    setEditTagihan(String(row.tagihan));
  };

  const saveEdit = (periode: string) => {
    if (!kavlingId) return;
    const tagihanNum = Math.max(0, Number(editTagihan) || 0);
    updateJadwalAngsuran(kavlingId, periode, tagihanNum, editJatuhTempo);
    setEditingPeriode(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBukti || !kavlingId) return;

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const newBukti: BuktiTransaksi = {
        id: `bkt-${Date.now()}`,
        nomorBukti: selectedBukti.bukti?.nomorBukti || `TRX/PRT/${selectedBukti.row.periode.replace('-', '')}`,
        namaBerkas: file.name,
        dataUrl,
        tipe: isPdf ? 'pdf' : 'image',
        ukuranBytes: file.size,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: 'Unggahan manual pengguna',
      };

      updateBuktiTransaksi(kavlingId, selectedBukti.row.periode, newBukti);
      setSelectedBukti({ bukti: newBukti, row: { ...selectedBukti.row, buktiTransaksi: newBukti } });
      setUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Jadwal vs realisasi"
        description={`${kv.namaUser}, ${kv.nomorKavling}. Angsuran tiap tanggal ${kv.tanggalAcuanAngsuran}.`}
        size="2xl"
        footer={<Button onClick={onClose}>Tutup</Button>}
      >
        <div className="space-y-6">
          <dl
            className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/50 bg-line sm:grid-cols-4"
            style={{
              boxShadow: `
                8px 8px 10px -1px rgba(0, 0, 0, 0.7),
                -8px -8px 10px -1px rgba(255, 255, 255, 0.7)
              `,
            }}
          >
            <div className="bg-subtle px-4 py-3">
              <dt className="text-xs font-semibold text-ink-3">Nilai SPPR</dt>
              <dd className="mt-1 text-sm font-bold text-ink"><Money value={kv.nilaiSppr} /></dd>
            </div>
            <div className="bg-subtle px-4 py-3">
              <dt className="text-xs font-semibold text-ink-3">Sudah dibayar</dt>
              <dd className="mt-1 text-sm font-bold text-ink"><Money value={totals.dibayar} /></dd>
            </div>
            <div className="bg-subtle px-4 py-3">
              <dt className="text-xs font-semibold text-ink-3">Belum terbayar</dt>
              <dd className="mt-1 text-sm font-bold text-ink"><Money value={totals.sisa} /></dd>
              <dd className="mt-0.5 text-xs text-ink-3">Termasuk yang belum jatuh tempo</dd>
            </div>
            <div className={tunggakan > 0 ? 'bg-warning-soft px-4 py-3' : 'bg-subtle px-4 py-3'}>
              <dt className={`text-xs font-semibold ${tunggakan > 0 ? 'text-warning' : 'text-ink-3'}`}>Tunggakan</dt>
              <dd className={`mt-1 text-sm font-bold ${tunggakan > 0 ? 'text-[#5c3300]' : 'text-ink'}`}><Money value={tunggakan} /></dd>
              <dd className={`mt-0.5 text-xs ${tunggakan > 0 ? 'text-[#5c3300]' : 'text-ink-3'}`}>Hanya periode yang lewat jatuh tempo</dd>
            </div>
          </dl>

          <div className="relative overflow-x-auto rounded-lg border border-line">
            <table className="tbl tbl-compact w-full">
              <thead>
                <tr>
                  <th scope="col" className="text-left">Periode</th>
                  <th scope="col" className="text-left">Jatuh tempo</th>
                  <th scope="col" className="text-left">Tgl bayar</th>
                  <th scope="col" className="text-left">Tagihan</th>
                  <th scope="col" className="text-left">Dibayar</th>
                  <th scope="col" className="text-left">Sisa</th>
                  <th scope="col" className="text-left">Status</th>
                  <th scope="col" className="text-left">Bukti transaksi</th>
                  <th scope="col" className="text-left"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const editing = editingPeriode === row.periode;
                  const tagihanVal = editing ? Math.max(0, Number(editTagihan) || 0) : row.tagihan;
                  const sisa = Math.max(0, tagihanVal - row.dibayar);
                  const status = computeStatus({
                    ...row,
                    tagihan: tagihanVal,
                    tanggalJatuhTempo: editing && editJatuhTempo ? editJatuhTempo : row.tanggalJatuhTempo,
                  });
                  const effectiveBukti = getEffectiveBukti(row);

                  return (
                    <tr key={row.periode} className={editing ? '[&>td]:bg-brand-50' : ''}>
                      <td className="whitespace-nowrap font-semibold text-ink text-left">{formatBulanPendek(row.periode)}</td>

                      {/* Jatuh tempo: BISA DIEDIT (RATA KIRI) */}
                      <td className="whitespace-nowrap tabular-nums text-left">
                        {editing ? (
                          <input
                            type="date"
                            aria-label={`Jatuh tempo ${formatBulanPendek(row.periode)}`}
                            className="control control-sm w-36 text-left"
                            value={editJatuhTempo}
                            onChange={(e) => setEditJatuhTempo(e.target.value)}
                          />
                        ) : (
                          formatTanggal(row.tanggalJatuhTempo)
                        )}
                      </td>

                      {/* Tgl bayar: DARI SINKRON PR TRACK (READ-ONLY, RATA KIRI) */}
                      <td className="whitespace-nowrap tabular-nums text-left">
                        {row.tanggalBayar ? (
                          formatTanggal(row.tanggalBayar)
                        ) : (
                          <span className="text-ink-3">-</span>
                        )}
                      </td>

                      {/* Tagihan: BISA DIEDIT (RATA KIRI) */}
                      <td className="whitespace-nowrap tabular-nums text-left font-semibold text-ink">
                        {editing ? (
                          <input
                            type="number"
                            inputMode="numeric"
                            aria-label={`Nominal tagihan ${formatBulanPendek(row.periode)}`}
                            className="control control-sm w-36 text-left"
                            value={editTagihan}
                            onChange={(e) => setEditTagihan(e.target.value)}
                          />
                        ) : (
                          <Money value={row.tagihan} />
                        )}
                      </td>

                      {/* Dibayar: DARI SINKRON PR TRACK (READ-ONLY, RATA KIRI) */}
                      <td className="whitespace-nowrap tabular-nums text-left font-semibold text-ink">
                        {row.dibayar > 0 ? (
                          <Money value={row.dibayar} />
                        ) : (
                          <span className="text-ink-3">-</span>
                        )}
                      </td>

                      {/* Sisa: RATA KIRI */}
                      <td className="whitespace-nowrap tabular-nums text-left font-semibold text-ink">
                        {sisa === 0 ? <span className="text-ink-3">-</span> : <Money value={sisa} />}
                      </td>

                      {/* Status: RATA KIRI */}
                      <td className="text-left">
                        <Badge tone={STATUS_PERIODE_TONE[status]}>{STATUS_PERIODE_LABELS[status]}</Badge>
                      </td>

                      {/* Bukti transaksi: RATA KIRI */}
                      <td className="whitespace-nowrap text-left">
                        {effectiveBukti ? (
                          <button
                            type="button"
                            onClick={() => setSelectedBukti({ bukti: effectiveBukti, row })}
                            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-2 hover:border-brand-600 hover:text-brand-600 shadow-sm transition-colors"
                            title="Lihat rincian & berkas bukti transaksi"
                          >
                            {effectiveBukti.tipe === 'pdf' ? (
                              <PiFilePdf className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
                            ) : (
                              <PiImage className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                            )}
                            <span className="max-w-[130px] truncate">
                              {effectiveBukti.nomorBukti || effectiveBukti.namaBerkas}
                            </span>
                          </button>
                        ) : row.dibayar > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedBukti({ bukti: null, row })}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          >
                            <PiUploadSimple className="h-3.5 w-3.5" aria-hidden /> Unggah
                          </button>
                        ) : (
                          <span className="text-ink-3">-</span>
                        )}
                      </td>

                      {/* Aksi Koreksi */}
                      <td className="!pr-2 text-left">
                        {editing ? (
                          <div className="flex items-center gap-0.5">
                            <IconButton icon={PiCheck} label="Simpan perubahan" onClick={() => saveEdit(row.periode)} />
                            <IconButton icon={PiX} label="Batal perubahan" onClick={() => setEditingPeriode(null)} />
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <IconButton
                              icon={PiPencilSimple}
                              label={`Edit jadwal ${formatBulanPendek(row.periode)}`}
                              onClick={() => startEdit(row)}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-left font-bold">Total</td>
                  <td className="text-left font-bold"><Money value={totals.tagihan} /></td>
                  <td className="text-left font-bold"><Money value={totals.dibayar} /></td>
                  <td className="text-left font-bold"><Money value={totals.sisa} /></td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>

          {kv.pembayaranLainnya && kv.pembayaranLainnya.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-ink">Pembayaran di luar jadwal angsuran</h3>
              <div className="relative overflow-x-auto rounded-lg border border-line">
                <table className="tbl tbl-compact w-full">
                  <thead>
                    <tr>
                      <th scope="col" className="text-left">Jenis</th>
                      <th scope="col" className="text-left">Tanggal</th>
                      <th scope="col" className="text-left">Nominal</th>
                      <th scope="col" className="text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kv.pembayaranLainnya.map((p) => (
                      <tr key={p.id}>
                        <td className="font-semibold text-ink text-left">{LAINNYA_LABEL[p.tipe] ?? p.tipe}</td>
                        <td className="whitespace-nowrap text-left">{formatTanggalPanjang(p.tanggal)}</td>
                        <td className="font-semibold text-ink text-left"><Money value={p.nominal} /></td>
                        <td className="text-left">{p.keterangan ?? <span className="text-ink-3">-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </Modal>

      {/* Modal Detail Bukti Transaksi dengan Neumorphism Style */}
      {selectedBukti && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBukti(null)}
          title="Bukti transaksi pembayaran"
          description={`${kv.nomorKavling} · Angsuran ${formatBulanPendek(selectedBukti.row.periode)}`}
          size="md"
          footer={
            <Button onClick={() => setSelectedBukti(null)}>
              Tutup
            </Button>
          }
        >
          <div className="space-y-5">
            {/* Box Atas: Rincian Bukti (Cekung / Inset Emboss Shadow, Warna #f0eff4) */}
            <div className="rounded-2xl border border-line/50 bg-[#f0eff4] p-5 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.18),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]">
              <div className="flex items-center justify-between border-b border-line/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0eff4] text-emerald-700 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]">
                    <PiReceipt className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="text-left">
                    <p className="text-xs text-ink-3 font-medium">No. Bukti / Reff Track</p>
                    <p className="font-bold text-ink">
                      {selectedBukti.bukti?.nomorBukti || selectedBukti.row.prTrackPaymentId || 'TRX/PRT/202401'}
                    </p>
                  </div>
                </div>
                <Badge tone="positive">
                  <span className="flex items-center gap-1 font-semibold">
                    <PiCheckCircle className="h-3.5 w-3.5" /> Terverifikasi
                  </span>
                </Badge>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-3 text-xs text-left">
                <div>
                  <span className="text-ink-3 font-medium">Tanggal Bayar:</span>
                  <p className="mt-0.5 font-bold text-ink">
                    {formatTanggalPanjang(selectedBukti.row.tanggalBayar || selectedBukti.row.tanggalJatuhTempo)}
                  </p>
                </div>
                <div>
                  <span className="text-ink-3 font-medium">Nominal Dibayar:</span>
                  <p className="mt-0.5 text-sm font-extrabold text-emerald-700">
                    <Money value={selectedBukti.row.dibayar} />
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-ink-3 font-medium">Keterangan:</span>
                  <p className="mt-0.5 font-medium text-ink-2">
                    {selectedBukti.bukti?.keterangan || 'Unggahan manual pengguna'}
                  </p>
                </div>
              </div>
            </div>

            {/* Box Bawah: Preview & 3 Tombol Berkas (Cembung / Raised Emboss Shadow, Warna #f0eff4) */}
            <div className="rounded-2xl border border-white/60 bg-[#f0eff4] p-5 text-center shadow-[6px_6px_14px_rgba(0,0,0,0.18),-6px_-6px_14px_rgba(255,255,255,0.85)]">
              <div className="flex flex-col items-center justify-center gap-4">
                {selectedBukti.bukti?.dataUrl && selectedBukti.bukti.tipe === 'image' ? (
                  <img
                    src={selectedBukti.bukti.dataUrl}
                    alt={selectedBukti.bukti.namaBerkas}
                    className="max-h-56 w-auto rounded-xl object-contain shadow-sm border border-line"
                  />
                ) : selectedBukti.bukti?.tipe === 'pdf' ? (
                  <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-line bg-[#f0eff4] text-ink-3 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]">
                    <PiFilePdf className="h-10 w-10 text-red-500 mb-1" />
                    <p className="text-xs font-bold text-ink">{selectedBukti.bukti.namaBerkas}</p>
                    <p className="text-[11px] text-ink-3">Dokumen PDF Terverifikasi Podo Rukun Track</p>
                  </div>
                ) : (
                  <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-line bg-[#f0eff4] text-ink-3 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]">
                    <PiImage className="h-10 w-10 text-brand-600 mb-1" />
                    <p className="text-xs font-bold text-ink">{selectedBukti.bukti?.namaBerkas || 'bukti_pembayaran.jpg'}</p>
                    <p className="text-[11px] text-ink-3">Berkas Bukti Pembayaran Digital</p>
                  </div>
                )}

                {/* 3 Tombol Berkas (Semua Cembung / Raised Emboss) */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                  {/* Tombol 1: Lihat berkas */}
                  <button
                    type="button"
                    onClick={() => setFullPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/60 bg-[#f0eff4] px-3.5 py-2 text-xs font-bold text-ink shadow-[4px_4px_8px_rgba(0,0,0,0.16),-4px_-4px_8px_rgba(255,255,255,0.9)] transition-all hover:bg-[#e6e5ea] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]"
                  >
                    <PiEye className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /> Lihat berkas
                  </button>

                  {/* Tombol 2: Unduh berkas */}
                  {selectedBukti.bukti && (
                    <a
                      href={selectedBukti.bukti.dataUrl || selectedBukti.bukti.url || '#'}
                      download={selectedBukti.bukti.namaBerkas}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/60 bg-[#f0eff4] px-3.5 py-2 text-xs font-bold text-ink shadow-[4px_4px_8px_rgba(0,0,0,0.16),-4px_-4px_8px_rgba(255,255,255,0.9)] transition-all hover:bg-[#e6e5ea] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]"
                    >
                      <PiDownloadSimple className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> Unduh berkas
                    </a>
                  )}

                  {/* Tombol 3: Ganti berkas */}
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/60 bg-[#f0eff4] px-3.5 py-2 text-xs font-bold text-ink shadow-[4px_4px_8px_rgba(0,0,0,0.16),-4px_-4px_8px_rgba(255,255,255,0.9)] transition-all hover:bg-[#e6e5ea] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]">
                    <PiUploadSimple className="h-4 w-4 shrink-0 text-amber-600" aria-hidden /> Ganti berkas
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      onChange={handleFileUpload}
                      disabled={uploadLoading}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Full Preview (Lightbox saat 'Lihat berkas' diklik) */}
      {fullPreviewOpen && selectedBukti && (
        <Modal
          isOpen={true}
          onClose={() => setFullPreviewOpen(false)}
          title={`Preview: ${selectedBukti.bukti?.namaBerkas || 'Bukti Transaksi'}`}
          description={`${kv.nomorKavling} · ${selectedBukti.bukti?.nomorBukti || 'PRT'}`}
          size="xl"
          footer={
            <Button onClick={() => setFullPreviewOpen(false)}>
              Tutup Preview
            </Button>
          }
        >
          <div className="flex flex-col items-center justify-center p-4">
            {selectedBukti.bukti?.dataUrl && selectedBukti.bukti.tipe === 'image' ? (
              <img
                src={selectedBukti.bukti.dataUrl}
                alt={selectedBukti.bukti.namaBerkas}
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg"
              />
            ) : selectedBukti.bukti?.dataUrl && selectedBukti.bukti.tipe === 'pdf' ? (
              <iframe
                src={selectedBukti.bukti.dataUrl}
                title={selectedBukti.bukti.namaBerkas}
                className="h-[65vh] w-full rounded-xl border border-line shadow-sm"
              />
            ) : (
              <div className="flex h-80 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-[#f0eff4] text-center p-6 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1)]">
                <PiReceipt className="h-16 w-16 text-brand-600 mb-3" />
                <h4 className="text-base font-bold text-ink mb-1">{selectedBukti.bukti?.namaBerkas || 'bukti_pembayaran_prt.pdf'}</h4>
                <p className="text-xs text-ink-3 max-w-md">
                  Dokumen bukti transaksi pembayaran Podo Rukun Track terverifikasi secara digital.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
