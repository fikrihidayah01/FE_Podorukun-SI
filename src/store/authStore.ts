import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type UserRole = 'admin' | 'keuangan' | 'teknisi' | 'marketing' | 'kontraktor';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  keuangan: 'Keuangan',
  teknisi: 'Teknisi',
  marketing: 'Marketing',
  kontraktor: 'Kontraktor',
};

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  devLogin: (role?: UserRole) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  error: null,

  initAuth: async () => {
    try {
      const res = await fetchApi('/auth/me');
      if (res.ok) {
        const json = await res.json();
        set({ user: json.data, isAuthenticated: true, isInitializing: false });
      } else {
        set({ user: null, isAuthenticated: false, isInitializing: false });
      }
    } catch (err) {
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      const json = await res.json();
      
      if (res.ok) {
        set({ user: json.data.user, isAuthenticated: true });
      } else {
        set({ error: json.message || 'Login gagal' });
      }
    } catch (err) {
      set({ error: 'Terjadi kesalahan jaringan' });
    }
  },

  devLogin: (role = 'keuangan') => {
    set({
      user: {
        id: 'dev-user-1',
        name: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role,
        email: `${role}@example.test`,
      },
      isAuthenticated: true,
      error: null,
    });
  },

  logout: async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
