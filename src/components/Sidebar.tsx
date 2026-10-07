import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PiSignOut, PiX } from 'react-icons/pi';
import { useAuthStore, ROLE_LABELS } from '../store/authStore';
import menuConfig, { type MenuItem } from '../config/menuConfig';
import { inisial } from '../utils/format';
import { accentFor, ROLE_ACCENT } from '../config/theme';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavLeaf = Omit<MenuItem, 'children'>;

// Setiap modul membawa warnanya sendiri: ikon kecil berwarna di menu sama dengan warna header halamannya
function NavItem({ item, onNavigate }: { item: NavLeaf; onNavigate: () => void }) {
  const accent = accentFor(item.path);
  return (
    <li>
      <NavLink
        to={item.path}
        end={item.path === '/dashboard'}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group flex h-10 items-center gap-3 rounded-lg px-2 text-sm transition-colors ${
            isActive ? 'bg-white/10 font-semibold text-white' : 'font-medium text-white/75 hover:bg-white/5 hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
              style={{
                backgroundColor: isActive ? accent : 'rgb(255 255 255 / 0.06)',
                color: isActive ? '#fff' : `color-mix(in srgb, ${accent} 45%, white)`,
              }}
            >
              <item.icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="truncate">{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLElement>(null);
  const role = user?.role;
  const groups = role ? menuConfig[role] : [];

  // Laci di layar kecil: fokus masuk saat dibuka, Escape menutup, fokus kembali ke tombol Menu saat ditutup.
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    const opener = document.activeElement as HTMLElement | null;
    panel?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (panel?.contains(document.activeElement)) opener?.focus();
    };
  }, [isOpen, onClose]);

  const closeOnMobile = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Item ber-anak ditampilkan terbuka sebagai kelompok berjudul: satu klik lebih sedikit untuk tiap halaman.
  const sections = groups.flatMap((group) =>
    group.items.map((item) =>
      item.children
        ? { heading: item.label, items: item.children as NavLeaf[] }
        : { heading: group.groupLabel, items: [item as NavLeaf] },
    ),
  );
  const merged = sections.reduce<{ heading?: string; items: NavLeaf[] }[]>((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && last.heading === s.heading) last.items.push(...s.items);
    else acc.push({ heading: s.heading, items: [...s.items] });
    return acc;
  }, []);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 animate-fade-in bg-ink/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        ref={panelRef}
        aria-label="Navigasi utama"
        // visibility langsung tampil saat dibuka (supaya bisa difokus), dan baru disembunyikan setelah slide-out selesai
        className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-[#18212b] text-white lg:left-0 lg:right-auto lg:visible lg:translate-x-0 ${
          isOpen
            ? 'visible translate-x-0 shadow-pop [transition:transform_200ms_ease-out,visibility_0s] lg:shadow-none'
            : 'invisible translate-x-full [transition:transform_200ms_ease-out,visibility_0s_linear_200ms] lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
          <NavLink to="/dashboard" onClick={closeOnMobile} className="flex items-center gap-2.5 rounded-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-xs font-extrabold tracking-wide text-ink">
              SI
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-white">SI-Podorukun</span>
              <span className="block text-xs text-white/60">Sistem informasi</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <PiX className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {merged.map((section, i) => (
            <div key={`${section.heading ?? 'root'}-${i}`} className={i > 0 ? 'mt-6' : ''}>
              {section.heading && <p className="mb-2 px-2 text-xs font-semibold text-white/50">{section.heading}</p>}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.path} item={item} onNavigate={closeOnMobile} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 px-2 py-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: role ? ROLE_ACCENT[role] : '#475569' }}
              aria-hidden
            >
              {user ? inisial(user.name) : '?'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name ?? 'Pengguna'}</p>
              <p className="truncate text-xs text-white/60">{role ? ROLE_LABELS[role] : ''}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar"
              title="Keluar"
              className="tap-target flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <PiSignOut className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
