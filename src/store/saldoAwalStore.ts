import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SaldoAkun {
  akunId: string;
  debit: number;
  kredit: number;
}

export interface PeriodeSaldoAwal {
  id: string;
  proyekId: string;
  tanggalMulai: string; // Format YYYY-MM-DD
  status: 'terbuka' | 'terkunci';
  saldo: SaldoAkun[];
}

interface SaldoAwalState {
  periodes: PeriodeSaldoAwal[];
  
  // Create or get period for project
  getOrCreatePeriode: (proyekId: string) => PeriodeSaldoAwal;
  
  // Update balance for an account
  updateSaldo: (periodeId: string, akunId: string, debit: number, kredit: number) => void;
  
  // Lock period
  tutupBuku: (periodeId: string) => void;
}

export const useSaldoAwalStore = create<SaldoAwalState>()(
  persist(
    (set, get) => ({
      periodes: [],

      getOrCreatePeriode: (proyekId) => {
        const existing = get().periodes.find(p => p.proyekId === proyekId);
        if (existing) return existing;
        
        const newPeriode: PeriodeSaldoAwal = {
          id: crypto.randomUUID(),
          proyekId,
          tanggalMulai: new Date().getFullYear() + '-01-01',
          status: 'terbuka',
          saldo: [],
        };
        
        set(state => ({
          periodes: [...state.periodes, newPeriode]
        }));
        
        return newPeriode;
      },

      updateSaldo: (periodeId, akunId, debit, kredit) => set((state) => {
        const periodes = state.periodes.map(p => {
          if (p.id !== periodeId) return p;
          
          let updatedSaldo = [...p.saldo];
          const existingIdx = updatedSaldo.findIndex(s => s.akunId === akunId);
          
          if (existingIdx >= 0) {
            updatedSaldo[existingIdx] = { akunId, debit, kredit };
          } else {
            updatedSaldo.push({ akunId, debit, kredit });
          }
          
          return { ...p, saldo: updatedSaldo };
        });
        
        return { periodes };
      }),

      tutupBuku: (periodeId) => set((state) => ({
        periodes: state.periodes.map(p => 
          p.id === periodeId ? { ...p, status: 'terkunci' as const } : p
        )
      })),
    }),
    { name: 'si-saldo-awal' }
  )
);
