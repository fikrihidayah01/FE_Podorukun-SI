import { useMemo, useState } from 'react';
import { PiPlus } from 'react-icons/pi';
import { usePinjamanBankStore, type PinjamanBank, type JenisPembayaran } from '../../../store/pinjamanBankStore';
import { useCoaStore, type Akun } from '../../../store/coaStore';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import Field from '../../../components/ui/Field';
import { formatTanggal } from '../../../utils/format';
import JurnalPreview from './JurnalPreview';

interface PaymentForm {
  jenis: JenisPembayaran | 'gabungan';
  tanggal: string;
  nominal: string;
  nominalPokok: string;
  nominalBunga: string;
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

const INITIAL_TOPUP: TopUpForm = { tanggal: '', nominal: '', keterangan: '' };

const emptyPayment = (pola: PinjamanBank['pola']): PaymentForm => ({
  jenis: pola === 'bunga_rutin' ? 'bunga' : 'pokok',
  tanggal: '',
  nominal: '',
  nominalPokok: '',
  nominalBunga: '',
  periodeBunga: '',
  keterangan: '',
  noBukti: '',
  akunKasId: '',
});

const POLA_NOTE: Record<PinjamanBank['pola'], string> = {
  terpisah: 'Pola terpisah. Pokok dan bunga ditransfer sebagai dua transaksi berbeda.',
  satu_transfer:
    'Satu transfer. Komposisi pokok dan bunga ditentukan bank. Isi rinciannya setelah menerima keterangan dari bank.',
  bunga_rutin: 'Bunga rutin. Pokok tidak dicicil dan dilunasi sekaligus di akhir tenor, jadi sisa pokok tetap sampai pelunasan.',
  fleksibel: 'Pola fleksibel. Pokok, bunga, atau keduanya dalam satu transfer bisa dicatat sesuai kejadian.',
};

const JENIS_LABEL = { pokok: 'Pokok', bunga: 'Bunga', gabungan: 'Satu transfer' } as const;

const akunLabel = (a: Akun | undefined, fallback: string) => (a ? `${a.kodeAkun} - ${a.namaAkun}` : fallback);

interface PinjamanBankDetailModalProps {
  pinjaman: PinjamanBank | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PinjamanBankDetailModal({ pinjaman, isOpen, onClose }: PinjamanBankDetailModalProps) {
  const { pinjamans, getEntriesByPinjaman, addEntry, addTopUp } = usePinjamanBankStore();
  const akuns = useCoaStore((s) => s.items);
  const kasBankAkuns = useMemo(() => akuns.filter((a) => a.isKasBank), [akuns]);

  const [payForm, setPayForm] = useState<PaymentForm>(() => emptyPayment(pinjaman?.pola ?? 'terpisah'));
  const [payError, setPayError] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpForm, setTopUpForm] = useState<TopUpForm>(INITIAL_TOPUP);
  const [topUpError, setTopUpError] = useState('');

  if (!pinjaman) return null;

  const fresh = pinjamans.find((p) => p.id === pinjaman.id) ?? pinjaman;
  const entries = getEntriesByPinjaman(fresh.id);
  const akunHutang = akuns.find((a) => a.id === fresh.akunHutangId);
  const akunBeban = akuns.find((a) => a.id === fresh.akunBebanBungaId);
  const akunKas = akuns.find((a) => a.id === payForm.akunKasId);

  let jenis = payForm.jenis;
  if (fresh.pola === 'satu_transfer') jenis = 'gabungan';
  if (fresh.pola === 'bunga_rutin' && payForm.jenis === 'gabungan') jenis = 'bunga';
  if (fresh.pola === 'terpisah' && payForm.jenis === 'gabungan') jenis = 'pokok';

  const totalBungaDibayar = entries.filter((e) => e.jenis === 'bunga').reduce((s, e) => s + e.nominal, 0);
  const setPay = <K extends keyof PaymentForm>(key: K, value: PaymentForm[K]) => setPayForm((f) => ({ ...f, [key]: value }));

  const pNominal = Number(payForm.nominal) || 0;
  const pPokok = Number(payForm.nominalPokok) || 0;
  const pBunga = Number(payForm.nominalBunga) || 0;
  const rincianCocok = jenis === 'gabungan' && pNominal > 0 && pPokok + pBunga === pNominal;

  const handlePayment = (statusRincian?: 'menunggu_rincian' | 'lengkap') => {
    if (!payForm.tanggal) return setPayError('Tanggal pembayaran wajib diisi.');
    if (!payForm.akunKasId) return setPayError('Pilih akun kas atau bank.');
    if (pNominal <= 0) return setPayError('Nominal pembayaran harus lebih dari 0.');
    // Simulasi tutup buku: transaksi sebelum 1 September 2026 dianggap periode terkunci
    if (new Date(payForm.tanggal) < new Date('2026-09-01')) {
      return setPayError('Tanggal ini masuk periode yang sudah dikunci (sebelum September 2026).');
    }
    if (jenis === 'gabungan' && statusRincian !== 'menunggu_rincian' && pPokok + pBunga !== pNominal) {
      return setPayError('Porsi pokok dan bunga belum sama dengan total transfer.');
    }

    addEntry(fresh.id, {
      tanggal: payForm.tanggal,
      jenis,
      nominal: pNominal,
      nominalPokok: jenis === 'gabungan' ? pPokok : undefined,
      nominalBunga: jenis === 'gabungan' ? pBunga : undefined,
      periodeBunga: jenis === 'bunga' || jenis === 'gabungan' ? payForm.periodeBunga.trim() || undefined : undefined,
      keterangan: payForm.keterangan.trim() || undefined,
      noBukti: payForm.noBukti.trim() || undefined,
      akunKasId: payForm.akunKasId,
      statusRincian,
    });
    setPayForm(emptyPayment(fresh.pola));
    setPayError('');
  };

  const handleTopUpSubmit = () => {
    const nominal = Number(topUpForm.nominal);
    if (!topUpForm.tanggal) return setTopUpError('Tanggal top-up wajib diisi.');
    if (!nominal || nominal <= 0) return setTopUpError('Nominal top-up harus lebih dari 0.');
    addTopUp(fresh.id, { tanggal: topUpForm.tanggal, nominal, keterangan: topUpForm.keterangan.trim() || undefined });
    setTopUpForm(INITIAL_TOPUP);
    setTopUpError('');
    setShowTopUp(false);
  };

  const ringkasan =
    fresh.pola === 'bunga_rutin'
      ? [
          { label: 'Sisa pokok', value: <Money value={fresh.sisaPokok} /> },
          { label: 'Bunga dibayar', value: <Money value={totalBungaDibayar} /> },
          { label: 'Jatuh tempo pokok', value: formatTanggal(fresh.tanggalJatuhTempoPokok) },
        ]
      : [
          { label: 'Total pencairan', value: <Money value={fresh.totalPencairan} /> },
          { label: 'Sisa pokok', value: <Money value={fresh.sisaPokok} /> },
          { label: 'Penebusan', value: <Money value={fresh.penebusan} accounting /> },
        ];

  const jurnalRows = [
    ...(jenis === 'pokok' || jenis === 'gabungan'
      ? [{ akun: akunLabel(akunHutang, 'Hutang bank'), debit: jenis === 'gabungan' ? pPokok : pNominal }]
      : []),
    ...(jenis === 'bunga' || jenis === 'gabungan'
      ? [{ akun: akunLabel(akunBeban, 'Beban bunga'), debit: jenis === 'gabungan' ? pBunga : pNominal }]
      : []),
    { akun: akunLabel(akunKas, 'Kas / bank'), kredit: pNominal },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat pembayaran"
      description={`${fresh.namaBank}, ${fresh.keterangan || 'pinjaman'}`}
      size="lg"
      footer={<Button onClick={onClose}>Tutup</Button>}
    >
      <div className="space-y-6">
        <Notice>{POLA_NOTE[fresh.pola]}</Notice>

        <dl
          className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/50 bg-line sm:grid-cols-3"
          style={{
            boxShadow: `
              8px 8px 10px -1px rgba(0, 0, 0, 0.7),
              -8px -8px 10px -1px rgba(255, 255, 255, 0.7)
            `,
          }}
        >
          {ringkasan.map((r) => (
            <div key={r.label} className="bg-subtle px-4 py-3">
              <dt className="text-xs font-semibold text-ink-3">{r.label}</dt>
              <dd className="mt-1 text-sm font-bold tabular-nums text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>

        <section className="rounded-lg border border-line">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-ink">
              Top-up pinjaman <span className="font-normal text-ink-3">({fresh.topUps?.length || 0})</span>
            </h3>
            <Button size="sm" variant="ghost" icon={showTopUp ? undefined : PiPlus} onClick={() => setShowTopUp((v) => !v)} aria-expanded={showTopUp}>
              {showTopUp ? 'Batal' : 'Catat top-up'}
            </Button>
          </div>
          {showTopUp && (
            <div className="space-y-3 border-t border-line bg-subtle px-4 py-4">
              {topUpError && <Notice tone="danger">{topUpError}</Notice>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tanggal" required>
                  <input type="date" className="control" value={topUpForm.tanggal} onChange={(e) => setTopUpForm({ ...topUpForm, tanggal: e.target.value })} />
                </Field>
                <Field label="Nominal" required>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="control control-num"
                    value={topUpForm.nominal}
                    onChange={(e) => setTopUpForm({ ...topUpForm, nominal: e.target.value })}
                    placeholder="0"
                  />
                </Field>
              </div>
              <Field label="Keterangan" optional>
                <input className="control" value={topUpForm.keterangan} onChange={(e) => setTopUpForm({ ...topUpForm, keterangan: e.target.value })} />
              </Field>
              <Button size="sm" variant="primary" onClick={handleTopUpSubmit}>
                Simpan top-up
              </Button>
            </div>
          )}
          {fresh.topUps && fresh.topUps.length > 0 && (
            <ul className="divide-y divide-line border-t border-line text-[13px]">
              {fresh.topUps.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="text-ink-2">
                    <span className="tabular-nums">{formatTanggal(t.tanggal)}</span>, {t.keterangan || 'top-up pinjaman'}
                  </span>
                  <Money value={t.nominal} signed className="font-semibold text-ink" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink">
            Riwayat pembayaran <span className="font-normal text-ink-3">({entries.length})</span>
          </h3>
          {entries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong/60 px-4 py-5 text-center text-[13px] text-ink-3">
              Belum ada pembayaran. Catat pembayaran pertama lewat formulir di bawah.
            </p>
          ) : (
            <div className="relative overflow-x-auto rounded-lg border border-line">
              <table className="tbl tbl-compact">
                <thead>
                  <tr>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Jenis</th>
                    <th scope="col" className="num">Nominal</th>
                    <th scope="col">No. bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap tabular-nums">{formatTanggal(entry.tanggal)}</td>
                      <td>
                        <span className="flex flex-wrap gap-1">
                          <Badge>{JENIS_LABEL[entry.jenis as keyof typeof JENIS_LABEL] ?? entry.jenis}</Badge>
                          {entry.statusRincian === 'menunggu_rincian' && <Badge tone="warning">Menunggu rincian</Badge>}
                        </span>
                      </td>
                      <td className="num">
                        <span className="font-semibold text-ink"><Money value={entry.nominal} /></span>
                        {entry.jenis === 'gabungan' && entry.statusRincian === 'lengkap' && (
                          <span className="mt-0.5 block text-xs text-ink-3">
                            Pokok <Money value={entry.nominalPokok || 0} />, bunga <Money value={entry.nominalBunga || 0} />
                          </span>
                        )}
                      </td>
                      <td>{entry.noBukti || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {fresh.status === 'aktif' && (
          <section className="space-y-4 border-t border-line pt-5">
            <h3 className="text-sm font-semibold text-ink">Pembayaran baru</h3>
            {payError && <Notice tone="danger">{payError}</Notice>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fresh.pola !== 'satu_transfer' && fresh.pola !== 'bunga_rutin' && (
                <Field label="Jenis pembayaran">
                  <select className="control" value={payForm.jenis} onChange={(e) => setPay('jenis', e.target.value as PaymentForm['jenis'])}>
                    <option value="pokok">Pokok</option>
                    <option value="bunga">Bunga</option>
                    {fresh.pola === 'fleksibel' && <option value="gabungan">Satu transfer (pokok dan bunga)</option>}
                  </select>
                </Field>
              )}
              <Field label={jenis === 'gabungan' ? 'Tanggal transfer' : 'Tanggal'} required>
                <input type="date" className="control" value={payForm.tanggal} onChange={(e) => setPay('tanggal', e.target.value)} />
              </Field>
              <Field label={jenis === 'gabungan' ? 'Total transfer' : jenis === 'bunga' ? 'Nominal bunga' : 'Nominal pokok'} required>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="control control-num"
                  value={payForm.nominal}
                  onChange={(e) => setPay('nominal', e.target.value)}
                  placeholder="0"
                />
              </Field>
              {(jenis === 'bunga' || jenis === 'gabungan') && fresh.pola === 'bunga_rutin' && (
                <Field label="Periode bunga" optional>
                  <input className="control" value={payForm.periodeBunga} onChange={(e) => setPay('periodeBunga', e.target.value)} placeholder="Contoh: September 2026" />
                </Field>
              )}
              <Field label="Akun kas / bank" required>
                <select className="control" value={payForm.akunKasId} onChange={(e) => setPay('akunKasId', e.target.value)}>
                  <option value="">Pilih akun</option>
                  {kasBankAkuns.map((a) => (
                    <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
                  ))}
                </select>
              </Field>
              <Field label="No. bukti" optional>
                <input className="control" value={payForm.noBukti} onChange={(e) => setPay('noBukti', e.target.value)} placeholder="Contoh: BKK/2026/09/031" />
              </Field>
            </div>

            {jenis === 'gabungan' && (
              <fieldset className="rounded-lg border border-line p-4">
                <legend className="px-1 text-[13px] font-semibold text-ink-2">Rincian dari bank</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Porsi pokok">
                    <input type="number" inputMode="numeric" min={0} className="control control-num" value={payForm.nominalPokok} onChange={(e) => setPay('nominalPokok', e.target.value)} />
                  </Field>
                  <Field label="Porsi bunga">
                    <input type="number" inputMode="numeric" min={0} className="control control-num" value={payForm.nominalBunga} onChange={(e) => setPay('nominalBunga', e.target.value)} />
                  </Field>
                </div>
                {rincianCocok && (
                  <Notice tone="positive" className="mt-3">
                    Rincian cocok dengan total transfer.
                  </Notice>
                )}
              </fieldset>
            )}

            <JurnalPreview rows={jurnalRows} />

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              {fresh.pola === 'bunga_rutin' ? (
                <Button
                  onClick={() =>
                    setPayForm((prev) => ({ ...prev, jenis: prev.jenis === 'pokok' ? 'bunga' : 'pokok', nominal: '', periodeBunga: '' }))
                  }
                >
                  {jenis === 'pokok' ? 'Ganti ke bayar bunga' : 'Ganti ke pelunasan pokok'}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPayForm(emptyPayment(fresh.pola));
                    setPayError('');
                  }}
                >
                  Kosongkan
                </Button>
                {jenis === 'gabungan' && <Button onClick={() => handlePayment('menunggu_rincian')}>Simpan tanpa rincian</Button>}
                <Button variant="primary" onClick={() => handlePayment('lengkap')}>
                  Simpan dan buat jurnal
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
