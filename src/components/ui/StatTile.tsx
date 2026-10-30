import { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { IconType } from 'react-icons';

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
      className="group relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden bg-white p-4 pt-5 sm:p-5 sm:pt-6 min-h-[114px] sm:min-h-[122px] transition-colors select-none cursor-default hover:bg-neutral-50/60"
    >
      {Icon && (
        <Icon
          className="pointer-events-none absolute -bottom-4 -right-3 h-24 w-24 text-[#cf1b1a]/[0.08] transition-transform duration-200 group-hover:scale-105"
          aria-hidden
        />
      )}
      <p className="relative text-[13px] font-semibold text-ink-3 tracking-wide">
        {label}
      </p>
      <div className="relative min-w-0">
        <p
          ref={valRef}
          aria-label={tooltipText ? `${label}: ${tooltipText}` : undefined}
          className="truncate text-xl font-bold tabular-nums tracking-[-0.01em] text-ink sm:text-[1.75rem]"
        >
          {value}
        </p>
        {hint && (
          <p
            className={`mt-1 text-xs truncate ${
              tone === 'warning'
                ? 'text-amber-600 font-semibold'
                : tone === 'danger'
                ? 'text-danger font-semibold'
                : 'text-ink-3'
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
          <div className="relative flex flex-col items-center rounded-xl bg-[#0f172a]/95 px-3.5 py-2 text-white shadow-xl backdrop-blur-md border border-white/20 whitespace-nowrap">
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
 * Ringkasan angka dalam satu panel div utuh bersekat (card holder) dengan aksen garis merah dan inner shadow tipis di kiri atas.
 */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  const cols = columns === 3 ? 'sm:grid-cols-3 max-sm:[&>*:first-child]:col-span-2' : 'xl:grid-cols-4';
  return (
    <div
      className={`relative grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line ${cols}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#cf1b1a] z-10" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl shadow-[inset_2px_2px_6px_rgba(0,0,0,0.08)]"
        aria-hidden
      />
      {children}
    </div>
  );
}
