
import React, { useState, useEffect } from 'react';
import {
    Play,
    TrendingUp,
    Clock,
    BookOpen,
    ArrowRight,
    RotateCcw,
    CheckCircle2,
    Circle,
    MoreVertical,
    Calendar,
    Zap
} from 'lucide-react';

interface WidgetProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    onSettings?: () => void;
}

const Widget: React.FC<WidgetProps> = ({ title, icon, children, className = "", onSettings }) => (
    <div className={`bg-[#1e1e1e] rounded-2xl p-6 transition-all duration-300 border border-white/[0.03] hover:border-white/[0.08] shadow-2xl flex flex-col h-full group ${className}`}>
        <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-2.5">
                <div className="text-[#9aa0a6] group-hover:text-white transition-colors duration-300">
                    {icon}
                </div>
                <h3 className="text-[11px] font-bold text-[#9aa0a6] uppercase tracking-[0.15em]">{title}</h3>
            </div>
            {onSettings && (
                <button onClick={onSettings} className="text-[#3c4043] hover:text-[#9aa0a6] transition-colors p-1">
                    <MoreVertical size={14} />
                </button>
            )}
        </div>
        <div className="flex-1 overflow-hidden">
            {children}
        </div>
    </div>
);

// --- Today Widget ---
export const TodayWidget: React.FC = () => {
    const [tasks, setTasks] = useState([
        { id: 1, text: "Mechanics: Problems 1-15", completed: true },
        { id: 2, text: "Organic: Review Sn1/Sn2", completed: false },
        { id: 3, text: "Math: Mock Quiz 4", completed: false },
        { id: 4, text: "Physics Lecture Analysis", completed: false },
    ]);

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <Widget title="Today's Agenda" icon={<Calendar size={14} />}>
            <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#121212]/50 hover:bg-[#252525] transition-all cursor-pointer group/item border border-transparent hover:border-white/[0.05]"
                    >
                        {task.completed ?
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> :
                            <Circle size={16} className="text-[#3c4043] group-hover/item:text-[#9aa0a6] shrink-0" />
                        }
                        <span className={`text-[13px] transition-all ${task.completed ? 'text-[#3c4043] line-through' : 'text-[#e8eaed]'}`}>
                            {task.text}
                        </span>
                    </div>
                ))}
                <div className="pt-2 flex justify-between items-center text-[10px] text-[#3c4043] font-bold uppercase tracking-widest px-1">
                    <span>{tasks.filter(t => t.completed).length}/{tasks.length} Completed</span>
                    <span className="text-emerald-500/50">Synced with Planner</span>
                </div>
            </div>
        </Widget>
    );
};

// --- Quick Resume Widget ---
export const QuickResumeWidget: React.FC<{ onResume?: () => void }> = ({ onResume }) => {
    const lastResource = {
        name: "Irodov - Problems in General Physics",
        type: "PDF",
        position: "Page 142",
        timestamp: "Last seen 42m ago"
    };

    return (
        <Widget title="Quick Resume" icon={<Play size={14} fill="currentColor" />}>
            <div className="flex flex-col h-full bg-[#121212]/30 rounded-xl p-4 border border-white/[0.02]">
                <div className="flex-1 space-y-1 mb-4">
                    <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Resource</div>
                    <div className="text-[14px] font-medium text-[#e8eaed] leading-snug line-clamp-2">{lastResource.name}</div>
                    <div className="flex gap-2 text-[10px] text-[#9aa0a6] font-mono mt-2">
                        <span className="px-1.5 py-0.5 bg-white/5 rounded">{lastResource.type}</span>
                        <span className="px-1.5 py-0.5 bg-white/5 rounded">{lastResource.position}</span>
                    </div>
                </div>
                <button
                    onClick={onResume}
                    className="w-full py-3.5 bg-white hover:bg-[#e8eaed] text-black text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-white/5"
                >
                    Return to Workspace <ArrowRight size={14} />
                </button>
            </div>
        </Widget>
    );
};

// --- Formula Widget ---
export const FormulaWidget: React.FC = () => {
    const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Math'>('Physics');

    return (
        <Widget
            title="Formula of the Hour"
            icon={<BookOpen size={14} />}
            onSettings={() => { }}
        >
            <div className="flex flex-col h-full">
                <div className="flex gap-2 mb-4 shrink-0">
                    {['Physics', 'Chemistry', 'Math'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setSubject(s as any)}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter transition-all ${subject === s ? 'bg-white text-black' : 'text-[#3c4043] border border-white/5 hover:text-[#9aa0a6]'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex-1 flex flex-col justify-center items-center bg-[#121212] rounded-xl p-6 border border-white/5 relative overflow-hidden">
                    <div className="text-[#e8eaed] text-lg font-serif italic text-center mb-2">
                        {"∫ e^{ax} sin(bx) dx"}
                    </div>
                    <div className="text-[10px] text-[#3c4043] font-bold uppercase tracking-widest text-center border-t border-white/5 pt-3 w-full">
                        Integration by Parts
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] text-[#3c4043]">
                        <RotateCcw size={8} />
                        <span>RESYNC IN 14M</span>
                    </div>
                </div>
            </div>
        </Widget>
    );
};

// --- Countdown Widget ---
export const CountdownWidget: React.FC = () => {
    const events = [
        { name: "JEE Main (Session 1)", days: 42, color: "text-emerald-500" },
        { name: "Unit Test: Electrostatics", days: 4, color: "text-blue-500" },
        { name: "JEE Advanced", days: 124, color: "text-zinc-500" }
    ];

    return (
        <Widget title="Milestone Track" icon={<Clock size={14} />}>
            <div className="space-y-5 py-2">
                {events.map((event, i) => (
                    <div key={i} className="flex items-center justify-between group/event">
                        <div className="space-y-0.5">
                            <div className="text-[12px] text-[#e8eaed] font-medium leading-none">{event.name}</div>
                            <div className="text-[9px] text-[#3c4043] font-bold uppercase tracking-widest">{event.days > 30 ? 'Normal Alert' : 'Priority Alpha'}</div>
                        </div>
                        <div className="text-right">
                            <div className={`text-2xl font-black font-mono tracking-tighter ${event.color}`}>{event.days}</div>
                            <div className="text-[8px] text-[#3c4043] font-bold uppercase tracking-tighter">DAYS LEFT</div>
                        </div>
                    </div>
                ))}
            </div>
        </Widget>
    );
};

// --- Stats Widget ---
export const StatsWidget: React.FC = () => {
    const data = [65, 45, 120, 85, 95, 110, 70];
    const max = Math.max(...data);

    return (
        <Widget title="Productivity Matrix" icon={<TrendingUp size={14} />}>
            <div className="flex flex-col h-full">
                <div className="flex-1 flex items-end gap-1.5 px-1 py-4">
                    {data.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                            <div
                                className="w-full bg-[#2a2a2a] rounded-t-sm group-hover/bar:bg-[#3c4043] transition-all relative overflow-hidden"
                                style={{ height: `${(h / max) * 100}%` }}
                            >
                                {i === 2 && <div className="absolute inset-0 bg-emerald-500/10" />}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                    <div className="space-y-1">
                        <div className="text-[20px] font-black font-mono text-white leading-none">12</div>
                        <div className="text-[9px] text-[#3c4043] font-bold uppercase tracking-widest">Study Streak</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-1">
                            {[1, 1, 1, 1, 1, 0, 0].map((v, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-emerald-500' : 'bg-[#1e1e1e]'}`} />
                            ))}
                        </div>
                        <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                            <Zap size={8} fill="currentColor" /> ACTIVE MODE
                        </span>
                    </div>
                </div>
            </div>
        </Widget>
    );
};

// --- Focus Timer ---
export const FocusTimerWidget: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Widget title="Focus Protocol" icon={<Clock size={14} />}>
            <div className="flex flex-col items-center justify-center h-full py-4">
                <div className="text-4xl font-mono text-white mb-6 font-medium bg-[#121212] px-6 py-3 rounded-2xl border border-white/5 tracking-tighter">
                    {formatTime(timeLeft)}
                </div>
                <div className="flex gap-3 w-full">
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${isActive
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-lg shadow-red-500/5'
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5'
                            }`}
                    >
                        {isActive ? 'Abort Focus' : 'Initiate Focus'}
                    </button>
                    <button
                        onClick={() => { setIsActive(false); setTimeLeft(25 * 60); }}
                        className="p-3 bg-[#121212] rounded-xl text-[#3c4043] hover:text-[#e8eaed] transition-colors border border-white/5"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>
        </Widget>
    );
};
