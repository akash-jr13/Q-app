
import React, { useState } from 'react';
import { LayoutDashboard, Brain, Zap, Target, Sparkles, ChevronRight, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { Metric, IntelWidget } from './AnalysisShared';

type IntelLayer = 'executive' | 'knowledge' | 'behavior' | 'strategy' | 'actions';

interface IntelligenceTabProps {
  stats: any;
}

export const IntelligenceTab: React.FC<IntelligenceTabProps> = ({ stats }) => {
  const [activeLayer, setActiveLayer] = useState<IntelLayer>('executive');

  return (
    <div className="animate-in fade-in duration-500 flex flex-col md:flex-row gap-8">
      {/* Internal Sidebar */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        {(['executive', 'knowledge', 'behavior', 'strategy', 'actions'] as IntelLayer[]).map(layer => (
          <button
            key={layer}
            onClick={() => setActiveLayer(layer)}
            className={`flex items-center gap-3 p-4 rounded-2xl transition-all border font-mono text-[10px] font-bold uppercase tracking-widest ${activeLayer === layer
              ? 'bg-zinc-100 text-black border-white shadow-xl scale-[1.02]'
              : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
              }`}
          >
            {layer === 'executive' && <LayoutDashboard size={14} />}
            {layer === 'knowledge' && <Brain size={14} />}
            {layer === 'behavior' && <Zap size={14} />}
            {layer === 'strategy' && <Target size={14} />}
            {layer === 'actions' && <Sparkles size={14} />}
            {layer}
          </button>
        ))}
        <div className="mt-8 p-4 border border-dashed border-zinc-800 rounded-2xl text-center">
          <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Logic Engine 2.1 • @AkashJR</span>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 space-y-10">
        <div className="flex justify-between items-end border-b border-zinc-900 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Diagnosis Layer <ChevronRight size={10} /> {activeLayer}</div>
            <h2 className="text-4xl font-bold text-zinc-100 tracking-tight capitalize">{activeLayer} Verdict</h2>
          </div>
          <div className="flex gap-8">
            <Metric label="Knowledge Index" value={`${stats.accuracy}%`} color={stats.accuracy > 70 ? 'text-emerald-500' : 'text-zinc-100'} />
            <Metric label="Strategy Rank" value="B+" color="text-amber-500" />
          </div>
        </div>

        {activeLayer === 'executive' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <IntelWidget title="Synthesis Report" icon={ShieldCheck} className="md:col-span-2">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 shadow-inner">
                  {stats.accuracy < 50 ? <Flame size={32} className="text-red-500 animate-pulse" /> : <ShieldCheck size={32} className="text-emerald-500" />}
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-zinc-300 font-mono leading-relaxed">
                    Your performance is currently <strong className={stats.accuracy < 50 ? 'text-red-400' : 'text-emerald-400'}>{stats.accuracy < 50 ? "Unstable" : "Solid"}</strong>.
                    {stats.accuracy < 50
                      ? " Friction detected in fundamental topics. Immediate theoretical revision required."
                      : " Efficiency is high. Score ceiling is now determined by calculation precision."}
                  </p>
                </div>
              </div>
            </IntelWidget>
          </div>
        )}

        {activeLayer === 'knowledge' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.topicStats.map((s: any) => (
                <div key={s.topic} className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl flex flex-col gap-2 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.topic} Mastery</span>
                  <span className={`text-2xl font-mono font-bold ${s.accuracy > 70 ? 'text-emerald-400' : s.accuracy > 40 ? 'text-amber-400' : 'text-red-400'}`}>{Math.round(s.accuracy)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeLayer === 'actions' && (
          <div className="max-w-3xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-[2rem] flex items-center justify-center text-black shadow-2xl shadow-white/10 mb-6"><Sparkles size={32} fill="currentColor" /></div>
              <h3 className="text-3xl font-bold text-zinc-100 tracking-tight">Your 7-Day Roadmap</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold italic">01</div>
                  <div className="text-left">
                    <h6 className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">Revise {stats.topicStats.sort((a: any, b: any) => a.accuracy - b.accuracy)[0]?.topic} Fundamentals</h6>
                  </div>
                </div>
                <ArrowRight size={20} className="text-zinc-800 group-hover:text-emerald-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
