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
  pasalIds: string[];
  nilaiFields: Record<string, string>; // key = pasalId_fieldKey, value = nilai yang diisi
  createdAt: string;
}

interface DokumenLegalState {
  items: DokumenLegal[];
  counter: number;
  add: (data: Omit<DokumenLegal, 'id' | 'noDokumen' | 'createdAt'> & { ptSingkatan: string }) => string;
  update: (id: string, data: Partial<Omit<DokumenLegal, 'id' | 'noDokumen' | 'createdAt'>>) => void;
  updateNilaiFields: (id: string, nilaiFields: Record<string, string>) => void;
  updateStatus: (id: string, status: StatusDokumen) => void;
  remove: (id: string) => void;
  getDokumenByPasal: (pasalId: string) => DokumenLegal[];
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
          return {
            counter: next,
            items: [
              ...state.items,
              {
                ...data,
                id,
                noDokumen,
                nilaiFields: data.nilaiFields ?? {},
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
        return id;
      },

      update: (id, data) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...data } : item)),
        })),

      updateNilaiFields: (id, nilaiFields) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, nilaiFields: { ...item.nilaiFields, ...nilaiFields } } : item
          ),
        })),

      updateStatus: (id, status) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, status } : item)),
        })),

      remove: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      getDokumenByPasal: (pasalId) =>
        get().items.filter((d) => d.pasalIds.includes(pasalId)),
    }),
    { name: 'si-dokumen-legal-v1' }
  )
);
