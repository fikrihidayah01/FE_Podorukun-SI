import type { IconType } from 'react-icons';
import {
  PiSquaresFour,
  PiReceipt,
  PiWrench,
  PiCalendarBlank,
  PiClipboardText,
  PiUsers,
  PiTarget,
  PiMegaphone,
  PiBuildings,
  PiHardHat,
  PiChartBar,
  PiChartLineUp,
  PiHandCoins,
  PiTreeStructure,
  PiNotebook,
  PiWallet,
  PiScroll,
  PiBookOpen,
} from 'react-icons/pi';

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
          icon: PiSquaresFour,
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
          icon: PiWallet,
          allowedRoles: ['keuangan'],
          children: [
            {
              label: 'Hutang',
              path: '/keuangan/hutang',
              icon: PiHandCoins,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Piutang',
              path: '/keuangan/piutang',
              icon: PiReceipt,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Akun (COA)',
              path: '/keuangan/coa',
              icon: PiTreeStructure,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Jurnal Umum',
              path: '/keuangan/jurnal',
              icon: PiNotebook,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Legal',
              path: '/keuangan/legal',
              icon: PiScroll,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Master PT',
              path: '/keuangan/master-pt',
              icon: PiBuildings,
              allowedRoles: ['keuangan'],
            },
            {
              label: 'Pustaka Pasal',
              path: '/keuangan/pustaka-pasal',
              icon: PiBookOpen,
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
          icon: PiSquaresFour,
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
          icon: PiWrench,
          allowedRoles: ['teknisi'],
        },
        {
          label: 'Jadwal',
          path: '/teknisi/jadwal',
          icon: PiCalendarBlank,
          allowedRoles: ['teknisi'],
        },
        {
          label: 'Laporan Teknis',
          path: '/teknisi/laporan',
          icon: PiClipboardText,
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
          icon: PiSquaresFour,
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
          icon: PiTarget,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Klien',
          path: '/marketing/klien',
          icon: PiUsers,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Campaign',
          path: '/marketing/campaign',
          icon: PiMegaphone,
          allowedRoles: ['marketing'],
        },
        {
          label: 'Statistik',
          path: '/marketing/statistik',
          icon: PiChartBar,
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
          icon: PiSquaresFour,
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
          icon: PiBuildings,
          allowedRoles: ['kontraktor'],
        },
        {
          label: 'Subkontraktor',
          path: '/kontraktor/subkontraktor',
          icon: PiHardHat,
          allowedRoles: ['kontraktor'],
        },
        {
          label: 'Progres',
          path: '/kontraktor/progres',
          icon: PiChartLineUp,
          allowedRoles: ['kontraktor'],
        },
      ],
    },
  ],
};

export default menuConfig;
