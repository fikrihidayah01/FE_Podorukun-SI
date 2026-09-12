import { useState, useMemo } from 'react';
import {
  usePinjamanBankStore,
  type PinjamanBank,
  type JenisPembayaran,
} from '../../../store/pinjamanBankStore';
import { useCoaStore } from '../../../store/coaStore';
import Modal from '../../../components/ui/Modal';
import { MdTrendingUp, MdInfo, MdCheck } from 'react-icons/md';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

interface PaymentForm {
  jenis: JenisPembayaran | 'gabungan';
  tanggal: string;
  nominal: string; // Total or specific nominal
  nominalPokok: string; // for gabungan
  nominalBunga: string; // for gabungan
  periodeBunga: string;
  keterangan: string;
  noBukti: string;
  akunKasId: string;
}

interface TopUpForm {
  tanggal: string;
  nominal: string;
  keterangan: string;
}

const INITIAL_TOPUP: TopUpForm = {
  tanggal: '',
  nominal: '',
  keterangan: '',
};

interface PinjamanBankDetailModalProps {
  pinjaman: PinjamanBank | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PinjamanBankDetailModal({
  pinjaman,
  isOpen,
  onClose,
}: PinjamanBankDetailModalProps) {
  const { getEntriesByPinjaman, addEntry, addTopUp } = usePinjamanBankStore();
  const akuns = useCoaStore((s) => s.items);

  const kasBankAkuns = useMemo(() => {
    return akuns.filter(a => a.isKasBank);
  }, [akuns]);

  const [payForm, setPayForm] = useState<PaymentForm>({
    jenis: 'pokok',
    tanggal: '',
    nominal: '',
    nominalPokok: '',
    nominalBunga: '',
    periodeBunga: '',
    keterangan: '',
    noBukti: '',
    akunKasId: '',
  });
  const [payError, setPayError] = useState('');

  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpForm, setTopUpForm] = useState<TopUpForm>(INITIAL_TOPUP);
  const [topUpError, setTopUpError] = useState('');

  if (!pinjaman) return null;

  const freshPinjaman =
    usePinjamanBankStore.getState().pinjamans.find((p) => p.id === pinjaman.id) ?? pinjaman;
  const entries = getEntriesByPinjaman(freshPinjaman.id);

  const akunHutang = akuns.find((a) => a.id === freshPinjaman.akunHutangId);
  const akunBeban = akuns.find((a) => a.id === freshPinjaman.akunBebanBungaId);
  const akunKas = akuns.find((a) => a.id === payForm.akunKasId);

  // When opening modal or pola changes, set initial default values
  let currentJenis = payForm.jenis;
  if (freshPinjaman.pola === 'satu_transfer') currentJenis = 'gabungan';
  if (freshPinjaman.pola === 'bunga_rutin' && payForm.jenis === 'gabungan') currentJenis = 'bunga';
  if (freshPinjaman.pola === 'terpisah' && payForm.jenis === 'gabungan') currentJenis = 'pokok';

  // For Bunga Rutin total bunga dibayar
  const totalBungaDibayar = entries.filter(e => e.jenis === 'bunga').reduce((s, e) => s + e.nominal, 0);

  const handlePayment = (statusRincian?: 'menunggu_rincian' | 'lengkap') => {
    if (!payForm.tanggal) return setPayError('Tanggal pembayaran wajib diisi.');
    if (!payForm.akunKasId) return setPayError('Akun kas / bank wajib dipilih.');

    const nominal = Number(payForm.nominal);
    if (!nominal || nominal <= 0) return setPayError('Nominal pembayaran harus lebih dari 0.');

    // Validasi periode terkunci (simulasi: sebelum 1 September 2026 dianggap terkunci)
    const payDate = new Date(payForm.tanggal);
    if (payDate < new Date('2026-09-01')) {
      return setPayError('Tanggal transaksi masuk dalam periode yang sudah terkunci (sebelum September 2026).');
    }

    let pPokok = 0;
    let pBunga = 0;

    if (currentJenis === 'gabungan') {
      pPokok = Number(payForm.nominalPokok) || 0;
      pBunga = Number(payForm.nominalBunga) || 0;
      if (statusRincian !== 'menunggu_rincian' && pPokok + pBunga !== nominal) {
        return setPayError('Rincian pokok dan bunga tidak cocok dengan total transfer.');
      }
    }

    addEntry({
      pinjamanId: freshPinjaman.id,
      tanggal: payForm.tanggal,
      jenis: currentJenis,
      nominal,
      nominalPokok: currentJenis === 'gabungan' ? pPokok : undefined,
      nominalBunga: currentJenis === 'gabungan' ? pBunga : undefined,
      periodeBunga: (currentJenis === 'bunga' || currentJenis === 'gabungan') ? payForm.periodeBunga.trim() || undefined : undefined,
      keterangan: payForm.keterangan.trim() || undefined,
      noBukti: payForm.noBukti.trim() || undefined,
      akunKasId: payForm.akunKasId,
      statusRincian,
    });

    setPayForm({
      jenis: freshPinjaman.pola === 'bunga_rutin' ? 'bunga' : 'pokok',
      tanggal: '',
      nominal: '',
      nominalPokok: '',
      nominalBunga: '',
      periodeBunga: '',
      keterangan: '',
      noBukti: '',
      akunKasId: '',
    });
    setPayError('');
  };

  const handleTopUpSubmit = () => {
    const nominal = Number(topUpForm.nominal);
    if (!topUpForm.tanggal) return setTopUpError('Tanggal top-up wajib diisi.');
    if (!nominal || nominal <= 0) return setTopUpError('Nominal top-up harus lebih dari 0.');

    addTopUp(freshPinjaman.id, {
      tanggal: topUpForm.tanggal,
      nominal,
      keterangan: topUpForm.keterangan.trim() || undefined,
    });

    setTopUpForm(INITIAL_TOPUP);
    setTopUpError('');
    setShowTopUp(false);
  };

  const isRincianCocok = currentJenis === 'gabungan' &&
    Number(payForm.nominal) > 0 &&
    (Number(payForm.nominalPokok) + Number(payForm.nominalBunga) === Number(payForm.nominal));

  // Journal Preview calculations
  const pNominal = Number(payForm.nominal) || 0;
  const pPokok = Number(payForm.nominalPokok) || 0;
  const pBunga = Number(payForm.nominalBunga) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Catat pembayaran`}
      size="lg"
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
        <div>
          <p className="text-sm text-gray-500 mb-4">{freshPinjaman.namaBank} · {usePinjamanBankStore.getState().pinjamans.find(p=>p.id===freshPinjaman.id)?.keterangan || 'Pinjaman'}</p>
        </div>

        {/* ── Banner Info Pola ──────────────────────────────── */}
        {freshPinjaman.pola === 'terpisah' && (
          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
            <MdInfo className="h-5 w-5 mt-0.5 shrink-0 text-sky-600" />
            <p className="text-sm">
              Pola terpisah. Pokok dan bunga ditransfer sebagai dua transaksi berbeda.
            </p>
          </div>
        )}
        {freshPinjaman.pola === 'satu_transfer' && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <MdInfo className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm">
              Satu transfer. Komposisi pokok dan bunga ditentukan bank. Isi rincian setelah menerima keterangan dari bank.
            </p>
          </div>
        )}
        {freshPinjaman.pola === 'bunga_rutin' && (
          <div className="flex items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-900">
            <MdInfo className="h-5 w-5 mt-0.5 shrink-0 text-indigo-600" />
            <p className="text-sm">
              Bunga rutin. Pokok tidak dicicil, dilunasi sekaligus di akhir tenor. Sisa pokok tetap sampai pelunasan.
            </p>
          </div>
        )}

        {/* ── Bunga Rutin Info Cards ────────────────────────── */}
        {freshPinjaman.pola === 'bunga_rutin' && (
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Sisa pokok</p>
              <p className="text-sm font-bold text-gray-900">{formatRupiah(freshPinjaman.sisaPokok)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Bunga dibayar</p>
              <p className="text-sm font-bold text-gray-900">{formatRupiah(totalBungaDibayar)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Jatuh tempo pokok</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(freshPinjaman.tanggalJatuhTempoPokok)}</p>
            </div>
          </div>
        )}

        {/* ── Info Pinjaman (for non-bunga_rutin) ───────────── */}
        {freshPinjaman.pola !== 'bunga_rutin' && (
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Total Pencairan</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatRupiah(freshPinjaman.totalPencairan)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Sisa Pokok</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatRupiah(freshPinjaman.sisaPokok)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Penebusan</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatRupiah(freshPinjaman.penebusan)}</p>
            </div>
          </div>
        )}

        {/* ── Top-Up Section ─────────────────────────────────── */}
        <div className="border rounded-xl border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700">
              <MdTrendingUp className="h-4 w-4 text-indigo-600" />
              Top-Up Pinjaman ({freshPinjaman.topUps?.length || 0})
            </div>
            <button onClick={() => setShowTopUp(!showTopUp)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              {showTopUp ? 'Batal' : '+ Catat Top-Up'}
            </button>
          </div>
          {showTopUp && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-3">
              {topUpError && <p className="text-xs text-red-600">{topUpError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Tanggal</label>
                  <input type="date" value={topUpForm.tanggal} onChange={(e) => setTopUpForm({ ...topUpForm, tanggal: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Nominal</label>
                  <input type="number" min={0} value={topUpForm.nominal} onChange={(e) => setTopUpForm({ ...topUpForm, nominal: e.target.value })} placeholder="0" className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Keterangan</label>
                <input type="text" value={topUpForm.keterangan} onChange={(e) => setTopUpForm({ ...topUpForm, keterangan: e.target.value })} placeholder="Keterangan top-up" className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
              </div>
              <button onClick={handleTopUpSubmit} className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">Simpan Top-Up</button>
            </div>
          )}
          {freshPinjaman.topUps && freshPinjaman.topUps.length > 0 && (
            <div className="mt-2 divide-y divide-gray-100 text-xs">
              {freshPinjaman.topUps.map((t) => (
                <div key={t.id} className="py-1.5 flex items-center justify-between text-gray-600">
                  <span>{formatDate(t.tanggal)} — {t.keterangan || 'Top-up pinjaman'}</span>
                  <span className="font-medium text-gray-900">+{formatRupiah(t.nominal)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Riwayat Pembayaran ─────────────────────────────── */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">
            Riwayat Pembayaran dari Jurnal ({entries.length})
          </h4>
          {entries.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center border border-dashed rounded-lg">Belum ada riwayat pembayaran untuk pinjaman ini.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Tanggal</th>
                    <th className="px-3 py-2 text-left text-gray-500">Jenis</th>
                    <th className="px-3 py-2 text-left text-gray-500">Nominal</th>
                    <th className="px-3 py-2 text-left text-gray-500">No Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{formatDate(entry.tanggal)}</td>
                      <td className="px-3 py-2">
                        <span className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium ${entry.jenis === 'pokok' ? 'bg-blue-100 text-blue-700' : entry.jenis === 'gabungan' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                          {entry.jenis === 'pokok' ? 'Pokok' : entry.jenis === 'gabungan' ? 'Satu Transfer' : 'Bunga'}
                        </span>
                        {entry.statusRincian === 'menunggu_rincian' && (
                          <span className="ml-1 text-[9px] text-red-500">(Menunggu Rincian)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-left font-medium text-gray-900">
                        {formatRupiah(entry.nominal)}
                        {entry.jenis === 'gabungan' && entry.statusRincian === 'lengkap' && (
                          <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                            P: {formatRupiah(entry.nominalPokok||0)} | B: {formatRupiah(entry.nominalBunga||0)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{entry.noBukti || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Form Input Pembayaran ──────────────────────────── */}
        {freshPinjaman.status === 'aktif' && (
          <div className="space-y-4">
            {payError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{payError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jenis Pembayaran */}
              {freshPinjaman.pola !== 'satu_transfer' && freshPinjaman.pola !== 'bunga_rutin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis pembayaran</label>
                  <select
                    value={payForm.jenis}
                    onChange={(e) => setPayForm({ ...payForm, jenis: e.target.value as JenisPembayaran | 'gabungan' })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="pokok">Pokok</option>
                    <option value="bunga">Bunga</option>
                    {freshPinjaman.pola === 'fleksibel' && (
                      <option value="gabungan">Satu Transfer (Pokok & Bunga)</option>
                    )}
                  </select>
                </div>
              )}

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{currentJenis === 'gabungan' ? 'Tanggal transfer' : 'Tanggal'}</label>
                <input
                  type="date"
                  value={payForm.tanggal}
                  onChange={(e) => setPayForm({ ...payForm, tanggal: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {currentJenis === 'gabungan' ? 'Total transfer' : currentJenis === 'bunga' ? 'Nominal bunga' : 'Nominal pokok'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={payForm.nominal}
                  onChange={(e) => setPayForm({ ...payForm, nominal: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Rincian (Satu Transfer) */}
              {currentJenis === 'gabungan' && (
                <div className="col-span-1 sm:col-span-2 mt-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Rincian dari bank</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Porsi pokok</label>
                      <input
                        type="number"
                        min={0}
                        value={payForm.nominalPokok}
                        onChange={(e) => setPayForm({ ...payForm, nominalPokok: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Porsi bunga</label>
                      <input
                        type="number"
                        min={0}
                        value={payForm.nominalBunga}
                        onChange={(e) => setPayForm({ ...payForm, nominalBunga: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                  {isRincianCocok && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800 border border-emerald-200">
                      <MdCheck className="h-4 w-4" /> Rincian cocok dengan total transfer.
                    </div>
                  )}
                </div>
              )}

              {/* Periode Bunga (Bunga Rutin) */}
              {(currentJenis === 'bunga' || currentJenis === 'gabungan') && freshPinjaman.pola === 'bunga_rutin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periode bunga</label>
                  <input
                    type="text"
                    value={payForm.periodeBunga}
                    onChange={(e) => setPayForm({ ...payForm, periodeBunga: e.target.value })}
                    placeholder="Contoh: September 2026"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}

              {/* Akun Kas / Bank */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Akun kas / bank</label>
                <select
                  value={payForm.akunKasId}
                  onChange={(e) => setPayForm({ ...payForm, akunKasId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">— Pilih akun —</option>
                  {kasBankAkuns.map(a => (
                    <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>
                  ))}
                </select>
              </div>

              {/* No Bukti */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. bukti</label>
                <input
                  type="text"
                  value={payForm.noBukti}
                  onChange={(e) => setPayForm({ ...payForm, noBukti: e.target.value })}
                  placeholder="BKK/2026/09/031"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Pratinjau Jurnal */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Pratinjau jurnal</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Akun</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Debit</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {/* DEBIT ROW(S) */}
                    {(currentJenis === 'pokok' || currentJenis === 'gabungan') && (
                      <tr>
                        <td className="px-4 py-2 text-gray-700">{akunHutang ? `${akunHutang.kodeAkun} — ${akunHutang.namaAkun}` : 'Hutang Bank'}</td>
                        <td className="px-4 py-2 text-left">{pNominal > 0 ? formatRupiah(currentJenis === 'gabungan' ? pPokok : pNominal) : '—'}</td>
                        <td className="px-4 py-2 text-left text-gray-400">—</td>
                      </tr>
                    )}
                    {(currentJenis === 'bunga' || currentJenis === 'gabungan') && (
                      <tr>
                        <td className="px-4 py-2 text-gray-700">{akunBeban ? `${akunBeban.kodeAkun} — ${akunBeban.namaAkun}` : 'Beban Bunga'}</td>
                        <td className="px-4 py-2 text-left">{pNominal > 0 ? formatRupiah(currentJenis === 'gabungan' ? pBunga : pNominal) : '—'}</td>
                        <td className="px-4 py-2 text-left text-gray-400">—</td>
                      </tr>
                    )}
                    {/* KREDIT ROW */}
                    <tr>
                      <td className="px-4 py-2 text-gray-700">{akunKas ? `${akunKas.kodeAkun} — ${akunKas.namaAkun}` : 'Kas / Bank'}</td>
                      <td className="px-4 py-2 text-left text-gray-400">—</td>
                      <td className="px-4 py-2 text-left">{pNominal > 0 ? formatRupiah(pNominal) : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {freshPinjaman.pola === 'bunga_rutin' ? (
                <button
                  onClick={() => {
                    setPayForm(prev => ({
                      ...prev,
                      jenis: prev.jenis === 'pokok' ? 'bunga' : 'pokok',
                      nominal: '',
                      periodeBunga: ''
                    }));
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  {currentJenis === 'pokok' ? 'Bayar Bunga Rutin' : 'Lunasi Pokok'}
                </button>
              ) : <div></div>}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPayForm({
                      jenis: freshPinjaman.pola === 'bunga_rutin' ? 'bunga' : 'pokok',
                      tanggal: '',
                      nominal: '',
                      nominalPokok: '',
                      nominalBunga: '',
                      periodeBunga: '',
                      keterangan: '',
                      noBukti: '',
                      akunKasId: '',
                    });
                    setPayError('');
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                {currentJenis === 'gabungan' && (
                  <button
                    onClick={() => handlePayment('menunggu_rincian')}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Simpan tanpa rincian
                  </button>
                )}
                <button
                  onClick={() => handlePayment('lengkap')}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Simpan dan buat jurnal
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </Modal>
  );
}
