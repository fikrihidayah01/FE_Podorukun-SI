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
      className="group relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden p-4 text-white sm:p-5 min-h-[114px] sm:min-h-[122px] transition-all duration-200"
      style={{
        backgroundImage: `
          linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 32%, rgba(0, 0, 0, 0.02) 65%, rgba(0, 0, 0, 0.24) 100%),
          linear-gradient(135deg, ${color} 0%, ${shade(color, 60)} 100%)
        `,
        boxShadow: `
          inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.45),
          inset 1.5px 0 1px 0 rgba(255, 255, 255, 0.25),
          inset 0 -2.5px 4px 0 rgba(0, 0, 0, 0.35),
          inset -1.5px 0 2px 0 rgba(0, 0, 0, 0.25)
        `,
      }}
    >
      {/* Top bevel highlight line for crisp emboss edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-white/30 via-white/70 to-white/30"
        aria-hidden
      />

      {/* Bottom bevel shadow line */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-black/20 via-black/40 to-black/20"
        aria-hidden
      />

      {Icon && (
        <Icon
          className="pointer-events-none absolute -bottom-4 -right-3 h-24 w-24 text-white/15 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105"
          aria-hidden
        />
      )}
      <p className="relative text-[13px] font-semibold text-white/95 tracking-wide [text-shadow:_0_1px_2px_rgb(0_0_0_/_35%)]">
        {label}
      </p>
      <div className="relative">
        <p className="truncate text-xl font-bold tabular-nums tracking-[-0.01em] text-white sm:text-[1.75rem] [text-shadow:_0_1.5px_3px_rgb(0_0_0_/_40%)]">
          {value}
        </p>
        {hint && (
          <p
            className={`mt-1 text-xs truncate [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)] ${
              tone === 'warning'
                ? 'text-amber-200 font-semibold'
                : tone === 'danger'
                ? 'text-red-200 font-semibold'
                : 'text-white/85'
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
 * Ringkasan angka dalam satu panel div utuh bersekat (gap-px dengan border line luar),
 * dengan efek neumorphic emboss dan bayangan soft bertingkat.
 */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  const cols = columns === 3 ? 'sm:grid-cols-3 max-sm:[&>*:first-child]:col-span-2' : 'xl:grid-cols-4';
  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/50 bg-black/25 ${cols}`}
      style={{
        boxShadow: `
          8px 8px 10px -1px rgba(0, 0, 0, 0.3),
          -8px -8px 5px 5px rgba(255, 255, 255, 1)
        `,
      }}
    >
      {children}
    </div>
  );
}
