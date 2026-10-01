import { useCallback, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { PiList } from 'react-icons/pi';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-dvh bg-canvas selection:bg-brand-100 selection:text-brand-800">
      <a
        href="#konten"
        className="fixed left-3 top-3 z-[60] -translate-y-20 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white focus:translate-y-0"
      >
        Lewati ke konten
      </a>

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-dvh flex-col lg:pl-64">
        {/* Mobile Header - Floating / Glassy */}
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-white/80 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-expanded={sidebarOpen}
            className="tap-target inline-flex h-10 items-center gap-2 rounded-xl text-sm font-semibold text-ink hover:bg-neutral-soft"
          >
            <PiList className="h-5 w-5" aria-hidden />
          </button>
          <Link to="/dashboard" className="ml-auto flex items-center gap-2 rounded-lg">
            <span className="text-sm font-bold tracking-tight text-ink">SI-Podorukun</span>
          </Link>
        </div>

        {/* Main Content Area */}
        <main id="konten" tabIndex={-1} className="flex flex-1 flex-col outline-none w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
