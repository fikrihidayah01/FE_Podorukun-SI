import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PiCheck } from 'react-icons/pi';
import { usePiutangStore } from '../../../store/piutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import { fetchApi } from '../../../lib/api';
import { showToast } from '../../../store/toastStore';
import { apiError as toApiError } from '../../../lib/errors';
import PageHeader, { PageBody } from '../../../components/ui/PageHeader';
import Panel from '../../../components/ui/Panel';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Notice from '../../../components/ui/Notice';
import { formatRupiah, formatTanggal, hariIni } from '../../../utils/format';

export default function BastPembeliPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, fetchItems, error: loadError } = usePiutangStore();
  const { items: proyeks, fetch: fetchProyeks } = useProyekStore();

  useEffect(() => {
    fetchItems();
    fetchProyeks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kavling = useMemo(() => {
    if (!id) return undefined;
    return items.find((k) => k.id === id || k.nomorKavling.toLowerCase() === id.toLowerCase());
  }, [items, id]);

  const getProyekNama = (proyekId: string) => proyeks.find((p) => p.id === proyekId)?.nama ?? proyekId;

  const [tanggalBast, setTanggalBast] = useState(hariIni());
  const [nilaiHpp, setNilaiHpp] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback demo values if fields are empty
  const sppr = kavling?.nilaiSppr ?? 600000000;
  const uangMuka = kavling?.totalDibayar ?? 330000000;
  const sisaPiutang = kavling?.sisa ?? Math.max(0, sppr - uangMuka);

  const nomorKav = kavling?.nomorKavling ?? id ?? 'C-05';
  const namaUser = kavling?.namaUser ?? 'Demo 03';
  const namaProyek = kavling ? getProyekNama(kavling.proyekId) : 'Atlantis Hills';
  const tipeTrans = kavling?.tipeTransaksi ? kavling.tipeTransaksi.toUpperCase() : 'KPR';
  const isSudahBast = kavling?.statusBast === 'sudah_bast';

  // Rincian uang muka terkumpul
  const rincianUangMuka = useMemo(() => {
    if (!kavling || (!kavling.pembayaranLainnya?.length && !kavling.periodeAngsuran?.length)) {
      return [
        { tanggal: '2026-09-10', jenis: 'DP', nominal: 60000000 },
        { tanggal: '2026-10-20', jenis: 'Pencairan KPR tahap 1', nominal: 270000000 },
      ];
    }
    const list: { tanggal: string; jenis: string; nominal: number }[] = [];
    kavling.pembayaranLainnya.forEach((p) => {
      list.push({
        tanggal: p.tanggal,
        jenis: p.tipe === 'dp' ? 'DP' : p.tipe === 'booking_fee' ? 'Booking Fee' : p.tipe === 'pencairan_kpr' ? 'Pencairan KPR' : (p.keterangan || 'Pembayaran'),
        nominal: p.nominal,
      });
    });
    kavling.periodeAngsuran.forEach((pa) => {
      if (pa.dibayar > 0 && pa.tanggalBayar) {
        list.push({
          tanggal: pa.tanggalBayar,
          jenis: `Angsuran (${pa.periode})`,
          nominal: pa.dibayar,
        });
      }
    });
    return list.length > 0 ? list : [
      { tanggal: hariIni(), jenis: 'Uang Muka', nominal: uangMuka }
    ];
  }, [kavling, uangMuka]);

  const handleSubmit = async () => {
    if (!kavling) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetchApi(`/piutang/${kavling.id}/bast`, {
        method: 'POST',
        body: JSON.stringify({
          tanggal: tanggalBast,
          nilaiHpp: nilaiHpp ? Number(nilaiHpp) : (kavling.nilaiHpp ?? 0),
        }),
      });
      if (!res.ok) throw toApiError(res, 'Gagal menyimpan BAST');
      await fetchItems();
      showToast.success('BAST pembeli berhasil disimpan dan jurnal telah diposting');
      navigate('/keuangan/piutang/tagihan-user');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan BAST');
      showToast.error(err instanceof Error ? err.message : 'Gagal menyimpan BAST');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={`BAST pembeli ${nomorKav}`}
        status={
          <Badge tone={isSudahBast ? 'positive' : 'warning'}>
            {isSudahBast ? 'Sudah BAST' : 'Belum BAST'}
          </Badge>
        }
        description={`${namaUser} · ${namaProyek} · ${tipeTrans}. Saat disimpan, uang muka dipindah dan penjualan diakui.`}
        back={{ to: '/keuangan/piutang/tagihan-user', label: 'Kembali ke Tagihan user' }}
      />

      <PageBody>
        {loadError && <Notice tone="danger">{loadError}</Notice>}
        {errorMsg && <Notice tone="danger">{errorMsg}</Notice>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Kolom Kiri: Data Serah Terima */}
          <div className="lg:col-span-7 space-y-6">
            <Panel title="Data serah terima">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-6">
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">
                    Tanggal BAST pembeli
                  </label>
                  <input
                    type="date"
                    className="control w-full"
                    value={tanggalBast}
                    onChange={(e) => setTanggalBast(e.target.value)}
                    disabled={isSudahBast || submitting}
                  />
                  <p className="mt-1 text-xs text-ink-3">
                    Pembayaran mulai tanggal ini masuk piutang
                  </p>
                </div>

                <div>
                  <span className="block text-sm font-medium text-ink-2 mb-1.5">
                    BAST bangunan (Teknik)
                  </span>
                  <div className="flex h-10 items-center gap-2 rounded-lg bg-[#ecfdf3] px-3.5 text-sm font-semibold text-[#027a48] border border-[#d1fadf]">
                    <PiCheck className="h-4 w-4 shrink-0 stroke-[3]" />
                    <span>✓ Dibuat {formatTanggal('2026-11-04')}</span>
                  </div>
                </div>
              </div>

              {/* 3 Kotak Ringkasan */}
              <div className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-surface p-3 mb-6">
                <div className="px-3 text-left">
                  <p className="text-xs text-ink-3">Harga jual (SPPR)</p>
                  <p className="mt-1 text-sm sm:text-base font-bold text-ink tabular-nums">
                    {formatRupiah(sppr)}
                  </p>
                </div>
                <div className="px-3 text-left">
                  <p className="text-xs text-ink-3">Uang muka terkumpul (212007)</p>
                  <p className="mt-1 text-sm sm:text-base font-bold text-ink tabular-nums">
                    {formatRupiah(uangMuka)}
                  </p>
                </div>
                <div className="px-3 text-left">
                  <p className="text-xs text-ink-3">Sisa jadi piutang (113530)</p>
                  <p className="mt-1 text-sm sm:text-base font-bold text-ink tabular-nums">
                    {formatRupiah(sisaPiutang)}
                  </p>
                </div>
              </div>

              {/* Rincian Uang Muka Terkumpul */}
              <div>
                <h3 className="text-sm font-bold text-ink mb-3">Rincian uang muka terkumpul</h3>
                <div className="divide-y divide-line border-t border-line text-sm">
                  {rincianUangMuka.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ink-3 tabular-nums">{formatTanggal(item.tanggal)}</span>
                        <span className="text-ink font-medium">{item.jenis}</span>
                      </div>
                      <span className="font-semibold text-ink tabular-nums">{formatRupiah(item.nominal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input HPP opsional */}
              {!isSudahBast && (
                <div className="mt-6 pt-5 border-t border-line">
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">
                    Nilai HPP (Harga Pokok Penjualan)
                  </label>
                  <input
                    type="number"
                    placeholder="Masukkan nilai HPP (opsional)"
                    className="control w-full sm:w-64"
                    value={nilaiHpp}
                    onChange={(e) => setNilaiHpp(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-ink-3">
                    Bila diisi, jurnal HPP dan persediaan kavling akan otomatis terbentuk sesuai nilai ini.
                  </p>
                </div>
              )}
            </Panel>
          </div>

          {/* Kolom Kanan: Pratinjau Jurnal */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden border-t-4 border-t-[#cf1b1a]">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-[15px] font-bold text-ink">Pratinjau jurnal</h2>
              </div>

              <div className="p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs font-semibold text-ink-3">
                      <th className="pb-2.5">Akun</th>
                      <th className="pb-2.5 text-right">Debit</th>
                      <th className="pb-2.5 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs sm:text-sm">
                    <tr>
                      <td className="py-2.5 text-ink font-medium">
                        212007 Uang Muka Penjualan
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-ink">
                        {uangMuka.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 text-right text-ink-3">-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-ink font-medium">
                        113530 Piutang Penjualan
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-ink">
                        {sisaPiutang.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 text-right text-ink-3">-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-ink font-medium">
                        Penjualan
                      </td>
                      <td className="py-2.5 text-right text-ink-3">-</td>
                      <td className="py-2.5 text-right tabular-nums text-ink">
                        {sppr.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-ink font-medium">
                        HPP
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-ink">
                        {nilaiHpp ? Number(nilaiHpp).toLocaleString('id-ID') : '[HPP]'}
                      </td>
                      <td className="py-2.5 text-right text-ink-3">-</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-ink font-medium">
                        Persediaan kavling
                      </td>
                      <td className="py-2.5 text-right text-ink-3">-</td>
                      <td className="py-2.5 text-right tabular-nums text-ink">
                        {nilaiHpp ? Number(nilaiHpp).toLocaleString('id-ID') : '[HPP]'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Point checklist */}
                <div className="mt-5 space-y-2 border-t border-line pt-4 text-xs text-ink-2">
                  <p className="flex items-start gap-2">
                    <span className="text-[#027a48] font-bold">✓</span>
                    <span>Saldo 212007 kavling {nomorKav} menjadi Rp0</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#027a48] font-bold">✓</span>
                    <span>Piutang {nomorKav} terbentuk {formatRupiah(sisaPiutang)}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-[#027a48] font-bold">✓</span>
                    <span>Penjualan {formatRupiah(sppr)} diakui di laba rugi</span>
                  </p>
                </div>

                {/* Action button */}
                <div className="mt-6">
                  <Button
                    variant="primary"
                    className="w-full justify-center py-2.5 text-sm font-semibold !bg-[#cf1b1a] hover:!bg-[#b51716]"
                    disabled={isSudahBast || submitting}
                    onClick={() => void handleSubmit()}
                  >
                    {submitting ? 'Menyimpan & memposting…' : isSudahBast ? 'BAST sudah tercatat' : 'Simpan BAST dan posting jurnal'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
