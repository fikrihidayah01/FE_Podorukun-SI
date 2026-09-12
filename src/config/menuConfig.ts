import type { IconType } from 'react-icons';
import {
  MdDashboard,
  MdDescription,
  MdHandyman,
  MdCalendarMonth,
  MdAssignment,
  MdPeople,
  MdTrackChanges,
  MdCampaign,
  MdApartment,
  MdLan,
  MdBarChart,
  MdCreditCard,
  MdMenuBook,
  MdReceiptLong,
  MdAccountBalanceWallet,
} from 'react-icons/md';
import type { UserRole } from '../store/authStore';

export interface MenuItem {
  label: string;
  path: string;
  icon: IconType;
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
          icon: MdDashboard,
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
          icon: MdAccountBalanceWallet,
          allowedRoles: ['keuangan'],
          children: [
            {
              label: 'Hutang',
              path: '/keuangan/hutang',
              icon: MdCreditCard,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Piutang',
              path: '/keuangan/piutang',
              icon: MdDescription,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Akun (COA)',
              path: '/keuangan/coa',
              icon: MdMenuBook,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Jurnal Umum',
              path: '/keuangan/jurnal',
              icon: MdReceiptLong,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'SRP',
              path: '/keuangan/srp',
              icon: MdAssignment,
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
          icon: MdDashboard,
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
          icon: MdHandyman,
          allowedRoles: ['teknisi'],
        },
        {
          label: 'Jadwal',
          path: '/teknisi/jadwal',
          icon: MdCalendarMonth,
          allowedRoles: ['teknisi'],
        },
        {
          label: 'Laporan Teknis',
          path: '/teknisi/laporan',
          icon: MdAssignment,
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
          icon: MdDashboard,
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
          icon: MdTrackChanges,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Klien',
          path: '/marketing/klien',
          icon: MdPeople,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Campaign',
          path: '/marketing/campaign',
          icon: MdCampaign,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Statistik',
          path: '/marketing/statistik',
          icon: MdBarChart,
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
          icon: MdDashboard,
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
          icon: MdApartment,
          allowedRoles: ['kontraktor'],
        },
        {
          label: 'Subkontraktor',
          path: '/kontraktor/subkontraktor',
          icon: MdLan,
          allowedRoles: ['kontraktor'],
        },
        {
          label: 'Progres',
          path: '/kontraktor/progres',
          icon: MdBarChart,
          allowedRoles: ['kontraktor'],
        },
      ],
    },
  ],
};

export default menuConfig;
