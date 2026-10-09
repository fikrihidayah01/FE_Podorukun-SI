import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export interface SaldoAkun {
  akunId: string;
  debit: number;
  kredit: number;
  kodePembantuId?: string | null;
}

export interface PeriodeSaldoAwal {
  id: string;
  proyekId: string;
  status: 'terbuka' | 'terkunci';
  saldo: SaldoAkun[];
  tanggalMulai?: string;
}

interface SaldoAwalState {
  periodes: Record<string, PeriodeSaldoAwal>; // key: proyekId
  isLoading: boolean;
  error: string | null;

  fetchSaldoAwal: (proyekId: string) => Promise<PeriodeSaldoAwal>;
  updateSaldo: (proyekId: string, akunId: string, data: { debit: number, kredit: number, kodePembantuId?: string | null }) => Promise<void>;
  tutupBuku: (proyekId: string) => Promise<void>;
}

export const useSaldoAwalStore = create<SaldoAwalState>((set, get) => ({
  periodes: {},
  isLoading: false,
  error: null,

  fetchSaldoAwal: async (proyekId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi(`/saldo-awal/${proyekId}`);
      if (!res.ok) throw new Error('Gagal memuat saldo awal');
      const json = await res.json();
      
      const periode: PeriodeSaldoAwal = json.data;
      
      set((state) => ({
        periodes: { ...state.periodes, [proyekId]: periode },
        isLoading: false,
      }));
      return periode;
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
      throw err;
    }
  },

  updateSaldo: async (proyekId, akunId, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi(`/saldo-awal/${proyekId}/${akunId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Gagal menyimpan saldo awal');
      
      // refetch to ensure consistency
      await get().fetchSaldoAwal(proyekId);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  tutupBuku: async (proyekId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi(`/saldo-awal/${proyekId}/kunci`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Gagal mengunci saldo awal');
      }
      
      // refetch
      await get().fetchSaldoAwal(proyekId);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
