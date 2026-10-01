import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { PiCircleNotch } from 'react-icons/pi';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
type Size = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-[0_2px_8px_-2px_rgba(43,79,203,0.4)]',
  secondary:
    'bg-white text-ink border border-line shadow-sm hover:bg-subtle active:bg-neutral-soft',
  ghost: 'text-ink-2 hover:bg-subtle hover:text-ink active:bg-line',
  danger: 'bg-danger text-white hover:bg-[#9a1d14] active:bg-[#82180f] shadow-sm',
  'danger-ghost': 'text-danger hover:bg-danger-soft active:bg-[#fbdcd8]',
};

const SIZE: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
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
