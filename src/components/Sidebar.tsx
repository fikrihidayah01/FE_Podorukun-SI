import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import menuConfig from '../config/menuConfig';
import type { UserRole } from '../store/authStore';
import {
  MdChevronRight,
  MdKeyboardArrowDown,
  MdNotifications,
  MdLogout,
  MdPerson,
  MdClose,
} from 'react-icons/md';
import type { MenuItem } from '../config/menuConfig';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_BADGE_COLOR: Record<UserRole, string> = {
  keuangan: 'bg-emerald-100 text-emerald-700',
  teknisi: 'bg-blue-100 text-blue-700',
  marketing: 'bg-purple-100 text-purple-700',
  kontraktor: 'bg-orange-100 text-orange-700',
};

const ROLE_LABELS: Record<UserRole, string> = {
  keuangan: 'Keuangan',
  teknisi: 'Teknisi',
  marketing: 'Marketing',
  kontraktor: 'Kontraktor',
};

function AccordionItem({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const location = useLocation();

  // Auto-expand jika salah satu child aktif
  const isChildActive = item.children?.some((c) => location.pathname.startsWith(c.path)) ?? false;
  const [open, setOpen] = useState(isChildActive);

  const handleToggle = () => setOpen((prev) => !prev);

  return (
    <li>
      {/* Parent button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left
          ${isChildActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        `}
      >
        {/* Active indicator bar */}
        <span
          className={`absolute left-0 h-6 w-1 rounded-r-full bg-indigo-600 transition-opacity ${
            isChildActive ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <item.icon
          className={`h-4 w-4 shrink-0 ${isChildActive ? 'text-indigo-600' : 'text-gray-400'}`}
        />
        <span className="flex-1">{item.label}</span>
        {open ? (
          <MdKeyboardArrowDown className="h-4 w-4 text-gray-400" />
        ) : (
          <MdChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Children — indented accordion */}
      {open && item.children && (
        <ul className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-gray-100 pl-3">
          {item.children.map((child) => (
            <li key={child.path}>
              <NavLink
                to={child.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <child.icon
                      className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`}
                    />
                    <span>{child.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role as UserRole | undefined;
  const groups = role ? menuConfig[role] : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-50 flex h-screen w-72 flex-col
          overflow-hidden border-r border-gray-200 bg-white py-2
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header: Brand & Notifications */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-200">
              <span className="text-xs font-bold text-white">SI</span>
            </div>
            <div>
              <span className="block text-sm font-bold text-gray-900 leading-tight">SI-Podorukun</span>
              <span className="block text-[11px] text-gray-400 leading-tight">Sistem Informasi</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <button
              type="button"
              className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Notifikasi"
            >
              <MdNotifications className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
              aria-label="Tutup sidebar"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Nav groups (Scrollable) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            MENU
          </p>

          <ul className="space-y-0.5">
            {groups.flatMap((group) => group.items).map((item) =>
              item.children ? (
                // Accordion item
                <AccordionItem key={item.path} item={item} onClose={onClose} />
              ) : (
                // Regular nav item
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 h-6 w-1 rounded-r-full bg-indigo-600 transition-opacity ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              )
            )}
          </ul>
        </nav>

        {/* Footer: Logout & User profile */}
        <div className="shrink-0 bg-white p-3.5 space-y-3">
          {/* Logout button (left-aligned with #F4F6F8 stroke & no fill) */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-start gap-2.5 rounded-xl border border-[#F4F6F8] bg-transparent px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
            title="Keluar dari akun"
          >
            <MdLogout className="h-4 w-4 shrink-0" />
            <span>Keluar (Logout)</span>
          </button>

          {/* User profile card (with indigo border, larger avatar & font) */}
          <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <MdPerson className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900 leading-tight">
                {user?.name || 'Pengguna'}
              </p>
              {role && (
                <span
                  className={`mt-1 w-28 inline-flex items-center justify-start text-left rounded-full px-3 py-0.5 text-xs font-medium leading-none ${ROLE_BADGE_COLOR[role]}`}
                >
                  {ROLE_LABELS[role]}
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
