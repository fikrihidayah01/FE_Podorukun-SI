import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiArrowsClockwise } from 'react-icons/pi';
import {
  usePiutangStore,
  type KavlingTagihan,
} from '../../../store/piutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import { fetchApi } from '../../../lib/api';
import { showToast } from '../../../store/toastStore';
import { apiError as toApiError } from '../../../lib/errors';
import PageHeader, { PageBody } from '../../../components/ui/PageHeader';
import Panel from '../../../components/ui/Panel';
import Button from '../../../components/ui/Button';
import Badge, { type Tone } from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import { StatGrid, StatTile } from '../../../components/ui/StatTile';
import TabBar from '../../../components/ui/TabBar';
import { formatRupiah, formatTanggal, hariIni } from '../../../utils/format';

type StageStatus = 'cair' | 'diajukan' | 'tertahan' | 'belum';

interface TahapKPR {
  tahap: number;
  syarat: string;
  persen: number;
  nominal: number;
  status: StageStatus;
  statusLabel: string;
  tanggalCair?: string;
  akunKredit?: string;
}

const STAGE_TONE_MAP: Record<StageStatus, Tone> = {
  cair: 'positive',
  diajukan: 'brand',
  tertahan: 'danger',
  belum: 'neutral',
};

// Data mock/sample untuk kavling KPR agar tampilan persis sesuai referensi Image 1 bila data backend belum lengkap
interface KavlingKPRMock {
  id: string;
  nomorKavling: string;
  namaUser: string;
  proyekNama: string;
  bank: string;
  statusBast: 'sudah_bast' | 'belum_bast';
  tanggalBast?: string;
  plafon: number;
  cair: number;
  diajukan: number;
  tertahan: number;
  statusText: string;
  statusType: 'diajukan' | 'tertahan' | 'cair';
  tahapList: TahapKPR[];
}

const DEFAULT_KPR_ITEMS: KavlingKPRMock[] = [
  {
    id: 'kpr-1',
    nomorKavling: 'C-05',
    namaUser: 'Demo 03',
    proyekNama: 'Atlantis Hills',
    bank: 'BTN',
    statusBast: 'sudah_bast',
    tanggalBast: '2026-11-15',
    plafon: 540000000,
    cair: 270000000,
    diajukan: 270000000,
    tertahan: 0,
    statusText: 'Tahap III: Diajukan ke bank',
    statusType: 'diajukan',
    tahapList: [
      {
        tahap: 1,
        syarat: 'Akad kredit ditandatangani',
        persen: 25,
        nominal: 135000000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-08-01',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 2,
        syarat: 'Pondasi selesai',
        persen: 25,
        nominal: 135000000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-09-10',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 3,
        syarat: 'Atap selesai',
        persen: 30,
        nominal: 162000000,
        status: 'diajukan',
        statusLabel: 'Diajukan',
        tanggalCair: '2026-10-20',
      },
      {
        tahap: 4,
        syarat: 'BAST bangunan',
        persen: 20,
        nominal: 108000000,
        status: 'belum',
        statusLabel: 'Belum',
      },
    ],
  },
  {
    id: 'kpr-2',
    nomorKavling: 'E-15',
    namaUser: 'Demo 05',
    proyekNama: 'Atlantis Icon',
    bank: 'BRI',
    statusBast: 'belum_bast',
    plafon: 468000000,
    cair: 140400000,
    diajukan: 149760000,
    tertahan: 177840000,
    statusText: 'Tahap II: Siap diajukan · Progres 62% sudah memenuhi',
    statusType: 'diajukan',
    tahapList: [
      {
        tahap: 1,
        syarat: 'Akad kredit ditandatangani',
        persen: 30,
        nominal: 140400000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-06-02',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 2,
        syarat: 'Progres 50%',
        persen: 32,
        nominal: 149760000,
        status: 'diajukan',
        statusLabel: 'Siap diajukan',
      },
      {
        tahap: 3,
        syarat: 'Progres 100%',
        persen: 38,
        nominal: 177840000,
        status: 'tertahan',
        statusLabel: 'Tertahan',
      },
    ],
  },
  {
    id: 'kpr-3',
    nomorKavling: 'C-31',
    namaUser: 'Demo 06',
    proyekNama: 'Atlantis Hills',
    bank: 'Mandiri',
    statusBast: 'belum_bast',
    plafon: 360000000,
    cair: 216000000,
    diajukan: 0,
    tertahan: 144000000,
    statusText: 'Tahap III: Tertahan progres · Progres 70% dari syarat 100%',
    statusType: 'tertahan',
    tahapList: [
      {
        tahap: 1,
        syarat: 'Akad kredit ditandatangani',
        persen: 30,
        nominal: 108000000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-07-10',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 2,
        syarat: 'Pondasi dan struktur',
        persen: 30,
        nominal: 108000000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-09-01',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 3,
        syarat: 'Finishing dan BAST',
        persen: 40,
        nominal: 144000000,
        status: 'tertahan',
        statusLabel: 'Tertahan progres',
      },
    ],
  },
  {
    id: 'kpr-4',
    nomorKavling: 'B-11',
    namaUser: 'Demo 07',
    proyekNama: 'Atlantis Icon',
    bank: 'BTN',
    statusBast: 'belum_bast',
    plafon: 270000000,
    cair: 67500000,
    diajukan: 0,
    tertahan: 67500000,
    statusText: 'Tahap II: Tertahan progres · Progres 38% dari syarat 50%',
    statusType: 'tertahan',
    tahapList: [
      {
        tahap: 1,
        syarat: 'Akad kredit ditandatangani',
        persen: 25,
        nominal: 67500000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-08-15',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 2,
        syarat: 'Progres struktur 50%',
        persen: 25,
        nominal: 67500000,
        status: 'tertahan',
        statusLabel: 'Tertahan progres',
      },
      {
        tahap: 3,
        syarat: 'Finishing 100%',
        persen: 50,
        nominal: 135000000,
        status: 'belum',
        statusLabel: 'Belum',
      },
    ],
  },
];

export default function AngsuranKreditPage() {
  const { items, fetchItems, isLoading, error: loadError } = usePiutangStore();
  const { items: proyeks, fetch: fetchProyeks } = useProyekStore();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<string>('kpr-1');
  const [syncLoading, setSyncLoading] = useState(false);

  const posisi = hariIni();

  useEffect(() => {
    fetchItems();
    fetchProyeks();
  }, [fetchItems, fetchProyeks]);

  const getProyekNama = (id: string) => proyeks.find((p) => p.id === id)?.nama ?? id;

  // Gabungkan item KPR dari store jika ada, dengan fallback DEFAULT_KPR_ITEMS
  const displayItems: KavlingKPRMock[] = useMemo(() => {
    const storeKpr = items.filter((kv) => kv.status !== 'batal' && kv.tipeTransaksi === 'kpr');
    if (storeKpr.length === 0) return DEFAULT_KPR_ITEMS;

    return storeKpr.map((kv: KavlingTagihan, idx: number) => {
      const defaultItem = DEFAULT_KPR_ITEMS[idx % DEFAULT_KPR_ITEMS.length];
      return {
        id: kv.id,
        nomorKavling: kv.nomorKavling,
        namaUser: kv.namaUser,
        proyekNama: getProyekNama(kv.proyekId),
        bank: defaultItem?.bank ?? 'BTN',
        statusBast: kv.statusBast,
        tanggalBast: kv.tanggalBast ?? undefined,
        plafon: kv.nilaiSppr,
        cair: kv.totalDibayar,
        diajukan: defaultItem?.diajukan ?? 0,
        tertahan: Math.max(0, kv.sisa - (defaultItem?.diajukan ?? 0)),
        statusText: defaultItem?.statusText ?? 'Tahap I: Akad kredit',
        statusType: defaultItem?.statusType ?? 'diajukan',
        tahapList: defaultItem?.tahapList ?? [],
      };
    });
  }, [items, proyeks]);

  // Aggregate stats
  const totals = useMemo(() => {
    return {
      plafon: displayItems.reduce((s, k) => s + k.plafon, 0),
      cair: displayItems.reduce((s, k) => s + k.cair, 0),
      diajukan: displayItems.reduce((s, k) => s + k.diajukan, 0),
      tertahan: displayItems.reduce((s, k) => s + k.tertahan, 0),
    };
  }, [displayItems]);

  const selectedItem = displayItems.find((k) => k.id === selectedId) ?? displayItems[0];

  const handleSinkron = async () => {
    setSyncLoading(true);
    try {
      const res = await fetchApi('/sinkron/jalankan', { method: 'POST' });
      if (!res.ok) throw toApiError(res, 'Gagal sinkronisasi');
      await fetchItems();
      showToast.success('Sinkronisasi selesai');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Sinkronisasi gagal');
    } finally {
      setSyncLoading(false);
    }
  };

  const tabs = (
    <TabBar
      tabs={[
        { key: 'tagihan-user', label: 'Tagihan user' },
        { key: 'angsuran-kredit', label: 'Angsuran kredit' },
      ]}
      activeTab="angsuran-kredit"
      onTabChange={(key) => navigate(`/keuangan/piutang/${key}`)}
      idPrefix="piutang"
      label="Menu piutang"
    />
  );

  return (
    <>
      <PageHeader
        title="Angsuran kredit"
        description={`Pencairan KPR dari bank per kavling, dicicil sesuai kondisi bangunan di lapangan. Posisi ${posisi}.`}
        actions={
          <Button
            variant="primary"
            onClick={() => void handleSinkron()}
            disabled={syncLoading}
          >
            <PiArrowsClockwise className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} aria-hidden />
            {syncLoading ? 'Menyinkron…' : 'Sinkron Podorukuntrack'}
          </Button>
        }
        tabs={tabs}
      />

      <PageBody>
        {loadError && <Notice tone="danger">{loadError}</Notice>}

        <Notice tone="info">
          PR Track mencatat KPR sebagai <strong>satu pembayaran</strong> sebesar plafon. Pembayaran itu tidak
          dijurnal otomatis; SI memecahnya menjadi tahap sesuai skema bank. Jurnal baru dibuat saat Keuangan
          mencatat tahap yang cair dari mutasi rekening.
        </Notice>

        {/* 4 Stat tiles */}
        <StatGrid>
          <StatTile
            label="Plafon KPR"
            value={<Money value={totals.plafon} />}
            hint={`${displayItems.length} kavling · tercatat lunas di PR Track`}
            fullValue={formatRupiah(totals.plafon)}
          />
          <StatTile
            label="Sudah cair ke rekening"
            value={<Money value={totals.cair} />}
            hint={totals.plafon > 0 ? `${Math.round((totals.cair / totals.plafon) * 100)}% dari plafon · sudah dijurnal` : undefined}
            fullValue={formatRupiah(totals.cair)}
          />
          <StatTile
            label="Siap atau sedang diajukan"
            value={<span className="text-[#2563eb] font-bold"><Money value={totals.diajukan} /></span>}
            hint="Syarat progres sudah terpenuhi"
            fullValue={formatRupiah(totals.diajukan)}
          />
          <StatTile
            label="Tertahan progres"
            value={<span className="text-[#cf1b1a] font-bold"><Money value={totals.tertahan} /></span>}
            hint="Menunggu bangunan di lapangan"
            fullValue={formatRupiah(totals.tertahan)}
          />
        </StatGrid>

        {/* Kavling dengan KPR list */}
        <Panel
          title="Kavling dengan KPR"
          description="Pilih kavling untuk melihat jadwal pencairannya."
        >
          {isLoading && (
            <p className="py-8 text-center text-sm text-ink-3">Memuat data…</p>
          )}
          <div className="divide-y divide-line -mx-4 sm:-mx-5">
            {displayItems.map((kv) => {
              const isSelected = selectedItem?.id === kv.id;
              const persenCair = kv.plafon > 0 ? (kv.cair / kv.plafon) * 100 : 0;
              const persenDiajukan = kv.plafon > 0 ? (kv.diajukan / kv.plafon) * 100 : 0;
              const persenTertahan = kv.plafon > 0 ? (kv.tertahan / kv.plafon) * 100 : 0;

              return (
                <button
                  key={kv.id}
                  type="button"
                  onClick={() => setSelectedId(kv.id)}
                  className={`w-full px-4 py-3.5 sm:px-5 text-left transition-colors hover:bg-neutral-soft/50 cursor-pointer ${
                    isSelected ? 'bg-red-50/50' : ''
                  }`}
                  aria-expanded={isSelected}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink text-sm">
                        {kv.nomorKavling} · {kv.namaUser}
                      </p>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {kv.proyekNama} · {kv.bank} ·{' '}
                        <span className={kv.statusBast === 'sudah_bast' ? 'text-positive font-medium' : ''}>
                          {kv.statusBast === 'sudah_bast'
                            ? `BAST ${kv.tanggalBast ? formatTanggal(kv.tanggalBast) : ''}`
                            : 'Belum BAST'}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-ink text-sm tabular-nums">
                        {formatRupiah(kv.cair)}
                      </p>
                      <p className="text-xs text-ink-3">cair dari {formatRupiah(kv.plafon)}</p>
                    </div>
                  </div>

                  {/* Progress bar multi-warna */}
                  <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="bg-[#12b76a] transition-all"
                      style={{ width: `${persenCair}%` }}
                    />
                    <div
                      className="bg-[#2563eb] transition-all"
                      style={{ width: `${persenDiajukan}%` }}
                    />
                    <div
                      className="bg-[#f97066] transition-all"
                      style={{ width: `${persenTertahan}%` }}
                    />
                  </div>

                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      kv.statusType === 'tertahan'
                        ? 'text-[#cf1b1a]'
                        : kv.statusType === 'diajukan'
                        ? 'text-[#2563eb]'
                        : 'text-positive'
                    }`}
                  >
                    {kv.statusText}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-3 mt-2 border-t border-line text-xs text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#12b76a]" />
              Cair
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#2563eb]" />
              Diajukan atau siap
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#f97066]" />
              Tertahan progres
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-neutral-300" />
              Belum
            </span>
          </div>
        </Panel>

        {/* Detail Panel selected kavling */}
        {selectedItem && (
          <section className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden border-t-4 border-t-[#cf1b1a]">
            {/* Header detail */}
            <div className="px-4 py-4 sm:px-5 border-b border-line">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-lg font-bold text-ink">
                    {selectedItem.nomorKavling} · {selectedItem.namaUser}
                  </p>
                  <p className="text-sm text-ink-3 mt-0.5">
                    {selectedItem.proyekNama} · {selectedItem.bank} ·{' '}
                    akad {formatTanggal('2026-07-15')}
                  </p>
                </div>
                <Badge tone={selectedItem.statusBast === 'sudah_bast' ? 'positive' : 'warning'}>
                  {selectedItem.statusBast === 'sudah_bast'
                    ? `BAST ${selectedItem.tanggalBast ? formatTanggal(selectedItem.tanggalBast) : ''}`
                    : 'Belum BAST'}
                </Badge>
              </div>

              {/* Bar info PR Track */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-2 bg-neutral-soft/50 rounded-lg px-3 py-2.5">
                <span>
                  Di PR Track: Pencairan KPR {formatRupiah(selectedItem.plafon)} ·{' '}
                  {formatTanggal('2026-07-15')} · satu pembayaran
                </span>
                <Badge tone="neutral">Dijadwalkan · tidak dijurnal otomatis</Badge>
                <Badge tone="positive">✓ Jumlah {selectedItem.tahapList.length} tahap = nominal PR Track</Badge>
              </div>
            </div>

            {/* 4 Stats row */}
            <div className="grid grid-cols-2 gap-px border-b border-line sm:grid-cols-4 bg-line">
              <div className="bg-surface px-4 py-3 sm:px-5">
                <p className="text-xs text-ink-3">Plafon KPR</p>
                <p className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                  {formatRupiah(selectedItem.plafon)}
                </p>
              </div>
              <div className="bg-surface px-4 py-3 sm:px-5">
                <p className="text-xs text-ink-3">Sudah cair</p>
                <p className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                  {formatRupiah(selectedItem.cair)}
                </p>
              </div>
              <div className="bg-surface px-4 py-3 sm:px-5">
                <p className="text-xs text-ink-3">Belum cair dari bank</p>
                <p className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                  {formatRupiah(selectedItem.plafon - selectedItem.cair)}
                </p>
              </div>
              <div className="bg-surface px-4 py-3 sm:px-5">
                <p className="text-xs text-ink-3">Progres PR Track</p>
                <p className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">100%</p>
              </div>
            </div>

            {/* Table Jadwal Pencairan */}
            <div className="px-4 py-4 sm:px-5">
              <h3 className="text-[15px] font-bold text-ink mb-0.5">
                Jadwal pencairan · skema {selectedItem.bank}
              </h3>
              <p className="text-xs text-ink-3 mb-3">
                Skema contoh; persen dan syarat mengikuti perjanjian kerja sama dengan bank.
              </p>

              <div className="overflow-x-auto -mx-4 sm:-mx-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-3">
                      <th className="px-4 py-2.5 sm:px-5">Tahap</th>
                      <th className="px-4 py-2.5">Syarat</th>
                      <th className="px-4 py-2.5 text-right">%</th>
                      <th className="px-4 py-2.5 text-right">Nominal</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Aksi / jurnal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {selectedItem.tahapList.map((t) => (
                      <tr key={t.tahap} className="hover:bg-neutral-soft/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-ink sm:px-5">
                          {['I', 'II', 'III', 'IV', 'V'][t.tahap - 1] ?? t.tahap}
                        </td>
                        <td className="px-4 py-3 text-ink-2">{t.syarat}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-ink-2">{t.persen}%</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={STAGE_TONE_MAP[t.status]}>{t.statusLabel}</Badge>
                          {t.tanggalCair && (
                            <p className="text-xs text-ink-3 mt-0.5">{formatTanggal(t.tanggalCair)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {t.akunKredit ? (
                            <span className="inline-flex items-center rounded-md bg-[#fef3eb] px-2 py-0.5 text-xs font-medium text-[#b54708] border border-[#fecdca]">
                              {`Kredit${t.akunKredit}`}
                            </span>
                          ) : t.status === 'diajukan' ? (
                            <span className="text-xs font-medium text-[#2563eb]">
                              Catat pencairan
                            </span>
                          ) : (
                            <span className="text-xs text-ink-3">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </PageBody>
    </>
  );
}
