import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Adendum {
  id: string;
  kontrakId: string;
  noAdendum: string;
  tanggal: string; // ISO date
  nilaiLama: number;
  nilaiBaru: number;
  alasan: string;
  lampiran?: string; // dummy file name
  createdAt: string;
}

export interface PembayaranKontrak {
  id: string;
  kontrakId: string;
  tanggal: string; // ISO date
  nominal: number;
  akunKasId: string;
  noBukti: string;
  keterangan?: string;
  createdAt: string;
}

export interface Kontrak {
  id: string;
  noSpk: string;
  proyekId: string;
  kavling: string;
  tipe: string;
  tanggalSpk: string;
  kontraktorId: string; // We can just use string name or assume string ID, let's use string name for simplicity or a dummy reference
  namaKontraktor: string;
  rab: number;
  nilaiKontrak: number; // initial contract value
  keterangan?: string;
  akunPersediaanId?: string; // used for initial journal
  akunHutangId?: string;
  status?: 'aktif' | 'batal';
  createdAt: string;
}

interface KontrakState {
  kontraks: Kontrak[];
  adendums: Adendum[];
  pembayarans: PembayaranKontrak[];

  addKontrak: (data: Omit<Kontrak, 'id' | 'createdAt' | 'status'>) => string;
  addAdendum: (data: Omit<Adendum, 'id' | 'createdAt'>) => string;
  addPembayaran: (data: Omit<PembayaranKontrak, 'id' | 'createdAt'>) => string;
  cancelKontrak: (id: string) => void;
}

// Dummy data
const DUMMY_KONTRAKS: Kontrak[] = [
  {
    id: 'k1',
    noSpk: 'SPK/2026/01/001',
    proyekId: 'p1', // Atlantis Hills
    kavling: 'A-01',
    tipe: 'Type 45',
    tanggalSpk: '2026-01-15',
    kontraktorId: 'sub1',
    namaKontraktor: 'PT Bangun Sejahtera',
    rab: 150_000_000,
    nilaiKontrak: 145_000_000,
    keterangan: 'Pembangunan unit A-01 lengkap',
    akunPersediaanId: '13',
    akunHutangId: '14',
    status: 'aktif',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'k2',
    noSpk: 'SPK/2026/02/014',
    proyekId: 'p2', // Atlantis Icon
    kavling: 'B-12',
    tipe: 'Type 36',
    tanggalSpk: '2026-02-10',
    kontraktorId: 'sub2',
    namaKontraktor: 'CV Makmur Jaya',
    rab: 120_000_000,
    nilaiKontrak: 125_000_000,
    keterangan: 'Borongan tenaga kerja dan material',
    akunPersediaanId: '13',
    akunHutangId: '14',
    status: 'aktif',
    createdAt: '2026-02-10T00:00:00Z',
  }
];

const DUMMY_ADENDUMS: Adendum[] = [
  {
    id: 'ad1',
    kontrakId: 'k1',
    noAdendum: 'ADD/2026/03/001',
    tanggal: '2026-03-05',
    nilaiLama: 145_000_000,
    nilaiBaru: 155_000_000,
    alasan: 'Penambahan spesifikasi atap',
    createdAt: '2026-03-05T00:00:00Z',
  }
];

const DUMMY_PEMBAYARANS: PembayaranKontrak[] = [
  {
    id: 'pb1',
    kontrakId: 'k1',
    tanggal: '2026-02-15',
    nominal: 50_000_000,
    akunKasId: '2', // Bank BRI
    noBukti: 'BKK/2026/02/041',
    keterangan: 'DP 30%',
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'pb2',
    kontrakId: 'k1',
    tanggal: '2026-04-10',
    nominal: 50_000_000,
    akunKasId: '2',
    noBukti: 'BKK/2026/04/012',
    keterangan: 'Termin 1 (Progress 50%)',
    createdAt: '2026-04-10T00:00:00Z',
  }
];

export const useKontrakStore = create<KontrakState>()(
  persist(
    (set) => ({
      kontraks: DUMMY_KONTRAKS,
      adendums: DUMMY_ADENDUMS,
      pembayarans: DUMMY_PEMBAYARANS,

      addKontrak: (data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          kontraks: [...state.kontraks, { ...data, id, status: 'aktif', createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      addAdendum: (data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          adendums: [...state.adendums, { ...data, id, createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      addPembayaran: (data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          pembayarans: [...state.pembayarans, { ...data, id, createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      cancelKontrak: (id) => {
        set((state) => ({
          kontraks: state.kontraks.map(k => k.id === id ? { ...k, status: 'batal' } : k),
        }));
      },
    }),
    { name: 'si-kontrak' }
  )
);
