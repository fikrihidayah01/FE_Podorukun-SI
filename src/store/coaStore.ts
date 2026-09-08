import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type KategoriAkun = 'aktiva' | 'hutang' | 'modal' | 'pendapatan' | 'beban' | 'hpp';
export type KlasifikasiAkun = 'neraca' | 'laba_rugi';
export type TipeSaldo = 'd' | 'k';
export type StatusAkun = 'aktif' | 'nonaktif';
export type KategoriHutangPiutang = 'lahan' | 'bank' | 'antar_proyek' | 'ppn' | 'pihak_ketiga' | 'pemegang_saham' | 'karyawan' | 'kontraktor' | 'lain_lain';

export interface Akun {
  id: string;
  kodeAkun: string;
  namaAkun: string;
  kategori: KategoriAkun;
  tipeSaldo: TipeSaldo;
  klasifikasi: KlasifikasiAkun;
  status: StatusAkun;
  
  akunIndukId?: string;
  
  wajibKodePembantu: boolean;
  wajibProyek: boolean;
  isKasBank: boolean;
  
  kategoriHutangPiutang?: KategoriHutangPiutang;
}

interface CoaState {
  items: Akun[];
  add: (data: Omit<Akun, 'id'>) => void;
  update: (id: string, data: Partial<Omit<Akun, 'id'>>) => void;
  remove: (id: string) => void;
}

const DUMMY_AKUN: Akun[] = [
  { 
    id: '1', 
    kodeAkun: '110000', 
    namaAkun: 'Aktiva Lancar', 
    kategori: 'aktiva', 
    tipeSaldo: 'd', 
    klasifikasi: 'neraca', 
    status: 'aktif',
    wajibKodePembantu: false,
    wajibProyek: false,
    isKasBank: false
  },
  { 
    id: '2', 
    kodeAkun: '112010', 
    namaAkun: 'Bank Mandiri', 
    kategori: 'aktiva', 
    tipeSaldo: 'd', 
    klasifikasi: 'neraca', 
    status: 'aktif',
    akunIndukId: '1',
    wajibKodePembantu: false,
    wajibProyek: false,
    isKasBank: true
  },
  { 
    id: '3', 
    kodeAkun: '131010', 
    namaAkun: 'Persediaan kavling', 
    kategori: 'aktiva', 
    tipeSaldo: 'd', 
    klasifikasi: 'neraca', 
    status: 'aktif',
    akunIndukId: '1',
    wajibKodePembantu: false,
    wajibProyek: true,
    isKasBank: false
  },
  {
    id: '4',
    kodeAkun: '210000',
    namaAkun: 'Hutang',
    kategori: 'hutang',
    tipeSaldo: 'k',
    klasifikasi: 'neraca',
    status: 'aktif',
    wajibKodePembantu: false,
    wajibProyek: false,
    isKasBank: false
  },
  {
    id: '5',
    kodeAkun: '211010',
    namaAkun: 'Hutang lahan',
    kategori: 'hutang',
    tipeSaldo: 'k',
    klasifikasi: 'neraca',
    status: 'aktif',
    akunIndukId: '4',
    wajibKodePembantu: true,
    wajibProyek: false,
    isKasBank: false,
    kategoriHutangPiutang: 'lahan'
  },
  {
    id: '6',
    kodeAkun: '213010',
    namaAkun: 'Hutang kontraktor',
    kategori: 'hutang',
    tipeSaldo: 'k',
    klasifikasi: 'neraca',
    status: 'aktif',
    akunIndukId: '4',
    wajibKodePembantu: true,
    wajibProyek: false,
    isKasBank: false,
    kategoriHutangPiutang: 'kontraktor'
  },
  {
    id: '7',
    kodeAkun: '611010',
    namaAkun: 'Beban bunga',
    kategori: 'beban',
    tipeSaldo: 'd',
    klasifikasi: 'laba_rugi',
    status: 'aktif',
    wajibKodePembantu: false,
    wajibProyek: false,
    isKasBank: false
  }
];

export const useCoaStore = create<CoaState>()(
  persist(
    (set) => ({
      items: DUMMY_AKUN,

      add: (data) =>
        set((state) => ({
          items: [...state.items, { ...data, id: crypto.randomUUID() }],
        })),

      update: (id, data) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...data } : item
          ),
        })),

      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
    }),
    { name: 'si-coa-v2' }
  )
);

export const KATEGORI_AKUN_LABELS: Record<KategoriAkun, string> = {
  aktiva: 'Aktiva',
  hutang: 'Hutang',
  modal: 'Modal',
  pendapatan: 'Pendapatan',
  beban: 'Beban',
  hpp: 'HPP',
};

export const KLASIFIKASI_AKUN_LABELS: Record<KlasifikasiAkun, string> = {
  neraca: 'Neraca',
  laba_rugi: 'Laba Rugi',
};

export const KATEGORI_HUTANG_PIUTANG_LABELS: Record<KategoriHutangPiutang, string> = {
  lahan: 'Lahan',
  bank: 'Bank',
  antar_proyek: 'Antar Proyek',
  ppn: 'PPN',
  pihak_ketiga: 'Pihak Ketiga',
  pemegang_saham: 'Pemegang Saham',
  karyawan: 'Karyawan',
  kontraktor: 'Kontraktor',
  lain_lain: 'Lain-lain',
};
