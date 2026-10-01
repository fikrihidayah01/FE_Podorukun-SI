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
    <div className={`w-full overflow-x-auto py-1.5 ${className}`}>
      <nav
        className="w-full flex items-center gap-1.5 rounded-full bg-white/65 backdrop-blur-xl p-2 border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_20px_rgba(0,0,0,0.05)] min-w-[620px] md:min-w-0"
        aria-label="Tabs"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center text-center rounded-full py-3 px-3 text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_12px_rgba(79,70,229,0.35)]'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/60 font-medium'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
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
