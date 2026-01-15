
import React, { useMemo } from 'react';
import { Star, XCircle, Hourglass, RotateCcw, HelpCircle, Clock } from 'lucide-react';
import { Panel } from './AnalysisShared';

interface AttemptsTabProps {
  results: any[];
  subjects: string[];
}

export const AttemptsTab: React.FC<AttemptsTabProps> = ({ results, subjects }) => {
  const efficiencySummary = useMemo(() => {
    const categories = [
      { id: 'perfect', label: 'Perfect Attempts', sub: 'Correct attempt solved in time', icon: Star, color: 'text-emerald-500 bg-emerald-500/10' },
      { id: 'wasted', label: 'Wasted Attempts', sub: 'Incorrect attempt solved very quickly', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
      { id: 'overtime', label: 'Overtime Attempts', sub: 'Spent more than the allotted time', icon: Hourglass, color: 'text-amber-500 bg-amber-500/10' },
      { id: 'confused', label: 'Confused Attempts', sub: 'Unattempted & Spent more than the allotted time', icon: RotateCcw, color: 'text-purple-500 bg-purple-500/10' }
    ];

    return categories.map(cat => {
      const filtered = results.filter(r => r.attemptCategory === cat.id);
      const count = filtered.length;
      const percentage = results.length > 0 ? Math.round((count / results.length) * 100) : 0;
      const totalTime = filtered.reduce((a, b) => a + b.timeTaken, 0);
      
      let metricLabel = "";
      let metricVal = "";
      let metricColor = "text-zinc-100";

      if (cat.id === 'perfect') {
        const marks = filtered.reduce((a, b) => a + b.marks, 0);
        metricLabel = "marks";
        metricVal = `+${marks}`;
        metricColor = "text-emerald-500";
      } else if (cat.id === 'wasted') {
        const marks = filtered.reduce((a, b) => a + Math.abs(b.marks), 0);
        metricLabel = "marks";
        metricVal = `-${marks}`;
        metricColor = "text-red-500";
      } else if (cat.id === 'overtime') {
        const extraTime = filtered.reduce((a, b) => a + Math.max(0, b.timeTaken - (b.question.idealTime || 120)), 0);
        metricLabel = "extra";
        metricVal = `${extraTime}s`;
        metricColor = "text-amber-500";
      } else if (cat.id === 'confused') {
        metricLabel = "wasted";
        metricVal = `${totalTime}s`;
        metricColor = "text-purple-500";
      }

      return { ...cat, count, percentage, metricLabel, metricVal, metricColor, totalTime };
    });
  }, [results]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <Panel title="Attempt Efficiency Breakdown">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-800/20 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-center">Count</th>
              <th className="px-6 py-4 text-center">%</th>
              <th className="px-6 py-4 text-center">Metric</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {efficiencySummary.map((cat) => (
              <tr key={cat.id} className="hover:bg-zinc-800/10 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-800/50 ${cat.color}`}>
                      <cat.icon size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-100 text-sm uppercase tracking-tight">{cat.label}</div>
                      <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">{cat.sub}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center font-mono text-lg font-bold text-zinc-100">{cat.count}</td>
                <td className="px-6 py-5 text-center">
                  <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-emerald-400 font-mono text-[10px] font-bold">
                    {cat.percentage}%
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className={`font-mono text-sm font-bold ${cat.metricColor}`}>{cat.metricVal}</div>
                  <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">{cat.metricLabel}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-mono">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {cat.totalTime}s</span>
                    <span className="flex items-center gap-1.5"><HelpCircle size={12} /> {cat.count} questions</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Attempt Efficiency Audit - Subject Wise">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-zinc-800/20 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              <th className="px-6 py-4">Subject Segment</th>
              <th className="px-6 py-4 text-center text-emerald-400">Perfect</th>
              <th className="px-6 py-4 text-center text-red-400">Wasted</th>
              <th className="px-6 py-4 text-center text-amber-400">Overtime</th>
              <th className="px-6 py-4 text-center text-purple-400">Confused</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {subjects.map((sub) => {
              const subRes = results.filter(r => r.question.subject === sub);
              return (
                <tr key={sub} className="hover:bg-zinc-800/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-100 uppercase tracking-tighter">{sub}</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-bold">{subRes.filter(r => r.attemptCategory === 'perfect').length}</td>
                  <td className="px-6 py-4 text-center text-red-400 font-bold">{subRes.filter(r => r.attemptCategory === 'wasted').length}</td>
                  <td className="px-6 py-4 text-center text-amber-400 font-bold">{subRes.filter(r => r.attemptCategory === 'overtime').length}</td>
                  <td className="px-6 py-4 text-center text-purple-400 font-bold">{subRes.filter(r => r.attemptCategory === 'confused').length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
};
