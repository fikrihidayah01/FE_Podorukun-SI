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

export default function Panel({ title, description, actions, children, flush, className = '' }: PanelProps) {
  const hasHeader = title || actions;
  return (
    <section className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03] ${className}`}>
      {hasHeader && (
        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between border-b border-line/40">
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-ink tracking-tight">{title}</h2>}
            {description && <p className="mt-1 text-[13px] font-medium text-ink-3">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : 'p-6'}>{children}</div>
    </section>
  );
}

export function TableScroll({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
