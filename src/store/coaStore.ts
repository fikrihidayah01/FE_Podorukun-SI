import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TipeAkun = 'aset' | 'kewajiban' | 'ekuitas' | 'pendapatan' | 'beban';
export type SaldoNormal = 'debit' | 'kredit';

export interface Akun {
  id: string;
  kodeAkun: string;
  namaAkun: string;
  tipe: TipeAkun;
  saldoNormal: SaldoNormal;
  keterangan?: string;
}

interface CoaState {
  items: Akun[];
  add: (data: Omit<Akun, 'id'>) => void;
  update: (id: string, data: Partial<Omit<Akun, 'id'>>) => void;
  remove: (id: string) => void;
}

const DUMMY_AKUN: Akun[] = [
  { id: '1', kodeAkun: '1-1000', namaAkun: 'Kas', tipe: 'aset', saldoNormal: 'debit' },
  { id: '2', kodeAkun: '1-1100', namaAkun: 'Bank BRI', tipe: 'aset', saldoNormal: 'debit' },
  { id: '3', kodeAkun: '1-1200', namaAkun: 'Piutang Usaha', tipe: 'aset', saldoNormal: 'debit' },
  { id: '13', kodeAkun: '1-1300', namaAkun: 'Persediaan / WIP', tipe: 'aset', saldoNormal: 'debit' },
  { id: '4', kodeAkun: '1-1500', namaAkun: 'Perlengkapan', tipe: 'aset', saldoNormal: 'debit' },
  { id: '5', kodeAkun: '1-2000', namaAkun: 'Peralatan', tipe: 'aset', saldoNormal: 'debit' },
  { id: '6', kodeAkun: '2-1000', namaAkun: 'Hutang Usaha', tipe: 'kewajiban', saldoNormal: 'kredit' },
  { id: '14', kodeAkun: '2-1100', namaAkun: 'Hutang Kontraktor', tipe: 'kewajiban', saldoNormal: 'kredit' },
  { id: '7', kodeAkun: '2-2000', namaAkun: 'Hutang Bank', tipe: 'kewajiban', saldoNormal: 'kredit' },
  { id: '8', kodeAkun: '3-1000', namaAkun: 'Modal', tipe: 'ekuitas', saldoNormal: 'kredit' },
  { id: '9', kodeAkun: '4-1000', namaAkun: 'Pendapatan Jasa', tipe: 'pendapatan', saldoNormal: 'kredit' },
  { id: '10', kodeAkun: '5-1000', namaAkun: 'Beban Gaji', tipe: 'beban', saldoNormal: 'debit' },
  { id: '11', kodeAkun: '5-1100', namaAkun: 'Beban Operasional', tipe: 'beban', saldoNormal: 'debit' },
  { id: '12', kodeAkun: '5-1200', namaAkun: 'Beban Penyusutan', tipe: 'beban', saldoNormal: 'debit' },
];

export const useCoaStore = create<CoaState>()(
  persist(
    (set) => ({
      items: DUMMY_AKUN,

      add: (data) =>
        set((state) => ({
          items: [...state.items, { ...data, id: crypto.randomUUID() }],
        })),

      update: (id, data) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...data } : item
          ),
        })),

      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
    }),
    { name: 'si-coa' }
  )
);

export const TIPE_AKUN_LABELS: Record<TipeAkun, string> = {
  aset: 'Aset',
  kewajiban: 'Kewajiban',
  ekuitas: 'Ekuitas',
  pendapatan: 'Pendapatan',
  beban: 'Beban',
};
