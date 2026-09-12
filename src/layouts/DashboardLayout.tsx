import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { MdMenu } from 'react-icons/md';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content wrapper */}
      <div className="flex min-h-screen flex-col lg:pl-72 transition-all duration-300">
        {/* Mobile menu trigger button (screens < lg) */}
        <div className="lg:hidden flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 transition-all"
            aria-label="Buka menu navigasi"
          >
            <MdMenu className="h-4 w-4 text-gray-600" />
            <span>Menu Navigasi</span>
          </button>
          <span className="text-xs font-semibold text-gray-700">SI-Podorukun</span>
        </div>

        {/* Main content area */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
