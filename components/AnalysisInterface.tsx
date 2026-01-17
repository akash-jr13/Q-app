
import React, { useState } from 'react';
import {
    BarChart2,
    AlertCircle,
    Grid,
    Activity,
    ChevronRight,
    Download,
    Zap,
    ArrowUpRight,
    Target
} from 'lucide-react';
import { ResizableSplit } from './ResizableSplit';

export const AnalysisInterface: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'matrix' | 'error-log' | 'insights'>('matrix');

    const renderSidebar = () => (
        <div className="h-full p-10 pr-0 flex flex-col gap-6 bg-[#050505] border-r border-white/[0.03]">
            <div className="bg-[#1e1e1e] border border-white/[0.03] rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between text-[#3c4043]">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Composite Score</span>
                    <Target size={14} />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-mono font-medium text-white">742</span>
                    <span className="text-emerald-500 text-xs font-bold font-mono">/ 900</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-tighter">
                    <ArrowUpRight size={12} /> +14% From Last Cycle
                </div>
            </div>

            <div className="bg-[#1e1e1e] border border-white/[0.03] rounded-3xl p-6 space-y-4 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={48} fill="currentColor" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#3c4043]">Protocol Adherence</div>
                <div className="text-3xl font-mono font-medium text-white">92.4%</div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[92%]" />
                </div>
            </div>

            <div className="mt-auto bg-[#1e1e1e]/30 border border-white/[0.02] rounded-2xl p-6">
                <div className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest mb-2">System Status</div>
                <div className="flex items-center gap-2 text-[11px] text-[#9aa0a6] font-mono">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Neural Integrity: ACTIVE
                </div>
            </div>
        </div>
    );

    const renderMain = () => (
        <div className="h-full overflow-y-auto p-10 custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#3c4043]">
                        <BarChart2 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Performance Intelligence Suite</span>
                    </div>
                    <h1 className="text-4xl font-medium tracking-tight text-white flex items-center gap-3">
                        Analytical Cockpit
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#9aa0a6] hover:text-white transition-all">
                        <Download size={14} /> Export Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-10 mb-10 border-b border-white/[0.03] pb-4">
                {[
                    { id: 'matrix', label: 'Subject Heatmap', icon: Grid },
                    { id: 'error-log', label: 'Error Log Protocol', icon: AlertCircle },
                    { id: 'insights', label: 'Neural Insights', icon: Activity },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 pb-4 -mb-4 transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-[#3c4043] hover:text-[#9aa0a6]'
                            }`}
                    >
                        <tab.icon size={16} />
                        <span className="text-[12px] font-bold uppercase tracking-[0.15em]">{tab.label}</span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'matrix' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="bg-[#1e1e1e] border border-white/[0.03] rounded-[2.5rem] p-10">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#9aa0a6]">Proficiency Distribution Matrix</h3>
                            <div className="flex gap-2">
                                {['Physics', 'Chemistry', 'Math'].map(s => (
                                    <button key={s} className="px-3 py-1 bg-black/40 rounded-full border border-white/5 text-[9px] font-bold uppercase tracking-tighter text-[#3c4043] hover:text-white transition-colors">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                            {Array.from({ length: 50 }).map((_, i) => {
                                const intensities = ['bg-zinc-900', 'bg-emerald-900/20', 'bg-emerald-800/40', 'bg-emerald-700/60', 'bg-emerald-500'];
                                const intensity = intensities[Math.floor(Math.random() * intensities.length)];
                                return (
                                    <div key={i} className={`aspect-square rounded-lg ${intensity} border border-white/[0.02] hover:border-white/20 transition-all cursor-crosshair group relative`}>
                                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors rounded-lg" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-[#1e1e1e] border border-white/10 rounded text-[8px] font-mono text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                            CHAPTER {i + 1} | SCORE: {Math.floor(Math.random() * 100)}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex justify-between items-center text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">
                            <span>Low Proficiency</span>
                            <div className="flex gap-1.5 px-4 h-2">
                                {['bg-zinc-900', 'bg-emerald-900/20', 'bg-emerald-800/40', 'bg-emerald-700/60', 'bg-emerald-500'].map(c => (
                                    <div key={c} className={`w-8 rounded-full ${c}`} />
                                ))}
                            </div>
                            <span>Critical Mastery</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'error-log' && (
                <div className="bg-[#1e1e1e] border border-white/[0.03] rounded-[2.5rem] overflow-hidden animate-in slide-in-from-right-8 duration-500">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="text-red-500" size={18} />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#9aa0a6]">Active Error Protocol</h3>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all">
                                <Zap size={14} fill="currentColor" /> Initiate Sunday Review
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] font-bold text-[#3c4043] uppercase tracking-widest">
                                    <th className="px-8 py-5">Identified Error</th>
                                    <th className="px-8 py-5">Category</th>
                                    <th className="px-8 py-5">Severity</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="text-[12px] text-[#e8eaed]">
                                {[
                                    { name: 'Collision Mechanics Q-14', cat: 'Calculation', sev: 'High', status: 'Pending' },
                                    { name: 'Integration Limits Error', cat: 'Conceptual', sev: 'Critical', status: 'In-review' },
                                    { name: 'Redox Balancing Step 3', cat: 'Silly Mistake', sev: 'Medium', status: 'Pending' },
                                ].map((err, i) => (
                                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6 font-medium font-mono">{err.name}</td>
                                        <td className="px-8 py-6">
                                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold uppercase tracking-tighter text-[#9aa0a6]">
                                                {err.cat}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`w-2 h-2 rounded-full ${err.sev === 'Critical' ? 'bg-red-500' : err.sev === 'High' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-[#3c4043]">
                                            {err.status}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 text-[#3c4043] hover:text-white transition-colors">
                                                <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-screen bg-black">
            <ResizableSplit
                primary={renderSidebar()}
                secondary={renderMain()}
                initialSize={350}
                minSize={300}
                maxSize={500}
                primaryPosition="start"
            />
        </div>
    );
};
