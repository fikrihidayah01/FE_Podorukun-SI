import { useState, useMemo } from 'react';
import Modal from '../../../components/ui/Modal';
import {
  usePiutangStore,
  STATUS_PERIODE_LABELS,
  STATUS_PERIODE_COLOR,
  type StatusPeriode,
  type PeriodeAngsuran,
} from '../../../store/piutangStore';
import { MdErrorOutline, MdEdit, MdCheck, MdClose } from 'react-icons/md';

// ── Props ─────────────────────────────────────────────────────

interface Props {
  kavlingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
}

function fmtDateFull(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function fmtPeriode(periode: string): string {
  const [y, m] = periode.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[Number(m) - 1]} ${y}`;
}

// ── Status Computation ────────────────────────────────────────

function computeStatus(row: PeriodeAngsuran): StatusPeriode {
  const now = new Date();
  const jt = new Date(row.tanggalJatuhTempo);
  const sisa = row.tagihan - row.dibayar;
  const isLunas = sisa <= 0;
  const isPassed = jt < now;

  // Lunas sebelum jatuh tempo dan periode belum tiba
  if (!isPassed && isLunas) {
    return 'dibayar_dimuka';
  }

  // Jika sudah lunas
  if (isLunas && row.tanggalBayar) {
    const bayar = new Date(row.tanggalBayar);
    if (bayar < jt) return 'bayar_awal';
    if (bayar > jt) return 'terlambat';
    return 'lunas';
  }

  // Jika ada pembayaran sebagian
  if (row.dibayar > 0 && sisa > 0) {
    return 'sebagian';
  }

  // Jika belum bayar dan sudah lewat JT
  if (isPassed && row.dibayar === 0) {
    return 'belum_bayar';
  }

  return 'belum_jatuh_tempo';
}

// ── Component ─────────────────────────────────────────────────

export default function JadwalRealisasiModal({ kavlingId, isOpen, onClose }: Props) {
  const { getById, updateAlokasi } = usePiutangStore();
  const kv = kavlingId ? getById(kavlingId) : undefined;

  // Manual allocation edit state
  const [editingPeriode, setEditingPeriode] = useState<string | null>(null);
  const [editDibayar, setEditDibayar] = useState<string>('');
  const [editTglBayar, setEditTglBayar] = useState<string>('');

  const rows = useMemo(() => {
    if (!kv) return [];
    return [...kv.periodeAngsuran].sort((a, b) => a.periode.localeCompare(b.periode));
  }, [kv]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        tagihan: acc.tagihan + r.tagihan,
        dibayar: acc.dibayar + r.dibayar,
        sisa: acc.sisa + Math.max(0, r.tagihan - r.dibayar),
      }),
      { tagihan: 0, dibayar: 0, sisa: 0 }
    );
  }, [rows]);

  const tunggakan = useMemo(() => {
    const now = new Date();
    return rows
      .filter((r) => new Date(r.tanggalJatuhTempo) < now)
      .reduce((sum, r) => sum + Math.max(0, r.tagihan - r.dibayar), 0);
  }, [rows]);

  if (!kv) {
    return null;
  }

  const handleStartEdit = (row: PeriodeAngsuran) => {
    setEditingPeriode(row.periode);
    setEditDibayar(String(row.dibayar));
    setEditTglBayar(row.tanggalBayar ?? '');
  };

  const handleSaveEdit = (periode: string) => {
    if (!kavlingId) return;
    const dibayarNum = Number(editDibayar) || 0;
    updateAlokasi(kavlingId, periode, dibayarNum, editTglBayar || null);
    setEditingPeriode(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Jadwal vs realisasi"
      size="xl"
      footer={
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Tutup
        </button>
      }
    >
      <div className="space-y-6">
        {/* Subtitle */}
        <div>
          <p className="text-sm font-medium text-gray-800">
            {kv.nomorKavling} · angsuran tiap tanggal {kv.tanggalAcuanAngsuran}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            User: <span className="font-semibold text-gray-700">{kv.namaUser}</span> (SPPR: {formatRupiah(kv.nilaiSppr)})
          </p>
        </div>

        {/* ── Table Jadwal vs Realisasi ────────────────────────── */}
        <div className="overflow-x-auto rounded-xl border border-gray-200/70 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Periode
                </th>
                <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Jatuh tempo
                </th>
                <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tgl bayar
                </th>
                <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tagihan
                </th>
                <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Dibayar
                </th>
                <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Sisa
                </th>
                <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row) => {
                const sisa = Math.max(0, row.tagihan - row.dibayar);
                const status = computeStatus(row);
                const isEditing = editingPeriode === row.periode;

                return (
                  <tr key={row.periode} className="hover:bg-gray-50 transition-colors">
                    {/* Periode */}
                    <td className="px-3.5 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {fmtPeriode(row.periode)}
                    </td>

                    {/* Jatuh Tempo */}
                    <td className="px-3.5 py-3 text-gray-600 whitespace-nowrap">
                      {fmtDateShort(row.tanggalJatuhTempo)}
                    </td>

                    {/* Tgl Bayar */}
                    <td className="px-3.5 py-3 text-gray-600 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editTglBayar}
                          onChange={(e) => setEditTglBayar(e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      ) : row.tanggalBayar ? (
                        fmtDateShort(row.tanggalBayar)
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Tagihan */}
                    <td className="px-3.5 py-3 text-left text-gray-800">
                      {formatRupiah(row.tagihan)}
                    </td>

                    {/* Dibayar */}
                    <td className="px-3.5 py-3 text-left text-gray-800">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editDibayar}
                          onChange={(e) => setEditDibayar(e.target.value)}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-xs text-left"
                        />
                      ) : row.dibayar > 0 ? (
                        formatRupiah(row.dibayar)
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Sisa */}
                    <td className="px-3.5 py-3 text-left font-medium">
                      {sisa === 0 ? (
                        <span className="text-emerald-600 font-bold">Rp 0</span>
                      ) : (
                        <span className="text-gray-800">{formatRupiah(sisa)}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span
                        className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-medium ${STATUS_PERIODE_COLOR[status]}`}
                      >
                        {STATUS_PERIODE_LABELS[status]}
                      </span>
                    </td>

                    {/* Aksi Koreksi Manual */}
                    <td className="px-2 py-3 text-left">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(row.periode)}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            title="Simpan koreksi"
                          >
                            <MdCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingPeriode(null)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100"
                            title="Batal"
                          >
                            <MdClose className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(row)}
                          className="rounded p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Koreksi alokasi manual"
                        >
                          <MdEdit className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row */}
            <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold text-gray-900">
              <tr>
                <td className="px-3.5 py-3 text-left">Total</td>
                <td colSpan={2} className="px-3.5 py-3"></td>
                <td className="px-3.5 py-3 text-left">
                  {formatRupiah(totals.tagihan)}
                </td>
                <td className="px-3.5 py-3 text-left text-emerald-700">
                  {formatRupiah(totals.dibayar)}
                </td>
                <td className="px-3.5 py-3 text-left">
                  {formatRupiah(totals.sisa)}
                </td>
                <td colSpan={2} className="px-3.5 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── 3 Summary Cards Below Table ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total sudah dibayar</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {formatRupiah(totals.dibayar)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total belum terbayar</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {formatRupiah(totals.sisa)}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-xs text-amber-700 font-medium">Tunggakan jatuh tempo</p>
            <p className="text-lg font-bold text-amber-900 mt-1">
              {formatRupiah(tunggakan)}
            </p>
          </div>
        </div>

        {/* Explanatory note */}
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <MdErrorOutline className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
          <p>
            <strong>Keterangan:</strong> Tunggakan jatuh tempo adalah sisa dari periode yang sudah lewat jatuh tempo saja, sedangkan Total belum terbayar mencakup seluruh sisa termasuk yang belum jatuh tempo.
          </p>
        </div>

        {/* ── Pembayaran di Luar Jadwal Angsuran (Booking Fee, DP) */}
        {kv.pembayaranLainnya && kv.pembayaranLainnya.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">
              Pembayaran di Luar Jadwal Angsuran
            </h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Jenis</th>
                    <th className="px-3 py-2 text-left text-gray-500">Tanggal</th>
                    <th className="px-3 py-2 text-left text-gray-500">Nominal</th>
                    <th className="px-3 py-2 text-left text-gray-500">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {kv.pembayaranLainnya.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 font-medium capitalize text-gray-800">
                        {p.tipe.replace('_', ' ')}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{fmtDateFull(p.tanggal)}</td>
                      <td className="px-3 py-2 text-left font-medium text-gray-900">
                        {formatRupiah(p.nominal)}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{p.keterangan ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
