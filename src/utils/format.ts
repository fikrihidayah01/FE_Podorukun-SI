const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function formatAngka(n: number) {
  return n.toLocaleString('id-ID');
}

export function formatRupiah(n: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return 'Rp 0';
  const sign = n < 0 ? '-' : '';
  return `${sign}Rp ${Math.abs(n).toLocaleString('id-ID')}`;
}

/** Ringkas untuk kartu ringkasan: Rp 2,5 M / Rp 340,0 Jt. */
export function formatRupiahShort(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const opts = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toLocaleString('id-ID', opts)} M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toLocaleString('id-ID', opts)} Jt`;
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

/** dd/mm/yyyy, format tanggal standar laporan keuangan. */
export function formatTanggal(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** 12 Sep 2026 */
export function formatTanggalPanjang(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
}

/** 'YYYY-MM' -> 'September 2026' */
export function formatBulan(bulan: string) {
  const [y, m] = bulan.split('-');
  return `${BULAN[Number(m) - 1]} ${y}`;
}

/** 'YYYY-MM' -> 'Sep 2026' */
export function formatBulanPendek(bulan: string) {
  const [y, m] = bulan.split('-');
  return `${BULAN_PENDEK[Number(m) - 1]} ${y}`;
}

export function bulanIni() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Enam bulan ke belakang sampai enam bulan ke depan, untuk filter periode. */
export function opsiBulan(rentang = 6) {
  const now = new Date();
  const out: { value: string; label: string }[] = [];
  for (let i = -rentang; i <= rentang; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ value, label: formatBulan(value) });
  }
  return out;
}

export function inisial(nama: string) {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}
