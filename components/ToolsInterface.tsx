
import React, { useState } from 'react';
import {
    PenTool,
    Watch,
    Calendar,
    Settings2,
    Plus,
    ChevronRight,
    Maximize2,
    Minimize2,
    Zap,
    ArrowRight
} from 'lucide-react';
import { CanvasInterface } from './CanvasInterface';

export const ToolsInterface: React.FC = () => {
    const [activeTool, setActiveTool] = useState<'scratchpad' | 'timer' | 'planner'>('scratchpad');
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-[#e8eaed] flex flex-col overflow-hidden">
            {/* Tools Top Bar */}
            <div className="h-20 shrink-0 border-b border-white/[0.03] px-10 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-xl z-20">
                <div className="flex items-center gap-6">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[#3c4043]">
                            <Settings2 size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono">Utility Protocol</span>
                        </div>
                        <h1 className="text-xl font-medium tracking-tight text-white flex items-center gap-3">
                            Modular Toolshelf
                        </h1>
                    </div>

                    <div className="h-8 w-[1px] bg-white/5 mx-2" />

                    <nav className="flex items-center gap-2 bg-[#1e1e1e]/50 p-1 rounded-xl border border-white/5">
                        {[
                            { id: 'scratchpad', label: 'Scratchpad', icon: PenTool },
                            { id: 'timer', label: 'Focus Lab', icon: Watch },
                            { id: 'planner', label: 'Goal Engine', icon: Calendar },
                        ].map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all uppercase tracking-widest ${activeTool === tool.id ? 'bg-[#3c4043] text-white shadow-lg' : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                                    }`}
                            >
                                <tool.icon size={14} />
                                {tool.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2.5 bg-[#1e1e1e] border border-white/5 rounded-xl text-[#9aa0a6] hover:text-white transition-all shadow-xl"
                        title="Toggle Explorer"
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Tools Content Area */}
            <div className="flex-1 relative overflow-hidden bg-[#000000]">
                {activeTool === 'scratchpad' && (
                    <div className="h-full w-full relative animate-in fade-in duration-500">
                        <CanvasInterface onExit={() => { }} />
                    </div>
                )}

                {activeTool === 'timer' && (
                    <div className="h-full w-full flex items-center justify-center p-20 animate-in zoom-in-95 duration-500">
                        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-medium tracking-tight text-white">Focus Lab</h2>
                                    <p className="text-[#3c4043] font-mono text-xs uppercase tracking-[0.2em]">Systematic Cognitive Session</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[25, 50, 90, 120].map(min => (
                                        <button key={min} className="p-6 bg-[#1e1e1e] border border-white/5 rounded-2xl hover:border-emerald-500/50 transition-all text-left group">
                                            <div className="text-2xl font-mono text-white mb-2 group-hover:text-emerald-500 transition-colors">{min}m</div>
                                            <div className="text-[10px] text-[#3c4043] font-bold uppercase tracking-widest">Protocol {min === 25 ? 'Pomodoro' : 'Deep Work'}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#1e1e1e] rounded-3xl border border-white/[0.03] p-10 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 animate-pulse bg-emerald-500/20" />
                                <div className="text-[120px] font-mono text-white leading-none tracking-tighter mb-8">25:00</div>
                                <button className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all">
                                    Initiate Protocol
                                </button>
                                <div className="mt-8 flex items-center gap-2 text-[#3c4043] font-bold text-[10px] uppercase tracking-widest">
                                    <Zap size={10} fill="currentColor" /> Next: 5m Short Break
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'planner' && (
                    <div className="h-full w-full flex items-center justify-center p-20 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="w-full max-w-5xl bg-[#1e1e1e] rounded-[2.5rem] border border-white/[0.03] overflow-hidden shadow-2xl flex flex-col h-[70vh]">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-white" size={20} />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#9aa0a6]">Strategic Milestone Planner</h3>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all hover:shadow-lg active:scale-95">
                                    <Plus size={14} /> New Objective
                                </button>
                            </div>

                            <div className="flex-1 p-8 grid grid-cols-3 gap-8 overflow-y-auto custom-scrollbar">
                                {['In-Progress', 'Optimized', 'Historical'].map((col) => (
                                    <div key={col} className="space-y-6">
                                        <div className="flex items-center justify-between text-[#3c4043] font-bold text-[10px] uppercase tracking-[0.2em] px-2">
                                            <span>{col}</span>
                                            <span>{col === 'In-Progress' ? '02' : '00'}</span>
                                        </div>

                                        {col === 'In-Progress' && (
                                            <>
                                                <div className="bg-black/40 p-5 rounded-2xl border border-white/[0.02] space-y-4 hover:border-white/10 transition-colors group">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-[13px] font-medium text-[#e8eaed]">Calculus Mastery</h4>
                                                        <ChevronRight size={14} className="text-[#3c4043] group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[9px] font-bold text-[#3c4043]">
                                                            <span>Required: 4.5h/day</span>
                                                            <span className="text-emerald-500">ETA: Nov 30</span>
                                                        </div>
                                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 w-[65%]" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-black/40 p-5 rounded-2xl border border-white/[0.02] space-y-4 hover:border-white/10 transition-colors group">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-[13px] font-medium text-[#e8eaed]">Optics Revision</h4>
                                                        <ChevronRight size={14} className="text-[#3c4043] group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[9px] font-bold text-[#3c4043]">
                                                            <span>Required: 2h/day</span>
                                                            <span className="text-blue-500">ETA: Jan 15</span>
                                                        </div>
                                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 w-[30%]" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <button className="w-full py-4 border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[#3c4043] hover:text-[#9aa0a6] hover:border-white/10 transition-all">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Bottom Status for Tools */}
            <footer className="h-10 bg-[#050505] border-t border-white/[0.03] px-6 flex items-center justify-between z-20">
                <div className="flex gap-6 text-[9px] font-mono font-bold text-[#3c4043] uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><PenTool size={10} /> Latency: 4ms</div>
                    <div className="flex items-center gap-1.5"><Watch size={10} /> Active Session: 1h 42m</div>
                </div>
                <div className="text-[9px] font-mono font-bold text-[#3c4043] uppercase tracking-widest flex items-center gap-2">
                    Ready for Strategic Deployment <ArrowRight size={10} />
                </div>
            </footer>
        </div>
    );
};
