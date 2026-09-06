import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const KATEGORI_HUTANG_COLOR: Record<KategoriHutang, string> = {
  lahan: 'bg-amber-100 text-amber-700 border-amber-200',
  ppn: 'bg-sky-100 text-sky-700 border-sky-200',
  pihak_ketiga: 'bg-lime-100 text-lime-700 border-lime-200',
  pemegang_saham: 'bg-violet-100 text-violet-700 border-violet-200',
  karyawan: 'bg-rose-100 text-rose-700 border-rose-200',
  antar_proyek: 'bg-teal-100 text-teal-700 border-teal-200',
  bank: 'bg-blue-100 text-blue-700 border-blue-200',
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
  lampiran?: string; // filename only (no actual storage)
  // Khusus antar proyek
  proyekLawanId?: string;
  mirrorMutasiId?: string; // ID of the mirrored entry
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
  mutasis: MutasiHutang[];

  // Kode Pembantu CRUD
  addKodePembantu: (data: Omit<KodePembantu, 'id'>) => string;
  removeKodePembantu: (id: string) => void;

  // Mutasi CRUD
  addMutasi: (data: Omit<MutasiHutang, 'id' | 'createdAt' | 'mirrorMutasiId'>) => void;
  removeMutasi: (id: string) => void;

  // Computed / queries
  getSaldoPerKodePembantu: (
    bulan: string, // 'YYYY-MM'
    proyekId?: string,
    kategori?: KategoriHutang
  ) => SaldoKodePembantu[];

  getTotalHutang: (bulan: string) => number;
  getTotalByKategori: (bulan: string, kategori: KategoriHutang) => number;
  getDueSoonCount: (hari: number) => number;
  getMutasiByKodePembantu: (kodePembantuId: string) => MutasiHutang[];
  getMutasiAntarProyek: (proyekId?: string) => MutasiHutang[];
}

// ── Dummy Data ───────────────────────────────────────────────
const DUMMY_KODE_PEMBANTU: KodePembantu[] = [
  { id: 'kp1', nama: 'Pemilik lahan — Pak Warsito', proyekId: 'p1', kategori: 'lahan' },
  { id: 'kp2', nama: 'Bank Mandiri', proyekId: 'p2', kategori: 'bank' },
  { id: 'kp3', nama: 'Aya Sophia', proyekId: 'p1', kategori: 'antar_proyek' },
  { id: 'kp4', nama: 'Investor — Arohma', proyekId: 'p2', kategori: 'pihak_ketiga' },
  { id: 'kp5', nama: 'PT Beton Jaya', proyekId: 'p1', kategori: 'pihak_ketiga' },
  { id: 'kp6', nama: 'Kantor Pajak', proyekId: 'p1', kategori: 'ppn' },
];

const DUMMY_MUTASI: MutasiHutang[] = [
  // Pak Warsito — lahan — saldo awal 2.476.557.881
  {
    id: 'm1', proyekId: 'p1', kodePembantuId: 'kp1', kategori: 'lahan',
    tanggal: '2026-01-01', uraian: 'Saldo awal hutang lahan', jenisMutasi: 'kredit',
    nominal: 2476557881, createdAt: '2026-01-01T00:00:00Z',
  },
  // Bank Mandiri — bank — saldo awal 40.900.400.000, mutasi debit 300jt
  {
    id: 'm2', proyekId: 'p2', kodePembantuId: 'kp2', kategori: 'bank',
    tanggal: '2026-01-01', uraian: 'Saldo awal pinjaman bank', jenisMutasi: 'kredit',
    nominal: 40900400000, createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'm3', proyekId: 'p2', kodePembantuId: 'kp2', kategori: 'bank',
    tanggal: '2026-06-15', uraian: 'Pembayaran angsuran pokok', jenisMutasi: 'debit',
    nominal: 300000000, createdAt: '2026-06-15T00:00:00Z',
  },
  // Aya Sophia — antar proyek — saldo awal 2.161.240.190, kredit 10jt
  {
    id: 'm4', proyekId: 'p1', kodePembantuId: 'kp3', kategori: 'antar_proyek',
    tanggal: '2026-01-01', uraian: 'Saldo awal hutang antar proyek', jenisMutasi: 'kredit',
    nominal: 2161240190, proyekLawanId: 'p3', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'm5', proyekId: 'p1', kodePembantuId: 'kp3', kategori: 'antar_proyek',
    tanggal: '2026-06-20', uraian: 'Pinjaman operasional dari Aya Sophia', jenisMutasi: 'kredit',
    nominal: 10000000, proyekLawanId: 'p3', mirrorMutasiId: 'm5_mirror',
    createdAt: '2026-06-20T00:00:00Z',
  },
  // Investor Arohma — pihak ketiga — saldo awal 5mily, debit 500jt
  {
    id: 'm6', proyekId: 'p2', kodePembantuId: 'kp4', kategori: 'pihak_ketiga',
    tanggal: '2026-01-01', uraian: 'Saldo awal hutang investor', jenisMutasi: 'kredit',
    nominal: 5000000000, createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'm7', proyekId: 'p2', kodePembantuId: 'kp4', kategori: 'pihak_ketiga',
    tanggal: '2026-06-10', uraian: 'Pengembalian investasi sebagian', jenisMutasi: 'debit',
    nominal: 500000000, createdAt: '2026-06-10T00:00:00Z',
  },
];

// ── Helper ───────────────────────────────────────────────────
function parseBulan(bulan: string): { year: number; month: number } {
  const [y, m] = bulan.split('-').map(Number);
  return { year: y, month: m };
}

function isBefore(tanggal: string, bulan: string): boolean {
  const { year, month } = parseBulan(bulan);
  const d = new Date(tanggal);
  return d < new Date(year, month - 1, 1);
}

function isInMonth(tanggal: string, bulan: string): boolean {
  const { year, month } = parseBulan(bulan);
  const d = new Date(tanggal);
  return d.getFullYear() === year && d.getMonth() === month - 1;
}

// ── Store Implementation ─────────────────────────────────────
export const useHutangStore = create<HutangState>()(
  persist(
    (set, get) => ({
      kodePembantus: DUMMY_KODE_PEMBANTU,
      mutasis: DUMMY_MUTASI,

      addKodePembantu: (data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          kodePembantus: [...state.kodePembantus, { ...data, id }],
        }));
        return id;
      },

      removeKodePembantu: (id) =>
        set((state) => ({
          kodePembantus: state.kodePembantus.filter((kp) => kp.id !== id),
        })),

      addMutasi: (data) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        set((state) => {
          const newMutasis = [
            ...state.mutasis,
            { ...data, id, mirrorMutasiId: undefined, createdAt: now },
          ];

          // Mirror entry for antar_proyek
          if (data.kategori === 'antar_proyek' && data.proyekLawanId) {
            const mirrorId = crypto.randomUUID();

            // Find or create mirror kode pembantu in the other project
            let mirrorKpId: string | undefined;
            const sourceProyekNama = (() => {
              // Just use the project ID as label lookup
              const p = state.kodePembantus.find((kp) => kp.proyekId === data.proyekId);
              return p?.nama ?? data.proyekId;
            })();

            const existingMirrorKp = state.kodePembantus.find(
              (kp) => kp.proyekId === data.proyekLawanId && kp.kategori === 'antar_proyek'
                && kp.nama.includes(data.proyekId)
            );

            if (existingMirrorKp) {
              mirrorKpId = existingMirrorKp.id;
            } else {
              mirrorKpId = crypto.randomUUID();
              // Add mirror kode pembantu
              state.kodePembantus = [
                ...state.kodePembantus,
                {
                  id: mirrorKpId,
                  nama: `${sourceProyekNama} (piutang)`,
                  proyekId: data.proyekLawanId,
                  kategori: 'antar_proyek',
                },
              ];
            }

            // Mirror: debit hutang di peminjam = kredit piutang di pemberi, dan sebaliknya
            newMutasis.push({
              id: mirrorId,
              proyekId: data.proyekLawanId,
              kodePembantuId: mirrorKpId,
              kategori: 'antar_proyek',
              tanggal: data.tanggal,
              uraian: `[Mirror] ${data.uraian}`,
              jenisMutasi: data.jenisMutasi, // same direction — kredit di peminjam = kredit (piutang) di pemberi
              nominal: data.nominal,
              akunCoaId: data.akunCoaId,
              referensi: data.referensi,
              proyekLawanId: data.proyekId,
              mirrorMutasiId: id,
              createdAt: now,
            });

            // Update original mutasi with mirror reference
            const origIdx = newMutasis.findIndex((m) => m.id === id);
            if (origIdx >= 0) {
              newMutasis[origIdx] = { ...newMutasis[origIdx], mirrorMutasiId: mirrorId };
            }
          }

          return { mutasis: newMutasis, kodePembantus: [...state.kodePembantus] };
        });
      },

      removeMutasi: (id) =>
        set((state) => {
          const mutasi = state.mutasis.find((m) => m.id === id);
          // Also remove mirror if exists
          const idsToRemove = new Set([id]);
          if (mutasi?.mirrorMutasiId) {
            idsToRemove.add(mutasi.mirrorMutasiId);
          }
          // Check if any other mutasi mirrors this one
          state.mutasis
            .filter((m) => m.mirrorMutasiId === id)
            .forEach((m) => idsToRemove.add(m.id));

          return {
            mutasis: state.mutasis.filter((m) => !idsToRemove.has(m.id)),
          };
        }),

      getSaldoPerKodePembantu: (bulan, proyekId, kategori) => {
        const { kodePembantus, mutasis } = get();

        let filteredKp = kodePembantus;
        if (proyekId) filteredKp = filteredKp.filter((kp) => kp.proyekId === proyekId);
        if (kategori) filteredKp = filteredKp.filter((kp) => kp.kategori === kategori);

        return filteredKp.map((kp) => {
          const kpMutasis = mutasis.filter((m) => m.kodePembantuId === kp.id);

          // Saldo awal = semua mutasi sebelum bulan ini
          const beforeMutasis = kpMutasis.filter((m) => isBefore(m.tanggal, bulan));
          const saldoAwal = beforeMutasis.reduce((sum, m) => {
            return sum + (m.jenisMutasi === 'kredit' ? m.nominal : -m.nominal);
          }, 0);

          // Mutasi bulan ini
          const monthMutasis = kpMutasis.filter((m) => isInMonth(m.tanggal, bulan));
          const totalDebit = monthMutasis
            .filter((m) => m.jenisMutasi === 'debit')
            .reduce((sum, m) => sum + m.nominal, 0);
          const totalKredit = monthMutasis
            .filter((m) => m.jenisMutasi === 'kredit')
            .reduce((sum, m) => sum + m.nominal, 0);
          const mutasiBulan = totalKredit - totalDebit;

          return {
            kodePembantu: kp,
            saldoAwal,
            totalDebit,
            totalKredit,
            mutasiBulan,
            saldoAkhir: saldoAwal + mutasiBulan,
          };
        });
      },

      getTotalHutang: (bulan) => {
        const saldos = get().getSaldoPerKodePembantu(bulan);
        return saldos.reduce((sum, s) => sum + s.saldoAkhir, 0);
      },

      getTotalByKategori: (bulan, kategori) => {
        const saldos = get().getSaldoPerKodePembantu(bulan, undefined, kategori);
        return saldos.reduce((sum, s) => sum + s.saldoAkhir, 0);
      },

      getDueSoonCount: (_hari) => {
        // Placeholder — actual implementation tied to pinjamanBank jatuh tempo
        return 2;
      },

      getMutasiByKodePembantu: (kodePembantuId) => {
        return get().mutasis
          .filter((m) => m.kodePembantuId === kodePembantuId)
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      },

      getMutasiAntarProyek: (proyekId) => {
        return get().mutasis
          .filter((m) => m.kategori === 'antar_proyek' && (!proyekId || m.proyekId === proyekId))
          .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      },
    }),
    { name: 'si-hutang-v2' }
  )
);
