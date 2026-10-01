import { useCallback, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { PiList } from 'react-icons/pi';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#konten"
        className="fixed left-3 top-3 z-[60] -translate-y-20 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white focus:translate-y-0"
      >
        Lewati ke konten
      </a>

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-expanded={sidebarOpen}
            className="tap-target inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink hover:bg-neutral-soft"
          >
            <PiList className="h-5 w-5" aria-hidden />
            Menu
          </button>
          <Link to="/dashboard" className="ml-auto mr-2 flex items-center gap-2 rounded-lg">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-[11px] font-bold text-white">SI</span>
            <span className="text-sm font-bold text-ink">SI-Podorukun</span>
          </Link>
        </div>

        <main id="konten" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
