import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { PiCircleNotch } from 'react-icons/pi';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
type Size = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white border border-white/30 shadow-[4px_4px_8px_rgba(0,0,0,0.18),-4px_-4px_8px_rgba(255,255,255,0.9)] hover:bg-brand-700 active:scale-95 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.35),inset_-1px_-1px_3px_rgba(255,255,255,0.2)]',
  secondary:
    'bg-[#f0eff4] text-ink border border-white/60 shadow-[4px_4px_8px_rgba(0,0,0,0.16),-4px_-4px_8px_rgba(255,255,255,0.9)] hover:bg-[#e6e5ea] active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]',
  ghost: 'text-ink-2 hover:bg-neutral-soft hover:text-ink active:bg-line',
  danger:
    'bg-danger text-white border border-white/30 shadow-[4px_4px_8px_rgba(0,0,0,0.18),-4px_-4px_8px_rgba(255,255,255,0.9)] hover:bg-[#9a1d14] active:scale-95 active:shadow-[inset_2px_2px_5px_rgba(100,20,15,0.35)]',
  'danger-ghost': 'text-danger hover:bg-danger-soft active:bg-[#fbdcd8]',
};

const SIZE: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3.5 text-xs font-bold rounded-xl',
  md: 'h-10 gap-2 px-4 text-sm font-semibold rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconType;
  loading?: boolean;
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, loading, className = '', children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`tap-target inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-[background-color,border-color,color,transform] duration-100 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <PiCircleNotch className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {children}
    </button>
  );
});

export default Button;

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType;
  label: string;
  tone?: 'default' | 'danger';
}

/** Tombol ikon saja. `label` wajib: dipakai sebagai aria-label dan tooltip. */
export function IconButton({ icon: Icon, label, tone = 'default', className = '', type = 'button', ...rest }: IconButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-ink-3 hover:bg-danger-soft hover:text-danger'
      : 'text-ink-3 hover:bg-neutral-soft hover:text-ink';
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`tap-target inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-40 ${toneClass} ${className}`}
      {...rest}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
