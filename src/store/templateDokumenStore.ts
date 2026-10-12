import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type TipeTransaksi = 'Cash' | 'KPR' | 'In House';

export interface TemplateDokumen {
  id: string;
  ptId: string;
  aktif?: boolean;
  tipeTransaksi: TipeTransaksi;
  polaNomor: string; // contoh: "{PT}/{TAHUN}/{NO}"
  pasalIds: string[]; // urutan pasal
  createdAt: string;
}

interface TemplateDokumenState {
  items: TemplateDokumen[];
  fetch: () => Promise<void>;
  add: (data: Omit<TemplateDokumen, 'id' | 'createdAt'>) => Promise<string>;
  update: (id: string, data: Partial<Omit<TemplateDokumen, 'id' | 'createdAt'>>) => Promise<void>;
  duplikat: (id: string) => Promise<string>;
  remove: (id: string) => Promise<void>;
}

export const useTemplateDokumenStore = create<TemplateDokumenState>()((set) => ({
  items: [],

  fetch: async () => {
    try {
      const res = await fetchApi('/template-dokumen');
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || 'Permintaan ditolak backend'); }
      if (res.ok) {
        const json = await res.json();
        set({ items: json.data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch template dokumen:', error);
    }
  },

  add: async (data) => {
    try {
      const res = await fetchApi('/template-dokumen', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || 'Permintaan ditolak backend'); }
      if (res.ok) {
        const json = await res.json();
        const newItem = json.data;
        set((state) => ({ items: [...state.items, newItem] }));
        return newItem.id;
      }
    } catch (error) {
      throw error;
    }
    return '';
  },

  update: async (id, data) => {
    try {
      const res = await fetchApi(`/template-dokumen/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || 'Permintaan ditolak backend'); }
      if (res.ok) {
        const json = await res.json();
        const updatedItem = json.data;
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)),
        }));
      }
    } catch (error) {
      throw error;
    }
  },

  duplikat: async (id) => {
    try {
      const res = await fetchApi(`/template-dokumen/${id}/duplikat`, {
        method: 'POST',
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || 'Permintaan ditolak backend'); }
      if (res.ok) {
        const json = await res.json();
        const newItem = json.data;
        set((state) => ({ items: [...state.items, newItem] }));
        return newItem.id;
      }
    } catch (error) {
      throw error;
    }
    return '';
  },

  remove: async (id) => {
    try {
      const res = await fetchApi(`/template-dokumen/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || 'Permintaan ditolak backend'); }
      if (res.ok) {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      }
    } catch (error) {
      throw error;
    }
  },
}));
