import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────

export type StatusBast = 'belum_bast' | 'sudah_bast';
export type TipeTransaksi = 'cash' | 'kpr' | 'in_house';

export type StatusPeriode =
  | 'lunas'
  | 'bayar_awal'
  | 'dibayar_dimuka'
  | 'sebagian'
  | 'terlambat'
  | 'belum_bayar'
  | 'belum_jatuh_tempo';

// ── Labels & Colors ───────────────────────────────────────────

export const TIPE_TRANSAKSI_LABELS: Record<TipeTransaksi, string> = {
  cash: 'Cash',
  kpr: 'KPR',
  in_house: 'In house',
};

export const TIPE_TRANSAKSI_COLOR: Record<TipeTransaksi, string> = {
  cash: 'bg-amber-100 text-amber-800 border-amber-200',
  kpr: 'bg-sky-100 text-sky-800 border-sky-200',
  in_house: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const STATUS_PERIODE_LABELS: Record<StatusPeriode, string> = {
  lunas: 'Lunas',
  bayar_awal: 'Bayar awal',
  dibayar_dimuka: 'Dibayar dimuka',
  sebagian: 'Sebagian',
  terlambat: 'Terlambat',
  belum_bayar: 'Belum bayar',
  belum_jatuh_tempo: 'Belum JT',
};

export const STATUS_PERIODE_COLOR: Record<StatusPeriode, string> = {
  lunas: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  bayar_awal: 'bg-sky-100 text-sky-700 border-sky-200',
  dibayar_dimuka: 'bg-purple-100 text-purple-700 border-purple-200',
  sebagian: 'bg-amber-100 text-amber-700 border-amber-200',
  terlambat: 'bg-rose-100 text-rose-700 border-rose-200',
  belum_bayar: 'bg-red-100 text-red-700 border-red-200',
  belum_jatuh_tempo: 'bg-gray-100 text-gray-500 border-gray-200',
};

// ── Data Models ───────────────────────────────────────────────

export interface PeriodeAngsuran {
  periode: string; // 'YYYY-MM'
  tanggalJatuhTempo: string; // ISO date
  tagihan: number;
  dibayar: number;
  tanggalBayar: string | null; // ISO date or null
  prTrackPaymentId?: string;
  isDuplicateSuspect?: boolean;
}

export interface PembayaranLainnya {
  id: string;
  tipe: 'booking_fee' | 'dp' | 'pencairan_kpr' | 'lainnya';
  tanggal: string; // ISO date
  nominal: number;
  keterangan?: string;
}

export interface AlokasiKoreksi {
  id: string;
  tanggal: string;
  periodeAsal: string;
  periodeTujuan: string;
  nominal: number;
  oleh: string;
}

export interface KavlingTagihan {
  id: string;
  proyekId: string;
  nomorKavling: string;
  namaUser: string;
  tipeTransaksi: TipeTransaksi;
  statusBast: StatusBast;
  nilaiSppr: number;
  tanggalAcuanAngsuran: number; // day of month 1-31
  periodeAwal: string; // 'YYYY-MM'
  totalBulanAngsuran: number;
  periodeAngsuran: PeriodeAngsuran[];
  pembayaranLainnya: PembayaranLainnya[];
  riwayatAlokasi?: AlokasiKoreksi[];
}

// ── Dummy Data ────────────────────────────────────────────────
// Exact match with screenshot media_1788804367016.png and media_1788804395580.png

const DUMMY_KAVLING: KavlingTagihan[] = [
  {
    id: 'kv1',
    proyekId: 'p1', // Atlantis Hills
    nomorKavling: 'Kav A7',
    namaUser: 'Budi Santoso',
    tipeTransaksi: 'kpr',
    statusBast: 'belum_bast',
    nilaiSppr: 500_000_000,
    tanggalAcuanAngsuran: 15,
    periodeAwal: '2024-01',
    totalBulanAngsuran: 12,
    periodeAngsuran: [
      { periode: '2024-01', tanggalJatuhTempo: '2024-01-15', tagihan: 25_000_000, dibayar: 25_000_000, tanggalBayar: '2024-01-15' },
      { periode: '2024-02', tanggalJatuhTempo: '2024-02-15', tagihan: 25_000_000, dibayar: 25_000_000, tanggalBayar: '2024-02-14' },
      { periode: '2024-03', tanggalJatuhTempo: '2024-03-15', tagihan: 25_000_000, dibayar: 25_000_000, tanggalBayar: '2024-03-15' },
      { periode: '2024-04', tanggalJatuhTempo: '2024-04-15', tagihan: 25_000_000, dibayar: 25_000_000, tanggalBayar: '2024-04-15' },
      { periode: '2024-05', tanggalJatuhTempo: '2024-05-15', tagihan: 25_000_000, dibayar: 0, tanggalBayar: null },
      { periode: '2024-06', tanggalJatuhTempo: '2024-06-15', tagihan: 25_000_000, dibayar: 0, tanggalBayar: null },
    ],
    pembayaranLainnya: [
      { id: 'pl1', tipe: 'booking_fee', tanggal: '2023-12-10', nominal: 10_000_000, keterangan: 'Booking Fee' },
      { id: 'pl2', tipe: 'dp', tanggal: '2023-12-28', nominal: 40_000_000, keterangan: 'Uang Muka Penjualan' },
    ],
  },
  {
    id: 'kv2',
    proyekId: 'p1', // Atlantis Hills
    nomorKavling: 'Kav B12',
    namaUser: 'Sri Wahyuni',
    tipeTransaksi: 'in_house',
    statusBast: 'belum_bast',
    nilaiSppr: 475_000_000,
    tanggalAcuanAngsuran: 15,
    periodeAwal: '2024-04',
    totalBulanAngsuran: 6,
    // Exact match for media_1788804395580.png (Kav B-05 / B12)
    periodeAngsuran: [
      { periode: '2024-04', tanggalJatuhTempo: '2024-04-15', tagihan: 41_000_000, dibayar: 41_000_000, tanggalBayar: '2024-04-15' },
      { periode: '2024-05', tanggalJatuhTempo: '2024-05-15', tagihan: 41_000_000, dibayar: 41_000_000, tanggalBayar: '2024-05-15' },
      { periode: '2024-06', tanggalJatuhTempo: '2024-06-15', tagihan: 41_000_000, dibayar: 41_000_000, tanggalBayar: '2024-06-08' },
      { periode: '2024-07', tanggalJatuhTempo: '2024-07-15', tagihan: 41_000_000, dibayar: 41_000_000, tanggalBayar: '2024-06-09' },
      { periode: '2024-08', tanggalJatuhTempo: '2024-08-15', tagihan: 41_000_000, dibayar: 25_000_000, tanggalBayar: '2024-08-20' },
      { periode: '2024-09', tanggalJatuhTempo: '2024-09-15', tagihan: 41_000_000, dibayar: 0, tanggalBayar: null },
    ],
    pembayaranLainnya: [
      { id: 'pl3', tipe: 'booking_fee', tanggal: '2024-03-01', nominal: 10_000_000, keterangan: 'Booking Fee' },
      { id: 'pl4', tipe: 'dp', tanggal: '2024-03-20', nominal: 37_500_000, keterangan: 'DP In House' },
    ],
  },
  {
    id: 'kv3',
    proyekId: 'p3', // Aya Sophia
    nomorKavling: 'Kav C3',
    namaUser: 'Agus Priyono',
    tipeTransaksi: 'cash',
    statusBast: 'belum_bast',
    nilaiSppr: 620_000_000,
    tanggalAcuanAngsuran: 10,
    periodeAwal: '2024-02',
    totalBulanAngsuran: 1,
    periodeAngsuran: [
      { periode: '2024-02', tanggalJatuhTempo: '2024-02-10', tagihan: 620_000_000, dibayar: 620_000_000, tanggalBayar: '2024-02-08' },
    ],
    pembayaranLainnya: [
      { id: 'pl5', tipe: 'booking_fee', tanggal: '2024-01-15', nominal: 20_000_000, keterangan: 'Booking Fee Cash' },
    ],
  },
  {
    id: 'kv4',
    proyekId: 'p3', // Aya Sophia
    nomorKavling: 'Kav C9',
    namaUser: 'Dewi Lestari',
    tipeTransaksi: 'kpr',
    statusBast: 'belum_bast',
    nilaiSppr: 545_000_000,
    tanggalAcuanAngsuran: 25,
    periodeAwal: '2024-05',
    totalBulanAngsuran: 12,
    periodeAngsuran: [
      { periode: '2024-05', tanggalJatuhTempo: '2024-05-25', tagihan: 27_250_000, dibayar: 27_250_000, tanggalBayar: '2024-05-24' },
      { periode: '2024-06', tanggalJatuhTempo: '2024-06-25', tagihan: 27_250_000, dibayar: 0, tanggalBayar: null },
      { periode: '2024-07', tanggalJatuhTempo: '2024-07-25', tagihan: 27_250_000, dibayar: 0, tanggalBayar: null },
    ],
    pembayaranLainnya: [
      { id: 'pl6', tipe: 'booking_fee', tanggal: '2024-04-10', nominal: 10_000_000, keterangan: 'Booking Fee KPR' },
    ],
  },
];

// ── Store Interface ───────────────────────────────────────────

interface TagihanState {
  items: KavlingTagihan[];
  getById: (id: string) => KavlingTagihan | undefined;
  getTotalNilaiKontrak: (proyekId?: string) => number;
  getTotalDibayar: (proyekId?: string) => number;
  getTotalSisa: (proyekId?: string) => number;
  updateAlokasi: (kavlingId: string, periode: string, dibayar: number, tanggalBayar: string | null) => void;
}

export const usePiutangStore = create<TagihanState>()(
  persist(
    (set, get) => ({
      items: DUMMY_KAVLING,

      getById: (id) => get().items.find((k) => k.id === id),

      getTotalNilaiKontrak: (proyekId) => {
        const filtered = proyekId ? get().items.filter((k) => k.proyekId === proyekId) : get().items;
        return filtered.reduce((s, k) => s + k.nilaiSppr, 0);
      },

      getTotalDibayar: (proyekId) => {
        const filtered = proyekId ? get().items.filter((k) => k.proyekId === proyekId) : get().items;
        return filtered.reduce((s, k) => {
          const dibayarAngsuran = k.periodeAngsuran.reduce((sum, p) => sum + p.dibayar, 0);
          return s + dibayarAngsuran;
        }, 0);
      },

      getTotalSisa: (proyekId) => {
        const filtered = proyekId ? get().items.filter((k) => k.proyekId === proyekId) : get().items;
        return filtered.reduce((s, k) => {
          const dibayarAngsuran = k.periodeAngsuran.reduce((sum, p) => sum + p.dibayar, 0);
          return s + (k.nilaiSppr - dibayarAngsuran);
        }, 0);
      },

      updateAlokasi: (kavlingId, periode, dibayar, tanggalBayar) => {
        set((state) => ({
          items: state.items.map((k) => {
            if (k.id !== kavlingId) return k;
            return {
              ...k,
              periodeAngsuran: k.periodeAngsuran.map((p) => {
                if (p.periode !== periode) return p;
                return { ...p, dibayar, tanggalBayar };
              }),
            };
          }),
        }));
      },
    }),
    { name: 'si-tagihan-v2' }
  )
);
