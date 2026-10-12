import { create } from 'zustand';
import { fetchApi } from '../lib/api';
import type { Tone } from '../components/ui/Badge';

export type StatusShm =
  | 'di_notaris'
  | 'di_kantor'
  | 'dijaminkan'
  | 'sudah_ditebus'
  | 'lainnya';

export const STATUS_SHM_LABELS: Record<StatusShm, string> = {
  di_notaris: 'Di notaris',
  di_kantor: 'Di kantor',
  dijaminkan: 'Dijaminkan ke bank',
  sudah_ditebus: 'Sudah ditebus',
  lainnya: 'Lainnya',
};

export const STATUS_SHM_TONE: Record<StatusShm, Tone> = {
  di_notaris: 'brand',
  di_kantor: 'neutral',
  dijaminkan: 'warning',
  sudah_ditebus: 'positive',
  lainnya: 'neutral',
};

export type StatusPbg = 'belum_diajukan' | 'dalam_proses' | 'terbit' | 'lainnya';

export const STATUS_PBG_LABELS: Record<StatusPbg, string> = {
  belum_diajukan: 'Belum diajukan',
  dalam_proses: 'Dalam proses',
  terbit: 'Terbit',
  lainnya: 'Lainnya',
};

export const STATUS_PBG_TONE: Record<StatusPbg, Tone> = {
  belum_diajukan: 'neutral',
  dalam_proses: 'brand',
  terbit: 'positive',
  lainnya: 'neutral',
};

export const STATUS_SHM_OPTIONS = Object.keys(STATUS_SHM_LABELS) as StatusShm[];
export const STATUS_PBG_OPTIONS = Object.keys(STATUS_PBG_LABELS) as StatusPbg[];

export interface ShmRiwayat {
  id: string;
  shmId: string;
  tanggal: string;
  dariStatus: StatusShm;
  keStatus: StatusShm;
  keterangan?: string;
}

export interface Shm {
  id: string;
  nomorShm: string;
  kavling: string;
  unitId?: string;
  status: StatusShm;
  statusKustom?: string;
  lokasi: string;
  lokasiKustom?: string;
  pinjamanBankId?: string;
  namaBank?: string;
  noPbg?: string;
  statusPbg: StatusPbg;
  statusPbgKustom?: string;
  riwayat: ShmRiwayat[];
  createdAt: string;
}

interface ShmState {
  shms: Shm[];
  isLoading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  addShm: (data: Omit<Shm, 'id' | 'riwayat' | 'createdAt'>) => Promise<boolean>;
  removeShm: (id: string) => Promise<void>;
  updateStatus: (
    id: string,
    keStatus: StatusShm,
    lokasi: string,
    keterangan?: string,
    pinjamanBankId?: string,
    namaBank?: string,
    statusKustom?: string,
  ) => Promise<void>;
  updateNoPbg: (
    id: string,
    noPbg: string,
    statusPbg: StatusPbg,
    statusPbgKustom?: string,
  ) => Promise<void>;

  getRiwayat: (shmId: string) => ShmRiwayat[];
  getShmByPinjaman: (pinjamanBankId: string) => Shm[];
  getCustomStatuses: () => string[];
  getCustomLokasis: () => string[];
}

export const useShmStore = create<ShmState>((set, get) => ({
  shms: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchApi('/shm');
      if (!res.ok) throw new Error('Gagal memuat data SHM');
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      set({ shms: list, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addShm: async (data) => {
    const payload = {
      nomorShm: data.nomorShm,
      unitId: data.unitId,
      status: data.status,
      statusKustom: data.statusKustom || undefined,
      lokasi: data.lokasi,
      pinjamanBankId: data.pinjamanBankId || undefined,
      noPbg: data.noPbg || undefined,
      statusPbg: data.statusPbg,
      statusPbgKustom: data.statusPbgKustom || undefined,
    };

    const res = await fetchApi('/shm', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal menyimpan SHM ke server');
    }

    await get().fetch();
    return true;
  },

  removeShm: async (id) => {
    const res = await fetchApi(`/shm/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal menghapus SHM di server');
    }
    await get().fetch();
  },

  updateStatus: async (id, keStatus, lokasi, keterangan, pinjamanBankId, _namaBank, statusKustom) => {
    const payload = {
      keStatus,
      lokasi,
      keterangan: keterangan || undefined,
      pinjamanBankId: keStatus === 'dijaminkan' ? (pinjamanBankId || undefined) : undefined,
      statusKustom: keStatus === 'lainnya' ? (statusKustom || undefined) : undefined,
    };
    const res = await fetchApi(`/shm/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal mengubah status SHM di server');
    }
    await get().fetch();
  },

  updateNoPbg: async (id, noPbg, statusPbg, statusPbgKustom) => {
    const payload = {
      noPbg: noPbg || undefined,
      statusPbg,
      statusPbgKustom: statusPbg === 'lainnya' ? (statusPbgKustom || undefined) : undefined,
    };
    const res = await fetchApi(`/shm/${id}/pbg`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Gagal memperbarui PBG di server');
    }
    await get().fetch();
  },

  getRiwayat: (shmId) => get().shms.find((s) => s.id === shmId)?.riwayat ?? [],
  getShmByPinjaman: (pinjamanBankId) =>
    get().shms.filter((s) => s.status === 'dijaminkan' && s.pinjamanBankId === pinjamanBankId),
  getCustomStatuses: () =>
    Array.from(
      new Set(
        get()
          .shms.filter((s) => s.status === 'lainnya' && s.statusKustom)
          .map((s) => s.statusKustom as string)
      )
    ),
  getCustomLokasis: () =>
    Array.from(
      new Set(get().shms.map((s) => s.lokasi).filter((l) => l && l.trim() !== ''))
    ),
}));