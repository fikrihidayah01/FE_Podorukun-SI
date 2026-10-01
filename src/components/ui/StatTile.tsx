import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { shade } from '../../config/theme';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: IconType;
  /** Warna yang mewakili angka ini (mis. warna kategori hutang). */
  color?: string;
  /** Angka utama di halaman: dipertahankan untuk kompatibilitas props. */
  emphasis?: boolean;
  tone?: 'default' | 'warning' | 'danger' | 'positive';
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  color = '#1e293b',
  tone = 'default',
}: StatTileProps) {
  return (
    <div
      className="relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden p-4 text-white sm:p-5 min-h-[112px] sm:min-h-[120px]"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color} 0%, ${shade(color, 60)} 100%)`,
      }}
    >
      {Icon && (
        <Icon
          className="pointer-events-none absolute -bottom-4 -right-3 h-24 w-24 text-white/15"
          aria-hidden
        />
      )}
      <p className="relative text-[13px] font-semibold text-white/90 tracking-wide">{label}</p>
      <div className="relative">
        <p className="truncate text-xl font-bold tabular-nums tracking-[-0.01em] text-white sm:text-[1.75rem]">
          {value}
        </p>
        {hint && (
          <p
            className={`mt-1 text-xs truncate ${
              tone === 'warning'
                ? 'text-amber-200 font-medium'
                : tone === 'danger'
                ? 'text-red-200 font-medium'
                : 'text-white/80'
            }`}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Ringkasan angka dalam satu panel div utuh bersekat (gap-px dengan border line luar).
 */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  const cols = columns === 3 ? 'sm:grid-cols-3 max-sm:[&>*:first-child]:col-span-2' : 'xl:grid-cols-4';
  return (
    <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-sm ${cols}`}>
      {children}
    </div>
  );
}
