import { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  /** Nilai lengkap untuk tooltip hover (opsional, default memakai string value) */
  fullValue?: string;
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  color = '#1e293b',
  tone = 'default',
  fullValue,
}: StatTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [pos, setPos] = useState<{ top: number; bottom: number; left: number } | null>(null);
  const valRef = useRef<HTMLParagraphElement>(null);

  const tooltipText =
    fullValue ??
    (typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : undefined);

  useEffect(() => {
    if (!isHovered) return;
    const updatePos = () => {
      if (valRef.current) {
        const rect = valRef.current.getBoundingClientRect();
        setPos({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left + rect.width / 2,
        });
      }
    };
    updatePos();
    window.addEventListener('scroll', updatePos, { passive: true });
    window.addEventListener('resize', updatePos, { passive: true });
    return () => {
      window.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
    };
  }, [isHovered]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden p-4 text-white sm:p-5 min-h-[114px] sm:min-h-[122px] transition-all duration-200 select-none cursor-default"
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
      <div className="relative min-w-0">
        <p
          ref={valRef}
          aria-label={tooltipText ? `${label}: ${tooltipText}` : undefined}
          className="truncate text-xl font-bold tabular-nums tracking-[-0.01em] text-white sm:text-[1.75rem] [text-shadow:_0_1.5px_3px_rgb(0_0_0_/_40%)]"
        >
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

      {isHovered && pos && tooltipText && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: pos.top < 70 ? pos.bottom + 8 : pos.top - 8,
            left: Math.max(100, Math.min(window.innerWidth - 100, pos.left)),
            transform: pos.top < 70 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 99999,
          }}
          className="pointer-events-none animate-fade-in"
        >
          <div className="relative flex flex-col items-center rounded-xl bg-[#0f172a]/95 px-3.5 py-2 text-white shadow-2xl backdrop-blur-md border border-white/20 whitespace-nowrap">
            <span className="text-[11px] font-medium text-white/70 tracking-wide">{label}</span>
            <span className="text-sm font-bold tabular-nums text-white tracking-tight mt-0.5">{tooltipText}</span>
            {/* Arrow indicator */}
            {pos.top < 70 ? (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0f172a]/95" />
            ) : (
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0f172a]/95" />
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/**
 * Ringkasan angka dalam satu panel div utuh bersekat,
 * dengan efek neumorphic emboss dan bayangan soft bertingkat.
 */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  const cols = columns === 3 ? 'sm:grid-cols-3 max-sm:[&>*:first-child]:col-span-2' : 'xl:grid-cols-4';
  return (
      <div
        className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl  bg-black/25 ${cols}`}
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
