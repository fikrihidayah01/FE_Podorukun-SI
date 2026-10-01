import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { shade, tint } from '../../config/theme';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: IconType;
  /** Warna gradien utama. */
  color?: string;
}

export function StatTile({ label, value, hint, icon: Icon, color = '#18212b' }: StatTileProps) {
  return (
    <div
      className="relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden p-5 text-white rounded-2xl shadow-sm ring-1 ring-black/[0.03]"
      style={{ backgroundImage: `linear-gradient(135deg, ${color} 0%, ${shade(color, 62)} 100%)` }}
    >
      {Icon && <Icon className="pointer-events-none absolute -bottom-4 -right-3 h-28 w-28 text-white/10" aria-hidden />}
      <p className="relative text-sm font-semibold tracking-wide text-white/90">{label}</p>
      <div className="relative">
        <p className="truncate text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl">{value}</p>
        {hint && <p className="mt-1 text-sm text-white/80">{hint}</p>}
      </div>
    </div>
  );
}

export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  const cols = columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols}`}>
      {children}
    </div>
  );
}
