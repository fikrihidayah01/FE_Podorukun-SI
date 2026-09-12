import type { IconType } from 'react-icons';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: IconType;
  color?: 'indigo' | 'emerald' | 'blue' | 'purple' | 'orange' | 'red';
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

const THEME_MAP = {
  indigo: {
    card: 'bg-indigo-50/30 border-indigo-200',
    gradient: 'from-indigo-500 to-indigo-600',
    icon: 'text-indigo-600',
    text: 'text-indigo-700',
    subtitle: 'text-indigo-500',
    radialGlow: 'rgba(99, 102, 241, 0.35)',
    glowClass: 'bg-indigo-500/20',
  },
  emerald: {
    card: 'bg-emerald-200/30 border-emerald-200',
    gradient: 'from-emerald-500 to-emerald-600',
    icon: 'text-emerald-600',
    text: 'text-emerald-700',
    subtitle: 'text-emerald-500',
    radialGlow: 'rgba(16, 185, 129, 0.35)',
    glowClass: 'bg-emerald-500/20',
  },
  blue: {
    card: 'bg-blue-200/30 border-blue-200',
    gradient: 'from-blue-500 to-blue-600',
    icon: 'text-blue-600',
    text: 'text-blue-700',
    subtitle: 'text-blue-500',
    radialGlow: 'rgba(59, 130, 246, 0.35)',
    glowClass: 'bg-blue-500/20',
  },
  purple: {
    card: 'bg-purple-200/30 border-purple-200',
    gradient: 'from-purple-500 to-purple-600',
    icon: 'text-purple-600',
    text: 'text-purple-700',
    subtitle: 'text-purple-500',
    radialGlow: 'rgba(168, 85, 247, 0.35)',
    glowClass: 'bg-purple-500/20',
  },
  orange: {
    card: 'bg-amber-200/30 border-amber-200',
    gradient: 'from-amber-500 to-amber-600',
    icon: 'text-orange-600',
    text: 'text-amber-700',
    subtitle: 'text-amber-500',
    radialGlow: 'rgba(245, 158, 11, 0.40)',
    glowClass: 'bg-amber-500/25',
  },
  red: {
    card: 'bg-red-200/30 border-red-200',
    gradient: 'from-red-500 to-red-600',
    icon: 'text-red-600',
    text: 'text-red-700',
    subtitle: 'text-red-500',
    radialGlow: 'rgba(239, 68, 68, 0.35)',
    glowClass: 'bg-red-500/20',
  },
};

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
}: SummaryCardProps) {
  const theme = THEME_MAP[color] || THEME_MAP.indigo;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-4 md:p-5 flex flex-col justify-between gap-3 shadow-sm transition-all`}>
      {/* Radial blur layer di pojok kanan bawah sesuai warna masing-masing */}
      <div
        className={`pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full blur-2xl ${theme.glowClass}`}
        style={{
          background: `radial-gradient(circle at center, ${theme.radialGlow} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center justify-between">
        <p className={`text-lg font-bold ${theme.text}`}>{title}</p>
          <Icon className={`h-8 w-8 ${theme.icon}`} />
      </div>

      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
        <span className={`text-2xl md:text-3xl font-bold ${theme.text} truncate leading-tight`}>
          {value}
        </span>
      </div>

      {/* Title & Trend */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5 pt-0.5">
        {subtitle && (
          <p className={`text-sm font-semibold ${theme.subtitle} mt-1 truncate`}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 shrink-0 bg-white/90 backdrop-blur-xs border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
            <span
              className={
                trend.direction === 'up'
                  ? 'text-emerald-600'
                  : trend.direction === 'down'
                  ? 'text-red-500'
                  : 'text-gray-500'
              }
            >
              {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'} {trend.value}
            </span>
            <span className="text-gray-400 font-normal">vs bulan lalu</span>
          </div>
        )}
      </div>
    </div>
  );
}
