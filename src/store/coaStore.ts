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

export interface RiwayatAkun {
  id: string;
  akunId: string;
  waktu: string; // ISO string
  field: string;
  nilaiLama: string;
  nilaiBaru: string;
  oleh: string;
}

interface CoaState {
  items: Akun[];
  riwayat: RiwayatAkun[];
  add: (data: Omit<Akun, 'id'>, oleh?: string) => void;
  update: (id: string, data: Partial<Omit<Akun, 'id'>>, oleh?: string) => void;
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
      riwayat: [],

      add: (data, oleh = 'System') =>
        set((state) => {
          const newId = crypto.randomUUID();
          const newRiwayat: RiwayatAkun = {
            id: crypto.randomUUID(),
            akunId: newId,
            waktu: new Date().toISOString(),
            field: 'Akun dibuat',
            nilaiLama: '—',
            nilaiBaru: '—',
            oleh
          };
          return {
            items: [...state.items, { ...data, id: newId }],
            riwayat: [...state.riwayat, newRiwayat]
          };
        }),

      update: (id, data, oleh = 'System') =>
        set((state) => {
          const oldItem = state.items.find(i => i.id === id);
          if (!oldItem) return state;

          const newRiwayats: RiwayatAkun[] = [];
          
          Object.keys(data).forEach(key => {
            const k = key as keyof typeof data;
            const oldVal = oldItem[k];
            const newVal = data[k];

            if (oldVal !== newVal) {
              let fieldLabel = key;
              let nLama = String(oldVal ?? '—');
              let nBaru = String(newVal ?? '—');

              if (key === 'wajibProyek' || key === 'wajibKodePembantu' || key === 'isKasBank') {
                nLama = oldVal ? 'Ya' : 'Tidak';
                nBaru = newVal ? 'Ya' : 'Tidak';
                if (key === 'wajibProyek') fieldLabel = 'Wajib proyek';
                if (key === 'wajibKodePembantu') fieldLabel = 'Wajib kode pembantu';
                if (key === 'isKasBank') fieldLabel = 'Akun kas/bank';
              } else if (key === 'kategoriHutangPiutang') {
                fieldLabel = 'Kategori hutang/piutang';
                nLama = KATEGORI_HUTANG_PIUTANG_LABELS[oldVal as KategoriHutangPiutang] || nLama;
                nBaru = KATEGORI_HUTANG_PIUTANG_LABELS[newVal as KategoriHutangPiutang] || nBaru;
              } else if (key === 'namaAkun') {
                fieldLabel = 'Nama akun';
              } else if (key === 'status') {
                fieldLabel = 'Status';
                nLama = oldVal === 'aktif' ? 'Aktif' : 'Nonaktif';
                nBaru = newVal === 'aktif' ? 'Aktif' : 'Nonaktif';
              } else if (key === 'kodeAkun') {
                fieldLabel = 'Kode akun';
              }

              newRiwayats.push({
                id: crypto.randomUUID(),
                akunId: id,
                waktu: new Date().toISOString(),
                field: fieldLabel,
                nilaiLama: nLama,
                nilaiBaru: nBaru,
                oleh
              });
            }
          });

          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...data } : item
            ),
            riwayat: [...state.riwayat, ...newRiwayats]
          };
        }),

      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          riwayat: state.riwayat.filter(r => r.akunId !== id)
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
