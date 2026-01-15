
import React from 'react';
import { AlertTriangle, Brain } from 'lucide-react';
import { MistakeType } from './AnalysisShared';

interface MistakesTabProps {
  mistakes: Record<string, MistakeType>;
  results: any[];
}

const MISTAKE_OPTIONS: MistakeType[] = ['Conceptual', 'Calculation', 'Silly', 'Guess', 'Time-Pressure', 'None'];

export const MistakesTab: React.FC<MistakesTabProps> = ({ mistakes, results }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-widest">
          <AlertTriangle className="text-red-400" /> Mistake Assessment
        </h3>
        <p className="text-xs text-zinc-500 uppercase tracking-tighter leading-relaxed">Categorize errors in the review tab to track solving patterns.</p>
        <div className="space-y-4">
          {Object.keys(mistakes).length === 0 ? (
            <div className="p-10 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-600 font-mono uppercase tracking-widest">No data Captured</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {MISTAKE_OPTIONS.filter(o => o !== 'None').map(opt => {
                const count = Object.values(mistakes).filter(v => v === opt).length;
                return (
                  <div key={opt} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center group shadow-inner">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{opt}</span>
                    <span className="font-mono text-zinc-100 font-bold text-lg">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 space-y-8 shadow-xl">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-widest">
          <Brain className="text-emerald-400" /> Remediation Engine
        </h3>
        <div className="space-y-8 pt-4">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest"><span>Concept Gaps</span><span>{Math.round((results.filter(r => r.status === 'incorrect' && r.question.difficulty === 'Easy').length / (results.length || 1)) * 100)}%</span></div>
            <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-red-400" style={{ width: `${(results.filter(r => r.status === 'incorrect' && r.question.difficulty === 'Easy').length / (results.length || 1)) * 100}%` }} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest"><span>Execution Gaps</span><span>{Math.round((Object.values(mistakes).filter(v => v === 'Silly' || v === 'Calculation').length / (results.length || 1)) * 100)}%</span></div>
            <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-amber-400" style={{ width: `${(Object.values(mistakes).filter(v => v === 'Silly' || v === 'Calculation').length / (results.length || 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
