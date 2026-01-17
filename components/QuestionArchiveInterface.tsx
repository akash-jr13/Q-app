
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Save,
    Tag,
    Search,
    Database,
    CheckCircle2,
    X,
    Loader2,
    BookOpen,
    HelpCircle,
    Trash2,
    Edit3
} from 'lucide-react';
import { CloudService } from '../utils/cloud';

export const QuestionArchiveInterface: React.FC = () => {
    const [mode, setMode] = useState<'browse' | 'create'>('browse');
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [searchFilters, setSearchFilters] = useState({
        subject: '',
        topic: '',
        difficulty: '',
        tagInput: '',
        tags: [] as string[]
    });

    // Create State
    const [newQuestion, setNewQuestion] = useState({
        question_text: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: '',
        subject: 'Physics',
        topic: '',
        difficulty: 'Medium',
        tags: [] as string[]
    });
    const [currentTag, setCurrentTag] = useState('');

    useEffect(() => {
        if (mode === 'browse') {
            fetchQuestions();
        }
    }, [mode, searchFilters.subject, searchFilters.difficulty]);

    const fetchQuestions = async () => {
        setIsLoading(true);
        const data = await CloudService.getQuestions({
            subject: searchFilters.subject || undefined,
            difficulty: searchFilters.difficulty || undefined,
            tags: searchFilters.tags.length > 0 ? searchFilters.tags : undefined
        });
        setQuestions(data);
        setIsLoading(false);
    };

    const handleArchive = async () => {
        const token = localStorage.getItem('supabase_token');
        if (!token) return alert("Session expired. Please log in.");

        if (!newQuestion.question_text || newQuestion.options.some(o => !o)) {
            return alert("Please fill all required fields.");
        }

        setIsLoading(true);
        const success = await CloudService.archiveQuestion(token, newQuestion);
        if (success) {
            alert("Question Archived Successfully!");
            setMode('browse');
            setNewQuestion({
                question_text: '',
                options: ['', '', '', ''],
                correct_index: 0,
                explanation: '',
                subject: 'Physics',
                topic: '',
                difficulty: 'Medium',
                tags: [] as string[]
            });
        } else {
            alert("Failed to archive question.");
        }
        setIsLoading(false);
    };

    const addTag = (toSearch = false) => {
        if (!currentTag.trim()) return;
        if (toSearch) {
            if (!searchFilters.tags.includes(currentTag.trim())) {
                setSearchFilters({ ...searchFilters, tags: [...searchFilters.tags, currentTag.trim()] });
            }
        } else {
            if (!newQuestion.tags.includes(currentTag.trim())) {
                setNewQuestion({ ...newQuestion, tags: [...newQuestion.tags, currentTag.trim()] });
            }
        }
        setCurrentTag('');
    };

    const removeTag = (tag: string, fromSearch = false) => {
        if (fromSearch) {
            setSearchFilters({ ...searchFilters, tags: searchFilters.tags.filter(t => t !== tag) });
        } else {
            setNewQuestion({ ...newQuestion, tags: newQuestion.tags.filter(t => t !== tag) });
        }
    };

    return (
        <div className="h-full bg-black flex flex-col font-sans text-[#e8eaed]">
            {/* Header */}
            <div className="shrink-0 h-20 border-b border-white/[0.03] px-8 flex items-center justify-between bg-[#0a0a0a]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                        <Database size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight uppercase">Central Archive</h1>
                        <p className="text-[10px] font-mono text-[#5f6368] uppercase tracking-[0.2em]">Question Repository v1.0</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setMode('browse')}
                        className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${mode === 'browse' ? 'bg-white text-black' : 'bg-[#1e1e1e] text-[#9aa0a6] hover:text-white'}`}
                    >
                        Browse Matrix
                    </button>
                    <button
                        onClick={() => setMode('create')}
                        className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'create' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}
                    >
                        <Plus size={14} /> Archive New
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#050505]">
                    {mode === 'browse' ? (
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Search & Filter Bar */}
                            <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6 flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px] space-y-2">
                                    <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">Global Search</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c4043]" />
                                        <input
                                            type="text"
                                            placeholder="KEYWORDS..."
                                            className="w-full bg-black border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-[11px] text-white outline-none focus:border-white/20 uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="w-40 space-y-2">
                                    <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">Subject</label>
                                    <select
                                        className="w-full bg-black border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white outline-none"
                                        value={searchFilters.subject}
                                        onChange={e => setSearchFilters({ ...searchFilters, subject: e.target.value })}
                                    >
                                        <option value="">ALL</option>
                                        <option value="Physics">PHYSICS</option>
                                        <option value="Chemistry">CHEMISTRY</option>
                                        <option value="Mathematics">MATH</option>
                                    </select>
                                </div>

                                <div className="w-40 space-y-2">
                                    <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">Complexity</label>
                                    <select
                                        className="w-full bg-black border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white outline-none"
                                        value={searchFilters.difficulty}
                                        onChange={e => setSearchFilters({ ...searchFilters, difficulty: e.target.value })}
                                    >
                                        <option value="">ANY</option>
                                        <option value="Easy">EASY</option>
                                        <option value="Medium">MEDIUM</option>
                                        <option value="Hard">HARD</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tags Cloud */}
                            {searchFilters.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {searchFilters.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] text-indigo-400 font-bold flex items-center gap-2">
                                            {tag}
                                            <button onClick={() => removeTag(tag, true)}><X size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Questions List */}
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                    <Loader2 className="animate-spin mb-4" size={32} />
                                    <span className="text-xs font-mono uppercase tracking-[0.3em]">Synching with Matrix...</span>
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl opacity-40">
                                    <Database size={48} className="mx-auto mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest">No matching datasets found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {questions.map((q) => (
                                        <div key={q.id} className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <HelpCircle size={100} />
                                            </div>

                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        q.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-red-500/10 text-red-500'
                                                        }`}>
                                                        {q.difficulty}
                                                    </span>
                                                    <span className="text-[10px] text-[#5f6368] font-bold uppercase tracking-widest">{q.subject} • {q.topic || 'General'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-2 text-[#3c4043] hover:text-white transition-colors"><Edit3 size={14} /></button>
                                                    <button className="p-2 text-[#3c4043] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </div>

                                            <p className="text-sm leading-relaxed text-[#e8eaed] mb-6 font-medium pr-10">{q.question_text}</p>

                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                {q.options.map((opt: string, idx: number) => (
                                                    <div key={idx} className={`p-3 rounded-xl border text-[11px] font-medium flex items-center gap-3 ${idx === q.correct_index
                                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                                        : 'bg-black/20 border-white/5 text-[#9aa0a6]'
                                                        }`}>
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${idx === q.correct_index ? 'bg-emerald-500 text-white' : 'bg-white/5'
                                                            }`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        {opt}
                                                        {idx === q.correct_index && <CheckCircle2 size={12} className="ml-auto" />}
                                                    </div>
                                                ))}
                                            </div>

                                            {q.tags && q.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {q.tags.map((tag: string) => (
                                                        <span key={tag} className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest flex items-center gap-1">
                                                            <Tag size={10} /> {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                            <div className="bg-[#1e1e1e] border border-white/5 rounded-3xl p-10 shadow-2xl">
                                <div className="space-y-8">
                                    {/* Subject & Difficulty */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Data Domain</label>
                                            <select
                                                className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                                value={newQuestion.subject}
                                                onChange={e => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                                            >
                                                <option>Physics</option>
                                                <option>Chemistry</option>
                                                <option>Mathematics</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Complexity Grade</label>
                                            <div className="flex gap-2">
                                                {['Easy', 'Medium', 'Hard'].map(d => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setNewQuestion({ ...newQuestion, difficulty: d })}
                                                        className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${newQuestion.difficulty === d ? 'bg-white text-black border-transparent' : 'bg-black border-white/5 text-[#3c4043] hover:text-white'
                                                            }`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Prompt String (Question Text)</label>
                                        <textarea
                                            placeholder="TYPE QUESTION CONTENT HERE..."
                                            rows={4}
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-white/20 transition-all resize-none placeholder:text-[#1a1a1a]"
                                            value={newQuestion.question_text}
                                            onChange={e => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                        />
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Response Alternatives</label>
                                        <div className="space-y-3">
                                            {newQuestion.options.map((opt, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <button
                                                        onClick={() => setNewQuestion({ ...newQuestion, correct_index: idx })}
                                                        className={`w-12 h-12 shrink-0 rounded-xl border font-black text-xs transition-all ${newQuestion.correct_index === idx ? 'bg-emerald-500 text-white border-transparent' : 'bg-black border-white/5 text-[#3c4043] hover:text-white'
                                                            }`}
                                                    >
                                                        {String.fromCharCode(65 + idx)}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        placeholder={`OPTION ${String.fromCharCode(65 + idx)}...`}
                                                        className={`flex-1 bg-black border rounded-xl px-4 text-[11px] outline-none transition-all ${newQuestion.correct_index === idx ? 'border-emerald-500/30' : 'border-white/5 focus:border-white/20'
                                                            }`}
                                                        value={opt}
                                                        onChange={e => {
                                                            const next = [...newQuestion.options];
                                                            next[idx] = e.target.value;
                                                            setNewQuestion({ ...newQuestion, options: next });
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[9px] font-mono text-emerald-500/60 uppercase text-center italic">Highlight the correct alternative using the lettered icons</p>
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Dataset Tags</label>
                                        <div className="flex gap-2 mb-3 flex-wrap">
                                            {newQuestion.tags.map(tag => (
                                                <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-white/5 rounded-lg text-[10px] font-bold text-[#9aa0a6]">
                                                    {tag}
                                                    <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c4043]" />
                                                <input
                                                    type="text"
                                                    placeholder="ADD TAG (e.g. JEE 2025, Thermodynamics)..."
                                                    className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-white/20"
                                                    value={currentTag}
                                                    onChange={e => setCurrentTag(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addTag()}
                                                />
                                            </div>
                                            <button
                                                onClick={() => addTag()}
                                                className="px-6 bg-white/5 text-white border border-white/5 rounded-xl text-[10px] font-bold uppercase transition-all hover:bg-white hover:text-black cursor-pointer"
                                            >
                                                Plus
                                            </button>
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Verification Log (Explanation)</label>
                                        <textarea
                                            placeholder="DOCUMENT THE LOGIC BEHIND THE CORRECT ALTERNATIVE..."
                                            rows={3}
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-white/20 transition-all resize-none"
                                            value={newQuestion.explanation}
                                            onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        onClick={handleArchive}
                                        disabled={isLoading}
                                        className="w-full py-6 bg-emerald-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        Finalize & Archive Segment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className="w-80 shrink-0 border-l border-white/[0.03] bg-[#080808] p-6 space-y-8 overflow-y-auto">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Dataset Health</h3>
                        <div className="space-y-2">
                            <div className="p-4 bg-[#1e1e1e] border border-white/5 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BookOpen size={16} className="text-indigo-400" />
                                    <span className="text-xs font-bold text-[#9aa0a6]">Total Entries</span>
                                </div>
                                <span className="font-mono text-white text-lg font-bold">{questions.length}</span>
                            </div>
                            <div className="p-4 bg-[#1e1e1e] border border-white/5 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Tag size={16} className="text-emerald-400" />
                                    <span className="text-xs font-bold text-[#9aa0a6]">Unique Tags</span>
                                </div>
                                <span className="font-mono text-white text-lg font-bold">14</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Recent Activity</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3 text-[10px]">
                                    <div className="w-1 h-8 bg-emerald-500/20 rounded-full" />
                                    <div>
                                        <p className="font-bold text-white uppercase tracking-tight">New Segment Encrypted</p>
                                        <p className="text-[#3c4043]">Topic: Rotation • 2m ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
