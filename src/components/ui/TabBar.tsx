interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export default function TabBar({ tabs, activeTab, onTabChange, className = '' }: TabBarProps) {
  return (
    <div className={`overflow-x-auto py-1 ${className}`}>
      <nav
        className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2.5 border border-gray-200/70"
        aria-label="Tabs"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`shrink-0 rounded-full px-5 py-3 text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-gray-900 hover:text-indigo-500 hover:bg-[#C0C0C0]/25 font-medium'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-gray-200/80 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
