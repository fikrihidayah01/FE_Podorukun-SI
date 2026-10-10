import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type JurnalStatus = 'draft' | 'diposting' | 'dikoreksi';

export interface JurnalRow {
  id: string;
  akunId: string;
  kodePembantuId?: string;
  keterangan: string;
  debit: number;
  kredit: number;
}

export interface Lampiran {
  id: string;
  nama: string;
  dataUrl: string;
  tipe: 'pdf' | 'gambar';
  ukuranBytes: number;
}

export interface Jurnal {
  id: string;
  nomorJurnal: string;
  tanggal: string;
  keterangan: string;
  proyekId?: string;
  sumber: string;
  status: JurnalStatus;
  rows: JurnalRow[];
  lampiran: Lampiran[];
  createdAt: string;
}

interface JurnalState {
  items: Jurnal[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Omit<Jurnal, 'id' | 'nomorJurnal' | 'createdAt'>) => Promise<void>;
  updateStatus: (id: string, status: JurnalStatus) => Promise<void>;
  updateLampiran: (id: string, lampiran: Lampiran[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useJurnalStore = create<JurnalState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi('/jurnal');
      if (!res.ok) throw new Error('Gagal memuat jurnal');
      const data = await res.json();
      set({ items: Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
    }
  },

    add: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { lampiran, ...jurnalData } = data;
      const res = await fetchApi('/jurnal', {
        method: 'POST',
        body: JSON.stringify(jurnalData),
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.message || 'Gagal menyimpan jurnal');
      }
      
      const resData = await res.json();
      const newItem = resData.data || resData;

      if (lampiran && lampiran.length > 0) {
        for (const l of lampiran) {
          if (l.dataUrl) {
            const blobRes = await fetch(l.dataUrl);
            const blob = await blobRes.blob();
            const formData = new FormData();
            formData.append('file', blob, l.nama);
            
            await fetchApi(`/lampiran?entityType=jurnal&entityId=${newItem.id}`, {
              method: 'POST',
              body: formData,
            });
          }
        }
      }

      await get().fetch();
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
      throw err;
    }
  },

    updateStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      let endpoint = '';
      if (status === 'diposting') endpoint = `/jurnal/${id}/posting`;
      else if (status === 'dikoreksi') endpoint = `/jurnal/${id}/balik`;
      
      if (endpoint) {
        const res = await fetchApi(endpoint, { method: 'POST' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || 'Gagal mengubah status jurnal');
        }
      } else {
        const res = await fetchApi(`/jurnal/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Gagal mengubah status jurnal');
      }
      
      // refetch to get updated data
      await get().fetch();
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
      throw err;
    }
  },

  updateLampiran: async (id, lampiran) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi(`/jurnal/${id}/lampiran`, {
        method: 'PATCH',
        body: JSON.stringify({ lampiran }),
      });
      if (!res.ok) {
        // Fallback to full patch
        if (res.status === 404) {
          const updateRes = await fetchApi(`/jurnal/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ lampiran }),
          });
          if (!updateRes.ok) throw new Error('Gagal memperbarui lampiran');
        } else {
          throw new Error('Gagal memperbarui lampiran');
        }
      }

      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, lampiran } : item)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
      throw err;
    }
  },

  remove: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi(`/jurnal/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus jurnal');
      
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
      throw err;
    }
  },
}));
