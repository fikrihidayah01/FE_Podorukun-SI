import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export interface Proyek {
  id: string;
  nama: string;
  kode: string;
  ptId?: string;
}

interface ProyekState {
  items: Proyek[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useProyekStore = create<ProyekState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi('/proyek');
      const json = await res.json();
      if (res.ok) {
        // the backend returns a list of proyek, possibly mapping fields
        set({ items: json.data || [], isLoading: false });
      } else {
        set({ error: json.message || 'Gagal memuat Proyek', isLoading: false });
      }
    } catch (err) {
      set({ error: 'Terjadi kesalahan jaringan', isLoading: false });
    }
  },
}));
