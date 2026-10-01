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
      className="relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden rounded-2xl p-4 text-white shadow-sm transition-transform hover:-translate-y-0.5 sm:p-5 min-h-[116px] sm:min-h-[124px]"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color} 0%, ${shade(color, 60)} 100%)`,
      }}
    >
      {Icon && (
        <Icon
          className="pointer-events-none absolute -bottom-3 -right-2 h-20 w-20 text-white/15 sm:-bottom-4 sm:-right-3 sm:h-24 sm:w-24"
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
 * Grid kartu ringkasan angka dengan elevasi dan spasi terpisah antar kartu.
 */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  const cols = columns === 3 ? 'sm:grid-cols-3 max-sm:[&>*:first-child]:col-span-2' : 'xl:grid-cols-4';
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${cols}`}>
      {children}
    </div>
  );
}
