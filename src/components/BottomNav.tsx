import { Home, PlusCircle, PieChart, Repeat, Settings } from 'lucide-react';
import type { Language, Theme } from '../types';
import { t } from '../i18n';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  language?: Language;
  theme?: Theme;
}

export default function BottomNav({ activeTab, onTabChange, language = 'zh', theme = 'light' }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: t(language, 'dashboardTab') },
    { id: 'add', icon: PlusCircle, label: t(language, 'addTab') },
    { id: 'recurring', icon: Repeat, label: t(language, 'recurringTab') },
    { id: 'analysis', icon: PieChart, label: t(language, 'analysisTab') },
    { id: 'settings', icon: Settings, label: t(language, 'settingsTab') },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`absolute bottom-0 w-full backdrop-blur-md border-t pb-safe transition-colors z-40 ${
      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white/80 border-gray-200 text-gray-400'
    }`}>
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors px-1 ${
                isActive 
                  ? 'text-blue-500 font-bold' 
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} className={isActive ? 'fill-blue-50 stroke-blue-500' : ''} />
              <span className="text-[9px] tracking-tight truncate w-full text-center">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
