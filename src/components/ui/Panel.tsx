import type { ReactNode } from 'react';

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Isi menempel ke tepi panel (untuk tabel). */
  flush?: boolean;
  className?: string;
}

/**
 * Satu-satunya permukaan yang terangkat dari kanvas. Isi di dalamnya tetap rata,
 * jadi bayangan hanya menandai "ini satu kelompok kerja".
 */
export default function Panel({ title, description, actions, children, flush, className = '' }: PanelProps) {
  const hasHeader = title || actions;
  return (
    <section className={`overflow-hidden rounded-xl bg-surface shadow-sm ${className}`}>
      {hasHeader && (
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : 'p-4 sm:p-5'}>{children}</div>
    </section>
  );
}

/** Area gulir horizontal untuk tabel lebar, dengan label untuk pembaca layar. */
export function TableScroll({ children, label }: { children: ReactNode; label: string }) {
  return (
    // relative: elemen sr-only (absolute) di dalam tabel tetap terkurung di area gulir ini
    <div className="relative overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
