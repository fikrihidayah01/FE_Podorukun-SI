import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.duration ?? 4000;
    set((state) => ({
      // Simpan maksimal 3 toast terbaru
      toasts: [...state.toasts.slice(-2), { ...toast, id, duration }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

export const showToast = {
  success: (message: string, title = 'Berhasil', duration = 4000) => {
    return useToastStore.getState().addToast({
      type: 'success',
      title,
      message,
      duration,
    });
  },
  error: (message: string, title = 'Gagal', duration = 5000) => {
    return useToastStore.getState().addToast({
      type: 'error',
      title,
      message,
      duration,
    });
  },
  info: (message: string, title = 'Informasi', duration = 4000) => {
    return useToastStore.getState().addToast({
      type: 'info',
      title,
      message,
      duration,
    });
  },
};
