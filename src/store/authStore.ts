import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'keuangan' | 'teknisi' | 'marketing' | 'kontraktor';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
}

const MOCK_USERS: Record<UserRole, AuthUser> = {
  keuangan: {
    id: '1',
    name: 'Siti Rahayu',
    role: 'keuangan',
    email: 'siti@podorukun.id',
  },
  teknisi: {
    id: '2',
    name: 'Budi Santoso',
    role: 'teknisi',
    email: 'budi@podorukun.id',
  },
  marketing: {
    id: '3',
    name: 'Rina Marlina',
    role: 'marketing',
    email: 'rina@podorukun.id',
  },
  kontraktor: {
    id: '4',
    name: 'Ahmad Fauzi',
    role: 'kontraktor',
    email: 'ahmad@podorukun.id',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (role: UserRole) => {
        const user = MOCK_USERS[role];
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'si-podorukun-auth',
    }
  )
);
