import type { ReactNode } from 'react';
import { shade, tint } from '../../config/theme';

export type Tone = 'neutral' | 'brand' | 'positive' | 'warning' | 'danger';

const TONE: Record<Tone, string> = {
  neutral: 'bg-neutral-soft text-ink-2',
  brand: 'bg-brand-50 text-brand-700',
  positive: 'bg-positive-soft text-positive',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

interface BadgeProps {
  tone?: Tone;
  /** Warna identitas (mis. kategori hutang). Menggantikan tone dan menambah titik warna. */
  color?: string;
  children: ReactNode;
  className?: string;
}

export default function Badge({ tone = 'neutral', color, children, className = '' }: BadgeProps) {
  if (color) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${className}`}
        style={{ backgroundColor: tint(color), color: shade(color) }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        {children}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
