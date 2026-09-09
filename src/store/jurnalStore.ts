import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JurnalStatus = 'draft' | 'diposting' | 'dikoreksi';

export interface JurnalRow {
  id: string;
  akunId: string;
  kodePembantuId?: string;
  keterangan: string;
  debit: number;
  kredit: number;
}

export interface Jurnal {
  id: string;
  nomorJurnal: string;
  tanggal: string;
  keterangan: string;
  proyekId?: string;
  sumber: string;
  status: JurnalStatus;
  rows: JurnalRow[];
  createdAt: string;
}

interface JurnalState {
  items: Jurnal[];
  counter: number;
  add: (data: Omit<Jurnal, 'id' | 'nomorJurnal' | 'createdAt'>) => void;
  updateStatus: (id: string, status: JurnalStatus) => void;
  remove: (id: string) => void;
}

export const useJurnalStore = create<JurnalState>()(
  persist(
    (set) => ({
      items: [],
      counter: 0,

      add: (data) =>
        set((state) => {
          const next = state.counter + 1;
          return {
            counter: next,
            items: [
              ...state.items,
              {
                ...data,
                id: crypto.randomUUID(),
                nomorJurnal: `JU-${String(next).padStart(4, '0')}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),

      updateStatus: (id, status) => set(state => ({
        items: state.items.map(item => item.id === id ? { ...item, status } : item)
      })),

      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
    }),
    { name: 'si-jurnal-v2' }
  )
);
