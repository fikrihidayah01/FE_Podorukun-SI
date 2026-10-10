import { useEffect, useRef, useState, useMemo } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { PiSignOut, PiX, PiCaretDown } from 'react-icons/pi';
import { useAuthStore, ROLE_LABELS } from '../store/authStore';
import menuConfig, { type MenuItem } from '../config/menuConfig';
import { inisial } from '../utils/format';
import { accentFor, ROLE_ACCENT } from '../config/theme';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function isSubItemActive(subPath: string, currentPath: string, currentSearch: string): boolean {
  const [subBasePath, subQuery] = subPath.split('?');
  if (currentPath !== subBasePath) return false;

  const currentParams = new URLSearchParams(currentSearch);
  const currentTab = currentParams.get('tab');

  if (subQuery) {
    const subParams = new URLSearchParams(subQuery);
    const subTab = subParams.get('tab');
    return currentTab === subTab;
  } else {
    // Sub-item default (tanpa query ?tab=)
    if (!currentTab) return true;
    if (subBasePath === '/keuangan/hutang' && (currentTab === 'saldo' || currentTab === '')) return true;
    if (subBasePath === '/keuangan/coa' && (currentTab === 'daftar' || currentTab === '')) return true;
    if (subBasePath === '/keuangan/master-pt' && (currentTab === 'master-pt' || currentTab === '')) return true;
    return false;
  }
}

// NavItem untuk menu tunggal tanpa anak
function NavItem({ item, onNavigate }: { item: MenuItem; onNavigate: () => void }) {
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

// NavAccordionItem untuk menu berjenjang (accordion sub-menu)
interface NavAccordionItemProps {
  item: MenuItem;
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  search: string;
  onNavigate: () => void;
}

function NavAccordionItem({
  item,
  isOpen,
  onToggle,
  pathname,
  search,
  onNavigate,
}: NavAccordionItemProps) {
  const navigate = useNavigate();
  const accent = accentFor(item.path);
  const isParentActive = pathname === item.path || pathname.startsWith(item.path + '/');

  const handleRowClick = () => {
    if (!isParentActive) {
      navigate(item.path);
      onNavigate();
    } else {
      onToggle();
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
          }
        }}
        className={`group flex h-10 cursor-pointer items-center justify-between rounded-lg px-2 text-sm transition-colors select-none ${
          isParentActive
            ? 'bg-white/10 font-semibold text-white'
            : 'font-medium text-white/75 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
            style={{
              backgroundColor: isParentActive ? accent : 'rgb(255 255 255 / 0.06)',
              color: isParentActive ? '#fff' : `color-mix(in srgb, ${accent} 45%, white)`,
            }}
          >
            <item.icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="truncate">{item.label}</span>
        </div>
        <button
          type="button"
          onClick={handleChevronClick}
          aria-label={`${isOpen ? 'Tutup' : 'Buka'} submenu ${item.label}`}
          aria-expanded={isOpen}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white"
        >
          <PiCaretDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
            aria-hidden
          />
        </button>
      </div>

      {isOpen && item.children && item.children.length > 0 && (
        <ul className="my-1 ml-5 space-y-0.5 border-l border-white/15 pl-2.5 animate-fade-in">
          {item.children.map((child) => {
            const active = isSubItemActive(child.path, pathname, search);
            return (
              <li key={child.path}>
                <Link
                  to={child.path}
                  onClick={onNavigate}
                  className={`group/sub flex h-8 items-center gap-2.5 rounded-md px-2 text-xs transition-colors ${
                    active
                      ? 'bg-white/10 font-semibold text-white shadow-xs'
                      : 'font-medium text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                      active ? 'scale-125 ring-2 ring-white/20' : 'bg-white/30 group-hover/sub:bg-white/60'
                    }`}
                    style={{
                      backgroundColor: active ? accent : undefined,
                    }}
                    aria-hidden
                  />
                  <span className="truncate">{child.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<HTMLElement>(null);
  const role = user?.role;
  const groups = useMemo(() => (role ? menuConfig[role] : []), [role]);

  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Buka accordion secara otomatis jika rute aktif saat ini berada di bawah modul tersebut
  useEffect(() => {
    for (const group of groups) {
      for (const item of group.items) {
        if (item.children && location.pathname.startsWith(item.path)) {
          setExpandedKeys((prev) => (prev[item.path] ? prev : { ...prev, [item.path]: true }));
        }
      }
    }
  }, [location.pathname, groups]);

  const toggleExpanded = (path: string) => {
    setExpandedKeys((prev) => {
      const current = prev[path] ?? location.pathname.startsWith(path);
      return { ...prev, [path]: !current };
    });
  };

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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 animate-fade-in bg-ink/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        ref={panelRef}
        aria-label="Navigasi utama"
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
          {groups.map((group, groupIdx) => (
            <div key={`${group.groupLabel ?? 'root'}-${groupIdx}`} className={groupIdx > 0 ? 'mt-6' : ''}>
              {group.groupLabel && <p className="mb-2 px-2 text-xs font-semibold text-white/50">{group.groupLabel}</p>}
              <ul className="space-y-0.5">
                {group.items.map((item) =>
                  item.children && item.children.length > 0 ? (
                    <NavAccordionItem
                      key={item.path}
                      item={item}
                      isOpen={expandedKeys[item.path] ?? location.pathname.startsWith(item.path)}
                      onToggle={() => toggleExpanded(item.path)}
                      pathname={location.pathname}
                      search={location.search}
                      onNavigate={closeOnMobile}
                    />
                  ) : (
                    <NavItem key={item.path} item={item} onNavigate={closeOnMobile} />
                  ),
                )}
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
