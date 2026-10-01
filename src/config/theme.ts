import type { KategoriHutang } from '../store/hutangStore';
import type { UserRole } from '../store/authStore';

/*
  Warna identitas. Setiap warna mewakili arti, bukan hiasan:
  - Hutang = terakota: uang yang harus keluar.
  - Tagihan user = zamrud: uang yang akan masuk.
  - Jurnal = cobalt: warna aksi utama, karena jurnal adalah sumber semua angka.
  - COA = violet: struktur/kerangka akun.
  - SRP = sian tua: dokumen.
  Semua warna di bawah lolos kontras >= 4.5:1 dengan teks putih.
*/
export const MODULE_ACCENT: Record<string, string> = {
  '/dashboard': '#2b4fcb',
  '/keuangan/hutang': '#c2410c',
  '/keuangan/piutang': '#047857',
  '/keuangan/coa': '#6d28d9',
  '/keuangan/jurnal': '#2b4fcb',
  '/keuangan/srp': '#0e7490',
  '/teknisi': '#0369a1',
  '/marketing': '#be185d',
  '/kontraktor': '#b45309',
};

export function accentFor(path: string) {
  const key = Object.keys(MODULE_ACCENT)
    .filter((k) => path.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return key ? MODULE_ACCENT[key] : '#2b4fcb';
}

export const ROLE_ACCENT: Record<UserRole, string> = {
  keuangan: '#047857',
  teknisi: '#0369a1',
  marketing: '#be185d',
  kontraktor: '#b45309',
};

/** Warna kategori hutang: dipakai konsisten di badge, legenda, dan grafik komposisi. */
export const KATEGORI_HUTANG_HEX: Record<KategoriHutang, string> = {
  bank: '#2b4fcb',
  lahan: '#a16207',
  antar_proyek: '#0f766e',
  pihak_ketiga: '#7c3aed',
  pemegang_saham: '#0369a1',
  karyawan: '#be185d',
  ppn: '#475569',
};

/** Latar dan teks badge yang diturunkan dari satu warna dasar. */
export const tint = (hex: string, pct = 12) => `color-mix(in srgb, ${hex} ${pct}%, white)`;
export const shade = (hex: string, pct = 78) => `color-mix(in srgb, ${hex} ${pct}%, black)`;
