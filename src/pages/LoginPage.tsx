import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/authStore';

export default function LoginPage() {
  const { login, devLogin, isAuthenticated, error, isInitializing } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.localhost'));

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const handleDevAutoLogin = async (role: UserRole = 'keuangan') => {
    const devEmail = `${role}@example.test`;
    const devPass = 'password';
    setEmail(devEmail);
    setPassword(devPass);
    setLoading(true);
    try {
      await login(devEmail, devPass);
      if (!useAuthStore.getState().isAuthenticated) {
        devLogin(role);
      }
    } catch {
      devLogin(role);
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <p className="text-ink-3">Memuat sesi...</p>
      </div>
    );
  }

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
          <p className="mt-1 text-sm text-ink-3">Gunakan email dan password Anda.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line p-2.5 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                placeholder="keuangan@example.test"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line p-2.5 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:opacity-70"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          {false && (
            <div className="mt-5 rounded-lg border border-dashed border-amber-300 bg-amber-50/70 p-3.5 text-xs text-amber-900">
              <div className="flex items-center justify-between font-semibold text-amber-800">
                <span>⚡ Dev Auto Login (Localhost Only)</span>
                <span className="rounded bg-amber-200/80 px-1.5 py-0.5 font-mono text-[10px] text-amber-900">
                  DEV
                </span>
              </div>
              <p className="mt-1 text-[11px] text-amber-800/80">
                Pilih role di bawah untuk langsung masuk otomatis:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDevAutoLogin('keuangan')}
                  className="flex-1 rounded-md bg-amber-600 px-2.5 py-1.5 font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                >
                  ⚡ Keuangan
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDevAutoLogin('admin')}
                  className="rounded-md border border-amber-400 bg-white px-2.5 py-1.5 font-semibold text-amber-900 shadow-sm hover:bg-amber-100 active:scale-95 disabled:opacity-50"
                >
                  Admin
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDevAutoLogin('teknisi')}
                  className="rounded-md border border-amber-400 bg-white px-2.5 py-1.5 font-semibold text-amber-900 shadow-sm hover:bg-amber-100 active:scale-95 disabled:opacity-50"
                >
                  Teknisi
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <p className="mx-auto mt-8 text-center text-xs text-ink-3">SI-Podorukun Ac 2026</p>
    </div>
  );
}
