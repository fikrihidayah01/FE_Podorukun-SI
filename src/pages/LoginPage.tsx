import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../store/authStore';
import { useEffect } from 'react';
import { LogIn } from 'lucide-react';

const ROLES: { value: UserRole; label: string; description: string; color: string }[] = [
  {
    value: 'keuangan',
    label: 'Keuangan',
    description: 'Laporan keuangan, tagihan, pengeluaran',
    color: 'hover:border-emerald-400 hover:bg-emerald-50',
  },
  {
    value: 'teknisi',
    label: 'Teknisi',
    description: 'Pekerjaan, jadwal, laporan teknis',
    color: 'hover:border-blue-400 hover:bg-blue-50',
  },
  {
    value: 'marketing',
    label: 'Marketing',
    description: 'Prospek, klien, campaign',
    color: 'hover:border-purple-400 hover:bg-purple-50',
  },
  {
    value: 'kontraktor',
    label: 'Kontraktor / Subkon',
    description: 'Proyek, subkontraktor, progres',
    color: 'hover:border-orange-400 hover:bg-orange-50',
  },
];

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo + Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
            <span className="text-xl font-bold text-white">SI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SI-Podorukun</h1>
          <p className="mt-1 text-sm text-gray-500">Sistem Informasi Manajemen</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <LogIn className="h-4 w-4 text-indigo-600" />
            <p className="text-sm font-semibold text-gray-700">Masuk sebagai</p>
          </div>

          <div className="space-y-3">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => handleLogin(role.value)}
                className={`w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all duration-150 ${role.color} focus:outline-none focus:ring-2 focus:ring-indigo-400`}
              >
                <p className="font-semibold text-gray-800">{role.label}</p>
                <p className="text-xs text-gray-400">{role.description}</p>
              </button>
            ))}
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            Mode simulasi — pilih role untuk masuk
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">SI-Podorukun © 2026</p>
      </div>
    </div>
  );
}
