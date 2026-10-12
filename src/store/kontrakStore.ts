import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export interface Kontrak {
  id: string;
  noSpk: string;
  proyekId: string;
  unitId?: string;
  kavling?: string;
  tipe?: string;
  tanggalSpk: string;
  kontraktorId?: string;
  namaKontraktor: string;
  rab: number;
  nilaiKontrak: number;
  nilaiTerkini?: number;
  totalDibayar?: number;
  sisaHutang?: number;
  keterangan?: string;
  akunPersediaanId: string;
  akunHutangId?: string;
  status: 'aktif' | 'selesai' | 'batal';
  createdAt: string;
}

export interface Adendum {
  id: string;
  kontrakId: string;
  noAdendum: string;
  tanggal: string;
  nilaiLama: number;
  nilaiBaru: number;
  alasan?: string;
  lampiran?: string;
  createdAt: string;
}

export interface PembayaranKontrak {
  id: string;
  kontrakId: string;
  tanggal: string;
  nominal: number;
  akunKasId: string;
  noBukti?: string;
  keterangan?: string;
  createdAt: string;
}

interface KontrakState {
  kontraks: Kontrak[];
  adendums: Adendum[];
  pembayarans: PembayaranKontrak[];
  isLoading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  addKontrak: (data: Omit<Kontrak, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  addAdendum: (data: Omit<Adendum, 'id' | 'createdAt'>) => Promise<string>;
  addPembayaran: (data: Omit<PembayaranKontrak, 'id' | 'createdAt'>) => Promise<string>;
  cancelKontrak: (id: string, alasan?: string) => Promise<void>;
  removePembayaran: (id: string) => Promise<void>;
}

export const useKontrakStore = create<KontrakState>((set, get) => ({
  kontraks: [],
  adendums: [],
  pembayarans: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi('/kontrak');
      if (!res.ok) throw new Error('Gagal memuat data kontrak');
      const json = await res.json();
      const list: Kontrak[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];

      set({
        kontraks: list,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchDetail: async (id: string) => {
    try {
      const res = await fetchApi(`/kontrak/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      const detail = json.data;
      if (!detail) return;

      const rawAdendums = detail.adendums ?? detail.adendum ?? [];
      const newAdendums = Array.isArray(rawAdendums)
        ? rawAdendums.map((a: any) => ({ ...a, kontrakId: id }))
        : [];

      const rawPembayarans = detail.pembayarans ?? detail.pembayaran ?? [];
      const newPembayarans = Array.isArray(rawPembayarans)
        ? rawPembayarans.map((p: any) => ({ ...p, kontrakId: id }))
        : [];

      set((state) => ({
        kontraks: state.kontraks.map((k) => (k.id === id ? { ...k, ...detail } : k)),
        adendums: [
          ...state.adendums.filter((a) => a.kontrakId !== id),
          ...newAdendums,
        ],
        pembayarans: [
          ...state.pembayarans.filter((p) => p.kontrakId !== id),
          ...newPembayarans,
        ],
      }));
    } catch (err) {
      console.error('Failed to fetch detail kontrak:', id, err);
    }
  },

  addKontrak: async (data) => {
    const payload = {
      noSpk: data.noSpk,
      proyekId: data.proyekId,
      unitId: data.unitId,
      tipe: data.tipe || undefined,
      tanggalSpk: data.tanggalSpk,
      kontraktorId: data.kontraktorId || undefined,
      namaKontraktor: data.namaKontraktor || undefined,
      rab: data.rab,
      nilaiKontrak: data.nilaiKontrak,
      keterangan: data.keterangan || undefined,
      akunPersediaanId: data.akunPersediaanId,
      akunHutangId: data.akunHutangId || undefined,
    };

    const res = await fetchApi('/kontrak', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal menyimpan kontrak ke server');
    }

    const json = await res.json();
    const created = json.data;
    await get().fetch();
    return created?.id || '';
  },

  addAdendum: async (data) => {
    const res = await fetchApi(`/kontrak/${data.kontrakId}/adendum`, {
      method: 'POST',
      body: JSON.stringify({
        noAdendum: data.noAdendum,
        tanggal: data.tanggal,
        nilaiBaru: data.nilaiBaru,
        alasan: data.alasan || undefined,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal menyimpan adendum ke server');
    }

    const json = await res.json();
    const created = json.data;
    await get().fetchDetail(data.kontrakId);
    return created?.id || '';
  },

  addPembayaran: async (data) => {
    const res = await fetchApi(`/kontrak/${data.kontrakId}/pembayaran`, {
      method: 'POST',
      body: JSON.stringify({
        tanggal: data.tanggal,
        nominal: data.nominal,
        akunKasId: data.akunKasId,
        noBukti: data.noBukti || undefined,
        keterangan: data.keterangan || undefined,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal mencatat pembayaran kontrak ke server');
    }

    const json = await res.json();
    const created = json.data;
    await get().fetchDetail(data.kontrakId);
    return created?.id || '';
  },

  cancelKontrak: async (id, alasan) => {
    const res = await fetchApi(`/kontrak/${id}/batal`, {
      method: 'POST',
      body: JSON.stringify({ alasan: alasan || 'Dibatalkan oleh pengguna' }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal membatalkan kontrak di server');
    }

    await get().fetch();
  },

  removePembayaran: async (id) => {
    const res = await fetchApi(`/kontrak/pembayaran/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal menghapus pembayaran di server');
    }
    set((state) => ({
      pembayarans: state.pembayarans.filter((p) => p.id !== id),
    }));
  },
}));
