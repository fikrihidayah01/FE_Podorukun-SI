import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StatusPiutang = 'belum_lunas' | 'sebagian' | 'lunas';

export interface Piutang {
  id: string;
  namaDebitur: string;
  jumlah: number;
  tanggalPiutang: string;
  tanggalJatuhTempo: string;
  keterangan: string;
  status: StatusPiutang;
  createdAt: string;
}

interface PiutangState {
  items: Piutang[];
  add: (data: Omit<Piutang, 'id' | 'createdAt'>) => void;
  update: (id: string, data: Partial<Omit<Piutang, 'id' | 'createdAt'>>) => void;
  remove: (id: string) => void;
}

const DUMMY: Piutang[] = [
  {
    id: '1',
    namaDebitur: 'CV Karya Jaya',
    jumlah: 25000000,
    tanggalPiutang: '2026-02-15',
    tanggalJatuhTempo: '2026-08-15',
    keterangan: 'Jasa konstruksi proyek Gedung A',
    status: 'belum_lunas',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    namaDebitur: 'Bpk. Hendra Wijaya',
    jumlah: 8500000,
    tanggalPiutang: '2026-04-01',
    tanggalJatuhTempo: '2026-07-01',
    keterangan: 'Renovasi rumah tinggal',
    status: 'lunas',
    createdAt: new Date().toISOString(),
  },
];

export const usePiutangStore = create<PiutangState>()(
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
    { name: 'si-piutang' }
  )
);
