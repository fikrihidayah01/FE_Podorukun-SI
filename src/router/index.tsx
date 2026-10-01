import { createBrowserRouter, Navigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout';
import RoleGuard from '../components/guards/RoleGuard';

import LoginPage from '../pages/LoginPage';
import PlaceholderPage from '../pages/PlaceholderPage';
import DashboardPage from '../pages/DashboardPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

import HutangPage from '../pages/keuangan/HutangPage';
import DetailKodePembantuPage from '../pages/keuangan/hutang/DetailKodePembantuPage';
import PiutangPage from '../pages/keuangan/PiutangPage';
import CoaPage from '../pages/keuangan/CoaPage';
import JurnalPage from '../pages/keuangan/JurnalPage';
import SrpPage from '../pages/keuangan/SrpPage';
import SrpEditorPage from '../pages/keuangan/SrpEditorPage';
import LegalPage from '../pages/keuangan/LegalPage';
import LegalEditorPage from '../pages/keuangan/LegalEditorPage';
import MasterPtPage from '../pages/keuangan/MasterPtPage';
import PustakaPasalPage from '../pages/keuangan/PustakaPasalPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },

  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },

  {
    element: <RoleGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },

          {
            element: <RoleGuard allowedRoles={['keuangan']} />,
            children: [
              { path: '/keuangan/hutang', element: <HutangPage /> },
              { path: '/keuangan/hutang/detail/:kodePembantuId', element: <DetailKodePembantuPage /> },
              { path: '/keuangan/piutang', element: <PiutangPage /> },
              { path: '/keuangan/coa', element: <CoaPage /> },
              { path: '/keuangan/jurnal', element: <JurnalPage /> },
              { path: '/keuangan/legal', element: <LegalPage /> },
              { path: '/keuangan/legal/:id', element: <LegalEditorPage /> },
              { path: '/keuangan/master-pt', element: <MasterPtPage /> },
              { path: '/keuangan/pustaka-pasal', element: <PustakaPasalPage /> },
              // Rute SRP lama — dipertahankan agar tidak 404
              { path: '/keuangan/srp', element: <SrpPage /> },
              { path: '/keuangan/srp/:id', element: <SrpEditorPage /> },

              // Rute lama yang belum punya halaman sendiri
              { path: '/keuangan/laporan', element: <PlaceholderPage title="Laporan Keuangan" /> },
              { path: '/keuangan/tagihan', element: <PlaceholderPage title="Tagihan" /> },
              { path: '/keuangan/pengeluaran', element: <PlaceholderPage title="Pengeluaran" /> },
            ],
          },

          {
            element: <RoleGuard allowedRoles={['teknisi']} />,
            children: [
              { path: '/teknisi/pekerjaan', element: <PlaceholderPage title="Pekerjaan" /> },
              { path: '/teknisi/jadwal', element: <PlaceholderPage title="Jadwal" /> },
              { path: '/teknisi/laporan', element: <PlaceholderPage title="Laporan Teknis" /> },
            ],
          },

          {
            element: <RoleGuard allowedRoles={['marketing']} />,
            children: [
              { path: '/marketing/prospek', element: <PlaceholderPage title="Prospek" /> },
              { path: '/marketing/klien', element: <PlaceholderPage title="Klien" /> },
              { path: '/marketing/campaign', element: <PlaceholderPage title="Campaign" /> },
              { path: '/marketing/statistik', element: <PlaceholderPage title="Statistik" /> },
            ],
          },

          {
            element: <RoleGuard allowedRoles={['kontraktor']} />,
            children: [
              { path: '/kontraktor/proyek', element: <PlaceholderPage title="Proyek" /> },
              { path: '/kontraktor/subkontraktor', element: <PlaceholderPage title="Subkontraktor" /> },
              { path: '/kontraktor/progres', element: <PlaceholderPage title="Progres" /> },
            ],
          },
        ],
      },
    ],
  },
]);
