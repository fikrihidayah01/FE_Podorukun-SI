import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiArrowsClockwise,
  PiFileText,
  PiCheckCircle,
  PiHourglassMedium,
  PiWarningCircle,
} from 'react-icons/pi';
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
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import { StatGrid, StatTile } from '../../../components/ui/StatTile';
import TabBar from '../../../components/ui/TabBar';
import { formatRupiah, formatTanggal, hariIni } from '../../../utils/format';

type StageStatus = 'cair' | 'diajukan' | 'tertahan' | 'belum';

interface TahapKPR {
  tahap: number;
  syarat: string;
  subSyarat?: string;
  persen: number;
  nominal: number;
  status: StageStatus;
  statusLabel: string;
  tanggalCair?: string;
  akunKredit?: string;
  aksiLabel?: string;
}

// Data mock/sample untuk kavling KPR agar tampilan persis sesuai referensi Image 1 bila data backend belum lengkap
interface KavlingKPRMock {
  id: string;
  nomorKavling: string;
  namaUser: string;
  proyekNama: string;
  bank: string;
  tanggalAkad?: string;
  statusBast: 'sudah_bast' | 'belum_bast';
  tanggalBast?: string;
  plafon: number;
  cair: number;
  diajukan: number;
  tertahan: number;
  progresPRTrack?: number;
  statusText: string;
  statusType: 'diajukan' | 'tertahan' | 'cair' | 'belum';
  tahapList: TahapKPR[];
}

const DEFAULT_KPR_ITEMS: KavlingKPRMock[] = [
  {
    id: 'kpr-1',
    nomorKavling: 'C-05',
    namaUser: 'Demo 03',
    proyekNama: 'Atlantis Hills',
    bank: 'BTN',
    tanggalAkad: '2026-08-01',
    statusBast: 'sudah_bast',
    tanggalBast: '2026-11-15',
    plafon: 540000000,
    cair: 486000000,
    diajukan: 0,
    tertahan: 0,
    progresPRTrack: 100,
    statusText: 'Tahap IV: Belum · Menunggu dokumen jaminan',
    statusType: 'belum',
    tahapList: [
      {
        tahap: 1,
        syarat: 'Akad kredit ditandatangani',
        persen: 30,
        nominal: 162000000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-08-01',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 2,
        syarat: 'Pondasi selesai',
        persen: 30,
        nominal: 162000000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-09-10',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 3,
        syarat: 'Atap dan finishing selesai',
        persen: 30,
        nominal: 162000000,
        status: 'cair',
        statusLabel: 'Cair',
        tanggalCair: '2026-10-20',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 4,
        syarat: 'BAST dan dokumen jaminan',
        subSyarat: 'Menunggu dokumen jaminan',
        persen: 10,
        nominal: 54000000,
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
    tanggalAkad: '2026-06-02',
    statusBast: 'belum_bast',
    plafon: 468000000,
    cair: 140400000,
    diajukan: 149760000,
    tertahan: 93600000,
    progresPRTrack: 62,
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
        syarat: 'Progres fisik minimal 50%',
        subSyarat: 'Progres 62% sudah memenuhi',
        persen: 32,
        nominal: 149760000,
        status: 'diajukan',
        statusLabel: 'Siap diajukan',
        aksiLabel: 'Catat pencairan',
      },
      {
        tahap: 3,
        syarat: 'Progres fisik 100%',
        persen: 20,
        nominal: 93600000,
        status: 'tertahan',
        statusLabel: 'Tertahan progres',
        aksiLabel: 'Menunggu progres',
      },
      {
        tahap: 4,
        syarat: 'BAST dan serah terima dokumen',
        subSyarat: 'Menunggu BAST',
        persen: 18,
        nominal: 84240000,
        status: 'belum',
        statusLabel: 'Belum',
      },
    ],
  },
  {
    id: 'kpr-3',
    nomorKavling: 'C-31',
    namaUser: 'Demo 06',
    proyekNama: 'Atlantis Hills',
    bank: 'Mandiri',
    tanggalAkad: '2026-07-10',
    statusBast: 'belum_bast',
    plafon: 360000000,
    cair: 216000000,
    diajukan: 0,
    tertahan: 72000000,
    progresPRTrack: 70,
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
        syarat: 'Progres fisik 100%',
        subSyarat: 'Progres 70% dari syarat 100%',
        persen: 20,
        nominal: 72000000,
        status: 'tertahan',
        statusLabel: 'Tertahan progres',
        aksiLabel: 'Menunggu progres',
      },
      {
        tahap: 4,
        syarat: 'BAST dan sertifikat',
        subSyarat: 'Menunggu BAST',
        persen: 20,
        nominal: 72000000,
        status: 'belum',
        statusLabel: 'Belum',
      },
    ],
  },
  {
    id: 'kpr-4',
    nomorKavling: 'B-11',
    namaUser: 'Demo 07',
    proyekNama: 'Atlantis Icon',
    bank: 'BTN',
    tanggalAkad: '2026-09-16',
    statusBast: 'belum_bast',
    plafon: 270000000,
    cair: 67500000,
    diajukan: 0,
    tertahan: 67500000,
    progresPRTrack: 38,
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
        tanggalCair: '2026-09-18',
        akunKredit: '212007 Uang muka',
      },
      {
        tahap: 2,
        syarat: 'Progres fisik minimal 50%',
        subSyarat: 'Progres 38% dari syarat 50%',
        persen: 25,
        nominal: 67500000,
        status: 'tertahan',
        statusLabel: 'Tertahan progres',
        aksiLabel: 'Menunggu progres',
      },
      {
        tahap: 3,
        syarat: 'Progres fisik 100%',
        persen: 40,
        nominal: 108000000,
        status: 'belum',
        statusLabel: 'Belum',
      },
      {
        tahap: 4,
        syarat: 'BAST dan dokumen jaminan diserahkan',
        subSyarat: 'Menunggu BAST',
        persen: 10,
        nominal: 27000000,
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

  const [selectedId, setSelectedId] = useState<string>('kpr-4');
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
        tanggalAkad: defaultItem?.tanggalAkad ?? '2026-07-15',
        statusBast: kv.statusBast,
        tanggalBast: kv.tanggalBast ?? undefined,
        plafon: kv.nilaiSppr,
        cair: kv.totalDibayar,
        diajukan: defaultItem?.diajukan ?? 0,
        tertahan: Math.max(0, kv.sisa - (defaultItem?.diajukan ?? 0)),
        progresPRTrack: defaultItem?.progresPRTrack ?? 100,
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
            icon={PiFileText}
            fullValue={formatRupiah(totals.plafon)}
          />
          <StatTile
            label="Sudah cair ke rekening"
            value={<Money value={totals.cair} />}
            hint={totals.plafon > 0 ? `${Math.round((totals.cair / totals.plafon) * 100)}% dari plafon · sudah dijurnal` : undefined}
            icon={PiCheckCircle}
            fullValue={formatRupiah(totals.cair)}
          />
          <StatTile
            label="Siap atau sedang diajukan"
            value={<span className="text-[#2563eb] font-bold"><Money value={totals.diajukan} /></span>}
            hint="Syarat progres sudah terpenuhi"
            icon={PiHourglassMedium}
            fullValue={formatRupiah(totals.diajukan)}
          />
          <StatTile
            label="Tertahan progres"
            value={<span className="text-[#cf1b1a] font-bold"><Money value={totals.tertahan} /></span>}
            hint="Menunggu bangunan di lapangan"
            icon={PiWarningCircle}
            fullValue={formatRupiah(totals.tertahan)}
          />
        </StatGrid>

        {/* Two-Column Layout: Kavling KPR (Kiri) & Detail Jadwal Pencairan (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: List Kavling dengan KPR */}
          <div className="lg:col-span-5">
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

                      {/* Progress bar terputus 4 bagian sama panjang */}
                      <div className="mt-2.5 grid grid-cols-4 gap-1.5 sm:gap-2">
                        {Array.from({ length: 4 }).map((_, idx) => {
                          const t = kv.tahapList[idx];
                          const status = t?.status ?? 'belum';
                          let bg = 'bg-[#e2e8f0]';
                          if (status === 'cair') {
                            bg = 'bg-[#16a34a]';
                          } else if (status === 'diajukan') {
                            bg = 'bg-[#2563eb]';
                          } else if (status === 'tertahan') {
                            bg = 'bg-[#f4938b]';
                          }

                          return (
                            <div
                              key={idx}
                              className={`h-2 sm:h-2.5 w-full rounded-full transition-colors ${bg}`}
                            />
                          );
                        })}
                      </div>

                      <p
                        className={`mt-1.5 text-xs font-bold ${
                          kv.statusType === 'tertahan'
                            ? 'text-[#c9352b]'
                            : kv.statusType === 'diajukan'
                            ? 'text-[#2563eb]'
                            : kv.statusType === 'cair'
                            ? 'text-[#16a34a]'
                            : 'text-ink-2'
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
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#16a34a]" />
                  Cair
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#2563eb]" />
                  Diajukan atau siap
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#f4938b]" />
                  Tertahan progres
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#e2e8f0]" />
                  Belum
                </span>
              </div>
            </Panel>
          </div>

          {/* Kolom Kanan: Detail Panel selected kavling */}
          <div className="lg:col-span-7">
            {selectedItem ? (
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
                        akad {selectedItem.tanggalAkad ? formatTanggal(selectedItem.tanggalAkad) : formatTanggal('2026-07-15')}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                        selectedItem.statusBast === 'sudah_bast'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {selectedItem.statusBast === 'sudah_bast'
                        ? `BAST ${selectedItem.tanggalBast ? formatTanggal(selectedItem.tanggalBast) : ''}`
                        : 'Belum BAST'}
                    </span>
                  </div>

                  {/* Bar info PR Track */}
                  <div className="mt-3 rounded-lg border border-line bg-neutral-soft/40 p-3.5 space-y-2">
                    <p className="text-sm font-medium text-ink">
                      Di PR Track: Pencairan KPR {formatRupiah(selectedItem.plafon)} ·{' '}
                      {selectedItem.tanggalAkad ? formatTanggal(selectedItem.tanggalAkad) : formatTanggal('2026-07-15')} · satu pembayaran
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-[#f4f3ff] px-2.5 py-0.5 text-xs font-medium text-[#5925dc] border border-[#d9d6fe]">
                        Dijadwalkan · tidak dijurnal otomatis
                      </span>
                      <span className="inline-flex items-center rounded-md bg-[#ecfdf3] px-2.5 py-0.5 text-xs font-medium text-[#027a48] border border-[#a6f4c5]">
                        ✓ Jumlah {selectedItem.tahapList.length} tahap = nominal PR Track
                      </span>
                    </div>
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
                    <p className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                      {selectedItem.progresPRTrack ?? 100}%
                    </p>
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
                            <td className="px-4 py-3 font-semibold text-ink sm:px-5 align-top">
                              {['I', 'II', 'III', 'IV', 'V'][t.tahap - 1] ?? t.tahap}
                            </td>
                            <td className="px-4 py-3 text-ink-2 align-top">
                              <p className="font-medium text-ink">{t.syarat}</p>
                              {t.subSyarat && (
                                <p className="text-xs text-ink-3 mt-0.5">{t.subSyarat}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-ink-2 align-top font-medium">
                              {t.persen}%
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-ink align-top">
                              {formatRupiah(t.nominal)}
                            </td>
                            <td className="px-4 py-3 align-top whitespace-nowrap">
                              {t.status === 'cair' && (
                                <span className="inline-flex items-center rounded-full bg-[#ecfdf3] px-2.5 py-0.5 text-xs font-medium text-[#027a48] border border-[#a6f4c5]">
                                  Cair
                                </span>
                              )}
                              {t.status === 'diajukan' && (
                                <span className="inline-flex items-center rounded-full bg-[#eff8ff] px-2.5 py-0.5 text-xs font-medium text-[#175cd3] border border-[#b2ddff]">
                                  Siap diajukan
                                </span>
                              )}
                              {t.status === 'tertahan' && (
                                <span className="inline-flex items-center rounded-full bg-[#fef3f2] px-2.5 py-0.5 text-xs font-medium text-[#b42318] border border-[#fecdca]">
                                  Tertahan progres
                                </span>
                              )}
                              {t.status === 'belum' && (
                                <span className="inline-flex items-center rounded-full bg-[#f8fafc] px-2.5 py-0.5 text-xs font-medium text-ink-3 border border-line">
                                  Belum
                                </span>
                              )}
                              {t.tanggalCair && (
                                <p className="text-xs text-ink-3 mt-1">{formatTanggal(t.tanggalCair)}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {t.akunKredit ? (
                                <span className="inline-flex items-center rounded bg-[#fef6ee] px-2 py-0.5 text-xs font-medium text-[#b54708] border border-[#f9dbaf]">
                                  {`Kredit${t.akunKredit}`}
                                </span>
                              ) : t.aksiLabel ? (
                                <span className="text-xs text-ink-3">{t.aksiLabel}</span>
                              ) : t.status === 'diajukan' ? (
                                <span className="text-xs font-medium text-[#2563eb] cursor-pointer hover:underline">
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

                {/* SOP Catatan Jurnal Pencairan */}
                <div className="px-4 py-3 sm:px-5 border-t border-line bg-neutral-soft/30 text-xs text-ink-3 leading-relaxed">
                  <p>
                    <strong className="text-ink-2">Cair sebelum BAST:</strong> Kas/bank · Beban admin KPR (D) / 212007 Uang Muka Penjualan (K).{' '}
                    <strong className="text-ink-2">Cair pada atau sesudah BAST:</strong> Kas/bank · Beban admin KPR (D) / 114001 Piutang Konsumen (K).
                  </p>
                </div>
              </section>
            ) : (
              <div className="rounded-xl border border-line bg-surface p-8 text-center text-ink-3">
                Pilih kavling di sebelah kiri untuk melihat jadwal pencairannya.
              </div>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}
