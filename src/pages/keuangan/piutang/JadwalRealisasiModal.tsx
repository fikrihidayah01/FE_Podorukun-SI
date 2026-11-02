import { useState } from 'react';
import {
  PiCheck,
  PiPencilSimple,
  PiX,
  PiFilePdf,
  PiImage,
  PiDownloadSimple,
  PiReceipt,
  PiEye,
  PiArrowsClockwise,
} from 'react-icons/pi';
import Modal from '../../../components/ui/Modal';
import Button, { IconButton } from '../../../components/ui/Button';
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
import { formatBulanPendek, formatTanggal, formatTanggalPanjang, formatRupiah, hariIni } from '../../../utils/format';

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

// Bandingkan per tanggal kalender (YYYY-MM-DD), bukan timestamp: hari jatuh tempo belum terhitung terlambat.
const tgl = (iso: string) => iso.slice(0, 10);
const lewatJatuhTempo = (jatuhTempo: string, hari = hariIni()) => tgl(jatuhTempo) < hari;
const rowKey = (row: PeriodeAngsuran) => row.id || row.jadwalId || row.periode;

function computeStatus(row: PeriodeAngsuran): StatusPeriode {
  const jt = tgl(row.tanggalJatuhTempo);
  const isLunas = row.tagihan - row.dibayar <= 0;
  const lewatJt = lewatJatuhTempo(jt);

  if (!lewatJt && isLunas) return 'dibayar_dimuka';
  if (isLunas && row.tanggalBayar) {
    const bayar = tgl(row.tanggalBayar);
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
  const { getById, pindahAlokasi, updateJadwalAngsuran } = usePiutangStore();
  // Edit Jatuh Tempo & Tagihan
  const [editingPeriode, setEditingPeriode] = useState<string | null>(null);
  const [editJatuhTempo, setEditJatuhTempo] = useState('');
  const [editTagihan, setEditTagihan] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
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
    (acc, r) => {
      const tagihanVal = editingPeriode === rowKey(r) ? Math.max(0, Number(editTagihan) || 0) : r.tagihan;
      return {
        tagihan: acc.tagihan + tagihanVal,
        dibayar: acc.dibayar + r.dibayar,
        sisa: acc.sisa + Math.max(0, tagihanVal - r.dibayar),
      };
    },
    { tagihan: 0, dibayar: 0, sisa: 0 },
  );

  const tunggakan = rows
    .filter((r) => {
      const jtStr = editingPeriode === rowKey(r) && editJatuhTempo ? editJatuhTempo : r.tanggalJatuhTempo;
      return lewatJatuhTempo(jtStr);
    })
    .reduce((sum, r) => {
      const tagihanVal = editingPeriode === rowKey(r) ? Math.max(0, Number(editTagihan) || 0) : r.tagihan;
      return sum + Math.max(0, tagihanVal - r.dibayar);
    }, 0);

  if (!kv) return null;

  const startEdit = (row: PeriodeAngsuran) => {
    setEditError('');
    setEditingPeriode(rowKey(row));
    setEditJatuhTempo(tgl(row.tanggalJatuhTempo));
    setEditTagihan(String(row.tagihan));
  };

  const saveEdit = async (periode: string, jadwalId?: string) => {
    if (!kavlingId) return;
    setSavingEdit(true);
    try {
      const tagihanNum = Math.max(0, Number(editTagihan) || 0);
      await updateJadwalAngsuran(kavlingId, periode, tagihanNum, editJatuhTempo, jadwalId);
      setEditingPeriode(null);
      setEditError('');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal angsuran');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePindahAlokasi = async () => {
    if (!pindahValid) return;
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

  const buktiSrc = selectedBukti?.bukti?.url || selectedBukti?.bukti?.dataUrl || '';

  const asalPindah = rows.find((r) => rowKey(r) === dariJadwal);
  const nominalPindahNum = Number(nominalPindah);
  const pindahMelebihi = Boolean(asalPindah) && nominalPindahNum > (asalPindah?.dibayar ?? 0);
  const pindahValid =
    Boolean(dariJadwal && keJadwal) && dariJadwal !== keJadwal && nominalPindahNum > 0 && !pindahMelebihi;

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
                  setDariJadwal(rowKey(firstPaid));
                  setKeJadwal('');
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
          {editError && (
            <Notice tone="danger" title="Jadwal belum tersimpan">
              {editError}
            </Notice>
          )}
          <Notice tone="info">
            Jadwal dan nominal tagihan angsuran dibentuk resmi dari Dokumen Legal SPPR. Realisasi pembayaran disinkronkan otomatis dari Podo Rukun Track.
          </Notice>

          <dl
            className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-sm sm:grid-cols-4"
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
                  <th scope="col" className="w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const editing = editingPeriode === rowKey(row);
                  const tagihanVal = editing ? Math.max(0, Number(editTagihan) || 0) : row.tagihan;
                  const sisa = Math.max(0, tagihanVal - row.dibayar);
                  const status = computeStatus({
                    ...row,
                    tagihan: tagihanVal,
                    tanggalJatuhTempo: editing && editJatuhTempo ? editJatuhTempo : row.tanggalJatuhTempo,
                  });
                  const effectiveBukti = getEffectiveBukti(row);

                  return (
                    <tr key={rowKey(row)} className={editing ? '[&>td]:bg-brand-50/40' : undefined}>
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

                      {/* Tgl bayar: Dari sinkron PR Track (Read-only) */}
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

                      {/* Aksi */}
                      <td className="!pr-2 text-center whitespace-nowrap">
                        {editing ? (
                          <div className="flex items-center justify-center gap-1">
                            <IconButton
                              icon={PiCheck}
                              label="Simpan perubahan"
                              disabled={savingEdit}
                              onClick={() => void saveEdit(row.periode, row.jadwalId || row.id)}
                              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            />
                            <IconButton
                              icon={PiX}
                              label="Batal perubahan"
                              disabled={savingEdit}
                              onClick={() => {
                                setEditingPeriode(null);
                                setEditError('');
                              }}
                              tone="danger"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <IconButton
                              icon={PiPencilSimple}
                              label={`Edit jadwal ${formatBulanPendek(row.periode)}`}
                              disabled={editingPeriode !== null}
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
                disabled={!pindahValid}
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
                  const selectedRow = rows.find((r) => rowKey(r) === val);
                  if (selectedRow) setNominalPindah(String(selectedRow.dibayar));
                  if (keJadwal === val) setKeJadwal('');
                }}
              >
                <option value="">-- Pilih Periode Asal --</option>
                {rows
                  .filter((r) => r.dibayar > 0)
                  .map((r) => (
                    <option key={rowKey(r)} value={rowKey(r)}>
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
                  .filter((r) => rowKey(r) !== dariJadwal)
                  .map((r) => (
                    <option key={rowKey(r)} value={rowKey(r)}>
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
              {pindahMelebihi && (
                <p className="mt-1 text-xs font-medium text-danger">
                  Melebihi pembayaran di periode asal ({formatRupiah(asalPindah?.dibayar ?? 0)}).
                </p>
              )}
            </div>

            <p className="text-xs text-ink-3">
              Perpindahan alokasi akan dikirim langsung ke backend API dan dicatat secara akuntabel dalam riwayat alokasi piutang.
            </p>
          </div>
        </Modal>
      )}

      {/* Modal Detail Bukti Transaksi */}
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
            <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-line pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <PiReceipt className="h-5 w-5" aria-hidden />
                </span>
                <div className="text-left">
                  <p className="text-xs font-medium text-ink-3">No. bukti / ref PR Track</p>
                  <p className="font-bold text-ink">
                    {selectedBukti.bukti?.nomorBukti || selectedBukti.row.prTrackPaymentId || <span className="text-ink-3">-</span>}
                  </p>
                </div>
              </div>

              <dl className="mt-3.5 grid grid-cols-2 gap-3 text-left text-xs">
                <div>
                  <dt className="font-medium text-ink-3">Tanggal bayar</dt>
                  <dd className="mt-0.5 font-bold text-ink">
                    {selectedBukti.row.tanggalBayar ? formatTanggalPanjang(selectedBukti.row.tanggalBayar) : <span className="text-ink-3">-</span>}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink-3">Nominal dibayar</dt>
                  <dd className="mt-0.5 text-sm font-extrabold text-emerald-700">
                    <Money value={selectedBukti.row.dibayar} />
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-medium text-ink-3">Keterangan</dt>
                  <dd className="mt-0.5 font-medium text-ink-2">{selectedBukti.bukti?.keterangan || <span className="text-ink-3">-</span>}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-sm">
              {buktiSrc ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  {selectedBukti.bukti?.tipe === 'image' ? (
                    <img
                      src={buktiSrc}
                      alt={selectedBukti.bukti.namaBerkas}
                      className="max-h-56 w-auto rounded-xl border border-line object-contain shadow-sm"
                    />
                  ) : (
                    <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-line bg-subtle/50 text-ink-3">
                      <PiFilePdf className="mb-1 h-10 w-10 text-red-500" aria-hidden />
                      <p className="text-xs font-bold text-ink">{selectedBukti.bukti?.namaBerkas}</p>
                    </div>
                  )}

                  <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFullPreviewOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-neutral-soft active:bg-neutral-soft/80"
                    >
                      <PiEye className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /> Lihat berkas
                    </button>
                    <a
                      href={buktiSrc}
                      download={selectedBukti.bukti?.namaBerkas}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-neutral-soft active:bg-neutral-soft/80"
                    >
                      <PiDownloadSimple className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> Unduh berkas
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-line bg-subtle/50 text-ink-3">
                  <PiImage className="mb-1 h-10 w-10" aria-hidden />
                  <p className="text-xs font-semibold text-ink-2">Berkas bukti tidak tersedia</p>
                  <p className="text-[11px]">PR Track belum mengirim berkas untuk pembayaran ini.</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {fullPreviewOpen && selectedBukti && buktiSrc && (
        <Modal
          isOpen={true}
          onClose={() => setFullPreviewOpen(false)}
          title={selectedBukti.bukti?.namaBerkas || 'Bukti transaksi'}
          description={`${kv.nomorKavling}${selectedBukti.bukti?.nomorBukti ? ` · ${selectedBukti.bukti.nomorBukti}` : ''}`}
          size="xl"
          footer={<Button onClick={() => setFullPreviewOpen(false)}>Tutup</Button>}
        >
          <div className="flex flex-col items-center justify-center p-4">
            {selectedBukti.bukti?.tipe === 'image' ? (
              <img src={buktiSrc} alt={selectedBukti.bukti.namaBerkas} className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg" />
            ) : (
              <iframe src={buktiSrc} title={selectedBukti.bukti?.namaBerkas || 'Bukti transaksi'} className="h-[65vh] w-full rounded-xl border border-line shadow-sm" />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
