import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    FilePlus2,
    Layers,
    Database,
    ChevronLeft,
    Search,
    Filter,
    Plus,
    Settings,
    Edit2,
    Trash2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { CloudService } from '../../utils/cloud';
import { EnhancedQuestion, QuestionStats } from '../../types';
import { QuestionDesigner } from './QuestionDesigner';
import { TestPackager } from './TestPackager';

type AdminTab = 'overview' | 'questions' | 'tests' | 'config';

export const AdminInterface: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [stats, setStats] = useState<QuestionStats | null>(null);
    const [questions, setQuestions] = useState<EnhancedQuestion[]>([]);
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [isPackagerOpen, setIsPackagerOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<EnhancedQuestion | null>(null);

    useEffect(() => {
        loadAllData();
    }, [activeTab]);

    const loadAllData = async () => {
        // Load Stats
        const s = await CloudService.getQuestionStats();

        // Load Questions (Cloud + Local)
        const cloudQuestions = await CloudService.getQuestions();
        const localQuestions = JSON.parse(localStorage.getItem('local_question_bank') || '[]');

        const allQuestions = [...localQuestions, ...cloudQuestions];
        setQuestions(allQuestions);

        if (s) {
            setStats({
                ...s,
                total_questions: allQuestions.length
            });
        }
    };

    const SidebarItem = ({ id, icon: Icon, label }: { id: AdminTab, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] transition-all group ${activeTab === id
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg'
                : 'text-theme-secondary hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
        >
            <Icon size={18} />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-theme-primary overflow-hidden transition-colors">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-theme-primary bg-theme-secondary flex flex-col p-4">
                <div className="mb-8 px-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                        <Settings size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-theme-primary tracking-tight">Admin Portal</span>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Control Alpha</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <SidebarItem id="overview" icon={BarChart3} label="System Overview" />
                    <SidebarItem id="questions" icon={FilePlus2} label="Question Bank" />
                    <SidebarItem id="tests" icon={Layers} label="Test Packaging" />
                    <SidebarItem id="config" icon={Database} label="Cloud Config" />
                </nav>

                <div className="p-2 border-t border-theme-primary mt-auto">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full flex items-center gap-3 px-3 py-2 text-[12px] text-theme-secondary hover:text-theme-primary transition-colors"
                    >
                        <ChevronLeft size={16} />
                        <span>Return to App</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-theme-primary p-8">
                {activeTab === 'overview' && (
                    <div className="max-w-6xl mx-auto space-y-8">
                        <header className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-theme-primary tracking-tighter">Overview</h1>
                                <p className="text-theme-secondary text-sm">System performance and content metrics.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDesignerOpen(true)}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <Plus size={16} /> New Question
                                </button>
                            </div>
                        </header>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard label="Total Questions" value={stats?.total_questions || 0} color="emerald" />
                            <StatCard label="Live Tests" value={0} color="blue" />
                            <StatCard label="Active Users" value={0} color="purple" />
                            <StatCard label="Accuracy Avg" value="0%" color="orange" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-theme-secondary border border-theme-primary rounded-2xl p-6 shadow-theme-sm">
                                    <h3 className="text-sm font-bold text-theme-primary mb-4 uppercase tracking-widest">Recent Activity</h3>
                                    <div className="space-y-4">
                                        <p className="text-[12px] text-theme-secondary italic text-center py-8">No recent activity detected.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-theme-secondary border border-theme-primary rounded-2xl p-6 shadow-theme-sm">
                                    <h3 className="text-sm font-bold text-theme-primary mb-4 uppercase tracking-widest">Subject Distribution</h3>
                                    {/* Placeholder for chart */}
                                    <div className="h-48 flex items-center justify-center border border-dashed border-theme-primary rounded-xl">
                                        <BarChart3 className="text-theme-secondary opacity-20" size={48} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'questions' && (
                    <div className="max-w-6xl mx-auto space-y-6">
                        <header className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-theme-primary tracking-tighter">Question Bank</h1>
                                <p className="text-theme-secondary text-sm">Manage your repository of test items.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDesignerOpen(true)}
                                    className="px-6 py-3 bg-zinc-900 text-white dark:bg-white dark:text-black hover:scale-[1.02] active:scale-95 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl"
                                >
                                    Create New Item
                                </button>
                            </div>
                        </header>

                        {/* Filters & Search */}
                        <div className="flex gap-4 items-center bg-theme-secondary p-4 rounded-2xl border border-theme-primary shadow-theme-sm">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary" />
                                <input
                                    placeholder="Search by text or tag..."
                                    className="w-full bg-theme-primary border border-theme-primary rounded-xl py-2.5 pl-10 pr-4 text-sm text-theme-primary outline-none focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-theme-primary border border-theme-primary rounded-xl text-xs font-bold text-theme-secondary hover:text-theme-primary transition-all">
                                <Filter size={16} /> Filters
                            </button>
                        </div>

                        {/* Question List Placeholder */}
                        <div className="bg-theme-secondary border border-theme-primary rounded-2xl overflow-hidden shadow-theme-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-theme-primary bg-theme-primary/50">
                                        <th className="px-6 py-4 text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Question</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Subject</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Difficulty</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Metrics</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.length === 0 ? (
                                        <tr className="border-b border-theme-primary/40 text-center">
                                            <td colSpan={5} className="py-20 text-theme-secondary text-sm italic">
                                                No questions found in system.
                                            </td>
                                        </tr>
                                    ) : (
                                        questions.map(q => (
                                            <tr key={q.id} className="border-b border-theme-primary/30 hover:bg-theme-primary/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-medium text-theme-primary line-clamp-1">{q.question_text}</span>
                                                        {(q as any).is_local && (
                                                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded w-fit">Local Store</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-theme-secondary">{q.subject}</td>
                                                <td className="px-6 py-4 text-xs text-theme-secondary">{q.difficulty}</td>
                                                <td className="px-6 py-4 text-xs text-theme-secondary">0 Attempts</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingQuestion(q);
                                                                setIsDesignerOpen(true);
                                                            }}
                                                            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-theme-secondary transition-all"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-red-500 transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'tests' && (
                    <div className="max-w-6xl mx-auto">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold text-theme-primary tracking-tighter">Test Packaging</h1>
                            <p className="text-theme-secondary text-sm">Bundle questions into professional exam papers.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-theme-primary rounded-[2rem] bg-theme-secondary/50">
                                    <Layers size={48} className="text-theme-secondary opacity-20 mb-4" />
                                    <h3 className="text-lg font-bold text-theme-primary mb-2">No Test Packages</h3>
                                    <p className="text-theme-secondary text-sm text-center max-w-sm mb-6">Create your first test package by selecting questions from the bank and setting properties.</p>
                                    <button
                                        onClick={() => setIsPackagerOpen(true)}
                                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                                    >
                                        Start New Package
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-theme-secondary border border-theme-primary rounded-2xl p-6 shadow-theme-sm">
                                    <h3 className="text-sm font-bold text-theme-primary mb-4 uppercase tracking-widest">Active Series</h3>
                                    <div className="space-y-3">
                                        <p className="text-[12px] text-theme-secondary">Test series allows you to group multiple test papers into a subscription or module.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="max-w-3xl mx-auto space-y-8">
                        <header>
                            <h1 className="text-3xl font-bold text-theme-primary tracking-tighter">Cloud Configuration</h1>
                            <p className="text-theme-secondary text-sm">Verify and update your system uplink.</p>
                        </header>

                        <div className="space-y-6">
                            <div className="bg-theme-secondary border border-theme-primary rounded-3xl p-8 shadow-theme-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                                            <Database size={24} className="text-theme-secondary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-theme-primary">Supabase Uplink</h4>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${CloudService.isConfigured() ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {CloudService.isConfigured() ? 'Connected & Operational' : 'Offline / Restricted'}
                                            </span>
                                        </div>
                                    </div>
                                    {CloudService.isConfigured() ? (
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                    ) : (
                                        <AlertCircle size={24} className="text-amber-500" />
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-theme-primary border border-theme-primary">
                                            <span className="text-[10px] text-theme-secondary font-bold uppercase block mb-1">API Status</span>
                                            <span className="text-sm font-mono text-theme-primary">200 OK</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-theme-primary border border-theme-primary">
                                            <span className="text-[10px] text-theme-secondary font-bold uppercase block mb-1">CDN Sync</span>
                                            <span className="text-sm font-mono text-theme-primary">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Overlays */}
            {isDesignerOpen && (
                <QuestionDesigner
                    onClose={() => setIsDesignerOpen(false)}
                    editingQuestion={editingQuestion}
                    onSave={() => { setIsDesignerOpen(false); loadAllData(); }}
                />
            )}

            {isPackagerOpen && (
                <TestPackager
                    onClose={() => setIsPackagerOpen(false)}
                />
            )}
        </div>
    );
};

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-500',
        blue: 'text-blue-500',
        purple: 'text-purple-500',
        orange: 'text-orange-500'
    };

    return (
        <div className="bg-theme-secondary border border-theme-primary rounded-2xl p-6 shadow-theme-sm group hover:scale-[1.02] transition-all hover:shadow-md">
            <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-[0.15em] mb-2 block">{label}</span>
            <div className={`text-3xl font-black font-mono tracking-tighter ${colors[color] || 'text-theme-primary'}`}>
                {value}
            </div>
        </div>
    );
};
