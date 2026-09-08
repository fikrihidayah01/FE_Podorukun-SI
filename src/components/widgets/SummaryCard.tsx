import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'blue' | 'purple' | 'orange' | 'red';
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

const GRADIENT_MAP = {
  indigo: 'from-indigo-500 to-indigo-600',
  emerald: 'from-emerald-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-amber-500 to-amber-600',
  red: 'from-red-500 to-red-600',
};

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
}: SummaryCardProps) {
  const gradient = GRADIENT_MAP[color] || GRADIENT_MAP.indigo;

  return (
    <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-4 md:p-5 flex flex-col justify-between gap-3">
      {/* Nominal & Subtitle Box (White with stroke) */}
      <div className="rounded-xl bg-white border border-gray-200 p-3.5 flex items-stretch justify-start gap-3.5">
        <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shrink-0 px-3.5 py-2.5 shadow-sm min-h-[52px]`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-2xl md:text-3xl font-bold text-gray-900 truncate leading-tight">
            {value}
          </span>
          {subtitle && (
            <p className="text-xs font-medium text-gray-500 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Title & Trend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5 pt-0.5">
        <p className="text-base font-bold text-gray-900">{title}</p>

        {trend && (
          <div className="flex items-center gap-1 shrink-0 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
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
