
import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Target, Award, MousePointer2, Clock, BarChart3, Shield, Globe, Cloud } from 'lucide-react';
import { Panel } from './AnalysisShared';
import { TestHistoryItem } from '../../../types';
import { CloudService, GlobalTestStats } from '../../../utils/cloud';

interface SnapshotTabProps {
  stats: any;
  history: TestHistoryItem[];
}

const mulberry32 = (a: number) => {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export const SnapshotTab: React.FC<SnapshotTabProps> = ({ stats, history }) => {
  const yourScore = stats.scored;
  const testName = stats.testName || "Standard Assessment";
  const totalMarks = stats.totalMarks;

  const [cloudStats, setCloudStats] = useState<GlobalTestStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Attempt to fetch real-time data if a backend exists
  useEffect(() => {
    const fetchCloud = async () => {
      setIsSyncing(true);
      const data = await CloudService.getGlobalStats(testName, yourScore);
      if (data) setCloudStats(data);
      setIsSyncing(false);
    };
    fetchCloud();
  }, [testName, yourScore]);

  const analytics = useMemo(() => {
    // If Cloud Data exists, use it!
    if (cloudStats) {
      return {
        rank: cloudStats.rank,
        percentile: cloudStats.percentile,
        poolSize: cloudStats.totalAttempts,
        topperScore: cloudStats.topScore,
        avgScore: cloudStats.avgScore,
        isReal: true
      };
    }

    // FALLBACK: Seeded Synthetic Engine (Used when offline or no backend)
    let seed = 0;
    for (let i = 0; i < testName.length; i++) {
      seed = ((seed << 5) - seed) + testName.charCodeAt(i);
      seed |= 0;
    }
    const rnd = mulberry32(Math.abs(seed));
    const globalScores: number[] = [];
    const GLOBAL_POOL_SIZE = 5000;
    const difficultyMean = 0.45 + (rnd() * 0.2);
    const standardDeviation = 0.15;

    for (let i = 0; i < GLOBAL_POOL_SIZE; i++) {
      const u = 1 - rnd();
      const v = rnd();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      let scorePercent = difficultyMean + z * standardDeviation;
      scorePercent = Math.max(0, Math.min(1, scorePercent));
      globalScores.push(scorePercent * totalMarks);
    }

    const localScores = history.map(h => h.score);
    const combinedPool = [...globalScores, ...localScores, yourScore].sort((a, b) => b - a);
    const currentRank = combinedPool.indexOf(yourScore) + 1;
    const currentPoolSize = combinedPool.length;
    const scoresBelow = combinedPool.filter(s => s < yourScore).length;
    const currentPercentile = Math.round((scoresBelow / currentPoolSize) * 100);

    return {
      rank: currentRank,
      percentile: currentPercentile,
      poolSize: currentPoolSize,
      topperScore: Math.max(combinedPool[0], yourScore),
      avgScore: Math.round(combinedPool.reduce((a, b) => a + b, 0) / currentPoolSize),
      isReal: false
    };
  }, [testName, history, yourScore, totalMarks, cloudStats]);

  const maxBarHeight = 160;
  const getBarHeight = (score: number) => {
    const highest = Math.max(analytics.topperScore, yourScore, 1);
    return (score / highest) * maxBarHeight;
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const subjects = stats.topicStats.slice(0, 3);
  const centerX = 100;
  const centerY = 100;
  const radius = 70;

  const getPoint = (index: number, total: number, value: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
  };

  const radarPoints = subjects.map((s: any, i: number) => getPoint(i, subjects.length, s.accuracy));
  const radarPath = radarPoints.map((p: any) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* TOP BANNER METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Score */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity"><Trophy size={64} /></div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Score</span>
          <div className="text-2xl font-mono font-bold tracking-tighter text-zinc-100">{Math.round(stats.scored)}/{stats.totalMarks}</div>
        </div>

        {/* Accuracy */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={64} /></div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Accuracy Rate</span>
          <div className="text-2xl font-mono font-bold tracking-tighter text-emerald-400">{stats.accuracy}%</div>
        </div>

        {/* Percentile & Rank */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity"><Award size={64} /></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              Percentile & Rank
              {analytics.isReal ? <Cloud size={10} className="text-emerald-500" /> : <Globe size={10} className="text-blue-500/50" />}
            </span>
            {isSyncing && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
          </div>
          <div className="text-2xl font-mono font-bold tracking-tighter flex items-baseline gap-2">
            <span className="text-zinc-100">{getOrdinal(analytics.percentile)},</span>
            <span className="text-amber-500">Rank {analytics.rank}</span>
          </div>
          <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
            Across {analytics.poolSize.toLocaleString()} {analytics.isReal ? 'Live' : 'Global'} Attempts
          </span>
        </div>

        {/* Attempt % */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity"><MousePointer2 size={64} /></div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attempt Percentage</span>
          <div className="text-2xl font-mono font-bold tracking-tighter text-blue-400">{stats.totalQuestions > 0 ? Math.round((stats.attempted / stats.totalQuestions) * 100) : 0}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Comparative Performance" icon={BarChart3}>
          <div className="h-[240px] w-full flex items-end justify-around px-8 pb-10 pt-10">
            <div className="flex flex-col items-center gap-4 group">
              <div className="relative w-16 bg-blue-500/80 rounded-t-lg transition-all hover:bg-blue-400 cursor-help shadow-lg shadow-blue-500/10" style={{ height: `${getBarHeight(yourScore)}px` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-blue-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{yourScore}</div>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase text-center leading-tight">Your Score<br />({yourScore})</span>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="relative w-16 bg-orange-500/80 rounded-t-lg transition-all hover:bg-orange-400 cursor-help shadow-lg shadow-orange-500/10" style={{ height: `${getBarHeight(analytics.avgScore)}px` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-orange-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{analytics.avgScore}</div>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase text-center leading-tight">Average Score<br />({analytics.avgScore})</span>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="relative w-16 bg-emerald-500/80 rounded-t-lg transition-all hover:bg-emerald-400 cursor-help shadow-lg shadow-emerald-500/10" style={{ height: `${getBarHeight(analytics.topperScore)}px` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-emerald-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{analytics.topperScore}</div>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase text-center leading-tight">Topper's Score<br />({analytics.topperScore})</span>
            </div>
          </div>
        </Panel>

        <Panel title="Sectional Balance" icon={Shield}>
          <div className="h-[240px] w-full flex items-center justify-center relative py-4">
            <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible">
              {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
                <circle key={scale} cx={centerX} cy={centerY} r={radius * scale} fill="none" stroke="#27272a" strokeWidth="1" />
              ))}
              {subjects.map((_: any, i: number) => {
                const p = getPoint(i, subjects.length, 100);
                return <line key={i} x1={centerX} y1={centerY} x2={p.x} y2={p.y} stroke="#27272a" strokeWidth="1" />;
              })}
              <polygon points={radarPath} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
              {radarPoints.map((p: any, i: number) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
              ))}
              {subjects.map((s: any, i: number) => {
                const p = getPoint(i, subjects.length, 115);
                return (
                  <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] font-bold uppercase fill-zinc-500">{s.topic}</text>
                );
              })}
            </svg>
          </div>
        </Panel>
      </div>

      <Panel title="Sectional Summary" icon={Clock}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-800/20 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              <th className="px-6 py-4">Section Name</th>
              <th className="px-6 py-4">Score obtained</th>
              <th className="px-6 py-4">Accuracy %</th>
              <th className="px-6 py-4">Time Spent vs. Recommended</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {stats.topicStats.map((t: any) => (
              <tr key={t.topic} className="hover:bg-zinc-800/10 transition-colors">
                <td className="px-6 py-4 font-bold text-zinc-100 uppercase">{t.topic}</td>
                <td className="px-6 py-4 font-mono">{t.scored.toFixed(0)}/{t.total}</td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-400">{Math.round(t.accuracy)}%</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono">{Math.floor(t.time / 60)}m/60m</span>
                    <div className="flex-1 max-w-[100px] h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${t.time / 3600 > 1 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (t.time / 3600) * 100)}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

    </div>
  );
};
