import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

interface EmptyStateProps {
  icon?: IconType;
  title: string;
  /** Kenapa kosong, dan apa yang mengisinya. */
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-start gap-3 sm:items-center sm:text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      {Icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-soft text-ink-3">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      <div className="max-w-md">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm leading-relaxed text-ink-3">{description}</p>}
      </div>
      {action}
    </div>
  );
}
