
import React, { useState, useMemo, useEffect } from 'react';
import { QuestionData, TestHistoryItem } from '../../types';
import {
    Home,
    Download,
    LineChart,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle2,
    Brain
} from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { SnapshotTab } from './analysis/SnapshotTab';
import { DashboardTab } from './analysis/DashboardTab';
import { AttemptsTab } from './analysis/AttemptsTab';
import { ReviewTab } from './analysis/ReviewTab';
import { MistakesTab } from './analysis/MistakesTab';
import { IntelligenceTab } from './analysis/IntelligenceTab';
import { AttemptCategory, QuestionStatus, MistakeType, formatTime } from './analysis/AnalysisShared';
import { dbStore } from '../../utils/db';

type QuestionWithImage = QuestionData & { imageUrl?: string };

interface TestAnalysisProps {
    testName: string;
    questions: QuestionWithImage[];
    answers: Record<string, string>;
    questionTimes: Record<string, number>;
    onExit: () => void;
}

interface QuestionResult {
    question: QuestionWithImage;
    userAnswer: string;
    status: QuestionStatus;
    marks: number;
    timeTaken: number;
    attemptCategory: AttemptCategory;
}

const evaluateQuestion = (q: QuestionData, userAnswer: string): { marks: number; status: QuestionStatus } => {
    const correctRaw = q.correctOption || "";
    const markedRaw = userAnswer || "";
    if (!markedRaw) return { marks: 0, status: 'unanswered' };

    if (q.type === 'MCQ' || q.type === 'NAT') {
        if (markedRaw === correctRaw) return { marks: q.markingScheme.correct, status: 'correct' };
        return { marks: q.markingScheme.incorrect, status: 'incorrect' };
    }

    if (q.type === 'MSQ') {
        const markedArr = markedRaw.split(',').filter(Boolean).sort();
        const correctArr = correctRaw.split(',').filter(Boolean).sort();
        const correctSet = new Set(correctArr);
        if (markedArr.length === correctArr.length && markedArr.every(v => correctSet.has(v))) return { marks: q.markingScheme.correct, status: 'correct' };
        if (markedArr.some(v => !correctSet.has(v))) return { marks: q.markingScheme.incorrect, status: 'incorrect' };
        return { marks: 0, status: 'incorrect' };
    }
    return { marks: 0, status: 'unanswered' };
};

export const TestAnalysis: React.FC<TestAnalysisProps> = ({ testName, questions, answers, questionTimes, onExit }) => {
    const [mistakes, setMistakes] = useState<Record<string, MistakeType>>({});
    const [activeTab, setActiveTab] = useState<'snapshot' | 'dashboard' | 'attempts' | 'review' | 'mistakes' | 'intelligence'>('snapshot');
    const [viewingQuestion, setViewingQuestion] = useState<QuestionResult | null>(null);
    const [history, setHistory] = useState<TestHistoryItem[]>([]);

    // Fetch history for real-time comparison
    useEffect(() => {
        const loadHistory = async () => {
            const items = await dbStore.getAll<TestHistoryItem>('history');
            setHistory(items || []);
        };
        loadHistory();
    }, []);

    const subjects = useMemo(() => Array.from(new Set(questions.map(q => q.subject))), [questions]);

    const results: QuestionResult[] = useMemo(() => {
        return questions.map(q => {
            const ans = answers[q.id] || "";
            const evalResult = evaluateQuestion(q, ans);
            const time = questionTimes[q.id] || 0;
            const idealTime = q.idealTime || 120;
            const wastedThreshold = 20;

            let attemptCategory: AttemptCategory = 'other';
            if (evalResult.status === 'correct' && time <= idealTime) attemptCategory = 'perfect';
            else if (evalResult.status === 'incorrect' && time < wastedThreshold) attemptCategory = 'wasted';
            else if (ans && time > idealTime) attemptCategory = 'overtime';
            else if (!ans && time > idealTime) attemptCategory = 'confused';

            return { question: q, userAnswer: ans, status: evalResult.status, marks: evalResult.marks, timeTaken: time, attemptCategory };
        });
    }, [questions, answers, questionTimes]);

    const stats = useMemo(() => {
        const totalMarks = results.reduce((acc, r) => acc + r.question.markingScheme.correct, 0);
        const scored = results.reduce((acc, r) => acc + r.marks, 0);
        const correct = results.filter(r => r.status === 'correct').length;
        const totalQuestions = results.length;
        const attempted = results.filter(r => r.status !== 'unanswered').length;
        const totalTime = results.reduce((acc, r) => acc + r.timeTaken, 0);
        const accuracy = attempted > 0
            ? Math.round((correct / attempted) * 100)
            : 0;

        const topicStats = subjects.map(s => {
            const subs = results.filter(r => r.question.subject === s);
            const subScored = subs.reduce((a, c) => a + c.marks, 0);
            const subTotal = subs.reduce((a, c) => a + (c.question.markingScheme.correct), 0);
            const subCorrect = subs.filter(r => r.status === 'correct').length;
            const subIncorrect = subs.filter(r => r.status === 'incorrect').length;
            const subAttempted = subs.filter(r => r.status !== 'unanswered').length;
            const subTime = subs.reduce((a, c) => a + c.timeTaken, 0);
            const subAccuracy = subAttempted > 0
                ? (subCorrect / subAttempted) * 100
                : 0;

            return { topic: s, scored: subScored, total: subTotal, correct: subCorrect, incorrect: subIncorrect, time: subTime, accuracy: subAccuracy, avgTime: subCorrect > 0 ? subTime / subCorrect : 0, count: subs.length };
        });

        return { totalMarks, scored, correct, incorrect: results.filter(r => r.status === 'incorrect').length, totalQuestions, attempted, totalTime, topicStats, accuracy };
    }, [results, subjects]);

    const handleDownload = async () => {
        const zip = new JSZip();
        zip.file("analysis.json", JSON.stringify({ testName, questions, answers, questionTimes, mistakes }, null, 2));
        saveAs(await zip.generateAsync({ type: "blob" }), `${testName}_Analysis.zip`);
    };

    const toggleMistake = (id: string, type: MistakeType) => setMistakes(prev => ({ ...prev, [id]: type }));

    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-sm text-zinc-300 relative overflow-x-hidden selection:bg-zinc-100 selection:text-black">
            <div className="fixed inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

            <header className="h-14 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-30 shadow-2xl gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-black shadow-lg"><LineChart size={20} strokeWidth={2.5} /></div>
                    <div><h1 className="text-zinc-100 font-bold text-sm tracking-widest uppercase font-mono">{testName}</h1><span className="text-[10px] text-zinc-500 font-mono uppercase">Performance Intelligence Dashboard</span></div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                    <div className="flex p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                        {(['snapshot', 'dashboard', 'attempts', 'review', 'mistakes', 'intelligence'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>{tab}</button>
                        ))}
                    </div>
                    <button onClick={handleDownload} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 transition-all"><Download size={14} /> Export</button>
                    <button onClick={onExit} className="bg-zinc-100 text-black px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all"><Home size={14} /> Exit</button>
                </div>
            </header>

            <main className="w-full max-w-[98%] mx-auto p-4 md:p-8 space-y-8 relative z-10 animate-in fade-in duration-500 pb-20">
                {activeTab === 'snapshot' && <SnapshotTab stats={stats} history={history} />}
                {activeTab === 'dashboard' && <DashboardTab stats={stats} results={results} />}
                {activeTab === 'attempts' && <AttemptsTab results={results} subjects={subjects} />}
                {activeTab === 'review' && <ReviewTab results={results} subjects={subjects} onViewQuestion={setViewingQuestion} />}
                {activeTab === 'mistakes' && <MistakesTab mistakes={mistakes} results={results} />}
                {activeTab === 'intelligence' && <IntelligenceTab stats={stats} />}
            </main>

            {/* SHARED QUESTION VIEW MODAL */}
            {viewingQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
                        <div className="bg-zinc-900/50 px-8 py-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 font-mono font-bold text-xl shadow-inner">{viewingQuestion.question.questionNumber}</div>
                                <div><h3 className="font-bold text-zinc-100 text-lg uppercase tracking-widest">{viewingQuestion.question.subject}</h3><span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{viewingQuestion.question.type} • Detailed Review</span></div>
                            </div>
                            <button onClick={() => setViewingQuestion(null)} className="text-zinc-500 hover:text-zinc-100 p-3 hover:bg-zinc-800 rounded-2xl transition-all"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-8">
                            <div className="bg-white rounded-[2rem] p-4 border border-zinc-800 shadow-2xl max-w-full"><img src={viewingQuestion.question.imageUrl} className="max-w-full h-auto max-h-[40vh] object-contain rounded-xl" alt="Q-Image" /></div>
                            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-500"><CheckCircle2 size={16} strokeWidth={3} /><span className="text-[10px] font-bold uppercase tracking-widest">Correct Answer</span></div>
                                    <div className="text-4xl font-mono font-bold text-emerald-400">{viewingQuestion.question.correctOption}</div>
                                </div>
                                <div className={`p-8 rounded-[2rem] space-y-4 border ${viewingQuestion.status === 'correct' ? 'bg-emerald-500/5 border-emerald-500/20' : viewingQuestion.status === 'incorrect' ? 'bg-red-500/5 border-red-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
                                    <div className="flex items-center gap-2"><span className={`text-[10px] font-bold uppercase tracking-widest ${viewingQuestion.status === 'correct' ? 'text-emerald-500' : 'text-red-400'}`}>Your Response</span></div>
                                    <div className={`text-4xl font-mono font-bold ${viewingQuestion.status === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>{viewingQuestion.userAnswer || "NO INPUT"}</div>
                                </div>
                            </div>

                            {viewingQuestion.status === 'incorrect' && (
                                <div className="w-full max-w-4xl bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem]">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Brain size={14} /> Behavioral Profiling</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {['Conceptual', 'Calculation', 'Silly', 'Guess', 'Time-Pressure'].map(opt => (
                                            <button key={opt} onClick={() => toggleMistake(viewingQuestion.question.id, opt as MistakeType)} className={`px-2 py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${mistakes[viewingQuestion.question.id] === opt ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="w-full max-w-4xl flex items-center justify-between pb-12">
                                <div className="flex gap-4">
                                    <div className="bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800 shadow-sm"><span className="text-[9px] font-bold text-zinc-500 block uppercase mb-1">Time spent</span><span className="text-zinc-200 font-mono font-bold text-sm">{formatTime(viewingQuestion.timeTaken)}</span></div>
                                    <div className="bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800 shadow-sm"><span className="text-[9px] font-bold text-zinc-500 block uppercase mb-1">Marks</span><span className={`font-mono font-bold text-sm ${viewingQuestion.marks > 0 ? 'text-emerald-400' : viewingQuestion.marks < 0 ? 'text-red-400' : 'text-zinc-400'}`}>{viewingQuestion.marks > 0 ? '+' : ''}{viewingQuestion.marks.toFixed(1)}</span></div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => { const idx = results.findIndex(r => r.question.id === viewingQuestion.question.id); if (idx > 0) setViewingQuestion(results[idx - 1]); }} disabled={results.findIndex(r => r.question.id === viewingQuestion.question.id) <= 0} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 px-8 py-4 rounded-2xl border border-zinc-800 text-xs font-bold transition-all uppercase tracking-widest disabled:opacity-30 flex items-center gap-2"><ChevronLeft size={18} /> Prev</button>
                                    <button onClick={() => { const idx = results.findIndex(r => r.question.id === viewingQuestion.question.id); if (idx < results.length - 1) setViewingQuestion(results[idx + 1]); }} disabled={results.findIndex(r => r.question.id === viewingQuestion.question.id) >= results.length - 1} className="bg-zinc-100 hover:bg-white text-black px-8 py-4 rounded-2xl font-bold text-xs transition-all uppercase active:scale-95 tracking-widest shadow-lg flex items-center gap-2">Next <ChevronRight size={18} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
