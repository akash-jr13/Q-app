import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import {
  LayoutDashboard,
  Layers,
  BarChart2,
  PenTool,
  ChevronRight,
  Command,
  Users,
  MonitorPlay,
  Gift,
  Zap,
  Sparkles,
  HelpCircle,
  Book,
  Moon,
  LogOut,
  Settings,
  Inbox
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
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: AppMode; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'lectures', label: 'Lectures', icon: MonitorPlay },
    { id: 'practice', label: 'Practice', icon: Layers },
    { id: 'analysis', label: 'Analysis', icon: BarChart2 },
    { id: 'peer', label: 'Global Connect', icon: Users },
    // Archive hidden for admin access only
    { id: 'workflow', label: 'Workflow', icon: Command },
    { id: 'tools', label: 'Tools', icon: PenTool },
  ];

  return (
    <aside className="w-64 h-screen shrink-0 bg-theme-secondary flex flex-col sticky top-0 z-50 py-6 px-3 border-r border-theme-primary transition-colors">
      {/* Header / Logo */}
      <div className="px-4 mb-8">
        <h1 className="text-theme-primary text-lg font-bold tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 bg-theme-primary rounded-md flex items-center justify-center text-theme-secondary font-black text-xs">U</div>
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
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[14px] transition-all group ${isActive
                ? 'bg-zinc-900 text-white dark:bg-[#2a2a2a] dark:text-[#e8eaed] shadow-md dark:shadow-none'
                : 'text-zinc-500 dark:text-[#9aa0a6] hover:bg-zinc-100 dark:hover:bg-[#1e1e1e] hover:text-zinc-900 dark:hover:text-[#e8eaed]'
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

      <div className="mt-auto px-4 pb-4 space-y-2 pt-4 border-t border-white/5 relative" ref={menuRef}>


        {/* Share Card */}
        <button className="w-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-left p-3 rounded-xl border border-white/5 transition-all group relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <div className="text-[#e8eaed] text-[13px] font-semibold">Share This Site</div>
              <div className="text-[#9aa0a6] text-[11px]">Get 10 credits each</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#9aa0a6] group-hover:text-white transition-colors border border-white/5">
              <Gift size={14} />
            </div>
          </div>
        </button>

        {/* Upgrade Card */}
        <button
          onClick={() => navigate('/subscription')}
          className="w-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-left p-3 rounded-xl border border-white/5 transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-center relative z-10">
            <div>
              <div className="text-[#e8eaed] text-[13px] font-semibold">Upgrade to Pro</div>
              <div className="text-[#9aa0a6] text-[11px]">Unlock more benefits</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#3b435b] flex items-center justify-center text-white border border-white/5">
              <Zap size={14} fill="currentColor" />
            </div>
          </div>
        </button>

        {/* Profile Footer */}
        <div className="pt-2 flex items-center justify-between mt-2 relative">
          {/* Profile Popover Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-[-12px] bg-theme-panel border border-theme-primary rounded-xl w-[260px] shadow-2xl mb-2 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Header */}
              <div className="p-4 border-b border-theme-primary flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {userProfile?.fullName?.[0] || "G"}
                </div>
                <div className="overflow-hidden">
                  <div className="text-theme-primary text-sm font-medium truncate">{userProfile?.fullName || "Guest Agent"}</div>
                  <div className="text-theme-secondary text-xs truncate">{userProfile?.email || "guest@understood.app"}</div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2 space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-zinc-300 hover:bg-white/5 rounded-lg transition-colors">
                  <Sparkles size={16} />
                  <span>Bonuses</span>
                  <span className="ml-auto text-[10px] font-bold bg-[#3b435b] text-[#818cf8] px-1.5 py-0.5 rounded">New</span>
                </button>

                <button
                  onClick={() => { setMode('settings'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-theme-secondary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-theme-secondary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Moon size={16} />
                    <span>Appearance</span>
                  </div>
                  <div className="text-[10px] font-bold text-theme-secondary uppercase bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded transition-colors">{theme}</div>
                </button>

                <button className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-theme-secondary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <HelpCircle size={16} />
                    <span>Support</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-400" />
                </button>

                <button className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-theme-secondary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <Book size={16} />
                    <span>Documentation</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-400" />
                </button>

                <button
                  onClick={() => setMode('peer')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Users size={16} />
                  <span>Community</span>
                </button>
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-white/5">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="group flex items-center gap-2 outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#121212] group-hover:ring-white/20 transition-all">
              {userProfile?.fullName?.[0] || "G"}
            </div>
          </button>

          <button
            onClick={() => setMode('settings')}
            title="Messages"
            className="w-8 h-8 flex items-center justify-center text-[#9aa0a6] hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg bg-[#1e1e1e]"
          >
            <Inbox size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};