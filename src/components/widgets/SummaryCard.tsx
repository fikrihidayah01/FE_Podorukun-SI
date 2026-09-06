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

const COLOR_MAP = {
  indigo: {
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-600',
    text: 'text-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-600',
    text: 'text-emerald-700',
  },
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-600',
    text: 'text-blue-700',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-600',
    text: 'text-purple-700',
  },
  orange: {
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-600',
    text: 'text-orange-700',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-600',
    text: 'text-red-700',
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
  const c = COLOR_MAP[color];

  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}

          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.direction === 'up'
                    ? 'text-emerald-600'
                    : trend.direction === 'down'
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}
              >
                {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'}{' '}
                {trend.value}
              </span>
              <span className="text-xs text-gray-400">vs bulan lalu</span>
            </div>
          )}
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className={`mt-4 h-1 w-full rounded-full ${c.bg}`}>
        <div className={`h-1 w-1/2 rounded-full ${c.iconBg} opacity-60`} />
      </div>
    </div>
  );
}
