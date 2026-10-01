import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tone } from '../components/ui/Badge';

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

export const STATUS_PERIODE_LABELS: Record<StatusPeriode, string> = {
  lunas: 'Lunas',
  bayar_awal: 'Bayar awal',
  dibayar_dimuka: 'Dibayar dimuka',
  sebagian: 'Sebagian',
  terlambat: 'Terlambat',
  belum_bayar: 'Belum bayar',
  belum_jatuh_tempo: 'Belum jatuh tempo',
};

// Hijau = sudah lunas (kapan pun), kuning = lunas tapi telat atau baru sebagian, merah = lewat jatuh tempo tanpa bayar.
export const STATUS_PERIODE_TONE: Record<StatusPeriode, Tone> = {
  lunas: 'positive',
  bayar_awal: 'positive',
  dibayar_dimuka: 'positive',
  sebagian: 'warning',
  terlambat: 'warning',
  belum_bayar: 'danger',
  belum_jatuh_tempo: 'neutral',
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
  addFromLegal: (legalData: any) => void;
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
      
      addFromLegal: (legalData: any) => {
        set((state) => {
          // Hanya tambahkan jika belum ada di Piutang (berdasarkan legalData.id)
          // Dalam skenario nyata, kavlingId bisa jadi unik per transaksi jika belum serah terima.
          const exists = state.items.some((k) => k.id === legalData.id);
          if (exists) return state;

          const jadwal = legalData.jadwalPembayaran;
          const periodeAngsuran: PeriodeAngsuran[] = jadwal?.baris?.map((b: any) => {
            const date = new Date(b.tanggal);
            const periodeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return {
              periode: periodeStr,
              tanggalJatuhTempo: b.tanggal,
              tagihan: b.jumlah,
              dibayar: 0,
              tanggalBayar: null
            };
          }) ?? [];

          const newTagihan: KavlingTagihan = {
            id: legalData.id,
            proyekId: legalData.perumahanId,
            nomorKavling: legalData.kavlingId, // Idealnya ambil nomor aktual
            namaUser: legalData.pembeli.nama,
            tipeTransaksi: legalData.tipeTransaksi.toLowerCase() as TipeTransaksi,
            statusBast: 'belum_bast',
            nilaiSppr: legalData.hargaAwal + legalData.bphtb + legalData.ajbBbn,
            tanggalAcuanAngsuran: parseInt(jadwal?.tanggalAcuan ?? '1', 10) || 1,
            periodeAwal: periodeAngsuran.length > 0 ? periodeAngsuran[0].periode : '',
            totalBulanAngsuran: periodeAngsuran.length,
            periodeAngsuran,
            pembayaranLainnya: [],
          };

          return { items: [...state.items, newTagihan] };
        });
      },

    }),
    { name: 'si-tagihan-v2' }
  )
);
