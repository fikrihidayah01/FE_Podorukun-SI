import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type TipeTransaksi = 'Cash' | 'KPR' | 'In House';

export interface TemplateDokumen {
  id: string;
  ptId: string;
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

export const useTemplateDokumenStore = create<TemplateDokumenState>()((set, get) => ({
  items: [],

  fetch: async () => {
    try {
      const res = await fetchApi('/template-dokumen');
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
      if (res.ok) {
        const json = await res.json();
        const newItem = json.data;
        set((state) => ({ items: [...state.items, newItem] }));
        return newItem.id;
      }
    } catch (error) {
      console.error('Failed to add template dokumen:', error);
    }
    return '';
  },

  update: async (id, data) => {
    try {
      const res = await fetchApi(`/template-dokumen/${id}`, {
        method: 'PUT', // or PATCH
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedItem = json.data;
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)),
        }));
      }
    } catch (error) {
      console.error('Failed to update template dokumen:', error);
    }
  },

  duplikat: async (id) => {
    try {
      const src = get().items.find((t) => t.id === id);
      if (!src) return '';
      
      // Remove id, change name slightly
      const { id: _id, createdAt: _createdAt, ...rest } = src;
      const data = { ...rest, polaNomor: `${src.polaNomor}_COPY` };

      const res = await fetchApi('/template-dokumen', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        const newItem = json.data;
        set((state) => ({ items: [...state.items, newItem] }));
        return newItem.id;
      }
    } catch (error) {
      console.error('Failed to duplicate template dokumen:', error);
    }
    return '';
  },

  remove: async (id) => {
    try {
      const res = await fetchApi(`/template-dokumen/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      }
    } catch (error) {
      console.error('Failed to remove template dokumen:', error);
    }
  },
}));
