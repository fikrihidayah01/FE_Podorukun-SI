import { createElement, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { PiArrowLeft } from 'react-icons/pi';
import menuConfig from '../../config/menuConfig';
import { accentFor } from '../../config/theme';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
  tabs?: ReactNode;
}

const ICONS: { path: string; icon: IconType }[] = Object.values(menuConfig)
  .flatMap((groups) => groups.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])])))
  .map((i) => ({ path: i.path, icon: i.icon }));

function iconFor(path: string) {
  return ICONS.filter((i) => path.startsWith(i.path)).sort((a, b) => b.path.length - a.path.length)[0]?.icon;
}

export default function PageHeader({ title, description, status, back, actions, tabs }: PageHeaderProps) {
  const { pathname } = useLocation();
  const accent = accentFor(pathname);
  const Icon = iconFor(pathname);

  return (
    <header className="relative w-full pb-2 pt-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        {back && (
          <Link to={back.to} className="mb-4 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-ink-3 hover:text-ink transition-colors">
            <PiArrowLeft className="h-4 w-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <div className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${tabs ? 'pb-4' : 'pb-2'}`}>
          <div className="flex min-w-0 items-center gap-4">
            {Icon && (
              <span
                className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm sm:flex"
                style={{ backgroundColor: accent }}
              >
                {createElement(Icon, { className: 'h-6 w-6', 'aria-hidden': true })}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
                {status}
              </div>
              {description && <p className="mt-1.5 text-sm font-medium text-ink-3">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        {tabs}
      </div>
    </header>
  );
}

export function PageBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full space-y-6 px-4 py-4 sm:px-6 lg:space-y-8 lg:px-8 lg:py-6 ${className}`}>
      {children}
    </div>
  );
}
