import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ────────────────────────────────────────────────────
export type StatusShm =
  | 'di_notaris'
  | 'di_kantor'
  | 'dijaminkan'
  | 'sudah_ditebus';

export const STATUS_SHM_LABELS: Record<StatusShm, string> = {
  di_notaris: 'Di Notaris',
  di_kantor: 'Di Kantor',
  dijaminkan: 'Dijaminkan ke Bank',
  sudah_ditebus: 'Sudah Ditebus',
};

export const STATUS_SHM_COLOR: Record<StatusShm, string> = {
  di_notaris: 'bg-blue-100 text-blue-700',
  di_kantor: 'bg-gray-100 text-gray-700',
  dijaminkan: 'bg-red-100 text-red-700',
  sudah_ditebus: 'bg-emerald-100 text-emerald-700',
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
  lokasi: string; // lokasi saat ini (mis. "Bank Mandiri", "Notaris Budi", "Kantor Podorukun")
  pinjamanBankId?: string; // relasi ke pinjaman bank jika dijaminkan
  namaBank?: string;
  riwayat: ShmRiwayat[];
  createdAt: string;
}

// ── Store ────────────────────────────────────────────────────
interface ShmState {
  shms: Shm[];

  addShm: (data: Omit<Shm, 'id' | 'riwayat' | 'createdAt'>) => void;
  removeShm: (id: string) => void;
  updateStatus: (
    id: string,
    keStatus: StatusShm,
    lokasi: string,
    keterangan?: string,
    pinjamanBankId?: string,
    namaBank?: string
  ) => void;

  getRiwayat: (shmId: string) => ShmRiwayat[];
  getShmByPinjaman: (pinjamanBankId: string) => Shm[];
}

// ── Dummy Data ───────────────────────────────────────────────
const DUMMY_SHM: Shm[] = [
  {
    id: 'shm1',
    nomorShm: 'SHM-001/2024',
    kavling: 'Kavling A-01',
    status: 'dijaminkan',
    lokasi: 'Bank Mandiri',
    pinjamanBankId: 'pb1',
    namaBank: 'Bank Mandiri',
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
    kavling: 'Kavling A-02',
    status: 'di_kantor',
    lokasi: 'Kantor Podorukun',
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
    kavling: 'Kavling B-05',
    status: 'sudah_ditebus',
    lokasi: 'Kantor Podorukun',
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
];

// ── Implementation ───────────────────────────────────────────
export const useShmStore = create<ShmState>()(
  persist(
    (set, get) => ({
      shms: DUMMY_SHM,

      addShm: (data) =>
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
        })),

      removeShm: (id) =>
        set((state) => ({
          shms: state.shms.filter((s) => s.id !== id),
        })),

      updateStatus: (id, keStatus, lokasi, keterangan, pinjamanBankId, namaBank) =>
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
              lokasi,
              pinjamanBankId: keStatus === 'dijaminkan' ? pinjamanBankId : undefined,
              namaBank: keStatus === 'dijaminkan' ? namaBank : undefined,
              riwayat: [...shm.riwayat, newRiwayat],
            };
          }),
        })),

      getRiwayat: (shmId) => {
        const shm = get().shms.find((s) => s.id === shmId);
        return shm?.riwayat ?? [];
      },

      getShmByPinjaman: (pinjamanBankId) =>
        get().shms.filter((s) => s.pinjamanBankId === pinjamanBankId),
    }),
    { name: 'si-shm' }
  )
);
