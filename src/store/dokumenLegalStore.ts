import { create } from 'zustand';
import { fetchApi } from '../lib/api';
import type { TipeTransaksi } from './templateDokumenStore';

export type StatusDokumen = 'draft' | 'final' | 'ditandatangani';

export interface DataPembeli {
  nama: string;
  ttl: string;
  pekerjaan: string;
  alamat: string;
  noKtp: string;
  noHp: string;
}

export interface PasalDokumenField {
  id: string;
  key: string;
  label: string;
  tipe: 'teks' | 'angka' | 'tanggal' | string;
  nilai: string;
}

export interface PasalDokumen {
  id: string; // ID unik per blok dalam dokumen
  pustakaId?: string; // ID asal jika dari pustaka
  judul: string;
  isi: string;
  fields: PasalDokumenField[];
}

export interface BarisJadwal {
  id: string;
  tanggal: string;
  jumlah: number;
  keterangan: string;
}

export interface JadwalPembayaran {
  tanggalAcuan: string; // e.g. "4"
  nominalPerBulan: number;
  tanggalMulai: string;
  jatuhTempoTerakhir: string;
  baris: BarisJadwal[];
}

export interface RiwayatStatus {
  status: StatusDokumen;
  waktu: string;
  oleh: string;
}

export interface DokumenLegal {
  id: string;
  noDokumen: string;
  ptId: string;
  kavlingId: string;
  perumahanId: string;
  pembeli: DataPembeli;
  tipeTransaksi: TipeTransaksi;
  hargaAwal: number;
  bphtb: number;
  ajbBbn: number;
  uangMuka: number;
  tanggalPerjanjian: string;
  status: StatusDokumen;
  
  pasalDokumen: PasalDokumen[];
  jadwalPembayaran?: JadwalPembayaran;
  fasilitasTambahan?: string;
  lampiranScan?: string;
  
  riwayatStatus: RiwayatStatus[];
  createdAt: string;
}

interface DokumenLegalState {
  items: DokumenLegal[];
  counter: number;
  
  fetch: () => Promise<void>;
  // Dokumen CRUD
  add: (data: Omit<DokumenLegal, 'id' | 'noDokumen' | 'createdAt' | 'riwayatStatus'> & { ptSingkatan: string }) => Promise<string>;
  updateDataUtama: (id: string, data: Partial<Pick<DokumenLegal, 'pembeli' | 'hargaAwal' | 'bphtb' | 'ajbBbn' | 'uangMuka' | 'tanggalPerjanjian' | 'fasilitasTambahan' | 'lampiranScan'>>) => Promise<void>;
  updateStatus: (id: string, status: StatusDokumen, oleh?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  
  // Pasal actions
  addPasal: (docId: string, pasal: Omit<PasalDokumen, 'id'>, index?: number) => Promise<void>;
  updatePasalUtama: (docId: string, pasalId: string, data: Partial<Pick<PasalDokumen, 'judul' | 'isi'>>) => Promise<void>;
  updatePasalField: (docId: string, pasalId: string, fieldKey: string, nilai: string) => Promise<void>;
  removePasal: (docId: string, pasalId: string) => Promise<void>;
  reorderPasal: (docId: string, startIndex: number, endIndex: number) => Promise<void>;
  
  // Jadwal actions
  updateJadwalPembayaran: (docId: string, jadwal: JadwalPembayaran | undefined) => Promise<void>;
  updateBarisJadwal: (docId: string, barisId: string, jumlah: number) => Promise<void>;

  getDokumenByPasalPustaka: (pustakaId: string) => DokumenLegal[];
}

export const useDokumenLegalStore = create<DokumenLegalState>()((set, get) => ({
  items: [],
  counter: 0,

  fetch: async () => {
    try {
      const res = await fetchApi('/dokumen');
      if (res.ok) {
        const json = await res.json();
        set({ items: json.data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch dokumen legal:', error);
    }
  },

  add: async ({ ptSingkatan, ...data }) => {
    try {
      // In a real scenario, the backend would generate the noDokumen, id, etc.
      // We pass the data and await the created item.
      const payload = { ...data, ptSingkatan }; // Backend might need ptSingkatan to generate noDokumen
      const res = await fetchApi('/dokumen', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        const newDoc = json.data;
        set((state) => ({ items: [...state.items, newDoc] }));
        return newDoc.id;
      }
    } catch (error) {
      console.error('Failed to add dokumen legal:', error);
    }
    return '';
  },

  updateDataUtama: async (id, data) => {
    try {
      const res = await fetchApi(`/dokumen/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedItem = json.data;
        set((state) => ({
          items: state.items.map((doc) => (doc.id === id ? { ...doc, ...updatedItem } : doc)),
        }));
      }
    } catch (error) {
      console.error('Failed to update data utama:', error);
    }
  },

  updateStatus: async (id, status, oleh = 'User') => {
    try {
      let res;
      if (status === 'final') {
        res = await fetchApi(`/dokumen/${id}/finalisasi`, { method: 'POST' });
      } else if (status === 'ditandatangani') {
        res = await fetchApi(`/dokumen/${id}/tandatangani`, { method: 'POST' });
      } else {
        res = await fetchApi(`/dokumen/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, oleh }),
        });
      }

      if (res && res.ok) {
        const json = await res.json();
        const updatedItem = json.data;
        set((state) => ({
          items: state.items.map((doc) => (doc.id === id ? { ...doc, ...updatedItem } : doc)),
        }));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  },

  remove: async (id) => {
    try {
      const res = await fetchApi(`/dokumen/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({ items: state.items.filter((doc) => doc.id !== id) }));
      }
    } catch (error) {
      console.error('Failed to remove dokumen:', error);
    }
  },

  // -- Pasal Actions
  addPasal: async (docId, pasal, index) => {
    try {
      const payload = {
        pustakaId: pasal.pustakaId,
        judul: pasal.judul,
        isi: pasal.isi,
        fields: pasal.fields,
        index,
      };
      const res = await fetchApi(`/dokumen/${docId}/pasal`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedDoc = json.data;
        set((state) => ({
          items: state.items.map((doc) => (doc.id === docId ? updatedDoc : doc)),
        }));
      }
    } catch (error) {
      console.error('Failed to add pasal:', error);
    }
  },

  updatePasalUtama: async (docId, pasalId, data) => {
    try {
      const res = await fetchApi(`/dokumen/${docId}/pasal/${pasalId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedDoc = json.data;
        set((state) => ({
          items: state.items.map((doc) => (doc.id === docId ? updatedDoc : doc)),
        }));
      }
    } catch (error) {
      console.error('Failed to update pasal utama:', error);
    }
  },

  updatePasalField: async (docId, pasalId, fieldKey, nilai) => {
    try {
      const res = await fetchApi(`/dokumen/${docId}/pasal/${pasalId}`, {
        method: 'PATCH',
        body: JSON.stringify({ fieldValues: { [fieldKey]: nilai } }),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedDoc = json.data;
        set((state) => ({
          items: state.items.map((doc) => (doc.id === docId ? updatedDoc : doc)),
        }));
      }
    } catch (error) {
      console.error('Failed to update pasal field:', error);
    }
  },

  removePasal: async (docId, pasalId) => {
    try {
      const res = await fetchApi(`/dokumen/${docId}/pasal/${pasalId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const json = await res.json();
        const updatedDoc = json.data;
        set((state) => ({
          items: state.items.map((doc) => (doc.id === docId ? updatedDoc : doc)),
        }));
      }
    } catch (error) {
      console.error('Failed to remove pasal:', error);
    }
  },

  reorderPasal: async (docId, startIndex, endIndex) => {
    try {
      const doc = get().items.find((d) => d.id === docId);
      if (!doc) return;
      const list = [...doc.pasalDokumen];
      const [moved] = list.splice(startIndex, 1);
      list.splice(endIndex, 0, moved);
      const pasalIds = list.map((p) => p.id);

      const res = await fetchApi(`/dokumen/${docId}/pasal-urutan`, {
        method: 'PUT',
        body: JSON.stringify({ pasalIds }),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedDoc = json.data;
        set((state) => ({
          items: state.items.map((d) => (d.id === docId ? (updatedDoc || { ...d, pasalDokumen: list }) : d)),
        }));
      }
    } catch (error) {
      console.error('Failed to reorder pasal:', error);
    }
  },

  // -- Jadwal Actions
  updateJadwalPembayaran: async (docId, jadwal) => {
    try {
      const res = await fetchApi(`/dokumen/${docId}/jadwal`, {
        method: 'PUT',
        body: JSON.stringify(jadwal),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedDoc = json.data;
        set((state) => ({
          items: state.items.map((doc) => (doc.id === docId ? updatedDoc : doc)),
        }));
      }
    } catch (error) {
      console.error('Failed to update jadwal pembayaran:', error);
    }
  },

  updateBarisJadwal: async (docId, barisId, jumlah) => {
    try {
      const res = await fetchApi(`/dokumen/${docId}/jadwal/baris/${barisId}`, {
        method: 'PATCH',
        body: JSON.stringify({ jumlah }),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedDoc = json.data;
        set((state) => ({
          items: state.items.map((doc) => (doc.id === docId ? updatedDoc : doc)),
        }));
      }
    } catch (error) {
      console.error('Failed to update baris jadwal:', error);
    }
  },

  getDokumenByPasalPustaka: (pustakaId) => get().items.filter((d) => d.pasalDokumen.some((p) => p.pustakaId === pustakaId)),
}));
