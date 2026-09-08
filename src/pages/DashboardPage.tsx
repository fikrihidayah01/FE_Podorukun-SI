import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../store/authStore';
import SummaryCard from '../components/widgets/SummaryCard';
import {
  DollarSign,
  FileText,
  Receipt,
  TrendingDown,
  Wrench,
  CalendarDays,
  ClipboardList,
  AlertTriangle,
  Target,
  Users,
  Megaphone,
  BarChart3,
  Building2,
  Network,
  CheckCircle,
  Clock,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Widget data per role (dummy / placeholder)
// ──────────────────────────────────────────────

const WIDGETS: Record<UserRole, React.ReactNode[]> = {
  keuangan: [
    <SummaryCard
      key="pendapatan"
      title="Total Pendapatan"
      value="Rp 128.500.000"
      subtitle="Bulan September 2026"
      icon={DollarSign}
      color="emerald"
      trend={{ value: '12%', direction: 'up' }}
    />,
    <SummaryCard
      key="tagihan"
      title="Tagihan Belum Lunas"
      value="14"
      subtitle="Perlu tindak lanjut"
      icon={Receipt}
      color="red"
      trend={{ value: '3', direction: 'up' }}
    />,
    <SummaryCard
      key="pengeluaran"
      title="Total Pengeluaran"
      value="Rp 54.200.000"
      subtitle="Bulan September 2026"
      icon={TrendingDown}
      color="orange"
      trend={{ value: '5%', direction: 'down' }}
    />,
    <SummaryCard
      key="laporan"
      title="Laporan Dibuat"
      value="8"
      subtitle="Bulan ini"
      icon={FileText}
      color="indigo"
    />,
  ],

  teknisi: [
    <SummaryCard
      key="pekerjaan"
      title="Pekerjaan Aktif"
      value="23"
      subtitle="Sedang dikerjakan"
      icon={Wrench}
      color="blue"
      trend={{ value: '4', direction: 'up' }}
    />,
    <SummaryCard
      key="selesai"
      title="Selesai Bulan Ini"
      value="47"
      subtitle="Pekerjaan terselesaikan"
      icon={CheckCircle}
      color="emerald"
      trend={{ value: '15%', direction: 'up' }}
    />,
    <SummaryCard
      key="jadwal"
      title="Jadwal Hari Ini"
      value="5"
      subtitle="Tugas terjadwal"
      icon={CalendarDays}
      color="purple"
    />,
    <SummaryCard
      key="overdue"
      title="Pekerjaan Terlambat"
      value="3"
      subtitle="Perlu perhatian segera"
      icon={AlertTriangle}
      color="red"
    />,
    <SummaryCard
      key="laporan-teknis"
      title="Laporan Teknis"
      value="12"
      subtitle="Diajukan bulan ini"
      icon={ClipboardList}
      color="indigo"
    />,
    <SummaryCard
      key="antrian"
      title="Antrian Pekerjaan"
      value="9"
      subtitle="Belum dimulai"
      icon={Clock}
      color="orange"
    />,
  ],

  marketing: [
    <SummaryCard
      key="prospek"
      title="Prospek Aktif"
      value="38"
      subtitle="Dalam proses"
      icon={Target}
      color="purple"
      trend={{ value: '8', direction: 'up' }}
    />,
    <SummaryCard
      key="klien"
      title="Total Klien"
      value="152"
      subtitle="Klien terdaftar"
      icon={Users}
      color="blue"
      trend={{ value: '6%', direction: 'up' }}
    />,
    <SummaryCard
      key="campaign"
      title="Campaign Berjalan"
      value="4"
      subtitle="Aktif saat ini"
      icon={Megaphone}
      color="orange"
    />,
    <SummaryCard
      key="konversi"
      title="Tingkat Konversi"
      value="24%"
      subtitle="Prospek → Klien"
      icon={BarChart3}
      color="emerald"
      trend={{ value: '3%', direction: 'up' }}
    />,
  ],

  kontraktor: [
    <SummaryCard
      key="proyek"
      title="Proyek Aktif"
      value="7"
      subtitle="Sedang berjalan"
      icon={Building2}
      color="orange"
      trend={{ value: '2', direction: 'up' }}
    />,
    <SummaryCard
      key="subkon"
      title="Subkontraktor"
      value="15"
      subtitle="Terdaftar & aktif"
      icon={Network}
      color="blue"
    />,
    <SummaryCard
      key="progres"
      title="Rata-rata Progres"
      value="68%"
      subtitle="Semua proyek aktif"
      icon={BarChart3}
      color="emerald"
      trend={{ value: '5%', direction: 'up' }}
    />,
    <SummaryCard
      key="selesai-proyek"
      title="Proyek Selesai"
      value="24"
      subtitle="Tahun 2026"
      icon={CheckCircle}
      color="indigo"
    />,
  ],
};

const GREETING: Record<UserRole, string> = {
  keuangan: 'Ringkasan Keuangan',
  teknisi: 'Ringkasan Teknis',
  marketing: 'Ringkasan Pemasaran',
  kontraktor: 'Ringkasan Proyek',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role as UserRole | undefined;

  const widgets = role ? WIDGETS[role] : [];
  const greeting = role ? GREETING[role] : 'Dashboard';

  // Get current time greeting
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full">
        <h1 className="text-xl font-bold text-gray-900">
          {timeGreet}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">{greeting} — {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Main summary grid container (1 baris 4 cards) */}
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
          {widgets}
        </div>
      </div>

      {/* Placeholder info box */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white shadow-sm p-6 text-center">
        <p className="text-sm font-medium text-gray-500">Area Konten Tambahan</p>
        <p className="mt-1 text-xs text-gray-400">
          Grafik, tabel, dan komponen lanjutan akan ditambahkan di sini
        </p>
      </div>
    </div>
  );
}
