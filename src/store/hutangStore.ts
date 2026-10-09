import { create } from 'zustand';
import { fetchApi } from '../lib/api';

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
  kategori: KategoriHutang;
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
  createdAt: string;
}

// ── Saldo computed view ──────────────────────────────────────
export interface SaldoKodePembantu {
  kodePembantu: KodePembantu;
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
  isLoading: boolean;
  error: string | null;

  fetchKodePembantus: (proyekId?: string, kategori?: KategoriHutang) => Promise<void>;
  addKodePembantu: (data: Omit<KodePembantu, 'id'>) => Promise<string>;
  removeKodePembantu: (id: string) => Promise<void>;

  fetchMutasiByKodePembantu: (kodePembantuId: string) => Promise<void>;
  fetchMutasiAntarProyek: (proyekId?: string) => Promise<void>;
  addMutasi: (data: Omit<MutasiHutang, 'id' | 'createdAt' | 'mirrorMutasiId'>) => Promise<void>;
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

export const useHutangStore = create<HutangState>((set, get) => ({
  kodePembantus: [],
  mutasis: {},
  mutasiAntarProyek: [],
  saldos: [],
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
      set({ error: 'Gagal memuat pihak/rekanan' });
    } finally {
      set({ isLoading: false });
    }
  },

  addKodePembantu: async (data) => {
    const res = await fetchApi('/kode-pembantu', { method: 'POST', body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    await get().fetchKodePembantus();
    return json.data.id;
  },

  removeKodePembantu: async (id) => {
    const res = await fetchApi(`/kode-pembantu/${id}`, { method: 'DELETE' });
    if (!res.ok) { const j = await res.json(); throw new Error(j.message + ' ' + JSON.stringify(j)); }
    await get().fetchKodePembantus();
  },

  fetchMutasiByKodePembantu: async (kodePembantuId) => {
    try {
      const res = await fetchApi(`/hutang/mutasi?kodePembantuId=${kodePembantuId}`);
      const json = await res.json();
      if (res.ok) {
        set((state) => ({ mutasis: { ...state.mutasis, [kodePembantuId]: json.data || [] } }));
      }
    } catch (e) {}
  },

  fetchMutasiAntarProyek: async (proyekId) => {
    try {
      const res = await fetchApi(`/hutang/antar-proyek${proyekId ? '?proyekId=' + proyekId : ''}`);
      const json = await res.json();
      if (res.ok) {
        set({ mutasiAntarProyek: json.data || [] });
      }
    } catch (e) {}
  },

  addMutasi: async (data) => {
    const res = await fetchApi('/hutang/mutasi', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const j = await res.json(); throw new Error(j.message + ' ' + JSON.stringify(j)); }
    // UI can call fetchMutasi/fetchSaldo directly after adding
  },

  removeMutasi: async (id) => {
    const res = await fetchApi(`/hutang/mutasi/${id}`, { method: 'DELETE' });
    if (!res.ok) { const j = await res.json(); throw new Error(j.message + ' ' + JSON.stringify(j)); }
  },

  fetchSaldo: async (bulan) => {
    try {
      const res = await fetchApi(`/hutang/saldo?bulan=${bulan}`);
      const json = await res.json();
      if (res.ok) {
        set({ saldos: json.data || [] });
      }
    } catch (e) {}
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
