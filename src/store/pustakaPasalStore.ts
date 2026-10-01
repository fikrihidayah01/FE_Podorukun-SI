import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  add: (data: Omit<Pasal, 'id' | 'createdAt'>) => string;
  update: (id: string, data: Partial<Omit<Pasal, 'id' | 'createdAt'>>) => void;
  nonaktifkan: (id: string) => void;
  aktifkan: (id: string) => void;
  remove: (id: string) => void;
  hitungDipakai: (id: string, dokumenIds: string[]) => number;
}

export const usePustakaPasalStore = create<PustakaPasalState>()(
  persist(
    (set) => ({
      items: [
        {
          id: 'pasal-001',
          judul: 'Pasal 1 — Identitas Para Pihak',
          isi: 'Pihak Pertama adalah {nama_pt}, diwakili oleh {nama_direktur}, berkedudukan di {alamat_pt}. Pihak Kedua adalah {nama_pembeli}, bertempat tinggal di {alamat_pembeli}.',
          berlaku: 'semua',
          fields: [
            { id: 'f-001', key: 'nama_pt', label: 'Nama PT', tipe: 'teks' },
            { id: 'f-002', key: 'nama_direktur', label: 'Nama Direktur', tipe: 'teks' },
            { id: 'f-003', key: 'alamat_pt', label: 'Alamat PT', tipe: 'teks' },
            { id: 'f-004', key: 'nama_pembeli', label: 'Nama Pembeli', tipe: 'teks' },
            { id: 'f-005', key: 'alamat_pembeli', label: 'Alamat Pembeli', tipe: 'teks' },
          ],
          aktif: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pasal-002',
          judul: 'Pasal 2 — Obyek Perjanjian',
          isi: 'Pihak Pertama setuju untuk menjual kavling nomor {no_kavling} seluas {luas_kavling} m² yang terletak di {nama_perumahan} kepada Pihak Kedua.',
          berlaku: 'semua',
          fields: [
            { id: 'f-006', key: 'no_kavling', label: 'Nomor Kavling', tipe: 'teks' },
            { id: 'f-007', key: 'luas_kavling', label: 'Luas Kavling (m²)', tipe: 'angka' },
            { id: 'f-008', key: 'nama_perumahan', label: 'Nama Perumahan', tipe: 'teks' },
          ],
          aktif: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pasal-003',
          judul: 'Pasal 3 — Harga dan Cara Pembayaran KPR',
          isi: 'Harga jual disepakati sebesar Rp {harga_nett} termasuk BPHTB dan AJB. Uang muka sebesar Rp {uang_muka} dibayar pada {tanggal_perjanjian}. Sisa sebesar Rp {sisa_kpr} dilunasi melalui fasilitas KPR.',
          berlaku: 'kpr',
          fields: [
            { id: 'f-009', key: 'harga_nett', label: 'Harga Nett', tipe: 'angka' },
            { id: 'f-010', key: 'uang_muka', label: 'Uang Muka', tipe: 'angka' },
            { id: 'f-011', key: 'sisa_kpr', label: 'Sisa KPR', tipe: 'angka' },
            { id: 'f-012', key: 'tanggal_perjanjian', label: 'Tanggal Perjanjian', tipe: 'tanggal' },
          ],
          aktif: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pasal-004',
          judul: 'Pasal 3 — Harga dan Cara Pembayaran Tunai',
          isi: 'Harga jual disepakati sebesar Rp {harga_nett} dibayar tunai seluruhnya pada {tanggal_perjanjian}.',
          berlaku: 'cash',
          fields: [
            { id: 'f-013', key: 'harga_nett', label: 'Harga Nett', tipe: 'angka' },
            { id: 'f-014', key: 'tanggal_perjanjian', label: 'Tanggal Perjanjian', tipe: 'tanggal' },
          ],
          aktif: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pasal-005',
          judul: 'Pasal 3 — Harga dan Cara Pembayaran In House',
          isi: 'Harga jual disepakati sebesar Rp {harga_nett}. Cicilan sebesar Rp {cicilan_per_bulan} per bulan selama {tenor_bulan} bulan dimulai sejak {tanggal_mulai}.',
          berlaku: 'in_house',
          fields: [
            { id: 'f-015', key: 'harga_nett', label: 'Harga Nett', tipe: 'angka' },
            { id: 'f-016', key: 'cicilan_per_bulan', label: 'Cicilan per Bulan', tipe: 'angka' },
            { id: 'f-017', key: 'tenor_bulan', label: 'Tenor (bulan)', tipe: 'angka' },
            { id: 'f-018', key: 'tanggal_mulai', label: 'Tanggal Mulai', tipe: 'tanggal' },
          ],
          aktif: true,
          createdAt: new Date().toISOString(),
        },
      ],

      add: (data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          items: [...state.items, { ...data, id, createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      update: (id, data) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...data } : item)),
        })),

      nonaktifkan: (id) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, aktif: false } : item)),
        })),

      aktifkan: (id) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, aktif: true } : item)),
        })),

      remove: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      hitungDipakai: (_id, dokumenIds) => dokumenIds.length, // dipanggil dengan filter dari dokumenLegalStore
    }),
    { name: 'si-pustaka-pasal-v1' }
  )
);
