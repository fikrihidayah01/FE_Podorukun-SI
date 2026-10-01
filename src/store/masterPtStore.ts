import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MasterPt {
  id: string;
  namaPt: string;
  namaDirektur: string;
  ttl: string; // tempat, tanggal lahir
  pekerjaan: string;
  alamat: string;
  noKtp: string;
  perumahanId?: string; // terikat ke satu perumahan
}

interface MasterPtState {
  items: MasterPt[];
  add: (data: Omit<MasterPt, 'id'>) => string;
  update: (id: string, data: Partial<Omit<MasterPt, 'id'>>) => void;
  remove: (id: string) => void;
}

export const useMasterPtStore = create<MasterPtState>()(
  persist(
    (set) => ({
      items: [
        {
          id: 'pt-001',
          namaPt: 'PT Pesona Raya Sejahtera Mandiri',
          namaDirektur: 'Budi Hartanto',
          ttl: 'Jakarta, 12 Maret 1975',
          pekerjaan: 'Direktur',
          alamat: 'Jl. Sudirman No. 45, Jakarta Selatan',
          noKtp: '3174012203750002',
          perumahanId: undefined,
        },
        {
          id: 'pt-002',
          namaPt: 'PT Prima Realty Nusantara',
          namaDirektur: 'Sari Dewi Kusuma',
          ttl: 'Surabaya, 8 Juli 1980',
          pekerjaan: 'Direktur',
          alamat: 'Jl. Pemuda No. 12, Surabaya',
          noKtp: '3578054807800003',
          perumahanId: undefined,
        },
      ],

      add: (data) => {
        const id = crypto.randomUUID();
        set((state) => ({ items: [...state.items, { ...data, id }] }));
        return id;
      },

      update: (id, data) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...data } : item)),
        })),

      remove: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
    }),
    { name: 'si-master-pt-v1' }
  )
);
