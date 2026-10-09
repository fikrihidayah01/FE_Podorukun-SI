import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type BerlakuPasal = 'semua' | 'cash' | 'kpr' | 'in_house';

export interface PasalField {
  id: string;
  key: string;   // nama variabel, misal "harga_jual"
  label: string; // label tampil, misal "Harga Jual"
  tipe: 'teks' | 'angka' | 'tanggal';
}

export interface Pasal {
  id: string;
  judul: string;
  isi: string; // teks dengan placeholder {key}
  berlaku: BerlakuPasal;
  fields: PasalField[];
  aktif: boolean;
  createdAt: string;
}

interface PustakaPasalState {
  items: Pasal[];
  fetch: () => Promise<void>;
  add: (data: Omit<Pasal, 'id' | 'createdAt'>) => Promise<string>;
  update: (id: string, data: Partial<Omit<Pasal, 'id' | 'createdAt'>>) => Promise<void>;
  nonaktifkan: (id: string) => Promise<void>;
  aktifkan: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  hitungDipakai: (id: string, dokumenIds: string[]) => number;
}

export const usePustakaPasalStore = create<PustakaPasalState>()((set) => ({
  items: [],

  fetch: async () => {
    try {
      const res = await fetchApi('/pasal');
      if (res.ok) {
        const json = await res.json();
        set({ items: json.data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch pasal:', error);
    }
  },

  add: async (data) => {
    try {
      const res = await fetchApi('/pasal', {
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
      console.error('Failed to add pasal:', error);
    }
    return '';
  },

  update: async (id, data) => {
    try {
      const res = await fetchApi(`/pasal/${id}`, {
        method: 'PUT',
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
      console.error('Failed to update pasal:', error);
    }
  },

  nonaktifkan: async (id) => {
    try {
      const res = await fetchApi(`/pasal/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ aktif: false }),
      });
      if (res.ok) {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, aktif: false } : item)),
        }));
      }
    } catch (error) {
      console.error('Failed to nonaktifkan pasal:', error);
    }
  },

  aktifkan: async (id) => {
    try {
      const res = await fetchApi(`/pasal/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ aktif: true }),
      });
      if (res.ok) {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, aktif: true } : item)),
        }));
      }
    } catch (error) {
      console.error('Failed to aktifkan pasal:', error);
    }
  },

  remove: async (id) => {
    try {
      const res = await fetchApi(`/pasal/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      }
    } catch (error) {
      console.error('Failed to remove pasal:', error);
    }
  },

  hitungDipakai: (_id, dokumenIds) => dokumenIds.length,
}));
