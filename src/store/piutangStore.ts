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
  id?: string;
  jadwalId?: string;
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
  totalDibayar: number;
  sisa: number;
  status?: string;
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
  pindahAlokasi: (piutangId: string, dariJadwalId: string, keJadwalId: string, nominal: number) => Promise<void>;
  updateJadwalAngsuran: (
    kavlingId: string,
    periode: string,
    tagihan: number,
    tanggalJatuhTempo: string,
    jadwalId?: string
  ) => Promise<void>;
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
      set({ items: (data?.data || []).map((item: KavlingTagihan) => ({ ...item, periodeAngsuran: item.periodeAngsuran.map((row) => ({ ...row, id: row.jadwalId || row.id })) })), isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  getById: (id) => get().items.find((k) => k.id === id),

  getTotalNilaiKontrak: (proyekId) => {
    const filtered = get().items.filter((k) => k.status !== 'batal' && (!proyekId || k.proyekId === proyekId));
    return filtered.reduce((s, k) => s + k.nilaiSppr, 0);
  },

  getTotalDibayar: (proyekId) => {
    const filtered = get().items.filter((k) => k.status !== 'batal' && (!proyekId || k.proyekId === proyekId));
    return filtered.reduce((s, k) => {
      return s + k.totalDibayar;
    }, 0);
  },

  getTotalSisa: (proyekId) => {
    const filtered = get().items.filter((k) => k.status !== 'batal' && (!proyekId || k.proyekId === proyekId));
    return filtered.reduce((s, k) => {
      return s + k.sisa;
    }, 0);
  },

  pindahAlokasi: async (piutangId, dariJadwalId, keJadwalId, nominal) => {
    const response = await fetchApi(`/piutang/${piutangId}/alokasi/pindah`, {
      method: 'POST',
      body: JSON.stringify({ dariJadwalId, keJadwalId, nominal }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || 'Gagal memindahkan alokasi pembayaran');
    }
    await get().fetchItems();
  },
  
  updateJadwalAngsuran: async (kavlingId, periode, tagihan, tanggalJatuhTempo, jadwalId) => {
    try {
      const response = await fetchApi(`/piutang/${kavlingId}/jadwal`, {
        method: 'PUT',
        body: JSON.stringify({ periode, tagihan, tanggalJatuhTempo, jadwalId }),
      });
      if (response.ok) {
        const updated = await response.json().catch(() => null);
        if (updated?.data) {
          set((state) => ({
            items: state.items.map((k) => (k.id === kavlingId ? updated.data : k)),
          }));
          return;
        }
      }
    } catch {}

    set((state) => ({
      items: state.items.map((k) => {
        if (k.id !== kavlingId) return k;
        const updatedPeriode = k.periodeAngsuran.map((p) =>
          p.periode === periode || (jadwalId && p.id === jadwalId)
            ? { ...p, tagihan, tanggalJatuhTempo }
            : p
        );
        const totalTagihan = updatedPeriode.reduce((sum, p) => sum + p.tagihan, 0);
        const totalLainnya = (k.pembayaranLainnya || []).reduce((sum, p) => sum + p.nominal, 0);
        const totalDibayar = updatedPeriode.reduce((sum, p) => sum + p.dibayar, 0);
        const nilaiSppr = totalTagihan + totalLainnya;
        return {
          ...k,
          nilaiSppr,
          totalDibayar,
          sisa: Math.max(0, nilaiSppr - totalDibayar),
          periodeAngsuran: updatedPeriode,
        };
      }),
    }));
  },

  addFromLegal: async (_legalData: any) => {
    await get().fetchItems();
  },
}));
