import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Type,
    CheckCircle2,
    Eye,
    Settings2,
    AlertCircle,
    Image as ImageIcon
} from 'lucide-react';
import { CloudService } from '../../utils/cloud';
import { EnhancedQuestion } from '../../types';
import { NestedTagSelector } from './NestedTagSelector';
import 'katex/dist/katex.min.css';
// @ts-ignore
import { InlineMath } from 'react-katex';

interface QuestionDesignerProps {
    onClose: () => void;
    onSave: (savedQuestion?: EnhancedQuestion) => void;
    editingQuestion?: EnhancedQuestion | null;
}

export const QuestionDesigner: React.FC<QuestionDesignerProps> = ({ onClose, onSave, editingQuestion }) => {
    const [question, setQuestion] = useState<Partial<EnhancedQuestion>>({
        question_text: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: '',
        subject: 'Physics',
        topic: '',
        difficulty: 'Medium',
        tags: [],
        nested_tags: {},
        question_image_url: '',
        option_image_urls: ['', '', '', '']
    });

    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editingQuestion) {
            setQuestion(editingQuestion);
        }
    }, [editingQuestion]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('supabase_token');

            const questionData = {
                question_text: question.question_text!,
                options: question.options!,
                correct_index: question.correct_index!,
                explanation: question.explanation!,
                subject: question.subject!,
                topic: question.topic || 'General',
                difficulty: question.difficulty as any,
                nested_tags: question.nested_tags,
                question_image_url: question.question_image_url,
                option_image_urls: question.option_image_urls
            };

            if (!token) {
                // Fallback: Save to Local Storage if no cloud token
                const localBank = JSON.parse(localStorage.getItem('local_question_bank') || '[]');
                const newQuestion: EnhancedQuestion = {
                    ...questionData,
                    id: `local-${Date.now()}`,
                    created_at: new Date().toISOString(),
                    is_local: true
                } as any;
                localBank.unshift(newQuestion);
                localStorage.setItem('local_question_bank', JSON.stringify(localBank));

                // Success Notification
                onSave(newQuestion);
                return;
            }

            const res = await CloudService.archiveQuestionEnhanced(token, questionData);

            if (res.success) {
                onSave({ ...questionData, id: res.questionId! } as any);
            } else {
                alert("Cloud Sync Failed. Saving locally instead.");
                // Secondary fallback on cloud error
                const localBank = JSON.parse(localStorage.getItem('local_question_bank') || '[]');
                const newQuestion = { ...questionData, id: `local-${Date.now()}`, is_local: true };
                localBank.unshift(newQuestion);
                localStorage.setItem('local_question_bank', JSON.stringify(localBank));
                onSave(newQuestion as any);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const updateOption = (index: number, val: string) => {
        const newOptions = [...(question.options || [])];
        newOptions[index] = val;
        setQuestion({ ...question, options: newOptions });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/60 backdrop-blur-sm transition-all duration-500">
            <div className="w-full max-w-4xl h-[95vh] mr-4 bg-theme-panel border border-theme-primary rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right fade-in duration-500">

                {/* Header */}
                <header className="px-8 py-6 border-b border-theme-primary flex items-center justify-between bg-theme-secondary/30">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-theme-primary border border-theme-primary flex items-center justify-center text-theme-secondary">
                            <Type size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-theme-primary tracking-tight">
                                {editingQuestion ? 'Edit Question' : 'Designer'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 rounded">Live Canvas</span>
                                {isPreview && <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest px-1.5 py-0.5 bg-blue-500/10 rounded">Preview Mode</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsPreview(!isPreview)}
                            className="p-2.5 text-theme-secondary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all"
                            title="Toggle Preview"
                        >
                            <Eye size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 text-theme-secondary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Form Side */}
                    <div className={`flex-1 overflow-y-auto p-8 space-y-8 transition-all ${isPreview ? 'hidden lg:block' : ''}`}>

                        {/* Text Content */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Question Text</h3>
                                <span className="text-[10px] text-theme-secondary opacity-50 font-mono italic">LaTeX Supported ($...$)</span>
                            </div>
                            <textarea
                                className="w-full h-40 bg-theme-primary border border-theme-primary rounded-2xl p-4 text-sm text-theme-primary outline-none focus:border-emerald-500/50 transition-all resize-none font-sans leading-relaxed mb-4"
                                placeholder="Enter question text here... use $ \sqrt{x} $ for math."
                                value={question.question_text}
                                onChange={(e) => setQuestion({ ...question, question_text: e.target.value })}
                            />

                            <div className="flex items-center gap-4 bg-theme-surface p-4 rounded-2xl border border-theme-primary">
                                <div className="w-10 h-10 rounded-xl bg-theme-primary flex items-center justify-center text-theme-secondary">
                                    <ImageIcon size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest mb-1">Question Image URL</p>
                                    <input
                                        className="w-full bg-transparent border-none text-xs text-theme-primary outline-none placeholder:opacity-30"
                                        placeholder="https://example.com/question-diagram.png"
                                        value={question.question_image_url}
                                        onChange={e => setQuestion({ ...question, question_image_url: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Options & Key</h3>
                            <div className="space-y-3">
                                {question.options?.map((opt, i) => (
                                    <div key={i} className="flex flex-col gap-2 group">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setQuestion({ ...question, correct_index: i })}
                                                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${question.correct_index === i
                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg'
                                                        : 'bg-theme-secondary border-theme-primary text-theme-secondary hover:border-emerald-500/30'
                                                    }`}
                                            >
                                                {String.fromCharCode(65 + i)}
                                            </button>
                                            <input
                                                className="flex-1 bg-theme-surface border border-theme-primary rounded-xl px-4 py-2.5 text-sm text-theme-primary outline-none focus:border-theme-primary transition-all"
                                                value={opt}
                                                onChange={(e) => updateOption(i, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + i)} Text`}
                                            />
                                        </div>
                                        <div className="pl-13 flex items-center gap-3 bg-theme-surface/50 p-2 pl-4 rounded-xl border border-theme-primary/50">
                                            <ImageIcon size={14} className="text-theme-secondary opacity-50" />
                                            <input
                                                className="flex-1 bg-transparent border-none text-[10px] text-theme-secondary outline-none placeholder:opacity-30"
                                                placeholder={`Option ${String.fromCharCode(65 + i)} Image URL`}
                                                value={question.option_image_urls?.[i]}
                                                onChange={e => {
                                                    const next = [...(question.option_image_urls || ['', '', '', ''])];
                                                    next[i] = e.target.value;
                                                    setQuestion({ ...question, option_image_urls: next });
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Classification (NESTED TAGS) */}
                        <div className="space-y-4">
                            <NestedTagSelector
                                tags={question.nested_tags || {}}
                                onChange={nt => setQuestion({ ...question, nested_tags: nt })}
                            />
                        </div>

                        {/* Explanation */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Solution Breakdown</h3>
                            <textarea
                                className="w-full h-32 bg-theme-primary border border-theme-primary rounded-2xl p-4 text-sm text-theme-primary outline-none focus:border-emerald-500/50 transition-all resize-none font-sans shadow-inner"
                                placeholder="Explain the logic behind the correct answer..."
                                value={question.explanation}
                                onChange={(e) => setQuestion({ ...question, explanation: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Preview Side */}
                    {(isPreview || window.innerWidth > 1024) && (
                        <div className={`w-[400px] border-l border-theme-primary bg-theme-secondary/20 p-8 overflow-y-auto space-y-8 ${!isPreview ? 'hidden lg:block opacity-60' : 'flex-1'}`}>
                            <h3 className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.2em] mb-4">Final Render</h3>

                            <div className="bg-theme-panel border border-theme-primary rounded-3xl p-6 shadow-theme-md space-y-6">
                                <div className="space-y-4">
                                    {question.question_image_url && (
                                        <div className="w-full rounded-2xl overflow-hidden border border-theme-primary">
                                            <img src={question.question_image_url} alt="Question Diagram" className="w-full h-auto object-contain bg-white" />
                                        </div>
                                    )}
                                    <div className="text-sm text-theme-primary leading-relaxed">
                                        <QuestionTextRenderer text={question.question_text || 'No text provided.'} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {question.options?.map((opt, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border text-sm transition-all flex flex-col gap-3 ${question.correct_index === i
                                                ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-medium'
                                                : 'border-theme-primary bg-theme-primary text-theme-secondary'
                                            }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold opacity-50">{String.fromCharCode(65 + i)}.</span>
                                                    <QuestionTextRenderer text={opt || '...'} />
                                                </div>
                                                {question.correct_index === i && <CheckCircle2 size={16} />}
                                            </div>
                                            {question.option_image_urls?.[i] && (
                                                <div className="w-full rounded-xl overflow-hidden border border-theme-primary/50">
                                                    <img src={question.option_image_urls[i]} alt={`Option ${String.fromCharCode(65 + i)}`} className="w-full h-auto object-contain bg-white max-h-40" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                                <div className="flex items-center gap-2 text-amber-500">
                                    <Settings2 size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Metadata Verify</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(question.nested_tags || {}).map(([layer, val]) => (
                                        <span key={layer} className="text-[9px] font-bold uppercase bg-theme-primary px-2 py-1 rounded-lg border border-theme-primary text-theme-secondary">
                                            {layer}: {val}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <footer className="px-8 py-6 border-t border-theme-primary bg-theme-secondary/30 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-theme-secondary">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Autosave is active</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-theme-secondary hover:text-theme-primary text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-8 py-3 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${isSaving ? 'opacity-50' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isSaving ? 'Uploading...' : 'Publish Item'} <Save size={16} />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const QuestionTextRenderer: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;

    // Simple regex to find $...$ segments
    const parts = text.split(/(\$.*?\$)/g);

    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('$') && part.endsWith('$')) {
                    const content = part.slice(1, -1);
                    return <InlineMath key={i} math={content} strokeWidth={2} />;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};
