import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TipeTransaksi = 'Cash' | 'KPR' | 'In House';

export interface TemplateDokumen {
  id: string;
  ptId: string;
  tipeTransaksi: TipeTransaksi;
  polaNomor: string; // contoh: "{PT}/{TAHUN}/{NO}"
  pasalIds: string[]; // urutan pasal
  createdAt: string;
}

interface TemplateDokumenState {
  items: TemplateDokumen[];
  add: (data: Omit<TemplateDokumen, 'id' | 'createdAt'>) => string;
  update: (id: string, data: Partial<Omit<TemplateDokumen, 'id' | 'createdAt'>>) => void;
  duplikat: (id: string) => string;
  remove: (id: string) => void;
}

export const useTemplateDokumenStore = create<TemplateDokumenState>()(
  persist(
    (set, get) => ({
      items: [
        {
          id: 'tmpl-001',
          ptId: 'pt-001',
          tipeTransaksi: 'KPR',
          polaNomor: 'PRSM/{TAHUN}/KPR/{NO}',
          pasalIds: ['pasal-001', 'pasal-002', 'pasal-003'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tmpl-002',
          ptId: 'pt-001',
          tipeTransaksi: 'Cash',
          polaNomor: 'PRSM/{TAHUN}/CASH/{NO}',
          pasalIds: ['pasal-001', 'pasal-004'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tmpl-003',
          ptId: 'pt-001',
          tipeTransaksi: 'In House',
          polaNomor: 'PRSM/{TAHUN}/IH/{NO}',
          pasalIds: ['pasal-001', 'pasal-002', 'pasal-005'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tmpl-004',
          ptId: 'pt-002',
          tipeTransaksi: 'KPR',
          polaNomor: 'PRN/{TAHUN}/KPR/{NO}',
          pasalIds: ['pasal-001', 'pasal-002'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tmpl-005',
          ptId: 'pt-002',
          tipeTransaksi: 'Cash',
          polaNomor: 'PRN/{TAHUN}/CASH/{NO}',
          pasalIds: ['pasal-001', 'pasal-004'],
          createdAt: new Date().toISOString(),
        },
      ],

      add: (data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          items: [
            ...state.items,
            { ...data, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      update: (id, data) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...data } : item)),
        })),

      duplikat: (id) => {
        const src = get().items.find((t) => t.id === id);
        if (!src) return '';
        const newId = crypto.randomUUID();
        set((state) => ({
          items: [
            ...state.items,
            {
              ...src,
              id: newId,
              polaNomor: `${src.polaNomor}_COPY`,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return newId;
      },

      remove: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
    }),
    { name: 'si-template-dokumen-v1' }
  )
);
