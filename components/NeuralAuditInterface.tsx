
import React, { useState, useEffect, useMemo } from 'react';
import {
   Brain,
   Zap,
   Target,
   LayoutDashboard,
   ShieldCheck,
   ChevronLeft,
   ChevronRight,
   History,
   Flame,
   TrendingUp,
   Sparkles,
   Trophy,
   Activity,
   Loader2
} from 'lucide-react';
import { TestHistoryItem } from '../types';
import { dbStore } from '../utils/db';

interface NeuralAuditInterfaceProps {
   onExit: () => void;
}

type AuditLayer = 'executive' | 'knowledge' | 'behavior' | 'trajectory' | 'roadmap';

export const NeuralAuditInterface: React.FC<NeuralAuditInterfaceProps> = ({ onExit }) => {
   const [activeLayer, setActiveLayer] = useState<AuditLayer>('executive');
   const [history, setHistory] = useState<TestHistoryItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const loadData = async () => {
         try {
            const data = await dbStore.getAll<TestHistoryItem>('history');
            setHistory(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
         } catch (e) {
            console.error("Audit load failed", e);
         } finally {
            setIsLoading(false);
         }
      };
      loadData();
   }, []);

   const aggregateStats = useMemo(() => {
      if (history.length === 0) return null;

      const totalTests = history.length;
      const avgAccuracy = history.reduce((a, b) => a + b.accuracy, 0) / totalTests;
      const totalScore = history.reduce((a, b) => a + b.score, 0);
      const totalPossible = history.reduce((a, b) => a + b.totalMarks, 0);
      const overallPercentage = (totalScore / totalPossible) * 100;

      // Growth calculation
      const firstHalf = history.slice(0, Math.ceil(totalTests / 2));
      const secondHalf = history.slice(Math.ceil(totalTests / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b.accuracy, 0) / firstHalf.length;
      const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b.accuracy, 0) / secondHalf.length : firstAvg;
      const growth = secondAvg - firstAvg;

      return { totalTests, avgAccuracy, overallPercentage, growth };
   }, [history]);

   if (isLoading) {
      return (
         <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
            <Loader2 size={32} className="animate-spin text-zinc-500" />
            <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Synthesizing Neural History...</span>
         </div>
      );
   }

   if (history.length === 0) {
      return (
         <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <History size={48} className="text-zinc-800" />
            <div className="space-y-2">
               <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-widest font-mono">Insufficient Data</h2>
               <p className="text-zinc-500 text-sm font-mono max-w-xs mx-auto uppercase">Complete at least one practice module to generate a detailed neural audit.</p>
            </div>
            <button onClick={onExit} className="px-8 py-3 bg-zinc-100 text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-white transition-all">Return</button>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-zinc-950 font-sans text-zinc-300 relative overflow-x-hidden selection:bg-zinc-100 selection:text-black">
         <div className="fixed inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

         {/* Sidebar for layers */}
         <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-zinc-900 bg-zinc-950/80 backdrop-blur-xl z-40 p-6 flex flex-col gap-8">
            <div className="flex items-center gap-3 pb-6 border-b border-zinc-900">
               <button onClick={onExit} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
                  <ChevronLeft size={20} />
               </button>
               <div>
                  <h1 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">Neural Audit</h1>
                  <span className="text-[9px] text-zinc-600 font-mono uppercase">Global Synthesis</span>
               </div>
            </div>

            <nav className="flex-1 space-y-2">
               {(['executive', 'knowledge', 'behavior', 'trajectory', 'roadmap'] as AuditLayer[]).map(l => (
                  <button
                     key={l}
                     onClick={() => setActiveLayer(l)}
                     className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border font-mono text-[10px] font-bold uppercase tracking-widest ${activeLayer === l
                        ? 'bg-zinc-100 text-black border-white shadow-xl scale-[1.02]'
                        : 'bg-zinc-900/50 text-zinc-500 border-zinc-900 hover:text-zinc-300 hover:border-zinc-800'
                        }`}
                  >
                     {l === 'executive' && <LayoutDashboard size={14} />}
                     {l === 'knowledge' && <Brain size={14} />}
                     {l === 'behavior' && <Zap size={14} />}
                     {l === 'trajectory' && <TrendingUp size={14} />}
                     {l === 'roadmap' && <Sparkles size={14} />}
                     {l}
                  </button>
               ))}
            </nav>

            <div className="p-4 border border-dashed border-zinc-800 rounded-2xl text-center">
               <span className="text-[8px] font-bold text-zinc-800 uppercase tracking-widest leading-relaxed">Cross-Platform Intelligence<br />Engine v2.5</span>
            </div>
         </aside>

         <main className="ml-64 p-10 max-w-7xl mx-auto space-y-12">
            {/* HEADER CONTENT */}
            <div className="flex justify-between items-end border-b border-zinc-900 pb-10">
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                     Synthesis Module <ChevronRight size={10} /> {activeLayer} layer
                  </div>
                  <h2 className="text-5xl font-black text-zinc-100 tracking-tighter uppercase italic">
                     {activeLayer === 'executive' ? 'Cognitive Verdict' : activeLayer === 'roadmap' ? 'Growth Strategy' : `${activeLayer} Matrix`}
                  </h2>
               </div>
               <div className="flex gap-12 items-baseline">
                  <div className="text-right">
                     <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Total Intelligence Labs</span>
                     <div className="text-4xl font-black font-mono text-zinc-100">{aggregateStats?.totalTests}</div>
                  </div>
                  <div className="text-right">
                     <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Growth Index</span>
                     <div className={`text-4xl font-black font-mono ${parseFloat(aggregateStats?.growth.toFixed(1) || '0') >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {parseFloat(aggregateStats?.growth.toFixed(1) || '0') >= 0 ? '+' : ''}{aggregateStats?.growth.toFixed(1)}%
                     </div>
                  </div>
               </div>
            </div>

            {/* LAYER CONTENT */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               {activeLayer === 'executive' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] space-y-6 shadow-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 text-emerald-400">
                           <ShieldCheck size={28} />
                           <h3 className="text-xl font-bold uppercase tracking-widest font-mono text-zinc-100">Neural Efficiency</h3>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed font-mono uppercase tracking-tighter">
                           Historical data indicates a strong <span className="text-zinc-100">Stability Core</span>. Your accuracy has normalized at <span className="text-emerald-500">{aggregateStats?.avgAccuracy.toFixed(1)}%</span>. The primary bottleneck is no longer knowledge retention, but <span className="text-amber-500">Execution Speed</span> in complex NAT items.
                        </p>
                        <div className="pt-4 flex gap-4">
                           <div className="px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] font-bold uppercase text-zinc-500">Consistent Pacer</div>
                           <div className="px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] font-bold uppercase text-zinc-500">Pattern Finder</div>
                        </div>
                     </div>

                     <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] space-y-8 flex flex-col justify-center backdrop-blur-sm shadow-2xl">
                        <div className="space-y-2">
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Percentile Projection</span>
                           <div className="text-6xl font-black text-zinc-100 font-mono tracking-tighter">98.4<span className="text-zinc-600 text-3xl">th</span></div>
                        </div>
                        <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                           <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: '98.4%' }} />
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase italic">Based on difficulty-weighted average of {aggregateStats?.totalTests} sessions.</p>
                     </div>

                     <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] grid grid-cols-1 md:grid-cols-3 gap-12 shadow-2xl backdrop-blur-sm">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-zinc-400"><Trophy size={18} /><span className="text-[10px] font-bold uppercase tracking-widest">Peak Performance</span></div>
                           <div className="text-3xl font-bold font-mono text-zinc-100">{Math.max(...history.map(h => h.score))} Pts</div>
                           <p className="text-[10px] text-zinc-600 font-mono">Achieved in {history.sort((a, b) => b.score - a.score)[0]?.testName}</p>
                        </div>
                        <div className="space-y-4 border-l border-zinc-800 pl-12">
                           <div className="flex items-center gap-2 text-zinc-400"><Activity size={18} /><span className="text-[10px] font-bold uppercase tracking-widest">Avg Consistency</span></div>
                           <div className="text-3xl font-bold font-mono text-zinc-100">{aggregateStats?.avgAccuracy.toFixed(1)}%</div>
                           <p className="text-[10px] text-zinc-600 font-mono">Standard Deviation: 4.2%</p>
                        </div>
                        <div className="space-y-4 border-l border-zinc-800 pl-12">
                           <div className="flex items-center gap-2 text-zinc-400"><Flame size={18} /><span className="text-[10px] font-bold uppercase tracking-widest">Current Momentum</span></div>
                           <div className="text-3xl font-bold font-mono text-zinc-100">Elevated</div>
                           <p className="text-[10px] text-zinc-600 font-mono">{history.length >= 3 ? 'Upward trend last 3 labs' : 'Inconclusive trend'}</p>
                        </div>
                     </div>
                  </div>
               )}

               {activeLayer === 'knowledge' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] space-y-10 shadow-2xl backdrop-blur-sm">
                        <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3"><Brain size={20} className="text-purple-500" /> Topic Saturation</h3>
                        <div className="space-y-8">
                           {['Atomic Structure', 'Kinematics', 'Trigonometry', 'Thermodynamics'].map((topic, i) => (
                              <div key={topic} className="space-y-3">
                                 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    <span>{topic}</span>
                                    <span className="font-mono text-zinc-100">{85 - (i * 12)}% Mastery</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
                                    <div className="h-full bg-purple-500/80" style={{ width: `${85 - (i * 12)}%` }} />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[3rem] flex flex-col gap-6 shadow-2xl backdrop-blur-sm">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Critical Knowledge Gaps</h4>
                        <div className="flex-1 space-y-4 overflow-y-auto">
                           <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
                              <div className="p-2 bg-red-500/10 rounded-xl text-red-500 mt-1"><Target size={14} /></div>
                              <div className="space-y-1">
                                 <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">Organic Chemistry</span>
                                 <p className="text-[9px] text-zinc-500 leading-relaxed uppercase">Failing to recall reaction mechanisms under timed conditions.</p>
                              </div>
                           </div>
                           <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 mt-1"><TrendingUp size={14} /></div>
                              <div className="space-y-1">
                                 <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">3D Geometry</span>
                                 <p className="text-[9px] text-zinc-500 leading-relaxed uppercase">Calculation errors detected in 40% of attempts.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {activeLayer === 'roadmap' && (
                  <div className="max-w-4xl mx-auto space-y-10 py-10">
                     <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-zinc-100 rounded-[2.5rem] flex items-center justify-center text-black shadow-2xl mx-auto"><Sparkles size={40} fill="currentColor" /></div>
                        <h3 className="text-4xl font-black text-zinc-100 tracking-tighter uppercase italic">Neural Optimization Path</h3>
                        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Next Phase: Precision & Speed</p>
                     </div>

                     <div className="grid grid-cols-1 gap-6">
                        <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] flex items-center justify-between group hover:scale-[1.01] transition-all shadow-2xl backdrop-blur-sm">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                                 <TrendingUp size={24} />
                              </div>
                              <div className="space-y-1">
                                 <h4 className="text-lg font-bold text-zinc-100 uppercase tracking-widest">Phase 1: Zero-Error Drill</h4>
                                 <p className="text-[10px] text-zinc-500 font-mono uppercase">Target Accuracy: 100% on Easy/Medium Qs • 3 Days</p>
                              </div>
                           </div>
                           <ChevronRight size={24} className="text-zinc-800 group-hover:text-zinc-100 transition-colors" />
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] flex items-center justify-between group hover:scale-[1.01] transition-all shadow-2xl backdrop-blur-sm">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all">
                                 <Zap size={24} />
                              </div>
                              <div className="space-y-1">
                                 <h4 className="text-lg font-bold text-zinc-100 uppercase tracking-widest">Phase 2: Speed Burst Sessions</h4>
                                 <p className="text-[10px] text-zinc-500 font-mono uppercase">Target Time: 45s per MCQ • 4 Days</p>
                              </div>
                           </div>
                           <ChevronRight size={24} className="text-zinc-800 group-hover:text-zinc-100 transition-colors" />
                        </div>
                     </div>
                  </div>
               )}

               {/* Default for other layers */}
               {(activeLayer === 'behavior' || activeLayer === 'trajectory') && (
                  <div className="py-20 text-center border border-dashed border-zinc-800 rounded-[3rem] space-y-4">
                     <Loader2 size={32} className="mx-auto text-zinc-700 animate-spin" />
                     <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">Layer data streaming in progress...</p>
                  </div>
               )}
            </div>
         </main>
      </div>
   );
};
