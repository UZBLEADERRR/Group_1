import React from 'react';
import { Camera, Layers, GitFork, MessageSquare, Compass } from 'lucide-react';

export type NavTab = 'camera' | 'objects' | 'graph' | 'chat';

interface BottomNavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  objectsCount: number;
}

export function BottomNavbar({ activeTab, onTabChange, objectsCount }: BottomNavbarProps) {
  const tabs = [
    {
      id: 'camera' as NavTab,
      label: 'Kamera',
      icon: Camera,
      badge: null,
    },
    {
      id: 'objects' as NavTab,
      label: 'Obyektlar',
      icon: Layers,
      badge: objectsCount > 0 ? objectsCount : null,
    },
    {
      id: 'graph' as NavTab,
      label: 'Fazoviy Graf',
      icon: GitFork,
      badge: null,
    },
    {
      id: 'chat' as NavTab,
      label: 'AI Savol-Javob',
      icon: MessageSquare,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 safe-area-bottom shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 select-none relative ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== null && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold shadow-md">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
