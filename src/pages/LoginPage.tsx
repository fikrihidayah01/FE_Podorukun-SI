import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { PiCaretRight, PiWallet, PiWrench, PiMegaphone, PiHardHat } from 'react-icons/pi';
import { useAuthStore, type UserRole } from '../store/authStore';
import Badge from '../components/ui/Badge';
import { ROLE_ACCENT } from '../config/theme';

const ROLES: { value: UserRole; label: string; description: string; icon: IconType; ready: boolean }[] = [
  { value: 'keuangan', label: 'Keuangan', description: 'Hutang, tagihan user, jurnal umum, COA, SRP', icon: PiWallet, ready: true },
  { value: 'teknisi', label: 'Teknisi', description: 'Pekerjaan, jadwal, laporan teknis', icon: PiWrench, ready: false },
  { value: 'marketing', label: 'Marketing', description: 'Prospek, klien, campaign', icon: PiMegaphone, ready: false },
  { value: 'kontraktor', label: 'Kontraktor / subkon', description: 'Proyek, subkontraktor, progres', icon: PiHardHat, ready: false },
];

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div
      className="flex min-h-dvh flex-col bg-canvas px-4 py-8 sm:py-14"
      style={{ backgroundImage: 'radial-gradient(60rem 30rem at 50% -10%, color-mix(in srgb, #2b4fcb 10%, transparent), transparent)' }}
    >
      <main className="mx-auto w-full max-w-[440px] flex-1">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">SI</span>
          <div className="leading-tight">
            <p className="text-base font-bold text-ink">SI-Podorukun</p>
            <p className="text-[13px] text-ink-3">Sistem informasi manajemen</p>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          <h1 className="text-xl font-bold text-ink">Masuk</h1>
          <p className="mt-1 text-sm text-ink-3">Mode simulasi. Pilih peran untuk membuka dasbornya.</p>

          <ul className="mt-5 space-y-2">
            {ROLES.map((role) => (
              <li key={role.value}>
                <button
                  type="button"
                  onClick={() => handleLogin(role.value)}
                  className="group flex w-full items-center gap-3.5 rounded-lg border border-line bg-surface p-3.5 text-left transition-colors hover:border-line-strong hover:bg-subtle active:bg-neutral-soft"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{ backgroundColor: ROLE_ACCENT[role.value] }}
                  >
                    <role.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{role.label}</span>
                      {!role.ready && <Badge>Dalam pengembangan</Badge>}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-ink-3">{role.description}</span>
                  </span>
                  <PiCaretRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <p className="mx-auto mt-8 text-center text-xs text-ink-3">SI-Podorukun © 2026</p>
    </div>
  );
}
