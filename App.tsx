
import React, { useState, useEffect } from 'react';
import {
  Box,
  History,
  TrendingUp,
  Settings,
  Plus,
  Layers,
  Menu,
  Sparkles,
  Play,
  User as UserIcon
} from 'lucide-react';
import { AuthInterface } from './components/AuthInterface';
import { Workspace } from './components/Workspace';
import { TakerInterface } from './components/taker/TakerInterface';
import { HistoryInterface } from './components/HistoryInterface';
import { TestSeriesInterface } from './components/TestSeriesInterface';
import { ProgressInterface } from './components/ProgressInterface';
import { TestAnalysis } from './components/taker/TestAnalysis';
import { Sidebar } from './components/Sidebar';
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
          <div className="p-8 w-full max-w-[1920px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/50 p-10 min-h-[300px] flex flex-col justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,#27272a_0%,transparent_50%)] opacity-50" />
              <div className="relative z-10 space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/10 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Operational
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                  WELCOME BACK, <br />
                  <span className="text-white">{userProfile ? userProfile.fullName.split(' ')[0] : 'COMMANDER'}</span>.
                </h1>
                <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
                  Your neural training hub is active. You have <span className="text-white font-bold">3 pending modules</span> in your queue today.
                </p>
                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setMode('test-series')}
                    className="px-8 py-4 bg-zinc-100 hover:bg-white text-black text-sm font-bold rounded-2xl transition-all shadow-lg shadow-white/5 uppercase tracking-widest active:scale-95 flex items-center gap-2"
                  >
                    <Play size={18} fill="currentColor" />
                    Resume Training
                  </button>
                  <button className="px-8 py-4 bg-zinc-900/50 hover:bg-zinc-800 text-white text-sm font-bold rounded-2xl border border-white/10 transition-all uppercase tracking-widest flex items-center gap-2">
                    Full Report
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid - Placeholder for Bento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Global Rank', value: '#42', sub: 'Top 5%', color: 'from-amber-500/20 to-amber-900/0', border: 'border-amber-500/20', text: 'text-amber-500' },
                { label: 'Accuracy', value: '87.5%', sub: '+2.4% this week', color: 'from-emerald-500/20 to-emerald-900/0', border: 'border-emerald-500/20', text: 'text-emerald-500' },
                { label: 'Time Spent', value: '12h 40m', sub: 'Session Active', color: 'from-blue-500/20 to-blue-900/0', border: 'border-blue-500/20', text: 'text-blue-500' },
                { label: 'Modules', value: '14/20', sub: 'On Track', color: 'from-purple-500/20 to-purple-900/0', border: 'border-purple-500/20', text: 'text-purple-500' }
              ].map((stat, i) => (
                <div key={i} className={`p-6 rounded-3xl bg-zinc-900/40 border ${stat.border} relative overflow-hidden group hover:bg-zinc-900/60 transition-colors`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</h3>
                    <div className={`text-3xl font-mono font-bold ${stat.text}`}>{stat.value}</div>
                    <div className="text-[10px] text-zinc-600 font-bold mt-2 uppercase">{stat.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      case 'settings':
        // Placeholder for settings if needed, for now just show profile info or logout
        return (
          <main className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <h2 className="text-2xl font-bold uppercase tracking-widest font-mono">Profile Settings</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 uppercase text-xs font-bold">Email</span>
                  <span className="font-mono">{userProfile?.email}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 uppercase text-xs font-bold">Full Name</span>
                  <span>{userProfile?.fullName}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 uppercase text-xs font-bold">Target Exam</span>
                  <span className="text-emerald-500 font-bold">{userProfile?.targetExam}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('supabase_token');
                  setUserProfile(null);
                  setMode('dashboard');
                }}
                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all"
              >
                Sign Out / Terminate Session
              </button>
            </div>
          </main>
        );
      default:
        return null;
    }
  };

  return (
              <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-black shadow-lg">
                <Box size={18} strokeWidth={2.5} />
              </div>
              <span className="font-bold tracking-tight text-lg">Q-app</span>
            </div >
          )}
<button
  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
  className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
>
  <Menu size={20} />
</button>
        </div >

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
      </aside >

  {/* Primary content area */ }
{ renderMainContent() }

{/* Global Footer Meta - Stays persistent */ }
<div className="fixed bottom-6 right-8 flex items-center gap-4 text-[10px] font-mono text-zinc-700 uppercase tracking-widest pointer-events-none z-0">
  <span>v2.6.0 STUDIO_ENGINE</span>
  <div className="w-1 h-1 bg-zinc-800 rounded-full" />
  <span>SY_SYNC: {userProfile ? 'ACTIVE_UPLINK' : 'LOCAL_ONLY'}</span>
</div>
    </div >
  );
};

const DashboardCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4 hover:bg-zinc-900 transition-all">
    <div className="text-zinc-500">{icon}</div>
    <div>
      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-bold font-mono text-zinc-100">{value}</div>
    </div>
  </div>
);

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
