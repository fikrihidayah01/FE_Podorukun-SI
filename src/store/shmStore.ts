import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ────────────────────────────────────────────────────
export type StatusShm =
  | 'di_notaris'
  | 'di_kantor'
  | 'dijaminkan'
  | 'sudah_ditebus'
  | 'lainnya';

export const STATUS_SHM_LABELS: Record<StatusShm, string> = {
  di_notaris: 'Di Notaris',
  di_kantor: 'Di Kantor',
  dijaminkan: 'Dijaminkan ke Bank',
  sudah_ditebus: 'Sudah Ditebus',
  lainnya: 'Lainnya...',
};

export const STATUS_SHM_COLOR: Record<StatusShm, string> = {
  di_notaris: 'bg-blue-100 text-blue-700',
  di_kantor: 'bg-gray-100 text-gray-700',
  dijaminkan: 'bg-red-100 text-red-700',
  sudah_ditebus: 'bg-emerald-100 text-emerald-700',
  lainnya: 'bg-purple-100 text-purple-700',
};

export type StatusPbg = 'belum_diajukan' | 'dalam_proses' | 'terbit' | 'lainnya';

export const STATUS_PBG_LABELS: Record<StatusPbg, string> = {
  belum_diajukan: 'Belum diajukan',
  dalam_proses: 'Dalam proses',
  terbit: 'Terbit',
  lainnya: 'Lainnya...',
};

export const STATUS_PBG_COLOR: Record<StatusPbg, string> = {
  belum_diajukan: 'bg-gray-100 text-gray-600',
  dalam_proses: 'bg-amber-100 text-amber-700',
  terbit: 'bg-emerald-100 text-emerald-700',
  lainnya: 'bg-purple-100 text-purple-700',
};

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
  status: StatusShm;
  statusKustom?: string;    // custom status text when status = 'lainnya'
  lokasi: string;           // lokasi saat ini (mis. "Bank Mandiri", "Notaris Budi", "Kantor Podorukun")
  lokasiKustom?: string;    // custom lokasi when lokasi = 'lainnya'
  pinjamanBankId?: string;  // relasi ke pinjaman bank jika dijaminkan
  namaBank?: string;
  noPbg?: string;           // No. PBG, optional
  statusPbg: StatusPbg;     // status permohonan PBG
  statusPbgKustom?: string; // when statusPbg = 'lainnya'
  riwayat: ShmRiwayat[];
  createdAt: string;
}

// ── Store ────────────────────────────────────────────────────
interface ShmState {
  shms: Shm[];

  /** Returns true if added successfully, false if nomorShm already exists */
  addShm: (data: Omit<Shm, 'id' | 'riwayat' | 'createdAt'>) => boolean;
  removeShm: (id: string) => void;
  updateStatus: (
    id: string,
    keStatus: StatusShm,
    lokasi: string,
    keterangan?: string,
    pinjamanBankId?: string,
    namaBank?: string,
    statusKustom?: string,
  ) => void;
  updateNoPbg: (
    id: string,
    noPbg: string,
    statusPbg: StatusPbg,
    statusPbgKustom?: string,
  ) => void;

  getRiwayat: (shmId: string) => ShmRiwayat[];
  getShmByPinjaman: (pinjamanBankId: string) => Shm[];
  /** Unique custom status values across all SHMs that use status='lainnya' */
  getCustomStatuses: () => string[];
  /** Unique lokasi values across all SHMs (for autocomplete suggestions) */
  getCustomLokasis: () => string[];
}

// ── Dummy Data ───────────────────────────────────────────────
const DUMMY_SHM: Shm[] = [
  {
    id: 'shm1',
    nomorShm: 'SHM-001/2024',
    kavling: 'Kav A-01',
    status: 'dijaminkan',
    lokasi: 'Bank Mandiri',
    pinjamanBankId: 'pb1',
    namaBank: 'Bank Mandiri',
    noPbg: 'PBG/24/017',
    statusPbg: 'terbit',
    riwayat: [
      {
        id: 'sr1', shmId: 'shm1', tanggal: '2024-01-15',
        dariStatus: 'di_notaris', keStatus: 'di_kantor',
        keterangan: 'Sertifikat selesai dari notaris',
      },
      {
        id: 'sr2', shmId: 'shm1', tanggal: '2025-03-15',
        dariStatus: 'di_kantor', keStatus: 'dijaminkan',
        keterangan: 'Dijaminkan ke Bank Mandiri untuk kredit konstruksi',
      },
    ],
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'shm2',
    nomorShm: 'SHM-002/2024',
    kavling: 'Kav A-02',
    status: 'di_kantor',
    lokasi: 'Kantor Podorukun',
    noPbg: 'PBG/24/018',
    statusPbg: 'terbit',
    riwayat: [
      {
        id: 'sr3', shmId: 'shm2', tanggal: '2024-03-01',
        dariStatus: 'di_notaris', keStatus: 'di_kantor',
        keterangan: 'Sertifikat selesai dari notaris',
      },
    ],
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'shm3',
    nomorShm: 'SHM-003/2025',
    kavling: 'Kav B-05',
    status: 'sudah_ditebus',
    lokasi: 'Kantor Podorukun',
    noPbg: '',
    statusPbg: 'dalam_proses',
    riwayat: [
      {
        id: 'sr4', shmId: 'shm3', tanggal: '2025-01-10',
        dariStatus: 'di_notaris', keStatus: 'dijaminkan',
        keterangan: 'Dijaminkan ke BRI',
      },
      {
        id: 'sr5', shmId: 'shm3', tanggal: '2026-02-01',
        dariStatus: 'dijaminkan', keStatus: 'sudah_ditebus',
        keterangan: 'Pinjaman lunas, SHM ditebus',
      },
    ],
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'shm4',
    nomorShm: 'SHM-004/2025',
    kavling: 'Kav B-06',
    status: 'di_notaris',
    lokasi: 'Notaris Ulfa',
    noPbg: '',
    statusPbg: 'belum_diajukan',
    riwayat: [],
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'shm5',
    nomorShm: 'SHM-005/2025',
    kavling: 'Kav C-03',
    status: 'lainnya',
    statusKustom: 'Di BPN',
    lokasi: 'Kantor BPN',
    noPbg: '',
    statusPbg: 'belum_diajukan',
    riwayat: [],
    createdAt: '2025-08-01T00:00:00Z',
  },
];

// ── Implementation ───────────────────────────────────────────
export const useShmStore = create<ShmState>()(
  persist(
    (set, get) => ({
      shms: DUMMY_SHM,

      addShm: (data) => {
        const exists = get().shms.some(
          (s) => s.nomorShm.trim().toLowerCase() === data.nomorShm.trim().toLowerCase()
        );
        if (exists) return false;

        set((state) => ({
          shms: [
            ...state.shms,
            {
              ...data,
              id: crypto.randomUUID(),
              riwayat: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return true;
      },

      removeShm: (id) =>
        set((state) => ({
          shms: state.shms.filter((s) => s.id !== id),
        })),

      updateStatus: (id, keStatus, lokasi, keterangan, pinjamanBankId, namaBank, statusKustom) =>
        set((state) => ({
          shms: state.shms.map((shm) => {
            if (shm.id !== id) return shm;

            const newRiwayat: ShmRiwayat = {
              id: crypto.randomUUID(),
              shmId: id,
              tanggal: new Date().toISOString().split('T')[0],
              dariStatus: shm.status,
              keStatus,
              keterangan,
            };

            return {
              ...shm,
              status: keStatus,
              statusKustom: keStatus === 'lainnya' ? statusKustom : undefined,
              lokasi,
              pinjamanBankId: keStatus === 'dijaminkan' ? pinjamanBankId : undefined,
              namaBank: keStatus === 'dijaminkan' ? namaBank : undefined,
              riwayat: [...shm.riwayat, newRiwayat],
            };
          }),
        })),

      updateNoPbg: (id, noPbg, statusPbg, statusPbgKustom) =>
        set((state) => ({
          shms: state.shms.map((shm) =>
            shm.id !== id
              ? shm
              : {
                  ...shm,
                  noPbg,
                  statusPbg,
                  statusPbgKustom: statusPbg === 'lainnya' ? statusPbgKustom : undefined,
                }
          ),
        })),

      getRiwayat: (shmId) => {
        const shm = get().shms.find((s) => s.id === shmId);
        return shm?.riwayat ?? [];
      },

      getShmByPinjaman: (pinjamanBankId) =>
        get().shms.filter((s) => s.pinjamanBankId === pinjamanBankId),

      getCustomStatuses: () => {
        const seen = new Set<string>();
        get().shms.forEach((s) => {
          if (s.status === 'lainnya' && s.statusKustom?.trim()) {
            seen.add(s.statusKustom.trim());
          }
        });
        return Array.from(seen);
      },

      getCustomLokasis: () => {
        const seen = new Set<string>();
        get().shms.forEach((s) => {
          if (s.lokasi?.trim()) seen.add(s.lokasi.trim());
          if (s.lokasiKustom?.trim()) seen.add(s.lokasiKustom.trim());
        });
        return Array.from(seen);
      },
    }),
    { name: 'si-shm' }
  )
);