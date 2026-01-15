
import React from 'react';
import { Trophy, Activity, ListChecks, Zap } from 'lucide-react';
import { Panel, formatTimeDetailed, formatTime } from './AnalysisShared';

interface DashboardTabProps {
  stats: any;
  results: any[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ stats, results }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* PERFORMANCE REPORT I */}
      <Panel title="Performance Report I" icon={Trophy}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-800/20 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Your score</th>
              <th className="px-6 py-4 text-emerald-400">Answered correct</th>
              <th className="px-6 py-4 text-emerald-500">Positive marks</th>
              <th className="px-6 py-4 text-red-400">Answered incorrect</th>
              <th className="px-6 py-4 text-red-500">Negative marks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {stats.topicStats.map((t: any) => (
              <tr key={t.topic} className="hover:bg-zinc-800/10 transition-colors">
                <td className="px-6 py-4 font-bold text-zinc-100 uppercase">{t.topic}</td>
                <td className="px-6 py-4 font-mono">{t.scored.toFixed(1)} <span className="text-zinc-600">out of {t.total}.0</span></td>
                <td className="px-6 py-4 text-emerald-400 font-bold">{t.correct}</td>
                <td className="px-6 py-4 text-emerald-500">+{t.correct * 4}.0</td>
                <td className="px-6 py-4 text-red-400 font-bold">{t.incorrect}</td>
                <td className="px-6 py-4 text-red-500">-{t.incorrect * 1}.0</td>
              </tr>
            ))}
            <tr className="bg-zinc-800/40 font-bold border-t border-zinc-800">
              <td className="px-6 py-5 text-zinc-100">TOTAL</td>
              <td className="px-6 py-5 font-mono text-zinc-100">{stats.scored.toFixed(1)} <span className="text-zinc-600 font-normal">out of {stats.totalMarks}.0</span></td>
              <td className="px-6 py-5 text-emerald-400">{stats.correct}</td>
              <td className="px-6 py-5 text-emerald-500">+{(stats.correct * 4).toFixed(1)}</td>
              <td className="px-6 py-5 text-red-400">{stats.incorrect}</td>
              <td className="px-6 py-5 text-red-500">-{stats.incorrect * 1}.0</td>
            </tr>
          </tbody>
        </table>
      </Panel>

      {/* PERFORMANCE REPORT II */}
      <Panel title="Performance Report II" icon={Activity}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-800/20 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Percentage score</th>
              <th className="px-6 py-4">Time taken</th>
              <th className="px-6 py-4">Accuracy</th>
              <th className="px-6 py-4">Avg. time taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {stats.topicStats.map((t: any) => (
              <tr key={t.topic} className="hover:bg-zinc-800/10 transition-colors">
                <td className="px-6 py-4 font-bold text-zinc-100 uppercase">{t.topic}</td>
                <td className="px-6 py-4 font-mono">{t.accuracy.toFixed(2)} % <span className="text-zinc-600">in {t.topic}</span></td>
                <td className="px-6 py-4 font-mono">{formatTimeDetailed(t.time)}</td>
                <td className="px-6 py-4 font-mono">{Math.round(t.accuracy)} %</td>
                <td className="px-6 py-4 font-mono">{formatTime(t.avgTime)}</td>
              </tr>
            ))}
            <tr className="bg-zinc-800/40 font-bold border-t border-zinc-800">
              <td className="px-6 py-5 text-zinc-100">TOTAL</td>
              <td className="px-6 py-5 font-mono text-zinc-100">{(stats.scored / (stats.totalMarks || 1) * 100).toFixed(2)} % <span className="text-zinc-600 font-normal">of total marks</span></td>
              <td className="px-6 py-5 font-mono">{formatTimeDetailed(stats.totalTime)}</td>
              <td className="px-6 py-5 font-mono">{(stats.correct / (results.filter(r => r.status !== 'unanswered').length || 1) * 100).toFixed(0)} %</td>
              <td className="px-6 py-5 font-mono">{formatTime(stats.totalTime / (stats.correct || 1))}</td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </div>
  );
};
