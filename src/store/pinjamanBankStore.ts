import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ────────────────────────────────────────────────────
export type StatusPinjaman = 'aktif' | 'lunas';
export type JenisPembayaran = 'pokok' | 'bunga';
export type PolaPembayaran = 'terpisah' | 'satu_transfer' | 'bunga_rutin' | 'fleksibel';

export const POLA_PEMBAYARAN_LABELS: Record<PolaPembayaran, string> = {
  terpisah: 'Terpisah',
  satu_transfer: 'Satu transfer',
  bunga_rutin: 'Bunga rutin',
  fleksibel: 'Fleksibel',
};

export const POLA_PEMBAYARAN_COLOR: Record<PolaPembayaran, string> = {
  terpisah: 'bg-sky-100 text-sky-800 border-sky-200',
  satu_transfer: 'bg-amber-100 text-amber-800 border-amber-200',
  bunga_rutin: 'bg-purple-100 text-purple-800 border-purple-200',
  fleksibel: 'bg-gray-100 text-gray-800 border-gray-200',
};

export interface TopUpPinjaman {
  id: string;
  pinjamanId: string;
  tanggal: string; // ISO date
  nominal: number;
  keterangan?: string;
}

export interface PinjamanBankEntry {
  id: string;
  pinjamanId: string;
  tanggal: string; // ISO date
  jenis: JenisPembayaran | 'gabungan'; // gabungan for satu_transfer
  nominal: number; // total transfer
  nominalPokok?: number;
  nominalBunga?: number;
  periodeBunga?: string; // e.g. "Juni 2026"
  keterangan?: string;
  noBukti?: string;
  akunKasId?: string;
  statusRincian?: 'lengkap' | 'menunggu_rincian';
  createdAt: string;
}

export interface PinjamanBank {
  id: string;
  proyekId: string;
  namaBank: string;
  pola: PolaPembayaran;
  tanggalPencairanAwal: string; // ISO date
  nominalPencairanAwal: number;
  topUps: TopUpPinjaman[];
  totalPencairan: number; // nominalPencairanAwal + sum(topUps)
  sisaPokok: number;
  penebusan: number; // totalPencairan - sisaPokok
  tanggalAcuanBunga: number; // 1-31 berulang bulanan
  tanggalJatuhTempoPokok: string; // ISO date
  akunHutangId?: string;
  akunBebanBungaId?: string;
  status: StatusPinjaman;
  keterangan?: string;
  createdAt: string;
}

export interface DueReminder {
  pinjaman: PinjamanBank;
  jenis: 'bunga' | 'pokok';
  tanggalFormatted: string; // dd/mm/yyyy
  label: string;
  hariLagi: number;
}

// ── Store Interface ──────────────────────────────────────────
interface PinjamanBankState {
  pinjamans: PinjamanBank[];
  entries: PinjamanBankEntry[];

  addPinjaman: (data: {
    proyekId: string;
    namaBank: string;
    pola: PolaPembayaran;
    tanggalPencairanAwal: string;
    nominalPencairanAwal: number;
    tanggalAcuanBunga: number;
    tanggalJatuhTempoPokok: string;
    akunHutangId?: string;
    akunBebanBungaId?: string;
    keterangan?: string;
  }) => void;

  addTopUp: (pinjamanId: string, data: { tanggal: string; nominal: number; keterangan?: string }) => void;

  updatePinjaman: (
    id: string,
    data: Partial<Pick<PinjamanBank, 'tanggalAcuanBunga' | 'tanggalJatuhTempoPokok' | 'keterangan' | 'pola'>>
  ) => void;

  removePinjaman: (id: string) => void;

  addEntry: (data: Omit<PinjamanBankEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;

  getEntriesByPinjaman: (pinjamanId: string) => PinjamanBankEntry[];
  getDueReminders: (hari?: number) => DueReminder[];
  getTotalSisaPokok: () => number;
}

// ── Dummy Data ───────────────────────────────────────────────
// Exact match with media_1788804430820.png

const DUMMY_PINJAMAN: PinjamanBank[] = [
  {
    id: 'pb1',
    proyekId: 'p2', // Atlantis Icon
    namaBank: 'Bank Mandiri',
    pola: 'terpisah',
    tanggalPencairanAwal: '2025-03-15',
    nominalPencairanAwal: 45_000_000_000,
    topUps: [],
    totalPencairan: 45_000_000_000,
    sisaPokok: 40_600_400_000,
    penebusan: 4_399_600_000,
    tanggalAcuanBunga: 15,
    tanggalJatuhTempoPokok: '2026-09-15',
    akunHutangId: '7', // Hutang Bank (COA)
    akunBebanBungaId: '11',
    status: 'aktif',
    keterangan: 'Kredit konstruksi Atlantis Icon',
    createdAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'pb2',
    proyekId: 'p1', // Atlantis Hills
    namaBank: 'Bank BRI',
    pola: 'bunga_rutin',
    tanggalPencairanAwal: '2025-06-01',
    nominalPencairanAwal: 3_200_000_000,
    topUps: [],
    totalPencairan: 3_200_000_000,
    sisaPokok: 3_200_000_000,
    penebusan: 0,
    tanggalAcuanBunga: 12,
    tanggalJatuhTempoPokok: '2026-09-12',
    akunHutangId: '7',
    akunBebanBungaId: '11',
    status: 'aktif',
    keterangan: 'Kredit modal kerja Atlantis Hills',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'pb3',
    proyekId: 'p1', // Atlantis Hills
    namaBank: 'Bank BSN',
    pola: 'satu_transfer',
    tanggalPencairanAwal: '2025-01-10',
    nominalPencairanAwal: 8_500_000_000,
    topUps: [],
    totalPencairan: 8_500_000_000,
    sisaPokok: 6_240_000_000,
    penebusan: 2_260_000_000,
    tanggalAcuanBunga: 7,
    tanggalJatuhTempoPokok: '2028-03-07',
    akunHutangId: '7',
    akunBebanBungaId: '11',
    status: 'aktif',
    keterangan: 'Pinjaman modal kerja jangka panjang',
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'pb4',
    proyekId: 'p3', // Aya Sophia
    namaBank: 'BPR Artha',
    pola: 'fleksibel',
    tanggalPencairanAwal: '2025-05-20',
    nominalPencairanAwal: 1_500_000_000,
    topUps: [],
    totalPencairan: 1_500_000_000,
    sisaPokok: 980_000_000,
    penebusan: 520_000_000,
    tanggalAcuanBunga: 25,
    tanggalJatuhTempoPokok: '2027-11-25',
    akunHutangId: '7',
    akunBebanBungaId: '11',
    status: 'aktif',
    keterangan: 'Kredit bridging operasional',
    createdAt: '2025-05-20T00:00:00Z',
  },
];

const DUMMY_ENTRIES: PinjamanBankEntry[] = [
  {
    id: 'pe1',
    pinjamanId: 'pb1',
    tanggal: '2026-06-15',
    jenis: 'pokok',
    nominal: 4_399_600_000,
    keterangan: 'Penebusan pokok bertahap',
    createdAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'pe2',
    pinjamanId: 'pb1',
    tanggal: '2026-06-15',
    jenis: 'bunga',
    nominal: 187_500_000,
    periodeBunga: 'Juni 2026',
    keterangan: 'Bunga rutin bulanan',
    createdAt: '2026-06-15T00:00:00Z',
  },
];

// ── Store Implementation ─────────────────────────────────────
export const usePinjamanBankStore = create<PinjamanBankState>()(
  persist(
    (set, get) => ({
      pinjamans: DUMMY_PINJAMAN,
      entries: DUMMY_ENTRIES,

      addPinjaman: (data) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newPinjaman: PinjamanBank = {
          ...data,
          id,
          topUps: [],
          totalPencairan: data.nominalPencairanAwal,
          sisaPokok: data.nominalPencairanAwal,
          penebusan: 0,
          status: 'aktif',
          createdAt: now,
        };

        set((state) => ({
          pinjamans: [...state.pinjamans, newPinjaman],
        }));
      },

      addTopUp: (pinjamanId, data) => {
        const topUpId = crypto.randomUUID();
        set((state) => ({
          pinjamans: state.pinjamans.map((p) => {
            if (p.id !== pinjamanId) return p;
            const updatedTopUps = [...p.topUps, { ...data, id: topUpId, pinjamanId }];
            const totalPencairan = p.nominalPencairanAwal + updatedTopUps.reduce((s, t) => s + t.nominal, 0);
            const sisaPokok = p.sisaPokok + data.nominal;
            const penebusan = totalPencairan - sisaPokok;
            return {
              ...p,
              topUps: updatedTopUps,
              totalPencairan,
              sisaPokok,
              penebusan,
            };
          }),
        }));
      },

      updatePinjaman: (id, data) =>
        set((state) => ({
          pinjamans: state.pinjamans.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      removePinjaman: (id) =>
        set((state) => ({
          pinjamans: state.pinjamans.filter((p) => p.id !== id),
          entries: state.entries.filter((e) => e.pinjamanId !== id),
        })),

      addEntry: (data) =>
        set((state) => {
          const newEntry: PinjamanBankEntry = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          };

          let updatedPinjamans = state.pinjamans;
          if (data.jenis === 'pokok' || data.jenis === 'gabungan') {
            updatedPinjamans = state.pinjamans.map((p) => {
              if (p.id === data.pinjamanId) {
                const reducePokok = data.jenis === 'gabungan' ? (data.nominalPokok || 0) : data.nominal;
                const newSisa = Math.max(0, p.sisaPokok - reducePokok);
                const penebusan = p.totalPencairan - newSisa;
                return {
                  ...p,
                  sisaPokok: newSisa,
                  penebusan,
                  status: newSisa <= 0 ? ('lunas' as StatusPinjaman) : p.status,
                };
              }
              return p;
            });
          }

          return {
            entries: [...state.entries, newEntry],
            pinjamans: updatedPinjamans,
          };
        }),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      getEntriesByPinjaman: (pinjamanId) =>
        get()
          .entries.filter((e) => e.pinjamanId === pinjamanId)
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),

      getDueReminders: (hari = 14) => {
        const now = new Date();
        const active = get().pinjamans.filter((p) => p.status === 'aktif');
        const reminders: DueReminder[] = [];

        active.forEach((p) => {
          // 1. Reminder Bunga (berulang tiap bulan pada tanggalAcuanBunga)
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          const bungaDateThisMonth = new Date(currentYear, currentMonth, p.tanggalAcuanBunga);
          const bungaDateNextMonth = new Date(currentYear, currentMonth + 1, p.tanggalAcuanBunga);

          const targetBunga = bungaDateThisMonth >= now ? bungaDateThisMonth : bungaDateNextMonth;
          const diffBunga = Math.ceil((targetBunga.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (diffBunga >= 0 && diffBunga <= hari) {
            const dd = String(targetBunga.getDate()).padStart(2, '0');
            const mm = String(targetBunga.getMonth() + 1).padStart(2, '0');
            const yyyy = targetBunga.getFullYear();
            reminders.push({
              pinjaman: p,
              jenis: 'bunga',
              tanggalFormatted: `${dd}/${mm}/${yyyy}`,
              label: `${p.namaBank} — bunga jatuh tempo ${dd}/${mm}/${yyyy}`,
              hariLagi: diffBunga,
            });
          }

          // 2. Reminder Pokok (jatuh tempo pokok tunggal)
          const pokokDate = new Date(p.tanggalJatuhTempoPokok);
          const diffPokok = Math.ceil((pokokDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (diffPokok >= 0 && diffPokok <= hari) {
            const dd = String(pokokDate.getDate()).padStart(2, '0');
            const mm = String(pokokDate.getMonth() + 1).padStart(2, '0');
            const yyyy = pokokDate.getFullYear();
            reminders.push({
              pinjaman: p,
              jenis: 'pokok',
              tanggalFormatted: `${dd}/${mm}/${yyyy}`,
              label: `${p.namaBank} — pokok jatuh tempo ${dd}/${mm}/${yyyy}`,
              hariLagi: diffPokok,
            });
          }
        });

        return reminders.sort((a, b) => a.hariLagi - b.hariLagi);
      },

      getTotalSisaPokok: () =>
        get()
          .pinjamans.filter((p) => p.status === 'aktif')
          .reduce((sum, p) => sum + p.sisaPokok, 0),
    }),
    { name: 'si-pinjaman-bank-v2' }
  )
);
