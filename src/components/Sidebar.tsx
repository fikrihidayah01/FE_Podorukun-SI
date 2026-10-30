import { useEffect, useRef, useState, useMemo } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { PiSignOut, PiX, PiCaretDown } from 'react-icons/pi';
import { useAuthStore, ROLE_LABELS } from '../store/authStore';
import menuConfig, { type MenuItem } from '../config/menuConfig';
import { inisial } from '../utils/format';
import { ROLE_ACCENT } from '../config/theme';

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
  return (
    <li>
      <NavLink
        to={item.path}
        end={item.path === '/dashboard'}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group flex h-11 items-center gap-3.5 rounded-xl px-3.5 text-sm font-medium transition-all duration-150 ${
            isActive
              ? 'bg-[#cf1b1a] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              className={`h-5 w-5 shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-800'
              }`}
              aria-hidden
            />
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
  const hasActiveChild = item.children?.some((child) => isSubItemActive(child.path, pathname, search)) ?? false;
  const isDirectActive = pathname === item.path && !hasActiveChild;
  const isParentActive = hasActiveChild || pathname === item.path || pathname.startsWith(item.path + '/');

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
        className={`group flex h-11 cursor-pointer items-center justify-between rounded-xl px-3.5 text-sm font-medium transition-all duration-150 select-none ${
          isDirectActive
            ? 'bg-[#cf1b1a] text-white shadow-sm'
            : hasActiveChild
            ? 'bg-red-50/70 text-[#cf1b1a] font-semibold'
            : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <item.icon
            className={`h-5 w-5 shrink-0 transition-colors ${
              isDirectActive
                ? 'text-white'
                : hasActiveChild
                ? 'text-[#cf1b1a]'
                : 'text-gray-500 group-hover:text-gray-800'
            }`}
            aria-hidden
          />
          <span className="truncate">{item.label}</span>
        </div>
        <button
          type="button"
          onClick={handleChevronClick}
          aria-label={`${isOpen ? 'Tutup' : 'Buka'} submenu ${item.label}`}
          aria-expanded={isOpen}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isDirectActive
              ? 'text-white hover:bg-white/20'
              : hasActiveChild
              ? 'text-[#cf1b1a] hover:bg-red-100'
              : 'text-gray-400 hover:bg-gray-200/60 hover:text-gray-700'
          }`}
        >
          <PiCaretDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
            aria-hidden
          />
        </button>
      </div>

      {isOpen && item.children && item.children.length > 0 && (
        <ul className="my-1.5 ml-5 space-y-1 border-l-2 border-gray-100 pl-3 animate-fade-in">
          {item.children.map((child) => {
            const active = isSubItemActive(child.path, pathname, search);
            return (
              <li key={child.path}>
                <Link
                  to={child.path}
                  onClick={onNavigate}
                  className={`group/sub flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs transition-all duration-150 ${
                    active
                      ? 'bg-[#cf1b1a] font-semibold text-white shadow-xs'
                      : 'font-medium text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }`}
                >
                  {child.icon ? (
                    <child.icon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover/sub:text-gray-600'}`}
                      aria-hidden
                    />
                  ) : (
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                        active ? 'scale-125 bg-white' : 'bg-gray-300 group-hover/sub:bg-gray-500'
                      }`}
                      aria-hidden
                    />
                  )}
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

  // Buka otomatis HANYA submenu yang sedang aktif sesuai rute saat ini,
  // dan otomatis menutup submenu lain saat berpindah menu (misal dari Hutang ke Piutang).
  useEffect(() => {
    const nextExpanded: Record<string, boolean> = {};
    for (const group of groups) {
      for (const item of group.items) {
        if (item.children && location.pathname.startsWith(item.path)) {
          nextExpanded[item.path] = true;
        }
      }
    }
    setExpandedKeys(nextExpanded);
  }, [location.pathname, groups]);

  const toggleExpanded = (path: string) => {
    setExpandedKeys((prev) => {
      const isCurrentlyOpen = Boolean(prev[path]);
      if (isCurrentlyOpen) {
        // Tutup submenu ini
        return {};
      }
      // Buka submenu ini dan tutup submenu lainnya
      return { [path]: true };
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
        <div className="fixed inset-0 z-40 animate-fade-in bg-black/30 backdrop-blur-xs lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        ref={panelRef}
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-r border-gray-100 bg-white text-gray-900 lg:left-0 lg:right-auto lg:visible lg:translate-x-0 ${
          isOpen
            ? 'visible translate-x-0 shadow-xl [transition:transform_200ms_ease-out,visibility_0s] lg:shadow-none'
            : 'invisible translate-x-full [transition:transform_200ms_ease-out,visibility_0s_linear_200ms] lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4">
          <NavLink to="/dashboard" onClick={closeOnMobile} className="flex items-center gap-3 rounded-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#cf1b1a] text-xs font-extrabold tracking-wide text-white shadow-xs">
              SI
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-gray-900">SI-Podorukun</span>
              <span className="block text-xs text-gray-400">Sistem informasi</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          >
            <PiX className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3.5 py-4">
          {groups.map((group, groupIdx) => (
            <div key={`${group.groupLabel ?? 'root'}-${groupIdx}`} className={groupIdx > 0 ? 'mt-6' : ''}>
              {group.groupLabel && (
                <p className="mb-2 px-3 text-xs font-semibold text-gray-400">
                  {group.groupLabel}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) =>
                  item.children && item.children.length > 0 ? (
                    <NavAccordionItem
                      key={item.path}
                      item={item}
                      isOpen={Boolean(expandedKeys[item.path])}
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

        <div className="shrink-0 border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-2.5 py-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: role ? ROLE_ACCENT[role] : '#cf1b1a' }}
              aria-hidden
            >
              {user ? inisial(user.name) : '?'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">{user?.name ?? 'Pengguna'}</p>
              <p className="truncate text-xs font-medium text-gray-400">{role ? ROLE_LABELS[role] : ''}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar"
              title="Keluar"
              className="tap-target flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#cf1b1a] transition-colors"
            >
              <PiSignOut className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
