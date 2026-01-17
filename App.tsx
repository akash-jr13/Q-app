
import React, { useState, useEffect } from 'react';
import { HomeDashboard } from './components/HomeDashboard';
import { AuthInterface } from './components/AuthInterface';
import { Workspace } from './components/Workspace';
import { TakerInterface } from './components/taker/TakerInterface';
import { HistoryInterface } from './components/HistoryInterface';
import { TestSeriesInterface } from './components/TestSeriesInterface';
import { ProgressInterface } from './components/ProgressInterface';
import { TestAnalysis } from './components/taker/TestAnalysis';
import { Sidebar } from './components/Sidebar';
import { NeuralAuditInterface } from './components/NeuralAuditInterface';
import { CanvasInterface } from './components/CanvasInterface';
import { CloudService, UserProfile } from './utils/cloud';
import { AppMode, WorkspaceState } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('home');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeWorkspace] = useState<WorkspaceState | null>(null);
  const [preloadedPackage, setPreloadedPackage] = useState<{ name: string, data: string } | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Sub-modes for nested navigation
  const [practiceSubMode, setPracticeSubMode] = useState<'list' | 'taker'>('list');
  const [analysisSubMode, setAnalysisSubMode] = useState<'dashboard' | 'history' | 'report' | 'neural'>('dashboard');

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
    setPracticeSubMode('taker');
    setMode('practice');
  };

  // Content rendering switch
  const renderMainContent = () => {
    switch (mode) {
      case 'home':
        return <HomeDashboard onResume={() => setMode('practice')} />;
      case 'study':
        return <Workspace state={activeWorkspace || { id: 'default', name: 'JEE Prep', lastModified: new Date().toISOString(), elements: [] }} onExit={() => setMode('home')} />;
      case 'practice':
        if (practiceSubMode === 'taker') {
          return <TakerInterface onExit={() => setPracticeSubMode('list')} initialPackage={preloadedPackage} />;
        }
        return <TestSeriesInterface onExit={() => setMode('home')} onStartTest={handleStartTest} />;
      case 'analysis':
        if (analysisSubMode === 'report') {
          return <TestAnalysis
            testName={analysisData?.testName || "No Analysis"}
            questions={analysisData?.questions || []}
            answers={analysisData?.answers || {}}
            questionTimes={analysisData?.questionTimes || {}}
            onExit={() => setAnalysisSubMode('dashboard')}
          />;
        }
        if (analysisSubMode === 'history') {
          return <HistoryInterface onExit={() => setAnalysisSubMode('dashboard')} onAnalyze={(data) => { setAnalysisData(data); setAnalysisSubMode('report'); }} />;
        }
        if (analysisSubMode === 'neural') {
          return <NeuralAuditInterface onExit={() => setAnalysisSubMode('dashboard')} />;
        }
        return (
          <div className="p-1 w-full h-full overflow-hidden flex flex-col">
            <div className="p-12 pb-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-medium tracking-tight">Performance Intelligence</h2>
              <div className="flex gap-2">
                <button onClick={() => setAnalysisSubMode('history')} className="px-4 py-2 bg-[#1e1e1e] rounded-lg text-sm text-[#9aa0a6] hover:text-[#e8eaed] transition-colors">History</button>
                <button onClick={() => setAnalysisSubMode('neural')} className="px-4 py-2 bg-[#1e1e1e] rounded-lg text-sm text-[#9aa0a6] hover:text-[#e8eaed] transition-colors">Audit</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProgressInterface onExit={() => setMode('home')} onAudit={() => setAnalysisSubMode('neural')} />
            </div>
          </div>
        );
      case 'tools':
        return <div className="h-screen w-full relative bg-[#000000]">
          <CanvasInterface onExit={() => setMode('home')} />
        </div>;
      case 'auth':
        return <AuthInterface onAuthSuccess={(p) => { setUserProfile(p); setMode('home'); }} onExit={() => setMode('home')} />;
      case 'settings':
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
                  setMode('auth');
                }}
                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all"
              >
                Sign Out / Terminate Session
              </button>
            </div>
          </main>
        );
      default:
        // Default to dashboard or error state
        return null;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#000000] text-[#e8eaed] font-sans selection:bg-[#3c4043] selection:text-white overflow-hidden">
      {/* Sidebar - Conditional */}
      {!['auth', 'taker', 'study'].includes(mode) && (
        <Sidebar
          activeMode={mode}
          setMode={setMode}
          userProfile={userProfile}
          onLogout={() => {
            localStorage.removeItem('supabase_token');
            setUserProfile(null);
            setMode('auth');
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden h-screen bg-[#000000]">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default App;
