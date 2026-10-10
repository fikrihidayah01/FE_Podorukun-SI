import { create } from 'zustand';
import { fetchApi, setTokens, clearTokens, tryRefresh } from '../lib/api';

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

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetchApi('/auth/me');
    if (res.ok) {
      const json = await res.json();
      return json.data as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  error: null,

  initAuth: async () => {
    // Try to get current user from existing token/cookie
    let user = await fetchMe();

    if (!user) {
      // Token may have expired — attempt one silent refresh before giving up
      const newToken = await tryRefresh();
      if (newToken) {
        user = await fetchMe();
      }
    }

    if (user) {
      set({ user, isAuthenticated: true, isInitializing: false });
    } else {
      clearTokens();
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

      if (res.ok && json.data) {
        const user = json.data.user || json.data;
        const accessToken = json.data.accessToken;
        const refreshToken = json.data.refreshToken;

        // Backend always returns tokens in body AND sets HttpOnly cookies.
        // Store the Bearer token so it survives page reloads (cookie is HttpOnly, unreadable by JS).
        if (accessToken) {
          setTokens(accessToken, refreshToken);
        }

        set({ user, isAuthenticated: true });
      } else {
        set({ error: json.message || 'Login gagal. Periksa email dan password.' });
      }
    } catch {
      set({ error: 'Terjadi kesalahan jaringan. Coba lagi.' });
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
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
