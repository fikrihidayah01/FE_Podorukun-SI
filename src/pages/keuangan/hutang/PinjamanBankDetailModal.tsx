import { useState } from 'react';
import { usePinjamanBankStore, type PinjamanBank, type JenisPembayaran } from '../../../store/pinjamanBankStore';
import Modal from '../../../components/ui/Modal';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Form state ───────────────────────────────────────────────
interface PaymentForm {
  jenis: JenisPembayaran;
  tanggal: string;
  nominal: string;
  periodeBunga: string;
  keterangan: string;
}

const INITIAL_PAYMENT: PaymentForm = {
  jenis: 'pokok',
  tanggal: '',
  nominal: '',
  periodeBunga: 'Bulanan',
  keterangan: '',
};

// ── Props ────────────────────────────────────────────────────
interface PinjamanBankDetailModalProps {
  pinjaman: PinjamanBank | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PinjamanBankDetailModal({ pinjaman, isOpen, onClose }: PinjamanBankDetailModalProps) {
  const { getEntriesByPinjaman, addEntry } = usePinjamanBankStore();

  const [payForm, setPayForm] = useState<PaymentForm>(INITIAL_PAYMENT);
  const [payError, setPayError] = useState('');

  if (!pinjaman) return null;

  const entries = getEntriesByPinjaman(pinjaman.id);

  // Get the latest pinjaman data from store (sisaPokok may have updated)
  const freshPinjaman = usePinjamanBankStore.getState().pinjamans.find((p) => p.id === pinjaman.id) ?? pinjaman;

  // ── Payment submit ─────────────────────────────────────────
  const handlePayment = () => {
    const nominal = Number(payForm.nominal);

    if (!payForm.tanggal) {
      setPayError('Tanggal pembayaran wajib diisi.');
      return;
    }
    if (!nominal || nominal <= 0) {
      setPayError('Nominal harus lebih dari 0.');
      return;
    }

    addEntry({
      pinjamanId: pinjaman.id,
      tanggal: payForm.tanggal,
      jenis: payForm.jenis,
      nominal,
      periodeBunga: payForm.jenis === 'bunga' ? payForm.periodeBunga.trim() || undefined : undefined,
      keterangan: payForm.keterangan.trim() || undefined,
    });

    setPayForm(INITIAL_PAYMENT);
    setPayError('');
  };

  // ── Status badge ───────────────────────────────────────────
  const statusCls =
    freshPinjaman.status === 'lunas'
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : 'bg-blue-50 text-blue-700 ring-blue-600/20';

  // ── Jenis badge ────────────────────────────────────────────
  const JenisBadge = ({ jenis }: { jenis: JenisPembayaran }) => {
    const cls =
      jenis === 'pokok'
        ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
        : 'bg-orange-50 text-orange-700 ring-orange-600/20';
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
        {jenis === 'pokok' ? 'Pokok' : 'Bunga'}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pinjaman — ${freshPinjaman.namaBank}`} size="lg">
      <div className="space-y-6">
        {/* ── Header info ──────────────────────────────────── */}
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Informasi Pinjaman</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Pencairan</dt>
              <dd className="font-medium text-gray-900">
                {formatRupiah(freshPinjaman.nominalPencairan)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Tgl Pencairan</dt>
              <dd className="font-medium text-gray-900">{formatDate(freshPinjaman.tanggalPencairan)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Sisa Pokok</dt>
              <dd className="font-semibold text-gray-900">{formatRupiah(freshPinjaman.sisaPokok)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Jatuh Tempo</dt>
              <dd className="font-medium text-gray-900">{formatDate(freshPinjaman.tanggalJatuhTempo)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusCls}`}
                >
                  {freshPinjaman.status === 'lunas' ? 'Lunas' : 'Aktif'}
                </span>
              </dd>
            </div>
            {freshPinjaman.keterangan && (
              <div className="col-span-2">
                <dt className="text-gray-500">Keterangan</dt>
                <dd className="text-gray-700">{freshPinjaman.keterangan}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* ── Riwayat Pembayaran ───────────────────────────── */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Riwayat Pembayaran</h4>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Belum ada pembayaran tercatat.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tanggal', 'Jenis', 'Nominal', 'Periode Bunga', 'Keterangan'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700">{formatDate(e.tanggal)}</td>
                      <td className="px-4 py-2.5">
                        <JenisBadge jenis={e.jenis} />
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 tabular-nums">{formatRupiah(e.nominal)}</td>
                      <td className="px-4 py-2.5 text-gray-500">{e.periodeBunga ?? '-'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{e.keterangan ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Form Input Pembayaran ────────────────────────── */}
        {freshPinjaman.status === 'aktif' && (
          <div className="rounded-xl border border-gray-200 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Catat Pembayaran</h4>

            {payError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{payError}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Jenis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                <select
                  value={payForm.jenis}
                  onChange={(e) =>
                    setPayForm({ ...payForm, jenis: e.target.value as JenisPembayaran })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="pokok">Pokok</option>
                  <option value="bunga">Bunga</option>
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={payForm.tanggal}
                  onChange={(e) => setPayForm({ ...payForm, tanggal: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
                <input
                  type="number"
                  min={0}
                  value={payForm.nominal}
                  onChange={(e) => setPayForm({ ...payForm, nominal: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Periode Bunga — only if jenis = bunga */}
              {payForm.jenis === 'bunga' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periode Bunga</label>
                  <input
                    type="text"
                    value={payForm.periodeBunga}
                    onChange={(e) => setPayForm({ ...payForm, periodeBunga: e.target.value })}
                    placeholder="Bulanan"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Keterangan — full width */}
            {payForm.jenis === 'bunga' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={payForm.keterangan}
                  onChange={(e) => setPayForm({ ...payForm, keterangan: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handlePayment}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Catat Pembayaran
              </button>
            </div>

            {payForm.jenis === 'bunga' && (
              <p className="text-xs text-gray-400">
                * Pembayaran bunga tidak mengurangi sisa pokok (non-compound).
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
