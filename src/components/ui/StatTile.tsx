import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { shade, tint } from '../../config/theme';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: IconType;
  /** Warna yang mewakili angka ini (mis. warna kategori hutang). */
  color?: string;
  /** Angka utama di halaman: permukaan penuh warna sebagai titik fokus. */
  emphasis?: boolean;
  tone?: 'default' | 'warning' | 'danger' | 'positive';
}

const VALUE_TONE = {
  default: 'text-ink',
  warning: 'text-warning',
  danger: 'text-danger',
  positive: 'text-positive',
};

export function StatTile({ label, value, hint, icon: Icon, color = '#18212b', emphasis, tone = 'default' }: StatTileProps) {
  if (emphasis) {
    return (
      <div
        className="stat-emphasis relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden p-4 text-white sm:p-5"
        style={{ backgroundImage: `linear-gradient(135deg, ${color} 0%, ${shade(color, 62)} 100%)` }}
      >
        {Icon && <Icon className="pointer-events-none absolute -bottom-4 -right-3 h-24 w-24 text-white/10" aria-hidden />}
        <p className="relative text-[13px] font-semibold text-white/85">{label}</p>
        <div className="relative">
          <p className="truncate text-xl font-bold tabular-nums tracking-[-0.01em] sm:text-[1.75rem]">{value}</p>
          {hint && <p className="mt-1 text-xs text-white/80">{hint}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex min-w-0 flex-col justify-between gap-3 bg-surface p-4 sm:p-5">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: color }} aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink-3">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: tint(color), color }}>
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
        )}
      </div>
      <div>
        <p className={`truncate text-lg font-bold tabular-nums tracking-[-0.01em] sm:text-2xl ${VALUE_TONE[tone]}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
      </div>
    </div>
  );
}

/**
 * Ringkasan angka dalam satu panel bersekat.
 * Di ponsel dua kolom; pada grid tiga sel, sel utama dibentangkan agar tidak ada sel kosong.
 */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  const cols = columns === 3 ? 'sm:grid-cols-3 max-sm:[&>.stat-emphasis]:col-span-2' : 'xl:grid-cols-4';
  return (
    <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-sm ${cols}`}>
      {children}
    </div>
  );
}
