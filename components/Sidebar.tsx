
import React from 'react';
import {
  LayoutDashboard,
  Layers,
  BarChart2,
  Settings,
  LogOut,
  User,
  Book,
  PenTool,
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '../utils/cloud';
import { AppMode } from '../types';

interface SidebarProps {
  activeMode: AppMode;
  setMode: (mode: AppMode) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeMode, setMode, userProfile, onLogout }) => {

  const navItems: { id: AppMode; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'study', label: 'Study', icon: Book },
    { id: 'practice', label: 'Practice', icon: Layers },
    { id: 'analysis', label: 'Analysis', icon: BarChart2 },
    { id: 'tools', label: 'Tools', icon: PenTool },
  ];

  return (
    <aside className="w-64 h-screen shrink-0 bg-[#121212] flex flex-col sticky top-0 z-50 py-6 px-3 border-r border-white/5">
      {/* Header / Logo */}
      <div className="px-4 mb-8">
        <h1 className="text-white text-lg font-bold tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-[#121212] font-black text-xs">U</div>
          UNDERSTOOD
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = activeMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[14px] transition-colors group ${isActive
                ? 'bg-[#2a2a2a] text-[#e8eaed]'
                : 'text-[#9aa0a6] hover:bg-[#1e1e1e] hover:text-[#e8eaed]'
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </div>
              {item.id !== 'home' && (
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto space-y-1 pt-4 border-t border-white/5">
        <button
          onClick={() => setMode('settings')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] transition-colors ${activeMode === 'settings'
            ? 'bg-[#2a2a2a] text-[#e8eaed]'
            : 'text-[#9aa0a6] hover:bg-[#1e1e1e] hover:text-[#e8eaed]'
            }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] text-[#9aa0a6] hover:bg-[#1e1e1e] hover:text-[#e8eaed] transition-colors group"
        >
          <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] overflow-hidden">
            {userProfile?.fullName?.[0] || <User size={12} />}
          </div>
          <span className="truncate flex-1 text-left">{userProfile?.email || 'Guest Agent'}</span>
          <LogOut size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400" />
        </button>
      </div>
    </aside>
  );
};