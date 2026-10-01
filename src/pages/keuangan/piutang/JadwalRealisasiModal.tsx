import { useState } from 'react';
import { PiCheck, PiPencilSimple, PiX } from 'react-icons/pi';
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

export default function JadwalRealisasiModal({ kavlingId, isOpen, onClose }: Props) {
  const { getById, updateAlokasi } = usePiutangStore();
  const kv = kavlingId ? getById(kavlingId) : undefined;

  const [editingPeriode, setEditingPeriode] = useState<string | null>(null);
  const [editDibayar, setEditDibayar] = useState('');
  const [editTglBayar, setEditTglBayar] = useState('');

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

  const startEdit = (row: PeriodeAngsuran) => {
    setEditingPeriode(row.periode);
    setEditDibayar(String(row.dibayar));
    setEditTglBayar(row.tanggalBayar ?? '');
  };

  const saveEdit = (periode: string) => {
    if (!kavlingId) return;
    updateAlokasi(kavlingId, periode, Number(editDibayar) || 0, editTglBayar || null);
    setEditingPeriode(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Jadwal vs realisasi"
      description={`${kv.namaUser}, ${kv.nomorKavling}. Angsuran tiap tanggal ${kv.tanggalAcuanAngsuran}.`}
      size="xl"
      footer={<Button onClick={onClose}>Tutup</Button>}
    >
      <div className="space-y-6">
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
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
          <table className="tbl tbl-compact">
            <thead>
              <tr>
                <th scope="col">Periode</th>
                <th scope="col">Jatuh tempo</th>
                <th scope="col">Tgl bayar</th>
                <th scope="col" className="num">Tagihan</th>
                <th scope="col" className="num">Dibayar</th>
                <th scope="col" className="num">Sisa</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Koreksi</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const sisa = Math.max(0, row.tagihan - row.dibayar);
                const status = computeStatus(row);
                const editing = editingPeriode === row.periode;
                return (
                  <tr key={row.periode} className={editing ? '[&>td]:bg-brand-50' : ''}>
                    <td className="whitespace-nowrap font-semibold text-ink">{formatBulanPendek(row.periode)}</td>
                    <td className="whitespace-nowrap tabular-nums">{formatTanggal(row.tanggalJatuhTempo)}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {editing ? (
                        <input
                          type="date"
                          aria-label={`Tanggal bayar ${formatBulanPendek(row.periode)}`}
                          className="control control-sm w-40"
                          value={editTglBayar}
                          onChange={(e) => setEditTglBayar(e.target.value)}
                        />
                      ) : row.tanggalBayar ? (
                        formatTanggal(row.tanggalBayar)
                      ) : (
                        <span className="text-ink-3">-</span>
                      )}
                    </td>
                    <td className="num"><Money value={row.tagihan} /></td>
                    <td className="num">
                      {editing ? (
                        <input
                          type="number"
                          inputMode="numeric"
                          aria-label={`Nominal dibayar ${formatBulanPendek(row.periode)}`}
                          className="control control-sm control-num ml-auto w-36"
                          value={editDibayar}
                          onChange={(e) => setEditDibayar(e.target.value)}
                        />
                      ) : row.dibayar > 0 ? (
                        <Money value={row.dibayar} />
                      ) : (
                        <span className="text-ink-3">-</span>
                      )}
                    </td>
                    <td className="num font-semibold text-ink">{sisa === 0 ? <span className="text-ink-3">-</span> : <Money value={sisa} />}</td>
                    <td>
                      <Badge tone={STATUS_PERIODE_TONE[status]}>{STATUS_PERIODE_LABELS[status]}</Badge>
                    </td>
                    <td className="!pr-2">
                      {editing ? (
                        <div className="flex justify-end gap-0.5">
                          <IconButton icon={PiCheck} label="Simpan koreksi" onClick={() => saveEdit(row.periode)} />
                          <IconButton icon={PiX} label="Batal koreksi" onClick={() => setEditingPeriode(null)} />
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <IconButton icon={PiPencilSimple} label={`Koreksi alokasi ${formatBulanPendek(row.periode)}`} onClick={() => startEdit(row)} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total</td>
                <td className="num"><Money value={totals.tagihan} /></td>
                <td className="num"><Money value={totals.dibayar} /></td>
                <td className="num"><Money value={totals.sisa} /></td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {kv.pembayaranLainnya && kv.pembayaranLainnya.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Pembayaran di luar jadwal angsuran</h3>
            <div className="relative overflow-x-auto rounded-lg border border-line">
              <table className="tbl tbl-compact">
                <thead>
                  <tr>
                    <th scope="col">Jenis</th>
                    <th scope="col">Tanggal</th>
                    <th scope="col" className="num">Nominal</th>
                    <th scope="col">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {kv.pembayaranLainnya.map((p) => (
                    <tr key={p.id}>
                      <td className="font-semibold text-ink">{LAINNYA_LABEL[p.tipe] ?? p.tipe}</td>
                      <td className="whitespace-nowrap">{formatTanggalPanjang(p.tanggal)}</td>
                      <td className="num font-semibold text-ink"><Money value={p.nominal} /></td>
                      <td>{p.keterangan ?? <span className="text-ink-3">-</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
