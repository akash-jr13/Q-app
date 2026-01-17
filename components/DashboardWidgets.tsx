
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
    Calendar,
    Zap,
    Plus,
    Save,
    Trash2,
    Settings2
} from 'lucide-react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface WidgetProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    onSettings?: () => void;
    isEditing?: boolean;
    onCloseEditing?: () => void;
}

const Widget: React.FC<WidgetProps> = ({
    title,
    icon,
    children,
    className = "",
    onSettings,
    isEditing,
    onCloseEditing
}) => (
    <div className={`bg-theme-panel rounded-2xl p-6 transition-all duration-300 border border-theme-primary hover:border-zinc-300 dark:hover:border-white/[0.08] shadow-theme-md flex flex-col h-full group ${className}`}>
        <div className="flex items-center justify-between mb-5 shrink-0 drag-handle cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2.5">
                <div className="text-theme-secondary group-hover:text-theme-primary transition-colors duration-300">
                    {icon}
                </div>
                <h3 className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.15em]">{title}</h3>
            </div>
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <button onClick={onCloseEditing} className="text-emerald-500 hover:text-emerald-400 transition-colors p-1">
                        <Save size={14} />
                    </button>
                ) : (
                    onSettings && (
                        <button onClick={onSettings} className="text-[#3c4043] hover:text-[#9aa0a6] transition-colors p-1 opacity-0 group-hover:opacity-100">
                            <Settings2 size={14} />
                        </button>
                    )
                )}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
        </div>
    </div>
);

interface Task {
    id: number;
    text: string;
    completed: boolean;
}

// --- Today Widget ---
export const TodayWidget: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem('widget_tasks');
        return saved ? JSON.parse(saved) : [
            { id: 1, text: "Mechanics: Problems 1-15", completed: true },
            { id: 2, text: "Organic: Review Sn1/Sn2", completed: false },
            { id: 3, text: "Math: Mock Quiz 4", completed: false },
            { id: 4, text: "Physics Lecture Analysis", completed: false },
        ];
    });

    useEffect(() => {
        localStorage.setItem('widget_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addTask = () => {
        const newTask = { id: Date.now(), text: "New Task", completed: false };
        setTasks([...tasks, newTask]);
    };

    const removeTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const updateTaskText = (id: number, text: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t));
    };

    return (
        <Widget
            title="Today's Agenda"
            icon={<Calendar size={14} />}
            onSettings={() => setIsEditing(true)}
            isEditing={isEditing}
            onCloseEditing={() => setIsEditing(false)}
        >
            <div className="space-y-3">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-theme-surface hover:bg-zinc-200 dark:hover:bg-[#252525] transition-all group/item border border-theme-primary hover:border-zinc-300 dark:hover:border-white/[0.05]"
                    >
                        {isEditing ? (
                            <>
                                <input
                                    className="bg-transparent text-[13px] text-theme-primary outline-none flex-1 border-b border-theme-primary focus:border-emerald-500/50"
                                    value={task.text}
                                    onChange={(e) => updateTaskText(task.id, e.target.value)}
                                    autoFocus
                                />
                                <button onClick={() => removeTask(task.id)} className="text-red-500/50 hover:text-red-500 transition-colors">
                                    <Trash2 size={12} />
                                </button>
                            </>
                        ) : (
                            <>
                                <div onClick={() => toggleTask(task.id)} className="cursor-pointer">
                                    {task.completed ?
                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> :
                                        <Circle size={16} className="text-theme-secondary group-hover/item:text-theme-primary shrink-0" />
                                    }
                                </div>
                                <span
                                    onClick={() => toggleTask(task.id)}
                                    className={`text-[13px] transition-all cursor-pointer flex-1 ${task.completed ? 'text-theme-secondary line-through' : 'text-theme-primary'}`}
                                >
                                    {task.text}
                                </span>
                            </>
                        )}
                    </div>
                ))}

                {isEditing && (
                    <button
                        onClick={addTask}
                        className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[10px] text-[#3c4043] hover:text-[#9aa0a6] hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={12} /> Add Task
                    </button>
                )}

                <div className="pt-2 flex justify-between items-center text-[10px] text-[#3c4043] font-bold uppercase tracking-widest px-1">
                    <span>{tasks.filter(t => t.completed).length}/{tasks.length} Completed</span>
                    <span className="text-emerald-500/50">Synced Offline</span>
                </div>
            </div>
        </Widget>
    );
};

interface Resource {
    name: string;
    type: string;
    position: string;
    timestamp: string;
}

// --- Quick Resume Widget ---
export const QuickResumeWidget: React.FC<{ onResume?: () => void }> = ({ onResume }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [resource, setResource] = useState<Resource>(() => {
        const saved = localStorage.getItem('widget_resource');
        return saved ? JSON.parse(saved) : {
            name: "Irodov - Problems in General Physics",
            type: "PDF",
            position: "Page 142",
            timestamp: "Last seen 42m ago"
        };
    });

    useEffect(() => {
        localStorage.setItem('widget_resource', JSON.stringify(resource));
    }, [resource]);

    return (
        <Widget
            title="Quick Resume"
            icon={<Play size={14} fill="currentColor" />}
            onSettings={() => setIsEditing(true)}
            isEditing={isEditing}
            onCloseEditing={() => setIsEditing(false)}
        >
            <div className="flex flex-col h-full bg-theme-surface rounded-xl p-4 border border-theme-primary">
                {isEditing ? (
                    <div className="space-y-3 mb-4">
                        <input
                            className="w-full bg-theme-panel p-2 rounded text-[12px] text-theme-primary outline-none border border-theme-primary focus:border-emerald-500/50"
                            placeholder="Resource Name"
                            value={resource.name}
                            onChange={e => setResource({ ...resource, name: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-theme-panel p-2 rounded text-[12px] text-theme-primary outline-none border border-theme-primary focus:border-emerald-500/50"
                                placeholder="Type (e.g. PDF)"
                                value={resource.type}
                                onChange={e => setResource({ ...resource, type: e.target.value })}
                            />
                            <input
                                className="flex-1 bg-theme-panel p-2 rounded text-[12px] text-theme-primary outline-none border border-theme-primary focus:border-emerald-500/50"
                                placeholder="Position"
                                value={resource.position}
                                onChange={e => setResource({ ...resource, position: e.target.value })}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 space-y-1 mb-4">
                        <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Resource</div>
                        <div className="text-[14px] font-medium text-theme-primary leading-snug line-clamp-2">{resource.name}</div>
                        <div className="flex gap-2 text-[10px] text-theme-secondary font-mono mt-2">
                            <span className="px-1.5 py-0.5 bg-theme-panel rounded border border-theme-primary">{resource.type}</span>
                            <span className="px-1.5 py-0.5 bg-theme-panel rounded border border-theme-primary">{resource.position}</span>
                        </div>
                    </div>
                )}
                <button
                    onClick={onResume}
                    className="w-full py-3.5 bg-theme-primary dark:bg-white hover:bg-zinc-100 dark:hover:bg-[#e8eaed] text-theme-secondary dark:text-black text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl border border-theme-primary"
                >
                    Return to Workspace <ArrowRight size={14} />
                </button>
            </div>
        </Widget>
    );
};

interface FormulaConfig {
    latex: string;
    name: string;
    subject: string;
}

// --- Formula Widget ---
export const FormulaWidget: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [config, setConfig] = useState<FormulaConfig>(() => {
        const saved = localStorage.getItem('widget_formula');
        return saved ? JSON.parse(saved) : {
            latex: "\\int e^{ax} \\sin(bx) \\, dx = \\frac{e^{ax}}{a^2+b^2}(a \\sin bx - b \\cos bx) + C",
            name: "Integration by Parts",
            subject: 'Physics'
        };
    });

    useEffect(() => {
        localStorage.setItem('widget_formula', JSON.stringify(config));
    }, [config]);

    return (
        <Widget
            title="Formula Laboratory"
            icon={<BookOpen size={14} />}
            onSettings={() => setIsEditing(true)}
            isEditing={isEditing}
            onCloseEditing={() => setIsEditing(false)}
        >
            <div className="flex flex-col h-full">
                <div className="flex gap-2 mb-4 shrink-0">
                    {['Physics', 'Chemistry', 'Math'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setConfig({ ...config, subject: s })}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter transition-all ${config.subject === s ? 'bg-white text-black' : 'text-[#3c4043] border border-white/5 hover:text-[#9aa0a6]'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex-1 flex flex-col justify-center items-center bg-theme-surface rounded-xl p-6 border border-theme-primary relative overflow-hidden group/formula">
                    {isEditing ? (
                        <div className="w-full space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-[#3c4043] font-bold uppercase tracking-widest">Latex Code</label>
                                <textarea
                                    className="w-full h-24 bg-black/40 p-3 rounded text-[12px] text-emerald-500 font-mono outline-none border border-white/5 focus:border-emerald-500/50 resize-none"
                                    value={config.latex}
                                    onChange={e => setConfig({ ...config, latex: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-[#3c4043] font-bold uppercase tracking-widest">Formula Name</label>
                                <input
                                    className="w-full bg-black/40 p-2 rounded text-[12px] text-white outline-none border border-white/5 focus:border-emerald-500/50"
                                    value={config.name}
                                    onChange={e => setConfig({ ...config, name: e.target.value })}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="text-[#e8eaed] text-center mb-4 transition-transform duration-500 group-hover/formula:scale-105">
                                <BlockMath math={config.latex} />
                            </div>
                            <div className="text-[10px] text-[#3c4043] font-bold uppercase tracking-widest text-center border-t border-white/5 pt-3 w-full">
                                {config.name}
                            </div>
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] text-[#3c4043]">
                                <RotateCcw size={8} />
                                <span>LATEST REVISION</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Widget>
    );
};

interface Milestone {
    name: string;
    days: number;
    color: string;
}

// --- Countdown Widget ---
export const CountdownWidget: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [events, setEvents] = useState<Milestone[]>(() => {
        const saved = localStorage.getItem('widget_events');
        return saved ? JSON.parse(saved) : [
            { name: "JEE Main (Session 1)", days: 42, color: "text-emerald-500" },
            { name: "Unit Test: Electrostatics", days: 4, color: "text-blue-500" },
            { name: "JEE Advanced", days: 124, color: "text-zinc-500" }
        ];
    });

    useEffect(() => {
        localStorage.setItem('widget_events', JSON.stringify(events));
    }, [events]);

    const addEvent = () => {
        setEvents([...events, { name: "New Event", days: 0, color: "text-white" }]);
    };

    const removeEvent = (index: number) => {
        setEvents(events.filter((_, i) => i !== index));
    };

    const updateEvent = (index: number, field: keyof Milestone, value: any) => {
        setEvents(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
    };

    return (
        <Widget
            title="Milestone Track"
            icon={<Clock size={14} />}
            onSettings={() => setIsEditing(true)}
            isEditing={isEditing}
            onCloseEditing={() => setIsEditing(false)}
        >
            <div className="space-y-5 py-2">
                {events.map((event, i) => (
                    <div key={i} className="flex items-center justify-between group/event border-b border-white/[0.02] pb-4 last:border-0">
                        {isEditing ? (
                            <div className="flex-1 space-y-2 pr-4">
                                <input
                                    className="w-full bg-white/5 p-1.5 rounded text-[12px] text-white outline-none border border-white/5 focus:border-emerald-500/50"
                                    value={event.name}
                                    onChange={e => updateEvent(i, 'name', e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className="w-20 bg-white/5 p-1.5 rounded text-[12px] text-emerald-500 outline-none border border-white/5 focus:border-emerald-500/50"
                                        value={event.days}
                                        onChange={e => updateEvent(i, 'days', parseInt(e.target.value) || 0)}
                                    />
                                    <button onClick={() => removeEvent(i)} className="text-red-500/50 hover:text-red-500 transition-colors ml-auto">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-0.5">
                                    <div className="text-[12px] text-theme-primary font-medium leading-none">{event.name}</div>
                                    <div className="text-[9px] text-theme-secondary font-bold uppercase tracking-widest">{event.days > 30 ? 'Normal Alert' : 'Priority Alpha'}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-black font-mono tracking-tighter ${event.color}`}>{event.days}</div>
                                    <div className="text-[8px] text-[#3c4043] font-bold uppercase tracking-tighter">DAYS LEFT</div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {isEditing && (
                    <button
                        onClick={addEvent}
                        className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[10px] text-[#3c4043] hover:text-[#9aa0a6] hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={12} /> Add Milestone
                    </button>
                )}
            </div>
        </Widget>
    );
};

// --- Stats Widget ---
export const StatsWidget: React.FC = () => {
    const [data] = useState<number[]>(() => {
        const saved = localStorage.getItem('widget_stats');
        return saved ? JSON.parse(saved) : [65, 45, 120, 85, 95, 110, 70];
    });

    const [streak, setStreak] = useState<number>(() => {
        const saved = localStorage.getItem('widget_streak');
        return saved ? parseInt(saved) : 12;
    });

    useEffect(() => {
        localStorage.setItem('widget_stats', JSON.stringify(data));
        localStorage.setItem('widget_streak', streak.toString());
    }, [data, streak]);

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
                    <div className="space-y-1 group/streak cursor-pointer" onClick={() => setStreak(streak + 1)}>
                        <div className="text-[20px] font-black font-mono text-white leading-none group-hover/streak:text-emerald-500 transition-colors">{streak}</div>
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
    const [isEditing, setIsEditing] = useState(false);
    const [duration, setDuration] = useState<number>(() => {
        const saved = localStorage.getItem('widget_focus_duration');
        return saved ? parseInt(saved) : 25;
    });
    const [timeLeft, setTimeLeft] = useState<number>(duration * 60);
    const [isActive, setIsActive] = useState<boolean>(false);

    useEffect(() => {
        if (!isActive) {
            setTimeLeft(duration * 60);
        }
    }, [duration, isActive]);

    useEffect(() => {
        localStorage.setItem('widget_focus_duration', duration.toString());
    }, [duration]);

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
        <Widget
            title="Focus Protocol"
            icon={<Clock size={14} />}
            onSettings={() => setIsEditing(true)}
            isEditing={isEditing}
            onCloseEditing={() => setIsEditing(false)}
        >
            <div className="flex flex-col items-center justify-center h-full py-4">
                {isEditing ? (
                    <div className="text-center space-y-4">
                        <div className="text-[10px] text-[#3c4043] font-bold uppercase tracking-widest">Target Duration (Min)</div>
                        <input
                            type="number"
                            className="text-4xl font-mono text-emerald-500 bg-transparent border-b border-white/10 w-32 text-center outline-none"
                            value={duration}
                            onChange={e => setDuration(parseInt(e.target.value) || 0)}
                        />
                    </div>
                ) : (
                    <>
                        <div className="text-4xl font-mono text-theme-primary mb-6 font-medium bg-theme-surface px-6 py-3 rounded-2xl border border-theme-primary tracking-tighter">
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
                                onClick={() => { setIsActive(false); setTimeLeft(duration * 60); }}
                                className="p-3 bg-[#121212] rounded-xl text-[#3c4043] hover:text-[#e8eaed] transition-colors border border-white/5"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Widget>
    );
};
