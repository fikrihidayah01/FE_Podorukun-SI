import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type JurnalStatus = 'draft' | 'diposting' | 'dikoreksi' | 'balik';

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
  dataUrl?: string;
  url?: string;
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
      const items: Jurnal[] = [];
      for (let page = 1; ; page++) {
        const res = await fetchApi(`/jurnal?page=${page}&limit=200`);
        if (!res.ok) throw new Error('Gagal memuat jurnal');
        const data = await res.json();
        const rows = Array.isArray(data.data) ? data.data : [];
        items.push(...rows);
        if (rows.length < 200) break;
      }
      set({ items, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
    }
  },

    add: async (data) => {
    set({ isLoading: true, error: null });
    let createdId: string | undefined;
    try {
      const { lampiran, ...jurnalData } = data;
      const res = await fetchApi('/jurnal', {
        method: 'POST',
        body: JSON.stringify({ ...jurnalData, status: 'draft' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.message || 'Gagal menyimpan jurnal');
      }
      
      const resData = await res.json();
      const newItem = resData.data || resData;
      createdId = newItem.id;

      if (lampiran && lampiran.length > 0) {
        for (const l of lampiran) {
          if (l.dataUrl) {
            const blobRes = await fetch(l.dataUrl);
            const blob = await blobRes.blob();
            const formData = new FormData();
            formData.append('file', blob, l.nama);
            
            const upRes = await fetchApi(`/lampiran?entityType=jurnal&entityId=${newItem.id}`, {
              method: 'POST',
              body: formData,
            });
            if (!upRes.ok) {
              const err = await upRes.json().catch(() => ({}));
              throw new Error(err.message || 'Gagal mengunggah berkas lampiran jurnal');
            }
          }
        }
      }

      if (data.status === 'diposting') {
        try {
          await get().updateStatus(newItem.id, 'diposting');
        } catch (error) {
          throw new Error(`Draft ${newItem.nomorJurnal || newItem.id} tersimpan, tetapi belum diposting: ${error instanceof Error ? error.message : 'Posting gagal'}. Buka draft untuk melanjutkan.`);
        }
      }
      await get().fetch();
    } catch (err: any) {
      if (createdId) await get().fetch();
      const message = createdId
        ? `Jurnal ${createdId} sudah tersimpan. ${err.message || 'Proses belum selesai'}. Buka jurnal tersebut untuk melanjutkan, jangan membuat ulang.`
        : err.message || 'Terjadi kesalahan';
      set({ error: message, isLoading: false });
      throw new Error(message);
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
      if (lampiran && lampiran.length > 0) {
        for (const l of lampiran) {
          if (l.dataUrl) {
            const blobRes = await fetch(l.dataUrl);
            const blob = await blobRes.blob();
            const formData = new FormData();
            formData.append('file', blob, l.nama);

            const upRes = await fetchApi(`/lampiran?entityType=jurnal&entityId=${id}`, {
              method: 'POST',
              body: formData,
            });
            if (!upRes.ok) {
              const err = await upRes.json().catch(() => ({}));
              throw new Error(err.message || 'Gagal memperbarui berkas lampiran jurnal');
            }
          }
        }
      }

      await get().fetch();
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
