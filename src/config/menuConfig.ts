import {
  LayoutDashboard,
  FileText,
  Wrench,
  CalendarDays,
  ClipboardList,
  Users,
  Target,
  Megaphone,
  Building2,
  Network,
  BarChart3,
  CreditCard,
  BookOpen,
  ScrollText,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../store/authStore';

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
  /** Sub-items untuk accordion dropdown */
  children?: Omit<MenuItem, 'children'>[];
}

export interface MenuGroup {
  groupLabel?: string;
  items: MenuItem[];
}

const menuConfig: Record<UserRole, MenuGroup[]> = {
  keuangan: [
    {
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          allowedRoles: ['keuangan'],
        },
      ],
    },
    {
      groupLabel: 'Keuangan',
      items: [
        {
          label: 'Keuangan',
          path: '/keuangan',
          icon: Wallet,
          allowedRoles: ['keuangan'],
          children: [
            {
              label: 'Hutang',
              path: '/keuangan/hutang',
              icon: CreditCard,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Piutang',
              path: '/keuangan/piutang',
              icon: FileText,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Akun (COA)',
              path: '/keuangan/coa',
              icon: BookOpen,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Jurnal Umum',
              path: '/keuangan/jurnal',
              icon: ScrollText,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'SRP',
              path: '/keuangan/srp',
              icon: ClipboardList,
              allowedRoles: ['keuangan'],
            },
          ],
        },
      ],
    },
  ],

  teknisi: [
    {
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          allowedRoles: ['teknisi'],
        },
      ],
    },
    {
      groupLabel: 'Operasional',
      items: [
        {
          label: 'Pekerjaan',
          path: '/teknisi/pekerjaan',
          icon: Wrench,
          allowedRoles: ['teknisi'],
        },
        {
          label: 'Jadwal',
          path: '/teknisi/jadwal',
          icon: CalendarDays,
          allowedRoles: ['teknisi'],
        },
        {
          label: 'Laporan Teknis',
          path: '/teknisi/laporan',
          icon: ClipboardList,
          allowedRoles: ['teknisi'],
        },
      ],
    },
  ],

  marketing: [
    {
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          allowedRoles: ['marketing'],
        },
      ],
    },
    {
      groupLabel: 'Pemasaran',
      items: [
        {
          label: 'Prospek',
          path: '/marketing/prospek',
          icon: Target,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Klien',
          path: '/marketing/klien',
          icon: Users,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Campaign',
          path: '/marketing/campaign',
          icon: Megaphone,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Statistik',
          path: '/marketing/statistik',
          icon: BarChart3,
          allowedRoles: ['marketing'],
        },
      ],
    },
  ],

  kontraktor: [
    {
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          allowedRoles: ['kontraktor'],
        },
      ],
    },
    {
      groupLabel: 'Proyek',
      items: [
        {
          label: 'Proyek',
          path: '/kontraktor/proyek',
          icon: Building2,
          allowedRoles: ['kontraktor'],
        },
        {
          label: 'Subkontraktor',
          path: '/kontraktor/subkontraktor',
          icon: Network,
          allowedRoles: ['kontraktor'],
        },
        {
          label: 'Progres',
          path: '/kontraktor/progres',
          icon: BarChart3,
          allowedRoles: ['kontraktor'],
        },
      ],
    },
  ],
};

export default menuConfig;
