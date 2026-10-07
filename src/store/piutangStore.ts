import { create } from 'zustand';
import { fetchApi } from '../lib/api';
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

export interface BuktiTransaksi {
  id: string;
  nomorBukti?: string;
  namaBerkas: string;
  url?: string;
  dataUrl?: string;
  tipe: 'image' | 'pdf';
  ukuranBytes?: number;
  tanggal?: string;
  keterangan?: string;
}

export interface PeriodeAngsuran {
  periode: string; // 'YYYY-MM'
  tanggalJatuhTempo: string; // ISO date
  tagihan: number;
  dibayar: number;
  tanggalBayar: string | null; // ISO date or null
  prTrackPaymentId?: string;
  isDuplicateSuspect?: boolean;
  buktiTransaksi?: BuktiTransaksi | null;
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

// ── Store Interface ───────────────────────────────────────────

interface TagihanState {
  items: KavlingTagihan[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  getById: (id: string) => KavlingTagihan | undefined;
  getTotalNilaiKontrak: (proyekId?: string) => number;
  getTotalDibayar: (proyekId?: string) => number;
  getTotalSisa: (proyekId?: string) => number;
  updateAlokasi: (kavlingId: string, periode: string, dibayar: number, tanggalBayar: string | null) => Promise<void>;
  updateJadwalAngsuran: (kavlingId: string, periode: string, tagihan: number, tanggalJatuhTempo: string) => Promise<void>;
  updateBuktiTransaksi: (kavlingId: string, periode: string, bukti: BuktiTransaksi | null) => Promise<void>;
  addFromLegal: (legalData: any) => Promise<void>;
}

export const usePiutangStore = create<TagihanState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchApi('/piutang');
      if (!response.ok) throw new Error('Gagal mengambil data piutang');
      const data = await response.json();
      set({ items: data?.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

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

  updateAlokasi: async (kavlingId, periode, dibayar, tanggalBayar) => {
    try {
      const response = await fetchApi(`/piutang/${kavlingId}/alokasi`, {
        method: 'PUT',
        body: JSON.stringify({ periode, dibayar, tanggalBayar }),
      });
      if (!response.ok) throw new Error('Gagal update alokasi');
      const updated = await response.json();
      set((state) => ({
        items: state.items.map((k) => (k.id === kavlingId ? updated.data : k)),
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateJadwalAngsuran: async (kavlingId, periode, tagihan, tanggalJatuhTempo) => {
    try {
      const response = await fetchApi(`/piutang/${kavlingId}/jadwal`, {
        method: 'PUT',
        body: JSON.stringify({ periode, tagihan, tanggalJatuhTempo }),
      });
      if (!response.ok) throw new Error('Gagal update jadwal');
      const updated = await response.json();
      set((state) => ({
        items: state.items.map((k) => (k.id === kavlingId ? updated.data : k)),
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateBuktiTransaksi: async (kavlingId, periode, bukti) => {
    try {
      const response = await fetchApi(`/piutang/${kavlingId}/bukti`, {
        method: 'PUT',
        body: JSON.stringify({ periode, buktiTransaksi: bukti }),
      });
      if (!response.ok) throw new Error('Gagal update bukti transaksi');
      const updated = await response.json();
      set((state) => ({
        items: state.items.map((k) => (k.id === kavlingId ? updated.data : k)),
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  
  addFromLegal: async (legalData: any) => {
    try {
      const response = await fetchApi('/piutang/legal', {
        method: 'POST',
        body: JSON.stringify(legalData),
      });
      if (!response.ok) throw new Error('Gagal menambahkan dari legal');
      const newTagihanRes = await response.json();
      const newTagihan = newTagihanRes.data;
      set((state) => {
        const exists = state.items.some((k) => k.id === newTagihan.id);
        if (exists) return state;
        return { items: [...state.items, newTagihan] };
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
