import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export interface Periode {
  id: string;
  ptId: string;
  bulan: string; // YYYY-MM
  status: 'terbuka' | 'terkunci';
  createdAt?: string;
}

interface PeriodeState {
  periodes: Periode[];
  isLoading: boolean;
  error: string | null;
  fetch: (ptId?: string) => Promise<void>;
  tutupPeriode: (ptId: string, bulan: string) => Promise<boolean>;
  isTerkunci: (ptId: string | undefined, bulan: string) => boolean;
}

export const usePeriodeStore = create<PeriodeState>((set, get) => ({
  periodes: [],
  isLoading: false,
  error: null,

  fetch: async (ptId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = ptId ? `/periode?ptId=${ptId}` : '/periode';
      const res = await fetchApi(url);
      if (res.ok) {
        const json = await res.json();
        set({ periodes: json.data || [], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  tutupPeriode: async (ptId: string, bulan: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi('/periode/tutup', {
        method: 'POST',
        body: JSON.stringify({ ptId, bulan }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Gagal menutup periode');
      }
      await get().fetch(ptId);
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  isTerkunci: (ptId: string | undefined, bulan: string) => {
    const list = get().periodes;
    if (list.length === 0) return false;
    // Backend says: "yang tidak ada di daftar = terbuka"
    return list.some((p) => (!ptId || p.ptId === ptId) && p.bulan === bulan && p.status === 'terkunci');
  },
}));
