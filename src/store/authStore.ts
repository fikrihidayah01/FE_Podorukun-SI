import { create } from 'zustand';
import { fetchApi, setTokens, clearTokens, tryRefresh, getAccessToken, getRefreshToken, SESSION_EXPIRED_EVENT } from '../lib/api';
import { errorMessage } from '../lib/errors';

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
    const res = await fetchApi('/auth/me', { silent: true });
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
    // Mode simulasi dev lokal tetap aktif setelah reload halaman
    if (typeof window !== 'undefined' && localStorage.getItem('si_dev_user') === 'true') {
      const savedRole = (localStorage.getItem('si_dev_role') as UserRole) || 'keuangan';
      set({
        user: {
          id: 'dev-user-1',
          name: `Dev ${savedRole.charAt(0).toUpperCase() + savedRole.slice(1)}`,
          role: savedRole,
          email: `${savedRole}@example.test`,
        },
        isAuthenticated: true,
        isInitializing: false,
      });
      return;
    }

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    // Jika tidak ada token sama sekali di localStorage, pengguna memang belum masuk.
    // Hindari pemanggilan jaringan ke /auth/me atau /auth/refresh yang pasti menghasilkan 401.
    if (!accessToken && !refreshToken) {
      set({ user: null, isAuthenticated: false, isInitializing: false });
      return;
    }

    let user: AuthUser | null = null;
    if (accessToken) {
      user = await fetchMe();
    }

    if (!user && refreshToken) {
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
      localStorage.removeItem('si_dev_user');
      localStorage.removeItem('si_dev_role');
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        silent: true, // galat login ditampilkan inline di form
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
    } catch (err) {
      set({ error: errorMessage(err, 'Login gagal. Coba lagi.') });
    }
  },

  devLogin: (role = 'keuangan') => {
    localStorage.setItem('si_dev_user', 'true');
    localStorage.setItem('si_dev_role', role);
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
    localStorage.removeItem('si_dev_user');
    localStorage.removeItem('si_dev_role');
    try {
      const refreshToken = getRefreshToken();
      await fetchApi('/auth/logout', { method: 'POST', body: JSON.stringify(refreshToken ? { refreshToken } : {}), silent: true });
    } catch {
      // Logout lokal tetap dijalankan walau server tidak terjangkau.
    } finally {
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },
}));

// fetchApi memancarkan event ini saat refresh token gagal: keluarkan pengguna supaya RoleGuard mengarahkan ke /login.
if (typeof window !== 'undefined') {
  window.addEventListener(SESSION_EXPIRED_EVENT, () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    // devLogin (mode pengembangan tanpa token) tidak ikut dikeluarkan.
    if (isAuthenticated && user?.id !== 'dev-user-1') useAuthStore.setState({ user: null, isAuthenticated: false });
  });
}
