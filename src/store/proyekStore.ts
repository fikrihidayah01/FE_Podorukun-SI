import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export interface Proyek {
  id: string;
  nama: string;
  kode: string;
  ptId?: string;
}

export interface KavlingUnit {
  id: string;
  nomor: string;
  tipe?: string;
  luasTanah?: number;
  luasBangunan?: number;
  harga?: number;
  proyekId?: string;
  status?: string;
}

interface ProyekState {
  items: Proyek[];
  kavlingsByProyek: Record<string, KavlingUnit[]>;
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  fetchKavling: (proyekId: string) => Promise<KavlingUnit[]>;
}

export const useProyekStore = create<ProyekState>((set, get) => ({
  items: [],
  kavlingsByProyek: {},
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi('/proyek');
      const json = await res.json();
      if (res.ok) {
        set({ items: json.data || [], isLoading: false });
      } else {
        set({ error: json.message || 'Gagal memuat Proyek', isLoading: false });
      }
    } catch {
      set({ error: 'Terjadi kesalahan jaringan', isLoading: false });
    }
  },

  fetchKavling: async (proyekId: string) => {
    if (!proyekId) return [];
    try {
      const res = await fetchApi(`/proyek/${proyekId}/kavling`);
      if (res.ok) {
        const json = await res.json();
        const list: KavlingUnit[] = json.data || [];
        set((state) => ({
          kavlingsByProyek: { ...state.kavlingsByProyek, [proyekId]: list },
        }));
        return list;
      }
    } catch (error) {
      console.error('Failed to fetch kavling for proyek:', proyekId, error);
    }
    return get().kavlingsByProyek[proyekId] || [];
  },
}));
