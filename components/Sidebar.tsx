
import React from 'react';
import {
  Home,
  Layers,
  BarChart2,
  History,
  Settings,
  LogOut,
  Command,
  Sparkles,
  CircuitBoard,
  User,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeMode: string;
  setMode: (mode: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeMode, setMode, userProfile, onLogout }) => {

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'test-series', label: 'Q-Series', icon: Layers },
    { id: 'progress', label: 'Q-Progress', icon: BarChart2 },
    { id: 'history', label: 'Test History', icon: History },
    { id: 'neural-audit', label: 'Neural Audit', icon: CircuitBoard },
  ];

  return (
    <aside className="w-64 h-screen shrink-0 border-r border-white/5 bg-zinc-950/80 backdrop-blur-2xl flex flex-col sticky top-0 z-50">
      {/* Header / Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5 bg-zinc-900/20">
        <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          <Command size={18} strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-zinc-100 font-bold text-sm tracking-widest uppercase font-mono">Q-App</h1>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block -mt-0.5">Creative Command</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="px-2 mb-2">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Main Modules</span>
        </div>
        {navItems.map((item) => {
          const isActive = activeMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 group relative overflow-hidden ${isActive
                  ? 'bg-zinc-100 text-black shadow-lg shadow-white/5'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
                }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-300'} />
              <span className="uppercase tracking-wide">{item.label}</span>
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-black rounded-full shadow-sm" />
              )}
            </button>
          );
        })}

        <div className="px-2 mb-2 mt-8">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">System</span>
        </div>
        <button
          onClick={() => setMode('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${activeMode === 'settings'
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
            }`}
        >
          <Settings size={18} />
          <span className="uppercase tracking-wide">Settings</span>
        </button>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/20">
        <button className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-all group">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700 group-hover:text-zinc-100 transition-colors relative overflow-hidden">
            <User size={16} />
            {userProfile && <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent mix-blend-overlay" />}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-xs font-bold text-zinc-200 truncate">{userProfile?.fullName || 'Guest Agent'}</div>
            <div className="text-[9px] text-zinc-500 font-mono truncate">{userProfile?.email || 'local@qstudio.io'}</div>
          </div>
          <div className="text-zinc-600 group-hover:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); onLogout(); }}>
            <LogOut size={16} />
          </div>
        </button>
      </div>
    </aside>
  );
};