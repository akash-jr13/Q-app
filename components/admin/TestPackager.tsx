import React, { useState, useEffect } from 'react';
import {
    X,
    Search,
    Filter,
    Check,
    Layers,
    Clock,
    FileText,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { CloudService } from '../../utils/cloud';
import { EnhancedQuestion } from '../../types';
import { QuestionDesigner } from './QuestionDesigner';
import { Plus } from 'lucide-react';

interface TestPackagerProps {
    onClose: () => void;
}

export const TestPackager: React.FC<TestPackagerProps> = ({ onClose }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [questions, setQuestions] = useState<EnhancedQuestion[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [testInfo, setTestInfo] = useState({
        title: '',
        duration: 60,
        examName: 'JEE Main',
        year: new Date().getFullYear()
    });

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const cloudQs = await CloudService.getQuestions();
            const localQs = JSON.parse(localStorage.getItem('local_question_bank') || '[]');
            setQuestions([...localQs, ...cloudQs]);
        } catch (e) {
            console.error("Failed to load questions", e);
        }
    };

    const handleAddFromDesigner = (newQ?: EnhancedQuestion) => {
        setIsDesignerOpen(false);
        if (newQ) {
            loadQuestions(); // Sync list
            toggleSelect(newQ.id); // Auto-select what was just made
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleCreate = async () => {
        // Logic to create test package
        alert(`Creating test package: ${testInfo.title}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
            <div className="w-full max-w-5xl h-[85vh] bg-theme-panel border border-theme-primary rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Top Bar */}
                <div className="px-10 py-8 border-b border-theme-primary flex items-center justify-between bg-theme-secondary/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <Layers size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-theme-primary tracking-tighter">Test Packager</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <div className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${step === 1 ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'text-theme-secondary bg-theme-primary'}`}>01. Selection</div>
                                <ChevronRight size={12} className="text-theme-secondary" />
                                <div className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${step === 2 ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'text-theme-secondary bg-theme-primary'}`}>02. Finalization</div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-theme-secondary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Selection Step */}
                {step === 1 && (
                    <div className="flex-1 flex overflow-hidden">
                        {/* Question Browser */}
                        <div className="flex-1 flex flex-col bg-theme-primary/30 p-8">
                            <div className="mb-6 flex gap-4">
                                <div className="flex-1 relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" />
                                    <input
                                        placeholder="Filter question bank..."
                                        className="w-full bg-theme-panel border border-theme-primary rounded-2xl py-3 pl-12 pr-4 text-sm text-theme-primary outline-none focus:border-emerald-500/50 transition-all shadow-theme-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsDesignerOpen(true)}
                                    className="px-6 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-2xl text-xs font-bold transition-all flex items-center gap-2 hover:scale-[1.02]"
                                >
                                    <Plus size={16} /> Quick Add
                                </button>
                                <button className="px-6 bg-theme-panel border border-theme-primary rounded-2xl text-xs font-bold text-theme-secondary hover:text-theme-primary transition-all flex items-center gap-2">
                                    <Filter size={16} /> Advanced
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {questions.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <Search size={48} className="mb-4" />
                                        <span className="text-sm font-medium">No items found in system</span>
                                    </div>
                                ) : (
                                    questions.map(q => (
                                        <div
                                            key={q.id}
                                            onClick={() => toggleSelect(q.id)}
                                            className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${selectedIds.has(q.id)
                                                ? 'bg-emerald-500/5 border-emerald-500/40 shadow-lg'
                                                : 'bg-theme-panel border-theme-primary hover:border-zinc-300 dark:hover:border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.has(q.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-theme-primary'
                                                    }`}>
                                                    {selectedIds.has(q.id) && <Check size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-theme-primary font-medium line-clamp-1">{q.question_text}</p>
                                                    <div className="flex gap-3 mt-1">
                                                        <span className="text-[9px] font-bold text-theme-secondary uppercase">{q.subject}</span>
                                                        <span className="text-[9px] font-bold text-theme-secondary uppercase opacity-50">•</span>
                                                        <span className="text-[9px] font-bold text-theme-secondary uppercase">{q.difficulty}</span>
                                                        {(q as any).is_local && (
                                                            <span className="text-[9px] font-bold text-amber-500 uppercase ml-2 px-1 bg-amber-500/10 rounded">Local Item</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-theme-secondary opacity-0 group-hover:opacity-100 transition-all translate-x-1" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Selection Summary */}
                        <div className="w-80 border-l border-theme-primary bg-theme-secondary/20 p-8 flex flex-col">
                            <h3 className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.2em] mb-6">Package Summary</h3>
                            <div className="flex-1 space-y-4 overflow-y-auto">
                                <StatRow icon={Layers} label="Items Selected" value={selectedIds.size} />
                                <StatRow icon={Clock} label="Est. Duration" value={`${selectedIds.size * 2}m`} />
                                <StatRow icon={FileText} label="Total Points" value={selectedIds.size * 4} />
                            </div>

                            <button
                                disabled={selectedIds.size === 0}
                                onClick={() => setStep(2)}
                                className="mt-auto w-full py-4 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-2 hover:translate-x-1"
                            >
                                Package Data <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Finalization Step */}
                {step === 2 && (
                    <div className="flex-1 p-12 flex items-center justify-center bg-theme-primary/30">
                        <div className="max-w-md w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-theme-primary tracking-tighter mb-2">Configure Package</h3>
                                <p className="text-theme-secondary text-sm">Define how this test appears to students.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest pl-1">Test Title</label>
                                    <input
                                        className="w-full bg-theme-panel border border-theme-primary rounded-2xl py-4 px-6 text-sm text-theme-primary outline-none focus:border-emerald-500/50 shadow-theme-sm"
                                        placeholder="e.g. JEE Full Mock #04"
                                        value={testInfo.title}
                                        onChange={e => setTestInfo({ ...testInfo, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest pl-1">Duration (Min)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-theme-panel border border-theme-primary rounded-2xl py-4 px-6 text-sm text-theme-primary outline-none focus:border-emerald-500/50 shadow-theme-sm"
                                            value={testInfo.duration}
                                            onChange={e => setTestInfo({ ...testInfo, duration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest pl-1">Target Exam</label>
                                        <select className="w-full bg-theme-panel border border-theme-primary rounded-2xl py-4 px-6 text-sm text-theme-primary outline-none shadow-theme-sm">
                                            <option>JEE Main</option>
                                            <option>JEE Advanced</option>
                                            <option>NEET</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-theme-secondary border border-theme-primary rounded-2xl text-xs font-bold text-theme-secondary uppercase tracking-widest hover:text-theme-primary transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20"
                                >
                                    Initialize Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isDesignerOpen && (
                    <QuestionDesigner
                        onClose={() => setIsDesignerOpen(false)}
                        onSave={handleAddFromDesigner}
                    />
                )}
            </div>
        </div>
    );
};

const StatRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
    <div className="p-4 rounded-2xl bg-theme-primary/50 border border-theme-primary flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Icon size={16} className="text-theme-secondary" />
            <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-sm font-black text-theme-primary font-mono">{value}</span>
    </div>
);
