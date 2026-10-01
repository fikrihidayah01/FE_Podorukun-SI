import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  
  // Dokumen CRUD
  add: (data: Omit<DokumenLegal, 'id' | 'noDokumen' | 'createdAt' | 'riwayatStatus'> & { ptSingkatan: string }) => string;
  updateDataUtama: (id: string, data: Partial<Pick<DokumenLegal, 'pembeli' | 'hargaAwal' | 'bphtb' | 'ajbBbn' | 'uangMuka' | 'tanggalPerjanjian' | 'fasilitasTambahan' | 'lampiranScan'>>) => void;
  updateStatus: (id: string, status: StatusDokumen, oleh?: string) => void;
  remove: (id: string) => void;
  
  // Pasal actions
  addPasal: (docId: string, pasal: Omit<PasalDokumen, 'id'>, index?: number) => void;
  updatePasalUtama: (docId: string, pasalId: string, data: Partial<Pick<PasalDokumen, 'judul' | 'isi'>>) => void;
  updatePasalField: (docId: string, pasalId: string, fieldKey: string, nilai: string) => void;
  removePasal: (docId: string, pasalId: string) => void;
  reorderPasal: (docId: string, startIndex: number, endIndex: number) => void;
  
  // Jadwal actions
  updateJadwalPembayaran: (docId: string, jadwal: JadwalPembayaran | undefined) => void;
  updateBarisJadwal: (docId: string, barisId: string, jumlah: number) => void;

  getDokumenByPasalPustaka: (pustakaId: string) => DokumenLegal[];
}

export const useDokumenLegalStore = create<DokumenLegalState>()(
  persist(
    (set, get) => ({
      items: [],
      counter: 0,

      add: ({ ptSingkatan, ...data }) => {
        const id = crypto.randomUUID();
        set((state) => {
          const next = state.counter + 1;
          const tahun = new Date().getFullYear();
          const tipe = data.tipeTransaksi.toUpperCase().replace(' ', '_');
          const noDokumen = `${ptSingkatan}/${tahun}/${tipe}/${String(next).padStart(4, '0')}`;
          
          const newDoc: DokumenLegal = {
            ...data,
            id,
            noDokumen,
            riwayatStatus: [{ status: data.status, waktu: new Date().toISOString(), oleh: 'Sistem' }],
            createdAt: new Date().toISOString(),
          };
          return {
            counter: next,
            items: [...state.items, newDoc],
          };
        });
        return id;
      },

      updateDataUtama: (id, data) =>
        set((state) => ({
          items: state.items.map((doc) => (doc.id === id ? { ...doc, ...data } : doc)),
        })),

      updateStatus: (id, status, oleh = 'User') =>
        set((state) => ({
          items: state.items.map((doc) => {
            if (doc.id !== id || doc.status === status) return doc;
            return {
              ...doc,
              status,
              riwayatStatus: [...doc.riwayatStatus, { status, waktu: new Date().toISOString(), oleh }],
            };
          }),
        })),

      remove: (id) =>
        set((state) => ({ items: state.items.filter((doc) => doc.id !== id) })),

      // -- Pasal Actions
      addPasal: (docId, pasal, index) =>
        set((state) => ({
          items: state.items.map((doc) => {
            if (doc.id !== docId) return doc;
            const newPasal: PasalDokumen = { ...pasal, id: crypto.randomUUID() };
            const newArray = [...doc.pasalDokumen];
            if (index !== undefined) {
              newArray.splice(index, 0, newPasal);
            } else {
              newArray.push(newPasal);
            }
            return { ...doc, pasalDokumen: newArray };
          }),
        })),

      updatePasalUtama: (docId, pasalId, data) =>
        set((state) => ({
          items: state.items.map((doc) => {
            if (doc.id !== docId) return doc;
            return {
              ...doc,
              pasalDokumen: doc.pasalDokumen.map((p) => (p.id === pasalId ? { ...p, ...data } : p)),
            };
          }),
        })),

      updatePasalField: (docId, pasalId, fieldKey, nilai) =>
        set((state) => ({
          items: state.items.map((doc) => {
            if (doc.id !== docId) return doc;
            return {
              ...doc,
              pasalDokumen: doc.pasalDokumen.map((p) => {
                if (p.id !== pasalId) return p;
                return {
                  ...p,
                  fields: p.fields.map((f) => (f.key === fieldKey ? { ...f, nilai } : f)),
                };
              }),
            };
          }),
        })),

      removePasal: (docId, pasalId) =>
        set((state) => ({
          items: state.items.map((doc) => {
            if (doc.id !== docId) return doc;
            return { ...doc, pasalDokumen: doc.pasalDokumen.filter((p) => p.id !== pasalId) };
          }),
        })),

      reorderPasal: (docId, startIndex, endIndex) =>
        set((state) => ({
          items: state.items.map((doc) => {
            if (doc.id !== docId) return doc;
            const result = Array.from(doc.pasalDokumen);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return { ...doc, pasalDokumen: result };
          }),
        })),

      // -- Jadwal Actions
      updateJadwalPembayaran: (docId, jadwal) =>
        set((state) => ({
          items: state.items.map((doc) => (doc.id === docId ? { ...doc, jadwalPembayaran: jadwal } : doc)),
        })),

      updateBarisJadwal: (docId, barisId, jumlah) =>
        set((state) => ({
          items: state.items.map((doc) => {
            if (doc.id !== docId || !doc.jadwalPembayaran) return doc;
            return {
              ...doc,
              jadwalPembayaran: {
                ...doc.jadwalPembayaran,
                baris: doc.jadwalPembayaran.baris.map((b) => (b.id === barisId ? { ...b, jumlah } : b)),
              },
            };
          }),
        })),

      getDokumenByPasalPustaka: (pustakaId) => get().items.filter((d) => d.pasalDokumen.some((p) => p.pustakaId === pustakaId)),
    }),
    { name: 'si-dokumen-legal-v2' }
  )
);
