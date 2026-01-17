
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Save,
    Tag,
    Search,
    Database,
    CheckCircle2,
    X,
    FileDown,
    FileUp,
    Edit3,
    Trash2,
    Lock,
    Unlock,
    Eye,
    ArrowLeft,
    AlertCircle
} from 'lucide-react';
import { AuthoredQuestion, QuestionBank } from '../types';
import {
    generateQuestionId,
    validateQuestion,
    createQuestionBank,
    downloadQuestionBank,
    readQuestionBankFile,
    getQuestionBankStats,
    filterQuestions,
    encryptQuestionBank,
    decryptQuestionBank
} from '../utils/questionBank';
import 'katex/dist/katex.min.css';

interface QuestionAuthorInterfaceProps {
    onExit: () => void;
}

export const QuestionAuthorInterface: React.FC<QuestionAuthorInterfaceProps> = ({ onExit }) => {
    const [mode, setMode] = useState<'browse' | 'create' | 'preview'>('browse');
    const [questions, setQuestions] = useState<AuthoredQuestion[]>([]);
    const [bankName, setBankName] = useState('Untitled Question Bank');
    const [authorName, setAuthorName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({
        subject: '',
        difficulty: '',
        tags: [] as string[]
    });

    // Create/Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newQuestion, setNewQuestion] = useState<Partial<AuthoredQuestion>>({
        question_text: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: '',
        subject: 'Physics',
        topic: '',
        difficulty: 'Medium',
        tags: []
    });
    const [currentTag, setCurrentTag] = useState('');
    const [previewQuestion, setPreviewQuestion] = useState<AuthoredQuestion | null>(null);

    // Encryption
    const [useEncryption, setUseEncryption] = useState(false);
    const [encryptionPassword, setEncryptionPassword] = useState('');

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('offline_question_bank');
        if (saved) {
            try {
                const bank = JSON.parse(saved) as QuestionBank;
                setQuestions(bank.questions);
                setBankName(bank.name);
                setAuthorName(bank.metadata.author);
            } catch (e) {
                console.error('Failed to load saved questions');
            }
        }
    }, []);

    // Auto-save to localStorage
    useEffect(() => {
        if (questions.length > 0 || bankName !== 'Untitled Question Bank') {
            const bank = createQuestionBank(bankName, authorName || 'Anonymous', '', questions);
            localStorage.setItem('offline_question_bank', JSON.stringify(bank));
        }
    }, [questions, bankName, authorName]);

    const handleSaveQuestion = () => {
        if (!validateQuestion(newQuestion)) {
            alert('Please fill all required fields correctly.');
            return;
        }

        const timestamp = new Date().toISOString();
        const questionData: AuthoredQuestion = {
            id: editingId || generateQuestionId(),
            question_text: newQuestion.question_text!,
            options: newQuestion.options!,
            correct_index: newQuestion.correct_index!,
            explanation: newQuestion.explanation || '',
            subject: newQuestion.subject!,
            topic: newQuestion.topic || '',
            difficulty: newQuestion.difficulty!,
            tags: newQuestion.tags || [],
            created_at: editingId ? questions.find(q => q.id === editingId)?.created_at || timestamp : timestamp,
            updated_at: timestamp
        };

        if (editingId) {
            setQuestions(prev => prev.map(q => q.id === editingId ? questionData : q));
        } else {
            setQuestions(prev => [...prev, questionData]);
        }

        resetForm();
        setMode('browse');
    };

    const resetForm = () => {
        setNewQuestion({
            question_text: '',
            options: ['', '', '', ''],
            correct_index: 0,
            explanation: '',
            subject: 'Physics',
            topic: '',
            difficulty: 'Medium',
            tags: []
        });
        setEditingId(null);
        setCurrentTag('');
    };

    const handleEdit = (question: AuthoredQuestion) => {
        setNewQuestion(question);
        setEditingId(question.id);
        setMode('create');
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this question?')) {
            setQuestions(prev => prev.filter(q => q.id !== id));
        }
    };

    const handleExport = () => {
        if (questions.length === 0) {
            alert('No questions to export!');
            return;
        }

        const bank = createQuestionBank(bankName, authorName || 'Anonymous', '', questions);

        if (useEncryption && encryptionPassword) {
            const encrypted = encryptQuestionBank(bank, encryptionPassword);
            const blob = new Blob([encrypted], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${bankName.replace(/\s+/g, '_')}.qbank.encrypted`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            downloadQuestionBank(bank);
        }

        alert(`Exported ${questions.length} questions successfully!`);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isEncrypted = file.name.endsWith('.encrypted');

        if (isEncrypted) {
            const password = prompt('Enter decryption password:');
            if (!password) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const encrypted = event.target?.result as string;
                const bank = decryptQuestionBank(encrypted, password);
                if (bank) {
                    setQuestions(prev => [...prev, ...bank.questions]);
                    alert(`Imported ${bank.questions.length} questions!`);
                } else {
                    alert('Failed to decrypt. Wrong password?');
                }
            };
            reader.readAsText(file);
        } else {
            const bank = await readQuestionBankFile(file);
            if (bank) {
                setQuestions(prev => [...prev, ...bank.questions]);
                setBankName(bank.name);
                setAuthorName(bank.metadata.author);
                alert(`Imported ${bank.questions.length} questions!`);
            } else {
                alert('Failed to import question bank. Invalid file format.');
            }
        }

        e.target.value = '';
    };

    const addTag = () => {
        if (!currentTag.trim()) return;
        if (!newQuestion.tags?.includes(currentTag.trim())) {
            setNewQuestion({ ...newQuestion, tags: [...(newQuestion.tags || []), currentTag.trim()] });
        }
        setCurrentTag('');
    };

    const removeTag = (tag: string) => {
        setNewQuestion({ ...newQuestion, tags: newQuestion.tags?.filter(t => t !== tag) });
    };

    const filteredQuestions = filterQuestions(questions, {
        subject: selectedFilters.subject,
        difficulty: selectedFilters.difficulty,
        tags: selectedFilters.tags,
        searchText: searchQuery
    });

    const stats = questions.length > 0 ? getQuestionBankStats(createQuestionBank(bankName, authorName, '', questions)) : null;

    return (
        <div className="h-screen bg-black flex flex-col font-sans text-[#e8eaed]">
            {/* Header */}
            <div className="shrink-0 h-20 border-b border-white/[0.03] px-8 flex items-center justify-between bg-[#0a0a0a]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onExit}
                        className="p-2 hover:bg-white/5 rounded-xl text-[#9aa0a6] hover:text-white transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                        <Edit3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight uppercase">Question Author Studio</h1>
                        <p className="text-[10px] font-mono text-[#5f6368] uppercase tracking-[0.2em]">Private Offline Authoring v1.0</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setMode('browse')}
                        className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${mode === 'browse' ? 'bg-white text-black' : 'bg-[#1e1e1e] text-[#9aa0a6] hover:text-white'}`}
                    >
                        Browse ({questions.length})
                    </button>
                    <button
                        onClick={() => { resetForm(); setMode('create'); }}
                        className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'create' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500/20'}`}
                    >
                        <Plus size={14} /> Create New
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-6 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                    >
                        <FileDown size={14} /> Export Bank
                    </button>
                    <label className="px-6 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center gap-2 cursor-pointer">
                        <FileUp size={14} /> Import
                        <input type="file" accept=".qbank,.encrypted" onChange={handleImport} className="hidden" />
                    </label>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#050505]">
                    {mode === 'browse' ? (
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Bank Settings */}
                            <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6 space-y-4">
                                <h3 className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Bank Configuration</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">Bank Name</label>
                                        <input
                                            type="text"
                                            value={bankName}
                                            onChange={e => setBankName(e.target.value)}
                                            className="w-full bg-black border border-white/5 rounded-xl py-2.5 px-4 text-[11px] text-white outline-none focus:border-white/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">Author Name</label>
                                        <input
                                            type="text"
                                            value={authorName}
                                            onChange={e => setAuthorName(e.target.value)}
                                            placeholder="Your name..."
                                            className="w-full bg-black border border-white/5 rounded-xl py-2.5 px-4 text-[11px] text-white outline-none focus:border-white/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Search & Filter */}
                            <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6 flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px] space-y-2">
                                    <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">Search Questions</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c4043]" />
                                        <input
                                            type="text"
                                            placeholder="SEARCH BY TEXT, TAGS..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full bg-black border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-[11px] text-white outline-none focus:border-white/20 uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="w-40 space-y-2">
                                    <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">Subject</label>
                                    <select
                                        className="w-full bg-black border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white outline-none"
                                        value={selectedFilters.subject}
                                        onChange={e => setSelectedFilters({ ...selectedFilters, subject: e.target.value })}
                                    >
                                        <option value="">ALL</option>
                                        <option value="Physics">PHYSICS</option>
                                        <option value="Chemistry">CHEMISTRY</option>
                                        <option value="Mathematics">MATH</option>
                                    </select>
                                </div>

                                <div className="w-40 space-y-2">
                                    <label className="text-[9px] font-bold text-[#3c4043] uppercase tracking-widest">Difficulty</label>
                                    <select
                                        className="w-full bg-black border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white outline-none"
                                        value={selectedFilters.difficulty}
                                        onChange={e => setSelectedFilters({ ...selectedFilters, difficulty: e.target.value })}
                                    >
                                        <option value="">ANY</option>
                                        <option value="Easy">EASY</option>
                                        <option value="Medium">MEDIUM</option>
                                        <option value="Hard">HARD</option>
                                    </select>
                                </div>
                            </div>

                            {/* Questions List */}
                            {filteredQuestions.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl opacity-40">
                                    <Database size={48} className="mx-auto mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest">
                                        {questions.length === 0 ? 'No questions yet. Create your first one!' : 'No matching questions found'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredQuestions.map((q) => (
                                        <div key={q.id} className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
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
                                                    <button
                                                        onClick={() => setPreviewQuestion(q)}
                                                        className="p-2 text-[#3c4043] hover:text-blue-500 transition-colors"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(q)}
                                                        className="p-2 text-[#3c4043] hover:text-white transition-colors"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(q.id)}
                                                        className="p-2 text-[#3c4043] hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-sm leading-relaxed text-[#e8eaed] mb-6 font-medium">{q.question_text}</p>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                {q.options.map((opt, idx) => (
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
                                                    {q.tags.map((tag) => (
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
                        <div className="max-w-3xl mx-auto space-y-8 pb-20">
                            <div className="bg-[#1e1e1e] border border-white/5 rounded-3xl p-10 shadow-2xl">
                                <div className="space-y-8">
                                    {/* Subject & Difficulty */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Subject Domain</label>
                                            <select
                                                className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-purple-500 transition-all cursor-pointer"
                                                value={newQuestion.subject}
                                                onChange={e => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                                            >
                                                <option>Physics</option>
                                                <option>Chemistry</option>
                                                <option>Mathematics</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Topic (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Mechanics, Calculus..."
                                                className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-purple-500 transition-all"
                                                value={newQuestion.topic}
                                                onChange={e => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Difficulty Level</label>
                                        <div className="flex gap-2">
                                            {['Easy', 'Medium', 'Hard'].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setNewQuestion({ ...newQuestion, difficulty: d as any })}
                                                    className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${newQuestion.difficulty === d ? 'bg-white text-black border-transparent' : 'bg-black border-white/5 text-[#3c4043] hover:text-white'
                                                        }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Question Text</label>
                                        <textarea
                                            placeholder="TYPE QUESTION HERE... (Supports LaTeX: use $...$ for inline math)"
                                            rows={4}
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-white/20 transition-all resize-none placeholder:text-[#1a1a1a]"
                                            value={newQuestion.question_text}
                                            onChange={e => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                        />
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Answer Options</label>
                                        <div className="space-y-3">
                                            {newQuestion.options?.map((opt, idx) => (
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
                                                            const next = [...(newQuestion.options || [])];
                                                            next[idx] = e.target.value;
                                                            setNewQuestion({ ...newQuestion, options: next });
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[9px] font-mono text-emerald-500/60 uppercase text-center italic">Click letter buttons to mark correct answer</p>
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Tags</label>
                                        <div className="flex gap-2 mb-3 flex-wrap">
                                            {newQuestion.tags?.map(tag => (
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
                                                    placeholder="ADD TAG (e.g., JEE 2025, Thermodynamics)..."
                                                    className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-white/20"
                                                    value={currentTag}
                                                    onChange={e => setCurrentTag(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addTag()}
                                                />
                                            </div>
                                            <button
                                                onClick={addTag}
                                                className="px-6 bg-white/5 text-white border border-white/5 rounded-xl text-[10px] font-bold uppercase transition-all hover:bg-white hover:text-black"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Explanation (Optional)</label>
                                        <textarea
                                            placeholder="EXPLAIN WHY THE CORRECT ANSWER IS CORRECT..."
                                            rows={3}
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-white/20 transition-all resize-none"
                                            value={newQuestion.explanation}
                                            onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSaveQuestion}
                                        className="w-full py-6 bg-purple-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_20px_40px_rgba(168,85,247,0.15)] hover:bg-purple-400 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Save size={18} />
                                        {editingId ? 'Update Question' : 'Save Question'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className="w-80 shrink-0 border-l border-white/[0.03] bg-[#080808] p-6 space-y-8 overflow-y-auto">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Bank Statistics</h3>
                        <div className="space-y-2">
                            <div className="p-4 bg-[#1e1e1e] border border-white/5 rounded-2xl flex items-center justify-between">
                                <span className="text-xs font-bold text-[#9aa0a6]">Total Questions</span>
                                <span className="font-mono text-white text-lg font-bold">{questions.length}</span>
                            </div>
                            {stats && (
                                <>
                                    <div className="p-4 bg-[#1e1e1e] border border-white/5 rounded-2xl">
                                        <div className="text-xs font-bold text-[#9aa0a6] mb-3">Difficulty</div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-emerald-500">Easy</span>
                                                <span className="text-white font-mono">{stats.difficultyDistribution.Easy}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-amber-500">Medium</span>
                                                <span className="text-white font-mono">{stats.difficultyDistribution.Medium}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-red-500">Hard</span>
                                                <span className="text-white font-mono">{stats.difficultyDistribution.Hard}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#1e1e1e] border border-white/5 rounded-2xl">
                                        <div className="text-xs font-bold text-[#9aa0a6] mb-2">Subjects</div>
                                        <div className="flex flex-wrap gap-2">
                                            {stats.subjects.map(s => (
                                                <span key={s} className="text-[9px] px-2 py-1 bg-white/5 rounded text-white font-bold">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em]">Export Options</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] border border-white/5 rounded-xl">
                                <button
                                    onClick={() => setUseEncryption(!useEncryption)}
                                    className={`p-2 rounded-lg transition-all ${useEncryption ? 'bg-purple-500 text-white' : 'bg-white/5 text-[#3c4043]'}`}
                                >
                                    {useEncryption ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-white">Encryption</div>
                                    <div className="text-[8px] text-[#3c4043]">{useEncryption ? 'Enabled' : 'Disabled'}</div>
                                </div>
                            </div>
                            {useEncryption && (
                                <input
                                    type="password"
                                    placeholder="Encryption password..."
                                    value={encryptionPassword}
                                    onChange={e => setEncryptionPassword(e.target.value)}
                                    className="w-full bg-black border border-white/5 rounded-xl py-2 px-3 text-[10px] text-white outline-none focus:border-purple-500"
                                />
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={16} className="text-purple-500 shrink-0 mt-0.5" />
                            <div className="text-[9px] text-purple-400 leading-relaxed">
                                <strong>Private Mode:</strong> All questions are stored locally in your browser. Export to save permanently.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewQuestion && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8" onClick={() => setPreviewQuestion(null)}>
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-3xl p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold uppercase tracking-tight">Question Preview</h2>
                            <button onClick={() => setPreviewQuestion(null)} className="p-2 hover:bg-white/5 rounded-xl text-[#9aa0a6] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${previewQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                                    previewQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-red-500/10 text-red-500'
                                    }`}>
                                    {previewQuestion.difficulty}
                                </span>
                                <span className="text-[11px] text-[#5f6368] font-bold uppercase">{previewQuestion.subject} • {previewQuestion.topic || 'General'}</span>
                            </div>

                            <p className="text-base leading-relaxed text-white font-medium">{previewQuestion.question_text}</p>

                            <div className="space-y-3">
                                {previewQuestion.options.map((opt, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-3 ${idx === previewQuestion.correct_index
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                        : 'bg-black/40 border-white/5 text-[#9aa0a6]'
                                        }`}>
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${idx === previewQuestion.correct_index ? 'bg-emerald-500 text-white' : 'bg-white/5'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        {opt}
                                        {idx === previewQuestion.correct_index && <CheckCircle2 size={16} className="ml-auto" />}
                                    </div>
                                ))}
                            </div>

                            {previewQuestion.explanation && (
                                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Explanation</div>
                                    <p className="text-sm text-[#e8eaed] leading-relaxed">{previewQuestion.explanation}</p>
                                </div>
                            )}

                            {previewQuestion.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {previewQuestion.tags.map(tag => (
                                        <span key={tag} className="text-[9px] px-3 py-1 bg-white/5 rounded-full text-[#9aa0a6] font-bold uppercase flex items-center gap-1">
                                            <Tag size={10} /> {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
