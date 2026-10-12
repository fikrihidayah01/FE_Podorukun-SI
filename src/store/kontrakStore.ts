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

      // Extract all adendums and pembayarans if returned nested in items
      const allAdendums: Adendum[] = [];
      const allPembayarans: PembayaranKontrak[] = [];

      list.forEach((k: any) => {
        if (Array.isArray(k.adendum)) {
          k.adendum.forEach((a: any) => allAdendums.push({ ...a, kontrakId: k.id }));
        }
        if (Array.isArray(k.pembayaran)) {
          k.pembayaran.forEach((p: any) => allPembayarans.push({ ...p, kontrakId: k.id }));
        }
      });

      set({
        kontraks: list,
        adendums: allAdendums.length > 0 ? allAdendums : get().adendums,
        pembayarans: allPembayarans.length > 0 ? allPembayarans : get().pembayarans,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addKontrak: async (data) => {
    try {
      const payload = {
        noSpk: data.noSpk,
        proyekId: data.proyekId,
        unitId: data.unitId || crypto.randomUUID(),
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

      if (res.ok) {
        const json = await res.json();
        const created = json.data;
        await get().fetch();
        return created?.id || '';
      }
    } catch {
      // fallback
    }

    const id = crypto.randomUUID();
    const newK: Kontrak = { ...data, id, status: 'aktif', createdAt: new Date().toISOString() };
    set((state) => ({ kontraks: [...state.kontraks, newK] }));
    return id;
  },

  addAdendum: async (data) => {
    try {
      const res = await fetchApi(`/kontrak/${data.kontrakId}/adendum`, {
        method: 'POST',
        body: JSON.stringify({
          noAdendum: data.noAdendum,
          tanggal: data.tanggal,
          nilaiBaru: data.nilaiBaru,
          alasan: data.alasan || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const created = json.data;
        await get().fetch();
        return created?.id || '';
      }
    } catch {
      // fallback
    }

    const id = crypto.randomUUID();
    set((state) => ({
      adendums: [...state.adendums, { ...data, id, createdAt: new Date().toISOString() }],
    }));
    return id;
  },

  addPembayaran: async (data) => {
    try {
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

      if (res.ok) {
        const json = await res.json();
        const created = json.data;
        await get().fetch();
        return created?.id || '';
      }
    } catch {
      // fallback
    }

    const id = crypto.randomUUID();
    set((state) => ({
      pembayarans: [...state.pembayarans, { ...data, id, createdAt: new Date().toISOString() }],
    }));
    return id;
  },

  cancelKontrak: async (id, alasan) => {
    try {
      const res = await fetchApi(`/kontrak/${id}/batal`, {
        method: 'POST',
        body: JSON.stringify({ alasan: alasan || 'Dibatalkan oleh pengguna' }),
      });
      if (res.ok) {
        await get().fetch();
        return;
      }
    } catch {
      // fallback
    }

    set((state) => ({
      kontraks: state.kontraks.map((k) => (k.id === id ? { ...k, status: 'batal' } : k)),
    }));
  },

  removePembayaran: async (id) => {
    try {
      await fetchApi(`/kontrak/pembayaran/${id}`, { method: 'DELETE' });
    } catch {
      // fallback
    }
    set((state) => ({
      pembayarans: state.pembayarans.filter((p) => p.id !== id),
    }));
  },
}));
