import { formatAngka, formatRupiahShort } from '../../utils/format';

interface MoneyProps {
  value: number;
  /** Tampilkan dalam kurung jika negatif, gaya pembukuan. */
  accounting?: boolean;
  /** Selalu tampilkan tanda + atau - (untuk mutasi). */
  signed?: boolean;
  short?: boolean;
  tone?: 'default' | 'positive' | 'danger' | 'muted';
  className?: string;
}

const TONE = {
  default: '',
  positive: 'text-positive',
  danger: 'text-danger',
  muted: 'text-ink-3',
};

/**
 * Nominal rupiah dengan "Rp" diredam dan angka tabular,
 * supaya mata langsung ke angkanya dan kolom tetap rata kanan.
 */
export default function Money({ value, accounting, signed, short, tone = 'default', className = '' }: MoneyProps) {
  const negative = value < 0;
  const effectiveTone =
    tone !== 'default'
      ? tone
      : signed
      ? negative
        ? 'danger'
        : value > 0
        ? 'positive'
        : 'default'
      : 'default';

  if (short) {
    return <span className={`tabular-nums ${TONE[effectiveTone]} ${className}`}>{formatRupiahShort(value)}</span>;
  }
  const body = formatAngka(Math.abs(value));
  const prefix = negative && accounting ? '(' : negative ? '-' : signed && value > 0 ? '+' : '';
  return (
    <span className={`whitespace-nowrap tabular-nums ${TONE[effectiveTone]} ${className}`}>
      {prefix}
      <span className="text-[0.85em] font-medium opacity-70">Rp{' '}</span>
      {body}
      {negative && accounting ? ')' : ''}
    </span>
  );
}
