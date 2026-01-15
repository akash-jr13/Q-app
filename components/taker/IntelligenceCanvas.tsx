
import React, { useState, useMemo } from 'react';
import {
  Brain,
  Zap,
  Target,
  AlertCircle,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  History as HistoryIcon,
  Flame,
  LineChart,
  Eye,
  X
} from 'lucide-react';
import { QuestionData } from '../../types';

interface IntelligenceCanvasProps {
  testName: string;
  onExit: () => void;
  data: {
    questions: QuestionData[];
    answers: Record<string, string>;
    questionTimes: Record<string, number>;
  };
}

type AnalysisLayer = 'executive' | 'knowledge' | 'behavior' | 'strategy' | 'actions' | 'review';
type MistakeType = 'Conceptual' | 'Calculation' | 'Silly' | 'Guess' | 'Time-Pressure' | 'None';

const MISTAKE_OPTIONS: MistakeType[] = ['Conceptual', 'Calculation', 'Silly', 'Guess', 'Time-Pressure', 'None'];

// --- Diagnostic Helpers ---

const evaluateStatus = (q: QuestionData, ans: string) => {
  if (!ans) return 'unanswered';
  if (q.type === 'MCQ' || q.type === 'NAT') return ans === q.correctOption ? 'correct' : 'incorrect';
  if (q.type === 'MSQ') {
    const marked = ans.split(',').sort().join(',');
    const correct = q.correctOption.split(',').sort().join(',');
    return marked === correct ? 'correct' : 'incorrect';
  }
  return 'unanswered';
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const LayerIcon = ({ layer, size = 18 }: { layer: AnalysisLayer, size?: number }) => {
  switch (layer) {
    case 'executive': return <LayoutDashboard size={size} />;
    case 'knowledge': return <Brain size={size} />;
    case 'behavior': return <Zap size={size} />;
    case 'strategy': return <Target size={size} />;
    case 'actions': return <Sparkles size={size} />;
    case 'review': return <Eye size={size} />;
  }
};

const Metric = ({ label, value, sub, color = "text-zinc-100" }: { label: string, value: string | number, sub?: string, color?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
    <div className={`text-2xl font-mono font-bold tracking-tighter ${color}`}>{value}</div>
    {sub && <span className="text-[9px] font-mono text-zinc-600 uppercase italic truncate">{sub}</span>}
  </div>
);

// Fix: Explicitly define props and use React.FC to allow optional children and standard React props like 'key'
interface WidgetProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
  icon?: any;
}

const Widget: React.FC<WidgetProps> = ({ title, children, className = "", icon: Icon }) => (
  <div className={`bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/5 flex flex-col ${className}`}>
    <div className="px-6 py-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-800/20 shrink-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-zinc-500" />}
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="flex gap-1">
        <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
        <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
      </div>
    </div>
    <div className="p-6 flex-1 overflow-auto">
      {children}
    </div>
  </div>
);

export const IntelligenceCanvas: React.FC<IntelligenceCanvasProps> = ({ testName, onExit, data }) => {
  const [activeLayer, setActiveLayer] = useState<AnalysisLayer>('executive');
  const [viewingQuestionId, setViewingQuestionId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<Record<string, MistakeType>>({});

  // --- Process Data ---
  const results = useMemo(() => {
    const IDEAL_TIME = 120; // 2 mins per Q
    return data.questions.map(q => {
      const ans = data.answers[q.id] || "";
      const status = evaluateStatus(q, ans);
      const time = data.questionTimes[q.id] || 0;
      const isOvertime = time > IDEAL_TIME;
      const marks = status === 'correct' ? q.markingScheme.correct : (ans ? q.markingScheme.incorrect : 0);
      return { ...q, status, time, isOvertime, marks, userAnswer: ans };
    });
  }, [data]);

  const stats = useMemo(() => {
    const total = results.length;
    const correct = results.filter(r => r.status === 'correct').length;
    const incorrect = results.filter(r => r.status === 'incorrect').length;
    const unanswered = results.filter(r => r.status === 'unanswered').length;
    const accuracy = total > 0 ? Math.round(((correct + incorrect) > 0 ? correct / (correct + incorrect) : 0) * 100) : 0;
    const totalMarks = results.reduce((acc, r) => acc + r.markingScheme.correct, 0);
    const score = results.reduce((acc, r) => acc + r.marks, 0);

    const subjects = Array.from(new Set(results.map(r => r.subject)));
    const subStats = subjects.map(s => {
      const subResults = results.filter(r => r.subject === s);
      const subCorrect = subResults.filter(r => r.status === 'correct').length;
      const subTotal = subResults.length;
      return { name: s, accuracy: subTotal > 0 ? Math.round((subCorrect / subTotal) * 100) : 0, count: subTotal };
    });

    return { total, correct, incorrect, unanswered, accuracy, score, totalMarks, subStats };
  }, [results]);

  const toggleMistake = (id: string, type: MistakeType) => setMistakes(prev => ({ ...prev, [id]: type }));

  // --- Narrative Logic ---
  const getVerdict = () => {
    if (stats.accuracy > 80) return { label: 'Excellent', color: 'text-emerald-400', icon: Trophy, bg: 'bg-emerald-500/10' };
    if (stats.accuracy > 50) return { label: 'Improving', color: 'text-amber-400', icon: LineChart, bg: 'bg-amber-500/10' };
    return { label: 'Critical', color: 'text-red-400', icon: AlertTriangle, bg: 'bg-red-500/10' };
  };

  const verdict = getVerdict();
  const viewingQuestion = results.find(r => r.id === viewingQuestionId);

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-300 relative selection:bg-zinc-100 selection:text-black">
      <div className="fixed inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      <header className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors text-zinc-500 hover:text-zinc-100">
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-px bg-zinc-900 mx-2 hidden sm:block"></div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-zinc-100 uppercase tracking-widest font-mono">Intelligence Canvas</h1>
            <span className="text-[10px] text-zinc-500 font-mono uppercase italic truncate max-w-[200px]">{testName}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 ${verdict.bg}`}>
            <verdict.icon size={14} className={verdict.color} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${verdict.color}`}>{verdict.label}</span>
          </div>
          <button className="bg-zinc-100 text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95">Full Export</button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex min-h-[calc(100vh-64px)]">

        {/* SIDEBAR */}
        <aside className="w-20 md:w-64 border-r border-zinc-900 shrink-0 bg-zinc-950/50 z-30 flex flex-col pt-8">
          <nav className="flex-1 px-4 space-y-2">
            {(['executive', 'knowledge', 'behavior', 'strategy', 'actions', 'review'] as AnalysisLayer[]).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${activeLayer === layer ? 'bg-zinc-100 text-black shadow-xl scale-[1.02]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                  }`}
              >
                <div className="shrink-0"><LayerIcon layer={layer} /></div>
                <span className="text-[11px] font-bold uppercase tracking-widest hidden md:block">{layer}</span>
                {activeLayer === layer && <ChevronRight size={14} className="ml-auto hidden md:block" />}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-zinc-900 text-center">
            <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.2em]">Designed by @AkashJR</span>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-900 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Diagnostic <ChevronRight size={10} /> {activeLayer} Layer
                </div>
                <h2 className="text-4xl font-bold text-zinc-100 tracking-tight capitalize">
                  {activeLayer === 'executive' ? 'Personalized Verdict' : activeLayer === 'review' ? 'Micro View' : `${activeLayer} Analysis`}
                </h2>
              </div>
              <div className="flex items-center gap-8">
                <Metric label="Test Score" value={`${stats.score}/${stats.totalMarks}`} sub="Net points earned" />
                <Metric label="Accuracy" value={`${stats.accuracy}%`} sub="Correctness ratio" color={stats.accuracy > 70 ? 'text-emerald-400' : 'text-zinc-100'} />
              </div>
            </div>

            {/* --- EXECUTIVE LAYER --- */}
            {activeLayer === 'executive' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Widget title="Primary Diagnosis" className="md:col-span-2" icon={AlertCircle}>
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 shadow-inner">
                        {stats.accuracy < 50 ? <Flame size={24} className="text-red-500" /> : <ShieldCheck size={24} className="text-emerald-500" />}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Diagnostic Summary</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                          {stats.accuracy < 50
                            ? "Your score is primarily limited by conceptual instability. High friction detected in Section A subjects. Immediate theoretical revision required."
                            : "Solid performance detected. Score improvement is now capped by time efficiency rather than knowledge gaps. Optimize attempt order."}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block">✔ Score Drivers</span>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-[11px] text-zinc-300 font-mono"><ArrowUpRight size={12} className="text-emerald-500" /> High accuracy in {stats.subStats.sort((a, b) => b.accuracy - a.accuracy)[0]?.name}</li>
                          <li className="flex items-center gap-2 text-[11px] text-zinc-300 font-mono"><ArrowUpRight size={12} className="text-emerald-500" /> {stats.correct} Precision Attempts</li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block">❌ Score Drainers</span>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-[11px] text-zinc-300 font-mono"><ArrowDownRight size={12} className="text-red-500" /> {stats.incorrect} Negative Penalties</li>
                          <li className="flex items-center gap-2 text-[11px] text-zinc-300 font-mono"><ArrowDownRight size={12} className="text-red-500" /> Time waste in Hard Qs</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Widget>

                <Widget title="Efficiency Metrics" icon={Zap}>
                  <div className="space-y-6">
                    <Metric label="Time Utilized" value={`${Math.round(results.reduce((a, b) => a + b.time, 0) / 60)} min`} sub="of 180 available" />
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-100" style={{ width: `${(results.reduce((a, b) => a + b.time, 0) / 10800) * 100}%` }} />
                    </div>
                    <Metric label="Panic Index" value={stats.incorrect > 5 ? "Elevated" : "Normal"} sub="Strategic stability" color={stats.incorrect > 5 ? 'text-red-400' : 'text-emerald-400'} />
                  </div>
                </Widget>

                <Widget title="Difficulty Response" className="md:col-span-3" icon={LineChart}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {['Easy', 'Medium', 'Hard'].map(d => {
                      const dr = results.filter(r => r.difficulty === d);
                      const acc = dr.length > 0 ? Math.round((dr.filter(x => x.status === 'correct').length / dr.length) * 100) : 0;
                      return (
                        <div key={d} className="space-y-4">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{d} Accuracy</span>
                          <div className="text-3xl font-mono font-bold text-zinc-100">{acc}%</div>
                          <div className="h-1.5 w-24 mx-auto bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
                            <div className={`h-full ${acc > 70 ? 'bg-emerald-500' : acc > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${acc}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Widget>
              </div>
            )}

            {/* --- KNOWLEDGE LAYER --- */}
            {activeLayer === 'knowledge' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {stats.subStats.map(s => (
                    <div key={s.name} className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl flex flex-col gap-2 shadow-sm">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.name} Mastery</span>
                      <span className={`text-2xl font-mono font-bold ${s.accuracy > 70 ? 'text-emerald-400' : s.accuracy > 40 ? 'text-amber-400' : 'text-red-400'}`}>{s.accuracy}%</span>
                      <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">{s.count} Items Assessed</span>
                    </div>
                  ))}
                </div>
                <Widget title="Concept Leak Audit" icon={Brain}>
                  <div className="space-y-1">
                    {results.filter(r => r.status === 'incorrect').map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 border-b border-zinc-800/50 group hover:bg-zinc-800/20 transition-colors cursor-pointer" onClick={() => { setViewingQuestionId(r.id); setActiveLayer('review'); }}>
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-[10px] font-bold font-mono">Q{r.questionNumber}</span>
                          <div>
                            <h5 className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest">{r.subject}</h5>
                            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">Mistake Captured • {r.difficulty}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-200 transition-colors uppercase">View Q <ChevronRight size={10} className="inline ml-1" /></span>
                      </div>
                    ))}
                    {results.filter(r => r.status === 'incorrect').length === 0 && (
                      <div className="py-20 text-center text-zinc-700 font-mono text-xs uppercase tracking-widest">No critical leaks detected.</div>
                    )}
                  </div>
                </Widget>
              </div>
            )}

            {/* --- BEHAVIOR LAYER --- */}
            {activeLayer === 'behavior' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Widget title="Solving Behavioral Profile" icon={HistoryIcon}>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Rushed Attempts</span>
                      <span className="text-xl font-mono font-bold text-red-400">{results.filter(r => r.time < 30 && r.status === 'incorrect').length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Over-Analysis Qs</span>
                      <span className="text-xl font-mono font-bold text-zinc-200">{results.filter(r => r.isOvertime).length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Skips After Effort</span>
                      <span className="text-xl font-mono font-bold text-zinc-200">{results.filter(r => r.time > 60 && r.status === 'unanswered').length}</span>
                    </div>
                  </div>
                </Widget>
                <Widget title="Mistake Type Distribution" icon={AlertCircle}>
                  <div className="h-full flex flex-col justify-center gap-6 py-4">
                    {MISTAKE_OPTIONS.filter(o => o !== 'None').map(opt => {
                      const count = Object.values(mistakes).filter(v => v === opt).length;
                      const percentage = results.filter(r => r.status === 'incorrect').length > 0
                        ? (count / results.filter(r => r.status === 'incorrect').length) * 100
                        : 0;
                      return (
                        <div key={opt} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase"><span>{opt} Errors</span><span>{count} Qs</span></div>
                          <div className="h-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-zinc-400" style={{ width: `${percentage}%` }} /></div>
                        </div>
                      );
                    })}
                    {Object.keys(mistakes).length === 0 && <p className="text-[10px] text-zinc-600 font-mono italic">Tag your mistakes in the "Review" tab to see analysis.</p>}
                  </div>
                </Widget>
              </div>
            )}

            {/* --- STRATEGY LAYER --- */}
            {activeLayer === 'strategy' && (
              <div className="space-y-6">
                <Widget title="Attempt Order Audit" icon={Target}>
                  <div className="space-y-6">
                    <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                      <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><ArrowRight size={12} /> Strategic Sequence</h5>
                      <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                        {results.findIndex(r => r.difficulty === 'Hard') < results.findIndex(r => r.difficulty === 'Easy')
                          ? "⚠ Strategic Flaw: You attempted Hard questions before clearing Easy ones. This increased cognitive load early in the test."
                          : "✔ Strategic Soundness: You prioritized Easy questions, securing a safety score before attempting complex items."}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attempt Rate</span>
                        <span className="text-2xl font-mono font-bold text-zinc-100">{Math.round((results.filter(r => r.status !== 'unanswered').length / results.length) * 100)}%</span>
                      </div>
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Efficiency Points</span>
                        <span className="text-2xl font-mono font-bold text-emerald-400">+{(stats.correct * 3).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Widget>
              </div>
            )}

            {/* --- ACTION LAYER --- */}
            {activeLayer === 'actions' && (
              <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div className="text-center space-y-4 py-10">
                  <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-[2rem] flex items-center justify-center text-black shadow-2xl shadow-white/10">
                    <Sparkles size={32} fill="currentColor" />
                  </div>
                  <h3 className="text-3xl font-bold text-zinc-100 tracking-tight">Your 7-Day Roadmap</h3>
                  <p className="text-zinc-500 text-sm font-mono max-w-lg mx-auto uppercase tracking-tighter italic">Precision-generated based on behavioral & knowledge assessment</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400"><Minus size={18} className="rotate-90" /></div>
                      <div className="space-y-1 text-left">
                        <h6 className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">Revise {stats.subStats.sort((a, b) => a.accuracy - b.accuracy)[0]?.name} Fundamentals</h6>
                        <p className="text-[9px] text-zinc-600 font-mono uppercase">Priority High • 4 Hours Target</p>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-zinc-800 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group hover:border-amber-500/50 transition-all cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400"><Zap size={18} /></div>
                      <div className="space-y-1 text-left">
                        <h6 className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">Speed Drill: Level-1 Problems</h6>
                        <p className="text-[9px] text-zinc-600 font-mono uppercase">Correctness optimization • 2 Sessions</p>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-zinc-800 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {/* --- REVIEW LAYER (Section 5 Gold Standard) --- */}
            {activeLayer === 'review' && (
              <div className="space-y-6">
                {Array.from(new Set(results.map(r => r.subject))).map(sub => (
                  <Widget key={sub} title={`${sub} Detailed Review`}>
                    <div className="overflow-x-auto -mx-6">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="bg-zinc-800/20 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">
                            <th className="px-6 py-4">Q No</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Response</th>
                            <th className="px-6 py-4">Correct</th>
                            <th className="px-6 py-4">Marks</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {results.filter(r => r.subject === sub).map(r => (
                            <tr key={r.id} className="hover:bg-zinc-800/10 transition-colors group">
                              <td className="px-6 py-4 font-bold text-zinc-100">{r.questionNumber}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${r.status === 'correct' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  r.status === 'incorrect' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-zinc-800 text-zinc-500 border-zinc-700'
                                  }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className={`px-6 py-4 font-bold ${r.status === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>{r.userAnswer || '-'}</td>
                              <td className="px-6 py-4 font-bold text-zinc-400">{r.correctOption}</td>
                              <td className={`px-6 py-4 font-bold ${r.marks > 0 ? 'text-emerald-400' : r.marks < 0 ? 'text-red-400' : 'text-zinc-400'}`}>{r.marks > 0 ? '+' : ''}{r.marks.toFixed(1)}</td>
                              <td className="px-6 py-4 text-zinc-500">{formatTime(r.time)}</td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => setViewingQuestionId(r.id)} className="text-[9px] font-bold uppercase text-zinc-500 hover:text-zinc-100 transition-colors bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 group-hover:border-zinc-500">Analyze</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Widget>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* QUESTION REVIEW MODAL */}
      {viewingQuestionId && viewingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
            <div className="bg-zinc-900/50 px-8 py-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 font-mono font-bold text-xl shadow-inner">{viewingQuestion.questionNumber}</div>
                <div><h3 className="font-bold text-zinc-100 text-lg uppercase tracking-widest">{viewingQuestion.subject}</h3><span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{viewingQuestion.type} • Detailed Review</span></div>
              </div>
              <button onClick={() => setViewingQuestionId(null)} className="text-zinc-500 hover:text-zinc-100 p-3 hover:bg-zinc-800 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-8">
              <div className="bg-white rounded-[2rem] p-4 border border-zinc-800 shadow-2xl max-w-full"><img src={(viewingQuestion as any).imageUrl} className="max-w-full h-auto max-h-[40vh] object-contain rounded-xl" alt="Q-Image" /></div>
              <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500"><CheckCircle2 size={16} strokeWidth={3} /><span className="text-[10px] font-bold uppercase tracking-widest">Correct Answer</span></div>
                  <div className="text-4xl font-mono font-bold text-emerald-400">{viewingQuestion.correctOption}</div>
                </div>
                <div className={`p-8 rounded-[2rem] space-y-4 border ${viewingQuestion.status === 'correct' ? 'bg-emerald-500/5 border-emerald-500/20' : viewingQuestion.status === 'incorrect' ? 'bg-red-500/5 border-red-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
                  <div className="flex items-center gap-2"><span className={`text-[10px] font-bold uppercase tracking-widest ${viewingQuestion.status === 'correct' ? 'text-emerald-500' : 'text-red-400'}`}>Your Response</span></div>
                  <div className={`text-4xl font-mono font-bold ${viewingQuestion.status === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>{viewingQuestion.userAnswer || "NO INPUT"}</div>
                </div>
              </div>

              {viewingQuestion.status === 'incorrect' && (
                <div className="w-full max-w-4xl bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem]">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Brain size={14} /> Behavioral Profiling</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {MISTAKE_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => toggleMistake(viewingQuestion.id, opt)} className={`px-2 py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${mistakes[viewingQuestion.id] === opt ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full max-w-4xl flex items-center justify-between pb-12">
                <div className="flex gap-4">
                  <div className="bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800 shadow-sm"><span className="text-[9px] font-bold text-zinc-500 block uppercase mb-1">Time spent</span><span className="text-zinc-200 font-mono font-bold text-sm">{formatTime(viewingQuestion.time)}</span></div>
                  <div className="bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800 shadow-sm"><span className={`text-[9px] font-bold ${viewingQuestion.marks > 0 ? 'text-emerald-400' : viewingQuestion.marks < 0 ? 'text-red-400' : 'text-zinc-400'} block uppercase mb-1`}>Marks</span><span className={`font-mono font-bold text-sm ${viewingQuestion.marks > 0 ? 'text-emerald-400' : viewingQuestion.marks < 0 ? 'text-red-400' : 'text-zinc-400'}`}>{viewingQuestion.marks > 0 ? '+' : ''}{viewingQuestion.marks.toFixed(1)}</span></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { const idx = results.findIndex(r => r.id === viewingQuestionId); if (idx > 0) setViewingQuestionId(results[idx - 1].id); }} disabled={results.findIndex(r => r.id === viewingQuestionId) <= 0} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 px-6 py-3 rounded-2xl border border-zinc-800 text-[10px] font-bold transition-all uppercase tracking-widest disabled:opacity-30 flex items-center gap-2"><ChevronLeft size={16} /> Prev</button>
                  <button onClick={() => { const idx = results.findIndex(r => r.id === viewingQuestionId); if (idx < results.length - 1) setViewingQuestionId(results[idx + 1].id); }} disabled={results.findIndex(r => r.id === viewingQuestionId) >= results.length - 1} className="bg-zinc-100 hover:bg-white text-black px-6 py-3 rounded-2xl font-bold text-[10px] transition-all uppercase tracking-widest shadow-lg flex items-center gap-2">Next <ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
