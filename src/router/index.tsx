import { createBrowserRouter, Navigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout';
import RoleGuard from '../components/guards/RoleGuard';

import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

// Keuangan pages
import HutangPage from '../pages/keuangan/HutangPage';
import DetailKodePembantuPage from '../pages/keuangan/hutang/DetailKodePembantuPage';
import PiutangPage from '../pages/keuangan/PiutangPage';
import CoaPage from '../pages/keuangan/CoaPage';
import JurnalPage from '../pages/keuangan/JurnalPage';
import SrpPage from '../pages/keuangan/SrpPage';
import SrpEditorPage from '../pages/keuangan/SrpEditorPage';

// Placeholder for pages under development
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white border-b border-gray-200 px-6 py-4 md:px-8 md:py-5 w-full">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Modul {title}</p>
      </div>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
          <div className="rounded-xl border border-dashed border-gray-300 bg-white shadow-sm p-10 max-w-sm w-full">
            <p className="text-lg font-semibold text-gray-600">{title}</p>
            <p className="mt-2 text-sm text-gray-400">Halaman ini sedang dalam pengembangan</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  // Root redirect
  { path: '/', element: <Navigate to="/login" replace /> },

  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },

  // Protected dashboard routes
  {
    element: <RoleGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Dashboard — all authenticated roles
          { path: '/dashboard', element: <DashboardPage /> },

          // ── Keuangan routes ───────────────────────────────────────
          {
            element: <RoleGuard allowedRoles={['keuangan']} />,
            children: [
              { path: '/keuangan/hutang',   element: <HutangPage /> },
              { path: '/keuangan/hutang/detail/:kodePembantuId', element: <DetailKodePembantuPage /> },
              { path: '/keuangan/piutang',  element: <PiutangPage /> },
              { path: '/keuangan/coa',      element: <CoaPage /> },
              { path: '/keuangan/jurnal',   element: <JurnalPage /> },
              { path: '/keuangan/srp',      element: <SrpPage /> },
              { path: '/keuangan/srp/:id',  element: <SrpEditorPage /> },
              // Legacy placeholders
              { path: '/keuangan/laporan',  element: <PlaceholderPage title="Laporan Keuangan" /> },
              { path: '/keuangan/tagihan',  element: <PlaceholderPage title="Tagihan" /> },
              { path: '/keuangan/pengeluaran', element: <PlaceholderPage title="Pengeluaran" /> },
            ],
          },

          // ── Teknisi routes ────────────────────────────────────────
          {
            element: <RoleGuard allowedRoles={['teknisi']} />,
            children: [
              { path: '/teknisi/pekerjaan', element: <PlaceholderPage title="Pekerjaan" /> },
              { path: '/teknisi/jadwal',    element: <PlaceholderPage title="Jadwal" /> },
              { path: '/teknisi/laporan',   element: <PlaceholderPage title="Laporan Teknis" /> },
            ],
          },

          // ── Marketing routes ──────────────────────────────────────
          {
            element: <RoleGuard allowedRoles={['marketing']} />,
            children: [
              { path: '/marketing/prospek',   element: <PlaceholderPage title="Prospek" /> },
              { path: '/marketing/klien',     element: <PlaceholderPage title="Klien" /> },
              { path: '/marketing/campaign',  element: <PlaceholderPage title="Campaign" /> },
              { path: '/marketing/statistik', element: <PlaceholderPage title="Statistik" /> },
            ],
          },

          // ── Kontraktor routes ─────────────────────────────────────
          {
            element: <RoleGuard allowedRoles={['kontraktor']} />,
            children: [
              { path: '/kontraktor/proyek',        element: <PlaceholderPage title="Proyek" /> },
              { path: '/kontraktor/subkontraktor', element: <PlaceholderPage title="Subkontraktor" /> },
              { path: '/kontraktor/progres',       element: <PlaceholderPage title="Progres" /> },
            ],
          },
        ],
      },
    ],
  },
]);
