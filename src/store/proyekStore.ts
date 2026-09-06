import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Proyek {
  id: string;
  nama: string;
  kode: string;
}

interface ProyekState {
  items: Proyek[];
}

const DUMMY_PROYEK: Proyek[] = [
  { id: 'p1', nama: 'Atlantis Hills', kode: 'ATH' },
  { id: 'p2', nama: 'Atlantis Icon', kode: 'ATI' },
  { id: 'p3', nama: 'Aya Sophia', kode: 'AYS' },
];

export const useProyekStore = create<ProyekState>()(
  persist(
    () => ({
      items: DUMMY_PROYEK,
    }),
    { name: 'si-proyek' }
  )
);
