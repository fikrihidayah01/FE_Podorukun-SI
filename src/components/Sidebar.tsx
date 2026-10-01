import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PiSignOut, PiX, PiCirclesFour } from 'react-icons/pi';
import { useAuthStore, ROLE_LABELS } from '../store/authStore';
import menuConfig, { type MenuItem } from '../config/menuConfig';
import { inisial } from '../utils/format';
import { accentFor, ROLE_ACCENT } from '../config/theme';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavLeaf = Omit<MenuItem, 'children'>;

function NavItem({ item, onNavigate }: { item: NavLeaf; onNavigate: () => void }) {
  const accent = accentFor(item.path);
  return (
    <li>
      <NavLink
        to={item.path}
        end={item.path === '/dashboard'}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group flex h-9 items-center gap-3 rounded-lg px-2 text-sm transition-colors ${
            isActive ? 'bg-subtle font-semibold text-ink' : 'font-medium text-ink-2 hover:bg-neutral-soft hover:text-ink'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
              style={{
                backgroundColor: isActive ? accent : 'transparent',
                color: isActive ? '#fff' : 'var(--color-ink-3)',
              }}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden />
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
        <div className="fixed inset-0 z-40 animate-fade-in bg-ink/20 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        ref={panelRef}
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface text-ink lg:border-r lg:border-line/60 lg:visible lg:translate-x-0 ${
          isOpen
            ? 'visible translate-x-0 shadow-pop [transition:transform_200ms_ease-out,visibility_0s] lg:shadow-none'
            : 'invisible -translate-x-full [transition:transform_200ms_ease-out,visibility_0s_linear_200ms]'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-6">
          <NavLink to="/dashboard" onClick={closeOnMobile} className="flex items-center gap-2.5 rounded-lg">
            <PiCirclesFour className="h-6 w-6 text-brand-600" />
            <span className="text-sm font-extrabold tracking-tight text-ink">SI-Podorukun</span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-neutral-soft hover:text-ink lg:hidden"
          >
            <PiX className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {merged.map((section, i) => (
            <div key={`${section.heading ?? 'root'}-${i}`} className={i > 0 ? 'mt-8' : ''}>
              {section.heading && <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-ink-3/70">{section.heading}</p>}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <NavItem key={item.path} item={item} onNavigate={closeOnMobile} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-subtle px-3 py-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: role ? ROLE_ACCENT[role] : '#475569' }}
              aria-hidden
            >
              {user ? inisial(user.name) : '?'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user?.name ?? 'Pengguna'}</p>
              <p className="truncate text-[11px] font-medium text-ink-3">{role ? ROLE_LABELS[role] : ''}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar"
              title="Keluar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-white hover:text-danger hover:shadow-sm transition-all"
            >
              <PiSignOut className="h-[15px] w-[15px]" aria-hidden />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
