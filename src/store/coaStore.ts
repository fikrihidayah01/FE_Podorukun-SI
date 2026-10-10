import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type KategoriAkun = 'aktiva' | 'hutang' | 'modal' | 'pendapatan' | 'beban' | 'hpp';
export type KlasifikasiAkun = 'neraca' | 'laba_rugi';
export type TipeSaldo = 'd' | 'k';
export type StatusAkun = 'aktif' | 'nonaktif';
export type KategoriHutangPiutang = 'lahan' | 'bank' | 'antar_proyek' | 'ppn' | 'pihak_ketiga' | 'pemegang_saham' | 'karyawan' | 'kontraktor' | 'lain_lain';

export interface Akun {
  id: string;
  kodeAkun: string;
  namaAkun: string;
  kategori: KategoriAkun;
  tipeSaldo: TipeSaldo;
  klasifikasi: KlasifikasiAkun;
  status: StatusAkun;
  
  akunIndukId?: string | null;
  
  wajibKodePembantu: boolean;
  wajibProyek: boolean;
  isKasBank: boolean;
  kasBankInduk?: string | null;
  
  kategoriHutangPiutang?: KategoriHutangPiutang | null;
}

export interface RiwayatAkun {
  id: string;
  akunId: string;
  waktu: string; // ISO string
  field: string;
  nilaiLama: string;
  nilaiBaru: string;
  oleh: string;
}

interface CoaState {
  items: Akun[];
  riwayat: RiwayatAkun[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  fetchRiwayat: (id: string) => Promise<void>;
  add: (data: Omit<Akun, 'id'>, oleh?: string) => Promise<void>;
  update: (id: string, data: Partial<Omit<Akun, 'id'>>, oleh?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useCoaStore = create<CoaState>()((set) => ({
  items: [],
  riwayat: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi('/akun');
      if (!res.ok) throw new Error('Gagal memuat data akun');
      const data = await res.json();
      set({ items: data.data || data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

    fetchRiwayat: async (id: string) => {
    try {
      const res = await fetchApi(`/akun/${id}/riwayat`);
      if (res.ok) {
        const json = await res.json();
        set({ riwayat: json.data || json });
      }
    } catch {
      set({ riwayat: [] });
    }
  },

  add: async (data, _oleh = 'System') => {
    try {
      const res = await fetchApi('/akun', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Gagal menambah akun');
      const json = await res.json();
      set((state) => ({ items: [...state.items, json.data || json] }));
    } catch (err: any) {
      throw err;
    }
  },

  update: async (id, data, _oleh = 'System') => {
    try {
      const res = await fetchApi(/akun/ + id, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Gagal mengubah akun');
      const json = await res.json();
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, ...(json.data || json) } : item)),
      }));
    } catch (err: any) {
      throw err;
    }
  },

  remove: async (id) => {
    try {
      const res = await fetchApi(/akun/ + id, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus akun');
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (err: any) {
      throw err;
    }
  },
}));

export const KATEGORI_AKUN_LABELS: Record<KategoriAkun, string> = {
  aktiva: 'Aktiva',
  hutang: 'Hutang',
  modal: 'Modal',
  pendapatan: 'Pendapatan',
  beban: 'Beban',
  hpp: 'HPP',
};

export const KLASIFIKASI_AKUN_LABELS: Record<KlasifikasiAkun, string> = {
  neraca: 'Neraca',
  laba_rugi: 'Laba Rugi',
};

export const KATEGORI_HUTANG_PIUTANG_LABELS: Record<KategoriHutangPiutang, string> = {
  lahan: 'Lahan',
  bank: 'Bank',
  antar_proyek: 'Antar Proyek',
  ppn: 'PPN',
  pihak_ketiga: 'Pihak Ketiga',
  pemegang_saham: 'Pemegang Saham',
  karyawan: 'Karyawan',
  kontraktor: 'Kontraktor',
  lain_lain: 'Lain-lain',
};
