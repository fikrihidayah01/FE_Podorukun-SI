import { useState } from 'react';
import {
  PiFilePdf,
  PiImage,
  PiDownloadSimple,
  PiCheckCircle,
  PiReceipt,
  PiEye,
  PiArrowsClockwise,
} from 'react-icons/pi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import {
  usePiutangStore,
  STATUS_PERIODE_LABELS,
  STATUS_PERIODE_TONE,
  type StatusPeriode,
  type PeriodeAngsuran,
  type BuktiTransaksi,
} from '../../../store/piutangStore';
import { formatBulanPendek, formatTanggal, formatTanggalPanjang, formatRupiah } from '../../../utils/format';

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
  return null;
}

export default function JadwalRealisasiModal({ kavlingId, isOpen, onClose }: Props) {
  const { getById, pindahAlokasi } = usePiutangStore();
  const kv = kavlingId ? getById(kavlingId) : undefined;

  // Modal Bukti Transaksi
  const [selectedBukti, setSelectedBukti] = useState<{
    bukti: BuktiTransaksi | null;
    row: PeriodeAngsuran;
  } | null>(null);

  // Full Preview Modal Lightbox
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  // Koreksi / Pindah Alokasi Modal
  const [pindahModalOpen, setPindahModalOpen] = useState(false);
  const [dariJadwal, setDariJadwal] = useState('');
  const [keJadwal, setKeJadwal] = useState('');
  const [nominalPindah, setNominalPindah] = useState('');
  const [pindahLoading, setPindahLoading] = useState(false);
  const [pindahError, setPindahError] = useState<string | null>(null);

  const rows = kv ? [...kv.periodeAngsuran].sort((a, b) => a.periode.localeCompare(b.periode)) : [];

  const totals = rows.reduce(
    (acc, r) => ({
      tagihan: acc.tagihan + r.tagihan,
      dibayar: acc.dibayar + r.dibayar,
      sisa: acc.sisa + Math.max(0, r.tagihan - r.dibayar),
    }),
    { tagihan: 0, dibayar: 0, sisa: 0 },
  );

  const now = new Date();
  const tunggakan = rows
    .filter((r) => new Date(r.tanggalJatuhTempo) < now)
    .reduce((sum, r) => sum + Math.max(0, r.tagihan - r.dibayar), 0);

  if (!kv) return null;

  const handlePindahAlokasi = async () => {
    if (!dariJadwal || !keJadwal || !nominalPindah || Number(nominalPindah) <= 0) return;
    setPindahLoading(true);
    setPindahError(null);
    try {
      await pindahAlokasi(kv.id, dariJadwal, keJadwal, Number(nominalPindah));
      setPindahModalOpen(false);
      setDariJadwal('');
      setKeJadwal('');
      setNominalPindah('');
    } catch (err: any) {
      setPindahError(err.message || 'Gagal memindahkan alokasi pembayaran');
    } finally {
      setPindahLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Jadwal vs realisasi"
        description={`${kv.namaUser}, ${kv.nomorKavling}. Angsuran tiap tanggal ${kv.tanggalAcuanAngsuran}.`}
        size="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              icon={PiArrowsClockwise}
              disabled={rows.filter((r) => r.dibayar > 0).length === 0}
              onClick={() => {
                setPindahModalOpen(true);
                setPindahError(null);
                const firstPaid = rows.find((r) => r.dibayar > 0);
                if (firstPaid) {
                  setDariJadwal(firstPaid.id || firstPaid.periode);
                  setNominalPindah(String(firstPaid.dibayar));
                }
              }}
            >
              Koreksi / Pindah Alokasi
            </Button>
            <Button onClick={onClose}>Tutup</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <Notice tone="info">
            Jadwal dan nominal tagihan angsuran dibentuk resmi dari Dokumen Legal SPPR. Realisasi pembayaran disinkronkan otomatis dari Podo Rukun Track.
          </Notice>

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
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sisa = Math.max(0, row.tagihan - row.dibayar);
                  const status = computeStatus(row);
                  const effectiveBukti = getEffectiveBukti(row);

                  return (
                    <tr key={row.periode}>
                      <td className="whitespace-nowrap font-semibold text-ink text-left">{formatBulanPendek(row.periode)}</td>

                      {/* Jatuh tempo: Resmi dari SPPR (Read-only) */}
                      <td className="whitespace-nowrap tabular-nums text-left">
                        {formatTanggal(row.tanggalJatuhTempo)}
                      </td>

                      {/* Tgl bayar: Dari sinkron PR Track (Read-only) */}
                      <td className="whitespace-nowrap tabular-nums text-left">
                        {row.tanggalBayar ? (
                          formatTanggal(row.tanggalBayar)
                        ) : (
                          <span className="text-ink-3">-</span>
                        )}
                      </td>

                      {/* Tagihan: Resmi dari SPPR (Read-only) */}
                      <td className="whitespace-nowrap tabular-nums text-left font-semibold text-ink">
                        <Money value={row.tagihan} />
                      </td>

                      {/* Dibayar: Dari sinkron PR Track (Read-only) */}
                      <td className="whitespace-nowrap tabular-nums text-left font-semibold text-ink">
                        {row.dibayar > 0 ? (
                          <Money value={row.dibayar} />
                        ) : (
                          <span className="text-ink-3">-</span>
                        )}
                      </td>

                      {/* Sisa */}
                      <td className="whitespace-nowrap tabular-nums text-left font-semibold text-ink">
                        {sisa === 0 ? <span className="text-ink-3">-</span> : <Money value={sisa} />}
                      </td>

                      {/* Status */}
                      <td className="text-left">
                        <Badge tone={STATUS_PERIODE_TONE[status]}>{STATUS_PERIODE_LABELS[status]}</Badge>
                      </td>

                      {/* Bukti transaksi */}
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
                        ) : (
                          <span className="text-ink-3">-</span>
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
                  <td colSpan={2} />
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

      {/* Modal Koreksi / Pindah Alokasi Pembayaran */}
      {pindahModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setPindahModalOpen(false)}
          title="Koreksi / Pindah Alokasi Pembayaran"
          description={`Pindahkan alokasi penerimaan pembayaran antar periode tagihan untuk kavling ${kv.nomorKavling}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setPindahModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                loading={pindahLoading}
                disabled={!dariJadwal || !keJadwal || !nominalPindah || Number(nominalPindah) <= 0}
                onClick={handlePindahAlokasi}
              >
                Simpan Alokasi
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-left">
            {pindahError && (
              <Notice tone="danger" title="Gagal Memindahkan Alokasi">
                {pindahError}
              </Notice>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1">
                Periode Asal Pembayaran <span className="text-red-500">*</span>
              </label>
              <select
                className="control w-full text-sm"
                value={dariJadwal}
                onChange={(e) => {
                  const val = e.target.value;
                  setDariJadwal(val);
                  const selectedRow = rows.find((r) => (r.id || r.periode) === val);
                  if (selectedRow) setNominalPindah(String(selectedRow.dibayar));
                }}
              >
                <option value="">-- Pilih Periode Asal --</option>
                {rows
                  .filter((r) => r.dibayar > 0)
                  .map((r) => (
                    <option key={r.id || r.periode} value={r.id || r.periode}>
                      {formatBulanPendek(r.periode)} (Dibayar: {formatRupiah(r.dibayar)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1">
                Periode Tujuan Pembayaran <span className="text-red-500">*</span>
              </label>
              <select
                className="control w-full text-sm"
                value={keJadwal}
                onChange={(e) => setKeJadwal(e.target.value)}
              >
                <option value="">-- Pilih Periode Tujuan --</option>
                {rows
                  .filter((r) => (r.id || r.periode) !== dariJadwal)
                  .map((r) => (
                    <option key={r.id || r.periode} value={r.id || r.periode}>
                      {formatBulanPendek(r.periode)} (Tagihan: {formatRupiah(r.tagihan)}, Sisa: {formatRupiah(Math.max(0, r.tagihan - r.dibayar))})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1">
                Nominal Dipindahkan (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="control w-full text-sm"
                value={nominalPindah}
                onChange={(e) => setNominalPindah(e.target.value)}
                placeholder="Contoh: 1500000"
              />
            </div>

            <p className="text-xs text-ink-3">
              Perpindahan alokasi akan dikirim langsung ke backend API dan dicatat secara akuntabel dalam riwayat alokasi piutang.
            </p>
          </div>
        </Modal>
      )}

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
                    {selectedBukti.bukti?.keterangan || 'Tersinkronisasi dari Podo Rukun Track'}
                  </p>
                </div>
              </div>
            </div>

            {/* Box Bawah: Preview & Tombol Berkas */}
            <div className="rounded-2xl border border-white/60 bg-[#f0eff4] p-5 text-center shadow-[6px_6px_14px_rgba(0,0,0,0.18),-6px_-6px_14px_rgba(255,255,255,0.85)]">
              <div className="flex flex-col items-center justify-center gap-4">
                {(selectedBukti.bukti?.url || selectedBukti.bukti?.dataUrl) && selectedBukti.bukti.tipe === 'image' ? (
                  <img
                    src={selectedBukti.bukti.url || selectedBukti.bukti.dataUrl}
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

                <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setFullPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/60 bg-[#f0eff4] px-3.5 py-2 text-xs font-bold text-ink shadow-[4px_4px_8px_rgba(0,0,0,0.16),-4px_-4px_8px_rgba(255,255,255,0.9)] transition-all hover:bg-[#e6e5ea] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]"
                  >
                    <PiEye className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /> Lihat berkas
                  </button>

                  {selectedBukti.bukti && (selectedBukti.bukti.url || selectedBukti.bukti.dataUrl) && (
                    <a
                      href={selectedBukti.bukti.url || selectedBukti.bukti.dataUrl}
                      download={selectedBukti.bukti.namaBerkas}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/60 bg-[#f0eff4] px-3.5 py-2 text-xs font-bold text-ink shadow-[4px_4px_8px_rgba(0,0,0,0.16),-4px_-4px_8px_rgba(255,255,255,0.9)] transition-all hover:bg-[#e6e5ea] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]"
                    >
                      <PiDownloadSimple className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> Unduh berkas
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Full Preview */}
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
            {(selectedBukti.bukti?.url || selectedBukti.bukti?.dataUrl) && selectedBukti.bukti.tipe === 'image' ? (
              <img
                src={selectedBukti.bukti.url || selectedBukti.bukti.dataUrl}
                alt={selectedBukti.bukti.namaBerkas}
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg"
              />
            ) : (selectedBukti.bukti?.url || selectedBukti.bukti?.dataUrl) && selectedBukti.bukti.tipe === 'pdf' ? (
              <iframe
                src={selectedBukti.bukti.url || selectedBukti.bukti.dataUrl}
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
