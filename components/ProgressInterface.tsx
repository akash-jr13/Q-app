
import React, { useState, useEffect, useMemo } from 'react';
import { Home, TrendingUp, Activity, Calendar, Award, ChevronUp, ChevronRight, BrainCircuit, BarChart2, Zap, Flame, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { TestHistoryItem } from '../types';
import { dbStore } from '../utils/db';
import { CloudService } from '../utils/cloud';

interface ProgressInterfaceProps {
  onExit: () => void;
  onAudit: () => void;
}

export const ProgressInterface: React.FC<ProgressInterfaceProps> = ({ onExit, onAudit }) => {
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. Load Local
        const localData = await dbStore.getAll<TestHistoryItem>('history');
        let combined: TestHistoryItem[] = localData || [];

        // 2. Load Cloud if logged in
        const token = localStorage.getItem('supabase_token');
        if (token && CloudService.isConfigured()) {
          const profile = await CloudService.getProfile(token);
          if (profile) {
            const cloudAttempts = await CloudService.getAttempts(profile.id);
            cloudAttempts.forEach((ca: any) => {
              const exists = combined.some(l =>
                l.testName === ca.test_name &&
                Math.abs(new Date(l.timestamp).getTime() - new Date(ca.timestamp).getTime()) < 5000
              );
              if (!exists) {
                combined.push({
                  id: `cloud-${ca.id}`,
                  testName: ca.test_name,
                  timestamp: ca.timestamp,
                  score: ca.score,
                  totalMarks: 100,
                  percentage: ca.score.toString(),
                  accuracy: ca.accuracy,
                  timeTaken: 0,
                  totalQuestions: 0,
                  attempted: 0,
                  correct: 0,
                  incorrect: 0
                });
              }
            });
          }
        }

        setHistory(combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      } catch (e) {
        console.error("Failed to load history data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const scores = history.map(h => h.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const avgAccuracy = history.reduce((a, b) => a + b.accuracy, 0) / history.length;

    // Velocity calculation (simple trend)
    const latestScore = scores[scores.length - 1];
    const prevScore = scores[scores.length - 2] || latestScore;
    const velocity = latestScore - prevScore;

    const totalTime = history.reduce((a, b) => a + b.timeTaken, 0);

    return {
      avgScore: avgScore.toFixed(1),
      bestScore: bestScore.toFixed(1),
      avgAccuracy: Math.round(avgAccuracy),
      velocity: velocity.toFixed(1),
      totalTests: history.length,
      totalTime: Math.round(totalTime / 3600), // hours
      streak: 5 // Placeholder for now
    };
  }, [history]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
        <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Aggregating Neural Data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans p-6 md:p-10 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 z-10 relative">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-all shadow-lg active:scale-95">
            <Home size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase font-mono text-zinc-100 flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-500" />
              Q-Progress
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Neural Growth Visualization</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2 shadow-inner">
            <Flame size={16} className="text-orange-500" fill="currentColor" />
            <span className="text-xs font-bold font-mono">5 DAY STREAK</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8 z-10 relative animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* KPI Row - Refined dark theme cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Accuracy Index</span>
            <div className="flex items-end justify-between">
              <div className="text-5xl font-black tracking-tighter text-emerald-400 font-mono">{stats?.avgAccuracy || 0}%</div>
              <div className="text-[10px] text-zinc-600 font-bold uppercase mb-2">Target: 95%</div>
            </div>
            <div className="h-1.5 w-full bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
              <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${stats?.avgAccuracy || 0}%` }} />
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Current Velocity</span>
            <div className="flex items-end justify-between">
              <div className="text-5xl font-black tracking-tighter text-amber-500 font-mono">
                {parseFloat(stats?.velocity || '0') >= 0 ? '+' : ''}{stats?.velocity || '0.0'}
              </div>
              <ChevronUp size={28} className={`${parseFloat(stats?.velocity || '0') >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <span className="text-[10px] text-zinc-600 font-bold uppercase block">Pts variance vs last session</span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Personal Best</span>
            <div className="text-5xl font-black tracking-tighter text-zinc-100 font-mono">{stats?.bestScore || '0.0'}</div>
            <span className="text-[10px] text-zinc-600 font-bold uppercase block flex items-center gap-2">
              <Award size={12} className="text-amber-500" /> TOP PERCENTILE BRACKET
            </span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Neural Active Labs</span>
            <div className="text-5xl font-black tracking-tighter text-zinc-100 font-mono">{stats?.totalTests || '0'}</div>
            <span className="text-[10px] text-zinc-600 font-bold uppercase block flex items-center gap-2">
              <Clock size={12} className="text-blue-500" /> {stats?.totalTime || 0} Hours Invested
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Chart Container */}
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-950 rounded-xl text-zinc-300 border border-zinc-800">
                  <BarChart2 size={16} />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Score Trajectory</h3>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-[9px] font-bold uppercase text-zinc-500">Last 10 Sessions</span>
              </div>
            </div>

            <div className="flex-1 min-h-[280px] flex items-end justify-around px-4 pb-2 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
                <div className="w-full h-px bg-zinc-800" />
                <div className="w-full h-px bg-zinc-800" />
                <div className="w-full h-px bg-zinc-800" />
                <div className="w-full h-px bg-zinc-800" />
              </div>

              {history.length > 0 ? (
                history.slice(-10).map((h) => (
                  <div key={h.id} className="group relative flex flex-col items-center gap-3 flex-1 max-w-[60px]">
                    <div
                      className="w-full max-w-[32px] bg-gradient-to-t from-zinc-800 to-zinc-500/50 border-x border-t border-zinc-700/50 hover:from-amber-600 hover:to-amber-400 transition-all rounded-t-lg cursor-help relative group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      style={{ height: `${Math.max(20, (h.score / (h.totalMarks || 1)) * 240)}px` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-zinc-100 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap shadow-xl z-20">
                        {h.score} Pts
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                      {new Date(h.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 gap-4">
                  <Activity size={48} className="opacity-20" />
                  <p className="text-xs font-mono uppercase tracking-[0.2em]">Inadequate Neural Samples</p>
                </div>
              )}
            </div>
          </div>

          {/* Mastery Matrix Container */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-950 rounded-xl text-zinc-300 border border-zinc-800">
                <BrainCircuit size={16} />
              </div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Mastery Matrix</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={10} className="text-blue-500" fill="currentColor" /> Physics Core
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-100">72%</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden">
                  <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: '72%' }} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={10} className="text-emerald-500" fill="currentColor" /> Chemistry Core
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-100">88%</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden">
                  <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: '88%' }} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={10} className="text-purple-500" fill="currentColor" /> Mathematics Core
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-100">64%</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden">
                  <div className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" style={{ width: '64%' }} />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/50">
                <div className="flex items-center gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                  <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Learning Equilibrium</span>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">Chemistry is driving your current rank. Stabilize Mathematics to break the next bracket.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-900 gap-4">
          <div className="flex items-center gap-3 text-zinc-600">
            <Calendar size={14} />
            <span className="text-[10px] font-mono uppercase tracking-widest">Last Synced: {new Date().toLocaleTimeString()}</span>
          </div>
          <button
            onClick={onAudit}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-colors group px-6 py-3 border border-zinc-800 rounded-2xl hover:border-zinc-500"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">Detailed Neural Audit</span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>
    </div>
  );
};
