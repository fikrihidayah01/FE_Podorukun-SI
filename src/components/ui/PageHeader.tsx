import { createElement, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { PiArrowLeft } from 'react-icons/pi';
import menuConfig from '../../config/menuConfig';
import { accentFor, tint } from '../../config/theme';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
  tabs?: ReactNode;
}

// Ikon modul diambil dari menu, supaya header dan sidebar selalu memakai simbol yang sama
const ICONS: { path: string; icon: IconType }[] = Object.values(menuConfig).flatMap((groups) =>
  groups.flatMap((g) =>
    g.items.flatMap((i) => [
      { path: i.path, icon: i.icon },
      ...(i.children ?? []).map((c) => ({ path: c.path, icon: c.icon ?? i.icon })),
    ]),
  ),
);

function iconFor(path: string) {
  return ICONS.filter((i) => path.startsWith(i.path)).sort((a, b) => b.path.length - a.path.length)[0]?.icon;
}

export default function PageHeader({ title, description, status, back, actions, tabs }: PageHeaderProps) {
  const { pathname } = useLocation();
  const accent = accentFor(pathname);
  const Icon = iconFor(pathname);

  return (
    <header
      className="relative border-b border-line bg-surface"
      style={{ backgroundImage: `linear-gradient(180deg, ${tint(accent, 9)} 0%, #f0eff4 85%)` }}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} aria-hidden />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7">
        {back && (
          <Link to={back.to} className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-3 hover:text-ink">
            <PiArrowLeft className="h-4 w-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <div className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${tabs ? 'pb-4' : 'pb-5 lg:pb-6'}`}>
          <div className="flex min-w-0 items-center gap-3.5">
            {Icon && (
              <span
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm sm:flex"
                style={{ backgroundColor: accent }}
              >
                {createElement(Icon, { className: 'h-6 w-6', 'aria-hidden': true })}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h1 className="text-[1.375rem] font-bold leading-tight tracking-[-0.01em] text-ink sm:text-2xl">{title}</h1>
                {status}
              </div>
              {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {tabs}
      </div>
    </header>
  );
}

export function PageBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 lg:space-y-6 lg:px-8 lg:py-7 ${className}`}>
      {children}
    </div>
  );
}
