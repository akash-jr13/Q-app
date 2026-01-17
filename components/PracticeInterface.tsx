
import React, { useState } from 'react';
import {
    Layers,
    Filter,
    FileText,
    Trophy,
    Settings2,
    Database,
    History,
    Zap,
    ArrowRight,
    Clock,
    ChevronRight,
    Search,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { ResizableSplit } from './ResizableSplit';

interface PracticeInterfaceProps {
    onStartTest: (name: string, data: string) => void;
    onExit: () => void;
}

export const PracticeInterface: React.FC<PracticeInterfaceProps> = ({ onExit, onStartTest }) => {
    const [activeTab, setActiveTab] = useState<'bank' | 'simulation' | 'builder'>('bank');
    const [query, setQuery] = useState({
        subject: 'Physics',
        topic: 'Mechanics',
        difficulty: 'Medium',
        source: 'PYQ',
        mode: 'Timed'
    });

    const renderSidebar = () => (
        <div className="h-full bg-[#050505] flex flex-col border-r border-white/[0.03] p-6 space-y-6 select-none">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#3c4043]">
                    <Database size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Dataset Index</span>
                </div>
                <h2 className="text-xl font-medium text-white">Repository</h2>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c4043]" size={14} />
                <input
                    type="text"
                    placeholder="SEARCH MODULES..."
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold text-white uppercase tracking-widest outline-none focus:border-white/20 transition-all placeholder:text-[#3c4043]"
                />
            </div>

            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2 pb-24">
                {['Physics', 'Chemistry', 'Mathematics'].map(subject => (
                    <div key={subject} className="space-y-1">
                        <div className="px-3 py-2 text-[10px] font-bold text-[#3c4043] uppercase tracking-widest">{subject}</div>
                        {['Mechanics', 'Electrostatics', 'Calculus', 'Organic'].slice(0, 3).map(m => (
                            <button key={m} className="w-full text-left p-3 rounded-xl hover:bg-white/[0.02] transition-all group flex items-center justify-between border border-transparent hover:border-white/5">
                                <span className="text-[11px] font-bold text-[#9aa0a6] group-hover:text-white uppercase tracking-widest">{m}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-[#3c4043] group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all">42 Qs</span>
                                    <ChevronRight size={14} className="text-[#3c4043] group-hover:text-white" />
                                </div>
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMain = () => (
        <div className="h-full bg-black p-10 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#3c4043]">
                        <Layers size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Testing Suite v4.0</span>
                    </div>
                    <h1 className="text-4xl font-medium tracking-tight text-white flex items-center gap-3">
                        Practice Matrix
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={onExit} className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#9aa0a6] hover:text-white transition-all">
                        <History size={14} /> Session History
                    </button>
                    <button
                        onClick={() => setActiveTab('builder')}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
                    >
                        <Zap size={14} fill="currentColor" /> Quick Construct
                    </button>
                </div>
            </div>

            {/* Mode Navigation */}
            <div className="flex items-center gap-10 mb-10 border-b border-white/[0.03] pb-4">
                {[
                    { id: 'bank', label: 'Question Bank', icon: Database },
                    { id: 'simulation', label: 'Exam Simulation', icon: Settings2 },
                    { id: 'builder', label: 'Smart Query Builder', icon: Filter },
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

            {activeTab === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    <div className="col-span-full mb-4 flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500"><Zap size={16} /></div>
                        <div>
                            <div className="text-[11px] font-bold text-white uppercase tracking-widest">Recommended Protocol</div>
                            <div className="text-[10px] text-[#9aa0a6]">Based on your recent error log in Mechanics</div>
                        </div>
                        <button className="ml-auto px-6 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors">
                            Start Recovery Session
                        </button>
                    </div>

                    {[
                        { title: 'Physics - Mechanics I', q: 45, time: 60, type: 'Module' },
                        { title: 'Chemistry - Atomic Structure', q: 30, time: 45, type: 'PYQ 2023' },
                        { title: 'Math - Vector Algebra', q: 25, time: 40, type: 'Speed Drill' }
                    ].map((item, i) => (
                        <div key={i} className="bg-[#1e1e1e] border border-white/[0.03] rounded-2xl p-6 hover:border-white/10 transition-all shadow-xl group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-50"><FileText size={120} className="text-white/[0.02]" /></div>

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-white">
                                    <FileText size={20} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">Active</span>
                                </div>
                            </div>

                            <h3 className="text-lg font-medium text-[#e8eaed] mb-1 relative z-10">{item.title}</h3>
                            <div className="text-[10px] text-[#9aa0a6] uppercase tracking-widest mb-6 relative z-10">{item.type}</div>

                            <div className="flex gap-4 text-[10px] font-bold text-[#3c4043] uppercase tracking-widest mb-6 relative z-10">
                                <span className="flex items-center gap-1.5"><Clock size={12} /> {item.time}m</span>
                                <span className="flex items-center gap-1.5"><Trophy size={12} /> {item.q * 4} Marks</span>
                            </div>

                            <div className="relative z-10">
                                <button
                                    onClick={() => onStartTest(item.title, "Mock Data Package")}
                                    className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-black border border-white/5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2"
                                >
                                    Initiate Session <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'builder' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="bg-[#1e1e1e] border border-white/[0.03] rounded-3xl p-10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center">
                                <Filter size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-medium text-white">Logic Construct</h2>
                                <p className="text-[10px] text-[#3c4043] font-bold uppercase tracking-widest">Constructing Boolean Query for Data Extraction</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="space-y-4">
                                <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-[0.2em]">Subject Domain</label>
                                <select
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                                    value={query.subject}
                                    onChange={e => setQuery({ ...query, subject: e.target.value })}
                                >
                                    <option>Physics</option>
                                    <option>Chemistry</option>
                                    <option>Mathematics</option>
                                    <option>Full Mock</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-[0.2em]">Difficulty Coefficient</label>
                                <div className="flex gap-2">
                                    {['Easy', 'Medium', 'Hard'].map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setQuery({ ...query, difficulty: l })}
                                            className={`flex-1 py-3 rounded-xl border transition-all text-[11px] font-bold ${query.difficulty === l ? 'bg-white text-black border-transparent' : 'bg-black/40 border-white/5 text-[#3c4043] hover:text-white'
                                                }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-[0.2em]">Data Source</label>
                                <div className="flex gap-2">
                                    {['PYQ', 'INTERNAL', 'HCV'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setQuery({ ...query, source: s })}
                                            className={`flex-1 py-3 rounded-xl border transition-all text-[11px] font-bold ${query.source === s ? 'bg-emerald-500 text-white border-transparent' : 'bg-black/40 border-white/5 text-[#3c4043] hover:text-white'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-[0.2em]">Testing Mode</label>
                                <div className="flex gap-2">
                                    {['Timed', 'Tutor'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setQuery({ ...query, mode: s })}
                                            className={`flex-1 py-3 rounded-xl border transition-all text-[11px] font-bold ${query.mode === s ? 'bg-blue-500 text-white border-transparent' : 'bg-black/40 border-white/5 text-[#3c4043] hover:text-white'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-6 bg-emerald-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:scale-[1.01] active:scale-95 transition-all">
                            Execute Module Extraction
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'simulation' && (
                <div className="flex flex-col items-center justify-center py-10 animate-in slide-in-from-right-8 duration-500">
                    <div className="max-w-3xl w-full bg-[#1e1e1e] border border-white/[0.03] rounded-[2.5rem] p-12 text-center space-y-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-bold uppercase tracking-widest">
                                <AlertCircle size={12} /> High Fidelity Environment
                            </div>
                            <h2 className="text-4xl font-medium text-white italic">NTA Exam Simulation</h2>
                            <p className="text-[11px] text-[#9aa0a6] font-mono uppercase tracking-[0.1em] max-w-lg mx-auto leading-relaxed">
                                This module replicates the exact UI/UX of the official JEE Main/Advanced computer-based test to calibrate your sensory response to the examination environment.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => onStartTest("JEE MAIN SIMULATION 1", "MOCK_DATA")}
                                className="p-6 bg-black/40 border border-white/10 rounded-2xl hover:bg-white hover:text-black hover:border-white transition-all group text-left"
                            >
                                <div className="flex justify-between mb-4">
                                    <Trophy size={20} className="text-[#3c4043] group-hover:text-black" />
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 group-hover:bg-black/10 px-2 py-1 rounded">3hrs</span>
                                </div>
                                <div className="text-lg font-bold mb-1">JEE Main Full Mock</div>
                                <div className="text-[10px] text-[#9aa0a6] group-hover:text-black/60 font-mono">Standard NTA Protocol</div>
                            </button>
                            <button className="p-6 bg-black/40 border border-white/10 rounded-2xl hover:bg-white hover:text-black hover:border-white transition-all group text-left">
                                <div className="flex justify-between mb-4">
                                    <Zap size={20} className="text-[#3c4043] group-hover:text-black" />
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 group-hover:bg-black/10 px-2 py-1 rounded">6hrs</span>
                                </div>
                                <div className="text-lg font-bold mb-1">JEE Advanced Paper 1+2</div>
                                <div className="text-[10px] text-[#9aa0a6] group-hover:text-black/60 font-mono">Strict Pattern</div>
                            </button>
                        </div>

                        <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/20 text-left">
                            <h4 className="flex items-center gap-2 text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-4">
                                <CheckCircle2 size={14} /> Active Configurations
                            </h4>
                            <div className="grid grid-cols-2 gap-y-2 text-[11px] font-mono text-[#e8eaed]">
                                <span>• Full Screen Enforcement</span>
                                <span>• Question Palette Enabled</span>
                                <span>• On-Screen Calculator (Adv)</span>
                                <span>• Pattern Locked</span>
                            </div>
                        </div>
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
                initialSize={300}
                minSize={250}
                maxSize={500}
                primaryPosition="start"
            />
        </div>
    );
};
