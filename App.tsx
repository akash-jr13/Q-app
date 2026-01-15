
import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Settings,
  User as UserIcon,
  History,
  Box,
  Layers,
  Menu,
  Play,
  TrendingUp,
  Sparkles,
  Search,
  Command,
  Plus
} from 'lucide-react';
import { AuthInterface } from './components/AuthInterface';
import { Workspace } from './components/Workspace';
import { TakerInterface } from './components/taker/TakerInterface';
import { HistoryInterface } from './components/HistoryInterface';
import { TestSeriesInterface } from './components/TestSeriesInterface';
import { ProgressInterface } from './components/ProgressInterface';
import { TestAnalysis } from './components/taker/TestAnalysis';
import { NeuralAuditInterface } from './components/NeuralAuditInterface';
import { CloudService, UserProfile } from './utils/cloud';
import { AppMode, WorkspaceState } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceState | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [preloadedPackage, setPreloadedPackage] = useState<{ name: string, data: string } | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Auto-Auth Restore
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('supabase_token');
      if (token) {
        try {
          const profile = await CloudService.getProfile(token);
          if (profile) setUserProfile(profile);
        } catch (e) {
          localStorage.removeItem('supabase_token');
        }
      }
      setIsAuthLoading(false);
    };
    initAuth();
  }, []);

  const handleStartTest = (name: string, data: string) => {
    setPreloadedPackage({ name, data });
    setMode('taker');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-zinc-800 border-t-zinc-200 rounded-full animate-spin" />
      </div>
    );
  }

  // Content rendering switch
  const renderMainContent = () => {
    switch (mode) {
      case 'dashboard':
        return (
          <main className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center">
            {/* Blank Canvas Area as requested */}
            <div className="flex flex-col items-center justify-center gap-6 opacity-20 pointer-events-none select-none">
              <Command size={64} className="text-zinc-500" />
              <span className="text-xs font-mono font-bold uppercase tracking-[0.5em] text-zinc-500">
                Q-app Initiated
              </span>
            </div>
          </main>
        );
      case 'workspace':
        return activeWorkspace ? <Workspace state={activeWorkspace} onExit={() => setMode('dashboard')} /> : null;
      case 'taker':
        return <TakerInterface onExit={() => setMode('dashboard')} initialPackage={preloadedPackage} />;
      case 'history':
        return <HistoryInterface onExit={() => setMode('dashboard')} onAnalyze={(data) => { setAnalysisData(data); setMode('analysis'); }} />;
      case 'test-series':
        return <TestSeriesInterface onExit={() => setMode('dashboard')} onStartTest={handleStartTest} />;
      case 'progress':
        return <ProgressInterface onExit={() => setMode('dashboard')} onAudit={() => setMode('neural-audit')} />;
      case 'neural-audit':
        return <NeuralAuditInterface onExit={() => setMode('progress')} />;
      case 'analysis':
        return <TestAnalysis
          testName={analysisData?.testName || "No Analysis"}
          questions={analysisData?.questions || []}
          answers={analysisData?.answers || {}}
          questionTimes={analysisData?.questionTimes || {}}
          onExit={() => setMode('dashboard')}
        />;
      case 'auth':
        return <AuthInterface onAuthSuccess={(p) => { setUserProfile(p); setMode('dashboard'); }} onExit={() => setMode('dashboard')} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] font-sans flex overflow-hidden">
      {/* Background Mesh - Constant across canvas */}
      <div className="fixed inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-40" />

      {/* Sidebar - Matching AI Studio Style, listing specialized options */}
      <aside className={`${isSidebarExpanded ? 'w-64' : 'w-16'} border-r border-zinc-900 bg-[#09090b] flex flex-col transition-all duration-300 z-50 shrink-0`}>
        <div className="h-16 flex items-center px-4 justify-between border-b border-zinc-900/50">
          {isSidebarExpanded && (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode('dashboard')}>
              <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-black shadow-lg">
                <Box size={18} strokeWidth={2.5} />
              </div>
              <span className="font-bold tracking-tight text-lg">Q-app</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-2 space-y-8">
          {/* Navigation Group - available options as requested */}
          <div className="space-y-1">
            <NavItem
              icon={<Play size={18} />}
              label="Q-Taker"
              onClick={() => { setPreloadedPackage(null); setMode('taker'); }}
              active={mode === 'taker'}
              expanded={isSidebarExpanded}
            />
            <NavItem
              icon={<Layers size={18} />}
              label="Q-Series"
              onClick={() => setMode('test-series')}
              active={mode === 'test-series'}
              expanded={isSidebarExpanded}
            />
            <NavItem
              icon={<TrendingUp size={18} />}
              label="Q-Progress"
              onClick={() => setMode('progress')}
              active={mode === 'progress'}
              expanded={isSidebarExpanded}
            />
            <NavItem
              icon={<History size={18} />}
              label="Q-History"
              onClick={() => setMode('history')}
              active={mode === 'history'}
              expanded={isSidebarExpanded}
            />
          </div>

          {/* Admin Tools - hidden in sidebar if not needed, but keeping for completeness */}
          {isSidebarExpanded && (
            <div className="space-y-4 px-3 pt-4 border-t border-zinc-900/50">
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Workspace</h3>
              <NavItem
                icon={<Plus size={18} />}
                label="New Project"
                onClick={() => {
                  const newWs: WorkspaceState = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: "Untitled Project",
                    lastModified: new Date().toISOString(),
                    elements: []
                  };
                  setActiveWorkspace(newWs);
                  setMode('workspace');
                }}
                expanded={isSidebarExpanded}
              />
            </div>
          )}
        </div>

        <div className="p-2 border-t border-zinc-900 space-y-1">
          <NavItem icon={<Sparkles size={18} />} label="Upgrade Plan" expanded={isSidebarExpanded} />
          <NavItem
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => setMode('settings')}
            active={mode === 'settings'}
            expanded={isSidebarExpanded}
          />
          <div
            onClick={() => setMode('auth')}
            className="p-2 flex items-center gap-3 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold shrink-0 border border-zinc-700/50">
              {userProfile ? userProfile.fullName.charAt(0) : 'G'}
            </div>
            {isSidebarExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate">{userProfile ? userProfile.fullName : 'Guest Agent'}</span>
                <span className="text-[10px] text-zinc-500 truncate">{userProfile ? userProfile.email : 'local@qstudio.io'}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Primary content area */}
      {renderMainContent()}

      {/* Global Footer Meta - Stays persistent */}
      <div className="fixed bottom-6 right-8 flex items-center gap-4 text-[10px] font-mono text-zinc-700 uppercase tracking-widest pointer-events-none z-0">
        <span>v2.6.0 STUDIO_ENGINE</span>
        <div className="w-1 h-1 bg-zinc-800 rounded-full" />
        <span>SY_SYNC: {userProfile ? 'ACTIVE_UPLINK' : 'LOCAL_ONLY'}</span>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, onClick, active = false, expanded = true }: { icon: any, label: string, onClick?: () => void, active?: boolean, expanded: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${active ? 'bg-zinc-900 text-zinc-100 shadow-inner ring-1 ring-white/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
  >
    <div className="shrink-0">{icon}</div>
    {expanded && <span className="text-sm font-medium">{label}</span>}
  </button>
);

export default App;
