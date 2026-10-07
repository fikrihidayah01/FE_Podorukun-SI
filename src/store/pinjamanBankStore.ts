import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type StatusPinjaman = 'aktif' | 'lunas';
export type JenisPembayaran = 'pokok' | 'bunga' | 'gabungan';
export type PolaPembayaran = 'terpisah' | 'satu_transfer' | 'bunga_rutin' | 'fleksibel';

export const POLA_PEMBAYARAN_LABELS: Record<PolaPembayaran, string> = {
  terpisah: 'Terpisah',
  satu_transfer: 'Satu transfer',
  bunga_rutin: 'Bunga rutin',
  fleksibel: 'Fleksibel',
};

export interface TopUpPinjaman {
  id: string;
  pinjamanId: string;
  tanggal: string; // ISO date
  nominal: number;
  keterangan?: string;
}

export interface PinjamanBankEntry {
  id: string;
  pinjamanId: string;
  tanggal: string; // ISO date
  jenis: JenisPembayaran;
  nominal: number; // total transfer
  nominalPokok?: number;
  nominalBunga?: number;
  periodeBunga?: string;
  keterangan?: string;
  noBukti?: string;
  akunKasId?: string;
  statusRincian?: 'lengkap' | 'menunggu_rincian';
  createdAt: string;
}

export interface PinjamanBank {
  id: string;
  proyekId: string;
  namaBank: string;
  pola: PolaPembayaran;
  tanggalPencairanAwal: string; // ISO date
  nominalPencairanAwal: number;
  topUps: TopUpPinjaman[];
  totalPencairan: number;
  sisaPokok: number;
  penebusan: number;
  tanggalAcuanBunga: number;
  tanggalJatuhTempoPokok: string; // ISO date
  akunHutangId?: string;
  akunBebanBungaId?: string;
  status: StatusPinjaman;
  keterangan?: string;
  createdAt: string;
}

export interface DueReminder {
  pinjaman: PinjamanBank;
  jenis: 'bunga' | 'pokok';
  tanggalFormatted: string; // dd/mm/yyyy
  label: string;
  hariLagi: number;
}

interface PinjamanBankState {
  pinjamans: PinjamanBank[];
  entries: PinjamanBankEntry[];
  reminders: DueReminder[];
  isLoading: boolean;
  error: string | null;

  fetch: (proyekId?: string, status?: StatusPinjaman) => Promise<void>;
  fetchReminders: (hari?: number) => Promise<void>;
  fetchEntries: (pinjamanId: string) => Promise<void>;
  
  addPinjaman: (data: any) => Promise<void>;
  addTopUp: (pinjamanId: string, data: any) => Promise<void>;
  updatePinjaman: (id: string, data: any) => Promise<void>;
  removePinjaman: (id: string) => Promise<void>;

  addEntry: (pinjamanId: string, data: any) => Promise<void>;
  removeEntry: (pinjamanId: string, id: string) => Promise<void>;

  getEntriesByPinjaman: (pinjamanId: string) => PinjamanBankEntry[];
  getDueReminders: (hari?: number) => DueReminder[];
  getTotalSisaPokok: () => number;
}

export const usePinjamanBankStore = create<PinjamanBankState>((set, get) => ({
  pinjamans: [],
  entries: [],
  reminders: [],
  isLoading: false,
  error: null,

  fetch: async (proyekId, status) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (proyekId) params.append('proyekId', proyekId);
      if (status) params.append('status', status);
      const res = await fetchApi('/pinjaman?' + params.toString());
      const json = await res.json();
      if (res.ok) {
        set({ pinjamans: json.data || [], isLoading: false });
      } else {
        set({ error: json.message || 'Gagal memuat pinjaman', isLoading: false });
      }
    } catch (err) {
      set({ error: 'Terjadi kesalahan jaringan', isLoading: false });
    }
  },

  fetchReminders: async (hari = 14) => {
    try {
      const res = await fetchApi(`/pinjaman/jatuh-tempo?hari=${hari}`);
      const json = await res.json();
      if (res.ok) set({ reminders: json.data || [] });
    } catch (err) {}
  },

  fetchEntries: async (pinjamanId) => {
    try {
      const res = await fetchApi(`/pinjaman/${pinjamanId}`);
      const json = await res.json();
      if (res.ok) {
        set((state) => ({ 
          entries: [
            ...state.entries.filter(e => e.pinjamanId !== pinjamanId), 
            ...(json.data?.entries || [])
          ] 
        }));
      }
    } catch (err) {}
  },

  addPinjaman: async (data) => {
    const res = await fetchApi('/pinjaman', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Gagal menambah');
    await get().fetch();
  },

  addTopUp: async (pinjamanId, data) => {
    const res = await fetchApi(`/pinjaman/${pinjamanId}/top-up`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Gagal top-up');
    await get().fetch();
  },

  updatePinjaman: async (id, data) => {
    const res = await fetchApi(`/pinjaman/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Gagal mengubah');
    await get().fetch();
  },

  removePinjaman: async (id) => {
    const res = await fetchApi(`/pinjaman/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Gagal menghapus');
    await get().fetch();
  },

  addEntry: async (pinjamanId, data) => {
    const res = await fetchApi(`/pinjaman/${pinjamanId}/pembayaran`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Gagal mencatat pembayaran');
    await get().fetch();
    await get().fetchEntries(pinjamanId);
  },

  removeEntry: async (pinjamanId, id) => {
    const res = await fetchApi(`/pinjaman/transaksi/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Gagal menghapus pembayaran');
    await get().fetch();
    await get().fetchEntries(pinjamanId);
  },

  getEntriesByPinjaman: (pinjamanId) => get().entries.filter(e => e.pinjamanId === pinjamanId),
  getDueReminders: () => get().reminders,

  getTotalSisaPokok: () => {
    return get()
      .pinjamans.filter((p) => p.status === 'aktif')
      .reduce((sum, p) => sum + p.sisaPokok, 0);
  },
}));
