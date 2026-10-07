import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export interface MasterPt {
  id: string;
  namaPt: string;
  singkatan?: string | null;
  namaDirektur: string;
  ttl?: string | null;
  pekerjaan?: string | null;
  alamat?: string | null;
  noKtp?: string | null;
  perumahanId?: string | null;
}

interface MasterPtState {
  items: MasterPt[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Omit<MasterPt, 'id'>) => Promise<string>;
  update: (id: string, data: Partial<Omit<MasterPt, 'id'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useMasterPtStore = create<MasterPtState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi('/master-pt');
      const json = await res.json();
      if (res.ok) {
        set({ items: json.data || [], isLoading: false });
      } else {
        set({ error: json.message || 'Gagal memuat PT', isLoading: false });
      }
    } catch (err) {
      set({ error: 'Terjadi kesalahan jaringan', isLoading: false });
    }
  },

  add: async (data) => {
    const res = await fetchApi('/master-pt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal menambah PT');
    
    // Refresh list
    await get().fetch();
    return json.data?.id || '';
  },

  update: async (id, data) => {
    const res = await fetchApi(`/master-pt/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal mengubah PT');
    
    // Optimistic update or refresh
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...data } : item)),
    }));
  },

  remove: async (id) => {
    const res = await fetchApi(`/master-pt/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal menghapus PT');
    
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));
