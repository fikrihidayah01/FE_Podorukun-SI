import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PiArrowLeft } from 'react-icons/pi';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
  tabs?: ReactNode;
}

export default function PageHeader({ title, description, status, back, actions, tabs }: PageHeaderProps) {
  return (
    <header
      className="relative bg-surface"
      style={{ backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #f4f6f8 90%)' }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[#cf1b1a]" aria-hidden />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7">
        {back && (
          <Link to={back.to} className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-3 hover:text-ink">
            <PiArrowLeft className="h-4 w-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <div className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${tabs ? 'pb-4' : 'pb-5 lg:pb-6'}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 [&_button]:!rounded-lg">
              <h1 className="text-[1.375rem] font-bold leading-tight tracking-[-0.01em] text-ink sm:text-2xl">{title}</h1>
              {status}
            </div>
            {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 [&_button]:!rounded-lg">{actions}</div>}
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
