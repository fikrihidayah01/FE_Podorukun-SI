import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ────────────────────────────────────────────────────
export type StatusPinjaman = 'aktif' | 'lunas';
export type JenisPembayaran = 'pokok' | 'bunga';

export interface PinjamanBank {
  id: string;
  proyekId: string;
  namaBank: string;
  tanggalPencairan: string;
  nominalPencairan: number;
  sisaPokok: number;
  tanggalJatuhTempo: string;
  status: StatusPinjaman;
  keterangan?: string;
  createdAt: string;
}

export interface PinjamanBankEntry {
  id: string;
  pinjamanId: string;
  tanggal: string;
  jenis: JenisPembayaran;
  nominal: number;
  periodeBunga?: string; // e.g. "Juni 2026", free text
  keterangan?: string;
  createdAt: string;
}

// ── Store ────────────────────────────────────────────────────
interface PinjamanBankState {
  pinjamans: PinjamanBank[];
  entries: PinjamanBankEntry[];

  addPinjaman: (data: Omit<PinjamanBank, 'id' | 'sisaPokok' | 'status' | 'createdAt'>) => void;
  updatePinjaman: (id: string, data: Partial<Pick<PinjamanBank, 'tanggalJatuhTempo' | 'keterangan'>>) => void;
  removePinjaman: (id: string) => void;

  addEntry: (data: Omit<PinjamanBankEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;

  getEntriesByPinjaman: (pinjamanId: string) => PinjamanBankEntry[];
  getDueSoon: (hari: number) => PinjamanBank[];
  getTotalSisaPokok: () => number;
}

// ── Dummy Data ───────────────────────────────────────────────
const DUMMY_PINJAMAN: PinjamanBank[] = [
  {
    id: 'pb1',
    proyekId: 'p2',
    namaBank: 'Bank Mandiri',
    tanggalPencairan: '2025-03-15',
    nominalPencairan: 45000000000,
    sisaPokok: 40600400000,
    tanggalJatuhTempo: '2026-09-15',
    status: 'aktif',
    keterangan: 'Kredit konstruksi Atlantis Icon',
    createdAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'pb2',
    proyekId: 'p1',
    namaBank: 'Bank BRI',
    tanggalPencairan: '2025-06-01',
    nominalPencairan: 5000000000,
    sisaPokok: 3200000000,
    tanggalJatuhTempo: '2026-09-12',
    status: 'aktif',
    keterangan: 'Kredit modal kerja Atlantis Hills',
    createdAt: '2025-06-01T00:00:00Z',
  },
];

const DUMMY_ENTRIES: PinjamanBankEntry[] = [
  {
    id: 'pe1', pinjamanId: 'pb1', tanggal: '2026-06-15',
    jenis: 'pokok', nominal: 300000000, keterangan: 'Angsuran pokok Juni',
    createdAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'pe2', pinjamanId: 'pb1', tanggal: '2026-06-15',
    jenis: 'bunga', nominal: 187500000, periodeBunga: 'Juni 2026',
    keterangan: 'Bunga pinjaman', createdAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'pe3', pinjamanId: 'pb2', tanggal: '2026-05-01',
    jenis: 'pokok', nominal: 200000000, keterangan: 'Angsuran pokok Mei',
    createdAt: '2026-05-01T00:00:00Z',
  },
];

// ── Implementation ───────────────────────────────────────────
export const usePinjamanBankStore = create<PinjamanBankState>()(
  persist(
    (set, get) => ({
      pinjamans: DUMMY_PINJAMAN,
      entries: DUMMY_ENTRIES,

      addPinjaman: (data) =>
        set((state) => ({
          pinjamans: [
            ...state.pinjamans,
            {
              ...data,
              id: crypto.randomUUID(),
              sisaPokok: data.nominalPencairan,
              status: 'aktif' as StatusPinjaman,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

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

          // Update sisa pokok if jenis = 'pokok'
          let updatedPinjamans = state.pinjamans;
          if (data.jenis === 'pokok') {
            updatedPinjamans = state.pinjamans.map((p) => {
              if (p.id === data.pinjamanId) {
                const newSisa = p.sisaPokok - data.nominal;
                return {
                  ...p,
                  sisaPokok: Math.max(0, newSisa),
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

      getDueSoon: (hari) => {
        const now = new Date();
        const target = new Date(now);
        target.setDate(target.getDate() + hari);

        return get().pinjamans.filter((p) => {
          if (p.status === 'lunas') return false;
          const jt = new Date(p.tanggalJatuhTempo);
          return jt >= now && jt <= target;
        });
      },

      getTotalSisaPokok: () =>
        get()
          .pinjamans.filter((p) => p.status === 'aktif')
          .reduce((sum, p) => sum + p.sisaPokok, 0),
    }),
    { name: 'si-pinjaman-bank' }
  )
);
