import { create } from 'zustand';
import { fetchApi } from '../lib/api';
import { apiError, errorMessage, notifyError } from '../lib/errors';

// ── Kategori Hutang ──────────────────────────────────────────
export type KategoriHutang =
  | 'lahan'
  | 'ppn'
  | 'pihak_ketiga'
  | 'pemegang_saham'
  | 'karyawan'
  | 'antar_proyek'
  | 'bank';

export const KATEGORI_HUTANG_LABELS: Record<KategoriHutang, string> = {
  lahan: 'Lahan',
  ppn: 'PPN',
  pihak_ketiga: 'Pihak ketiga',
  pemegang_saham: 'Pemegang saham',
  karyawan: 'Karyawan',
  antar_proyek: 'Antar proyek',
  bank: 'Bank',
};

// ── Kode Pembantu (pihak hutang) ─────────────────────────────
export interface KodePembantu {
  id: string;
  nama: string;
  proyekId: string;
  kategori: KategoriHutang | 'kontraktor' | 'pembeli';
}

// ── Mutasi Hutang ────────────────────────────────────────────
export type JenisMutasi = 'debit' | 'kredit';

export interface MutasiHutang {
  id: string;
  proyekId: string;
  kodePembantuId: string;
  kategori: KategoriHutang;
  tanggal: string; // ISO date
  uraian: string;
  jenisMutasi: JenisMutasi; // debit = kurangi hutang, kredit = tambah hutang
  nominal: number;
  akunCoaId?: string;
  referensi?: string;
  lampiran?: string;
  proyekLawanId?: string;
  mirrorMutasiId?: string;
  /** 'saldo_awal' untuk baris saldo awal yang dikirim backend sebagai mutasi pertama. */
  sumber?: string;
  jurnalId?: string | null;
  nomorJurnal?: string | null;
  /** Baris berstatus 'draft' dikirim backend tetapi belum masuk saldo. */
  jurnalStatus?: string | null;
  createdAt: string | null;
}

/** Mutasi yang sudah terbuku (masuk saldo). Draft ditampilkan, tetapi tidak dihitung. */
export const mutasiTerbuku = (m: Pick<MutasiHutang, 'jurnalStatus'>) => m.jurnalStatus !== 'draft';

// ── Saldo computed view ──────────────────────────────────────
export interface SaldoKodePembantu {
  kodePembantu: Omit<KodePembantu, 'kategori'> & { kategori: KategoriHutang };
  saldoAwal: number;
  totalDebit: number;
  totalKredit: number;
  mutasiBulan: number; // net mutasi = kredit - debit
  saldoAkhir: number;
}

// ── Store ────────────────────────────────────────────────────
interface HutangState {
  kodePembantus: KodePembantu[];
  mutasis: Record<string, MutasiHutang[]>; // key: kodePembantuId
  mutasiAntarProyek: MutasiHutang[];
  saldos: SaldoKodePembantu[];
  /** Bulan ('YYYY-MM') yang sedang terisi di `saldos`. */
  saldoBulan: string | null;
  isLoading: boolean;
  error: string | null;

  fetchKodePembantus: (proyekId?: string, kategori?: KategoriHutang) => Promise<void>;
  addKodePembantu: (data: Omit<KodePembantu, 'id'>) => Promise<string>;
  removeKodePembantu: (id: string) => Promise<void>;

  fetchMutasiByKodePembantu: (kodePembantuId: string) => Promise<void>;
  fetchMutasiAntarProyek: (proyekId?: string) => Promise<void>;
  addMutasi: (data: Omit<MutasiHutang, 'id' | 'createdAt' | 'mirrorMutasiId' | 'kodePembantuId'> & { kodePembantuId?: string; kodePembantuBaru?: string }) => Promise<void>;
  removeMutasi: (id: string) => Promise<void>;

  fetchSaldo: (bulan: string) => Promise<void>;

  // Synchronous getters (reads from state, for UI compatibility)
  getSaldoPerKodePembantu: (
    bulan?: string,
    proyekId?: string,
    kategori?: KategoriHutang
  ) => SaldoKodePembantu[];
  getTotalHutang: () => number;
  getTotalByKategori: (kategori: KategoriHutang) => number;
  getMutasiByKodePembantu: (kodePembantuId: string) => MutasiHutang[];
  getMutasiAntarProyek: (proyekId?: string) => MutasiHutang[];
}

let saldoRequest = 0;

export const useHutangStore = create<HutangState>((set, get) => ({
  kodePembantus: [],
  mutasis: {},
  mutasiAntarProyek: [],
  saldos: [],
  saldoBulan: null,
  isLoading: false,
  error: null,

  fetchKodePembantus: async (proyekId, kategori) => {
    set({ isLoading: true, error: null });
    try {
      const p = new URLSearchParams();
      if (proyekId) p.append('proyekId', proyekId);
      if (kategori) p.append('kategori', kategori);
      const res = await fetchApi('/kode-pembantu?' + p.toString());
      const json = await res.json();
      if (res.ok) set({ kodePembantus: json.data || [] });
    } catch (e) {
      set({ error: errorMessage(e, 'Gagal memuat pihak/rekanan') });
      notifyError(e);
    } finally {
      set({ isLoading: false });
    }
  },

  addKodePembantu: async (data) => {
    const res = await fetchApi('/kode-pembantu', { method: 'POST', body: JSON.stringify(data) });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw apiError(res, 'Gagal menambah pihak');
    await get().fetchKodePembantus();
    return json.data.id;
  },

  removeKodePembantu: async (id) => {
    const res = await fetchApi(`/kode-pembantu/${id}`, { method: 'DELETE' });
    if (!res.ok) throw apiError(res, 'Gagal menghapus pihak');
    await get().fetchKodePembantus();
  },

  fetchMutasiByKodePembantu: async (kodePembantuId) => {
    try {
      const res = await fetchApi(`/hutang/mutasi?kodePembantuId=${kodePembantuId}`);
      const json = await res.json();
      if (res.ok) {
        set((state) => ({ mutasis: { ...state.mutasis, [kodePembantuId]: json.data || [] } }));
      }
    } catch (e) { notifyError(e); }
  },

  fetchMutasiAntarProyek: async (proyekId) => {
    try {
      const res = await fetchApi(`/hutang/antar-proyek${proyekId ? '?proyekId=' + proyekId : ''}`);
      const json = await res.json();
      if (res.ok) {
        set({ mutasiAntarProyek: json.data || [] });
      }
    } catch (e) { notifyError(e); }
  },

  addMutasi: async (data) => {
    const res = await fetchApi('/hutang/mutasi', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw apiError(res, 'Gagal menyimpan mutasi hutang');
    // UI can call fetchMutasi/fetchSaldo directly after adding
  },

  removeMutasi: async (id) => {
    const res = await fetchApi(`/hutang/mutasi/${id}`, { method: 'DELETE' });
    if (!res.ok) throw apiError(res, 'Gagal menghapus mutasi hutang');
  },

  fetchSaldo: async (bulan) => {
    // Ganti periode cepat: hanya respons permintaan terakhir yang boleh mengisi tabel.
    const token = ++saldoRequest;
    try {
      const res = await fetchApi(`/hutang/saldo?bulan=${bulan}`);
      const json = await res.json().catch(() => null);
      if (token !== saldoRequest) return;
      if (!res.ok) throw apiError(res, 'Gagal memuat saldo hutang');
      set({ saldos: json?.data || [], saldoBulan: bulan, error: null });
    } catch (e) {
      if (token === saldoRequest) set({ error: e instanceof Error ? e.message : 'Gagal memuat saldo hutang' });
    }
  },

  getSaldoPerKodePembantu: (_bulan, proyekId, kategori) => {
    let result = get().saldos;
    if (proyekId) result = result.filter((s) => s.kodePembantu.proyekId === proyekId);
    if (kategori) result = result.filter((s) => s.kodePembantu.kategori === kategori);
    return result;
  },

  getTotalHutang: () => {
    return get().saldos.reduce((sum, s) => sum + s.saldoAkhir, 0);
  },

  getTotalByKategori: (kategori) => {
    return get().saldos.filter((s) => s.kodePembantu.kategori === kategori).reduce((sum, s) => sum + s.saldoAkhir, 0);
  },

  getMutasiByKodePembantu: (kodePembantuId) => {
    return get().mutasis[kodePembantuId] || [];
  },

  getMutasiAntarProyek: (proyekId) => {
    let result = get().mutasiAntarProyek;
    if (proyekId) result = result.filter((m) => m.proyekId === proyekId);
    return result;
  },
}));
