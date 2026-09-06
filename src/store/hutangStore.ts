import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StatusHutang = 'belum_lunas' | 'sebagian' | 'lunas';

export interface Hutang {
  id: string;
  namaKreditur: string;
  jumlah: number;
  tanggalHutang: string;   // ISO date string
  tanggalJatuhTempo: string;
  keterangan: string;
  status: StatusHutang;
  createdAt: string;
}

interface HutangState {
  items: Hutang[];
  add: (data: Omit<Hutang, 'id' | 'createdAt'>) => void;
  update: (id: string, data: Partial<Omit<Hutang, 'id' | 'createdAt'>>) => void;
  remove: (id: string) => void;
}

const DUMMY: Hutang[] = [
  {
    id: '1',
    namaKreditur: 'Bank BRI',
    jumlah: 50000000,
    tanggalHutang: '2026-01-10',
    tanggalJatuhTempo: '2026-12-10',
    keterangan: 'Pinjaman modal kerja',
    status: 'belum_lunas',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    namaKreditur: 'PT Sumber Makmur',
    jumlah: 15000000,
    tanggalHutang: '2026-03-05',
    tanggalJatuhTempo: '2026-09-05',
    keterangan: 'Pembelian material bangunan',
    status: 'sebagian',
    createdAt: new Date().toISOString(),
  },
];

export const useHutangStore = create<HutangState>()(
  persist(
    (set) => ({
      items: DUMMY,

      add: (data) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              ...data,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      update: (id, data) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...data } : item
          ),
        })),

      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
    }),
    { name: 'si-hutang' }
  )
);
