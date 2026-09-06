import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SrpDoc {
  id: string;
  judul: string;
  content: string; // Tiptap HTML string
  updatedAt: string;
  createdAt: string;
}

interface SrpState {
  docs: SrpDoc[];
  create: (judul: string, content?: string) => string; // returns new doc id
  update: (id: string, data: Partial<Pick<SrpDoc, 'judul' | 'content'>>) => void;
  remove: (id: string) => void;
}

export const useSrpStore = create<SrpState>()(
  persist(
    (set) => ({
      docs: [],

      create: (judul, content = '') => {
        const id = crypto.randomUUID();
        set((state) => ({
          docs: [
            ...state.docs,
            {
              id,
              judul,
              content,
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

      update: (id, data) =>
        set((state) => ({
          docs: state.docs.map((doc) =>
            doc.id === id
              ? { ...doc, ...data, updatedAt: new Date().toISOString() }
              : doc
          ),
        })),

      remove: (id) =>
        set((state) => ({
          docs: state.docs.filter((doc) => doc.id !== id),
        })),
    }),
    { name: 'si-srp' }
  )
);
