
import React from 'react';
import { Panel, formatTime } from './AnalysisShared';

interface ReviewTabProps {
  results: any[];
  subjects: string[];
  onViewQuestion: (q: any) => void;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({ results, subjects, onViewQuestion }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {subjects.map(sub => (
        <Panel 
          key={sub} 
          title={`${sub} - Detailed Itemization`}
          headerRight={<span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Total Items: {results.filter(r => r.question.subject === sub).length}</span>}
        >
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-zinc-800/20 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                <th className="px-6 py-4 w-12">Q</th>
                <th className="px-6 py-4">Question Type</th>
                <th className="px-6 py-4">Correct Ans.</th>
                <th className="px-6 py-4">You Marked</th>
                <th className="px-6 py-4">Your Marks</th>
                <th className="px-6 py-4">Time in m:s</th>
                <th className="px-6 py-4 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 font-mono">
              {results.filter(r => r.question.subject === sub).map((r) => (
                <tr key={r.question.id} className="hover:bg-zinc-800/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-500">{r.question.questionNumber}</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full text-[9px] uppercase font-bold">{r.question.type}</span></td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{r.question.correctOption}</td>
                  <td className={`px-6 py-4 font-bold ${r.status === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>{r.userAnswer || '-'}</td>
                  <td className={`px-6 py-4 font-bold ${r.marks > 0 ? 'text-emerald-400' : r.marks < 0 ? 'text-red-400' : 'text-zinc-500'}`}>{r.marks}</td>
                  <td className="px-6 py-4 text-zinc-400">{formatTime(r.timeTaken)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onViewQuestion(r)} className="text-zinc-500 hover:text-zinc-100 font-bold transition-colors uppercase text-[9px] border border-zinc-800 px-3 py-1 rounded-lg bg-zinc-950/50">Analyze</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ))}
    </div>
  );
};
