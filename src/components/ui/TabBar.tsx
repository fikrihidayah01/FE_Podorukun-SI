import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { accentFor } from '../../config/theme';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  /** Dipakai untuk mengaitkan tab dengan panelnya (aria-controls). */
  idPrefix: string;
  label: string;
  className?: string;
}

/**
 * Tab bergaris bawah yang menempel di dasar PageHeader.
 * Panah kiri/kanan, Home, dan End berpindah tab sesuai pola WAI-ARIA tabs.
 */
export default function TabBar({ tabs, activeTab, onTabChange, idPrefix, label, className = '' }: TabBarProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const accent = accentFor(useLocation().pathname);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onTabChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div
      className={`-mx-4 overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <div role="tablist" aria-label={label} className="flex min-w-max gap-1">
        {tabs.map((tab, i) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${idPrefix}-tab-${tab.key}`}
              aria-selected={active}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabChange(tab.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              style={active ? { borderColor: accent } : undefined}
              className={`relative flex h-11 items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 px-3 text-sm transition-colors focus-visible:outline-offset-[-2px] ${
                active
                  ? 'font-semibold text-ink'
                  : 'border-transparent font-medium text-ink-3 hover:border-line-strong/50 hover:text-ink'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`rounded-md px-1.5 text-xs font-semibold tabular-nums ${
                    active ? 'bg-brand-50 text-brand-700' : 'bg-neutral-soft text-ink-3'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({ idPrefix, activeTab, children }: { idPrefix: string; activeTab: string; children: ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel`}
      aria-labelledby={`${idPrefix}-tab-${activeTab}`}
      className="space-y-5 lg:space-y-6"
    >
      {children}
    </div>
  );
}
