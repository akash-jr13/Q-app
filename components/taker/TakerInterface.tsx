
import React, { useRef, useState, useEffect } from 'react';
import { Upload, ArrowLeft, Lock, Loader2, ChevronRight, Clock, AlertCircle, Bookmark, RotateCcw, Menu, X, Trophy, AlertTriangle, FileQuestion, CheckCircle2, Pause, Play } from 'lucide-react';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { QuestionData, TestHistoryItem } from '../../types';
import { TestAnalysis } from './TestAnalysis';
import { dbStore } from '../../utils/db';
import { CloudService } from '../../utils/cloud';

interface TakerInterfaceProps {
  onExit: () => void;
  initialPackage?: { name: string, data: string } | null;
}

interface TestMetadata {
  testName: string;
  totalQuestions: number;
  questions: (QuestionData & { imagePath: string; imageUrl?: string })[];
}

// --- Crypto Helpers ---

const base64ToBuff = (b64: string): Uint8Array => {
  try {
    const dataPart = b64.includes(',') ? b64.split(',')[1] : b64;
    const binary = window.atob(dataPart);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decoding failed:", e);
    return new Uint8Array(0);
  }
};

async function getKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptData(encryptedData: Uint8Array, password: string, salt: Uint8Array, iv: Uint8Array) {
  try {
    const key = await getKey(password, salt);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      encryptedData.buffer as ArrayBuffer
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (e) {
    console.error("Decryption failed:", e);
    throw new Error("Incorrect Password");
  }
}

const evaluateQuestionScore = (q: QuestionData, userAnswer: string): { marks: number; isCorrect: boolean } => {
  const correctRaw = q.correctOption || "";
  const markedRaw = userAnswer || "";
  if (!markedRaw) return { marks: 0, isCorrect: false };

  if (q.type === 'MCQ') {
    if (markedRaw === correctRaw) return { marks: q.markingScheme.correct, isCorrect: true };
    return { marks: q.markingScheme.incorrect, isCorrect: false };
  }

  if (q.type === 'NAT') {
    if (markedRaw === correctRaw) return { marks: q.markingScheme.correct, isCorrect: true };
    const mVal = parseFloat(markedRaw); const cVal = parseFloat(correctRaw);
    if (!isNaN(mVal) && !isNaN(cVal) && Math.abs(mVal - cVal) < 0.0001) return { marks: q.markingScheme.correct, isCorrect: true };
    return { marks: q.markingScheme.incorrect, isCorrect: false };
  }

  if (q.type === 'MSQ') {
    const markedArr = markedRaw.split(',').filter(Boolean).sort();
    const correctArr = correctRaw.split(',').filter(Boolean).sort();
    const correctSet = new Set(correctArr);
    if (markedArr.length === correctArr.length && markedArr.every(v => correctSet.has(v))) return { marks: q.markingScheme.correct, isCorrect: true };
    if (markedArr.some(v => !correctSet.has(v))) return { marks: q.markingScheme.incorrect, isCorrect: false };
    if (q.markingScheme.partial && q.markingScheme.partial > 0) return { marks: markedArr.length * q.markingScheme.partial, isCorrect: false };
    return { marks: 0, isCorrect: false };
  }

  return { marks: 0, isCorrect: false };
};

export const TakerInterface: React.FC<TakerInterfaceProps> = ({ onExit, initialPackage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedZip, setSelectedZip] = useState<File | { name: string, data: string } | null>(initialPackage || null);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(!!initialPackage);
  const [password, setPassword] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [testData, setTestData] = useState<TestMetadata | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [isSubmitModalOpen, setSubmitModalOpen] = useState(false);
  const [isExitModalOpen, setExitModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [breakTime, setBreakTime] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnalysisView, setIsAnalysisView] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});

  const TYPE_MAPPING: Record<string, string> = {
    'MCQ': 'MCQ',
    'MSQ': 'MSQ',
    'NAT': 'NAT',
    'MSM': 'MSM'
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testData && !isAnalysisView) {
        const msg = "Progress will be lost."; e.preventDefault(); e.returnValue = msg; return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testData, isAnalysisView]);

  useEffect(() => {
    if (!testData || isPaused || isAnalysisView) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) { clearInterval(timer); finishTest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testData, isPaused, isAnalysisView]);

  useEffect(() => {
    let timer: any;
    if (isPaused) timer = setInterval(() => setBreakTime(p => p + 1), 1000);
    else setBreakTime(0);
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (testData) testData.questions.forEach(q => { if (q.imageUrl) URL.revokeObjectURL(q.imageUrl); });
    };
  }, [testData]);

  const currentQuestion = testData?.questions[currentQuestionIndex];

  useEffect(() => {
    if (!currentQuestion || isPaused || isAnalysisView) return;
    const timer = setInterval(() => {
      setQuestionTimes(prev => ({ ...prev, [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestion, isPaused, isAnalysisView]);

  useEffect(() => {
    if (currentQuestion && !isAnalysisView) {
      setVisited(prev => new Set(prev).add(currentQuestion.id));
      if (currentQuestion.subject && activeSubject !== currentQuestion.subject) setActiveSubject(currentQuestion.subject);
    }
  }, [currentQuestionIndex, currentQuestion, isAnalysisView]);

  useEffect(() => {
    if (testData && testData.questions.length > 0 && !activeSubject) {
      setActiveSubject(testData.questions[0].subject);
      setStartTime(Date.now());
    }
  }, [testData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedZip(file); setPasswordModalOpen(true); setDecryptError(""); setPassword(""); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZip || !password) return;
    setIsDecrypting(true); setDecryptError("");
    try {
      const zip = new JSZip();
      let blobOrData: any;
      if ('data' in selectedZip) blobOrData = base64ToBuff(selectedZip.data);
      else blobOrData = selectedZip;
      const zipContent = await zip.loadAsync(blobOrData);
      const securityFile = zipContent.file("security.json");
      const metadataFile = zipContent.file("encrypted_metadata.bin");
      if (!securityFile || !metadataFile) throw new Error("Invalid Package");
      const securityJson = JSON.parse(await securityFile.async("string"));
      const salt = base64ToBuff(securityJson.salt);
      const iv = base64ToBuff(securityJson.iv);
      const encryptedMetadata = await metadataFile.async("uint8array");
      const decryptedString = await decryptData(encryptedMetadata, password, salt, iv);
      const metadata: TestMetadata = JSON.parse(decryptedString);
      const questionsWithImages = await Promise.all(metadata.questions.map(async (q) => {
        const imgFile = zipContent.file(q.imagePath);
        let imageUrl = undefined;
        if (imgFile) imageUrl = URL.createObjectURL(await imgFile.async("blob"));
        return { ...q, imageUrl };
      }));
      setTestData({ ...metadata, questions: questionsWithImages });
      setPasswordModalOpen(false);
    } catch (err: any) {
      setDecryptError(err.message === "Incorrect Password" ? "Incorrect password." : "Corrupted data.");
    } finally { setIsDecrypting(false); }
  };

  const handleAnswerSelect = (option: string) => {
    if (!testData) return;
    const q = testData.questions[currentQuestionIndex];
    let newAns = option;
    if (q.type === 'MSQ') {
      const currentAns = answers[q.id] ? answers[q.id].split(',') : [];
      if (currentAns.includes(option)) newAns = currentAns.filter(a => a !== option).join(',');
      else newAns = [...currentAns, option].sort().join(',');
    }
    setAnswers(prev => ({ ...prev, [q.id]: newAns }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const finishTest = async () => {
    if (!testData) return;
    setSubmitModalOpen(false);
    let score = 0, correctCount = 0, incorrectCount = 0;
    const totalMarks = testData.questions.reduce((acc, q) => acc + q.markingScheme.correct, 0);
    const attemptedCount = Object.keys(answers).length;
    testData.questions.forEach(q => {
      const result = evaluateQuestionScore(q, answers[q.id] || "");
      score += result.marks;
      if (result.isCorrect) correctCount++;
      else if (answers[q.id]) incorrectCount++;
    });
    const timeTaken = Math.floor((Date.now() - startTime) / 1000) - breakTime;

    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const finalScore = parseFloat(score.toFixed(2));

    const historyItem: TestHistoryItem = {
      id: uuidv4(),
      testName: testData.testName,
      timestamp: new Date().toISOString(),
      score: finalScore,
      totalMarks,
      percentage: totalMarks > 0 ? ((score / totalMarks) * 100).toFixed(2) : "0.00",
      accuracy: accuracy,
      timeTaken,
      totalQuestions: testData.totalQuestions,
      attempted: attemptedCount,
      correct: correctCount,
      incorrect: incorrectCount,
      storedData: {
        questions: testData.questions.map(({ imageUrl, ...rest }) => rest),
        answers,
        questionTimes,
        mistakes: {}
      }
    };

    // 1. Sync to Cloud (LIVE Percentile calculation)
    const token = localStorage.getItem('supabase_token');
    let userId = undefined;
    if (token) {
      try {
        const profile = await CloudService.getProfile(token);
        if (profile) userId = profile.id;
      } catch (e) { }
    }
    CloudService.submitAttempt(testData.testName, finalScore, accuracy, userId);

    // 2. Sync to Local History
    try { await dbStore.set('history', historyItem); } catch (e) { console.error("Failed to save history", e); }

    setIsAnalysisView(true);
  };

  if (testData && isAnalysisView) {
    return (
      <TestAnalysis
        testName={testData.testName}
        onExit={onExit}
        questions={testData.questions}
        answers={answers}
        questionTimes={questionTimes}
      />
    );
  }

  if (testData && currentQuestion) {
    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === testData.questions.length - 1;
    const numOptions = parseInt(currentQuestion.optionsCount.split('x')[0]) || 4;
    const subjects = Array.from(new Set(testData.questions.map(q => q.subject)));
    const filteredQuestions = testData.questions.filter(q => q.subject === activeSubject);
    const groupedQuestions = filteredQuestions.reduce((acc, q) => {
      const groupName = (q.section && q.section.trim() !== "" && !q.section.match(/^Physics$|^Chemistry$|^Mathematics$/i)) ? q.section : q.type;
      if (!acc[groupName]) acc[groupName] = []; acc[groupName].push(q); return acc;
    }, {} as Record<string, QuestionData[]>);

    const attemptedCount = testData.questions.filter(q => !!answers[q.id]).length;
    const totalQuestions = testData.totalQuestions;
    const totalMarks = testData.questions.reduce((acc, q) => acc + q.markingScheme.correct, 0);
    const marksAttempted = testData.questions.reduce((acc, q) => {
      return (answers[q.id]) ? acc + q.markingScheme.correct : acc;
    }, 0);

    const getStatusColor = (q: QuestionData) => {
      const isAnswered = !!answers[q.id];
      const isMarked = marked.has(q.id);
      const isVisited = visited.has(q.id);
      if (isAnswered && isMarked) return 'bg-zinc-100 text-black border border-zinc-100';
      if (isMarked) return 'bg-zinc-700 text-zinc-100 border border-zinc-600';
      if (isAnswered) return 'bg-zinc-100 text-black border border-zinc-100';
      if (isVisited) return 'bg-zinc-900 text-zinc-300 border border-zinc-700';
      return 'bg-transparent text-zinc-600 border border-zinc-800';
    };

    const visualStats = {
      answered: testData.questions.filter(q => answers[q.id] && !marked.has(q.id)).length,
      notAnswered: testData.questions.filter(q => visited.has(q.id) && !answers[q.id] && !marked.has(q.id)).length,
      marked: testData.questions.filter(q => marked.has(q.id) && !answers[q.id]).length,
      markedAnswered: testData.questions.filter(q => marked.has(q.id) && answers[q.id]).length,
      notVisited: testData.questions.filter(q => !visited.has(q.id)).length
    };

    const sidebarContent = (
      <div className="flex flex-col h-full bg-zinc-900 text-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/30 shrink-0">
          <div className="grid grid-cols-2 gap-y-3 gap-x-2">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-zinc-100 border border-zinc-100 text-[8px] flex items-center justify-center font-bold text-black shadow-sm"></div><span className="text-[10px] text-zinc-400 font-medium uppercase">Answered ({visualStats.answered})</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 text-[8px] flex items-center justify-center font-bold text-zinc-300"></div><span className="text-[10px] text-zinc-400 font-medium uppercase">Not Answered ({visualStats.notAnswered})</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-zinc-800 text-[8px] flex items-center justify-center font-bold text-zinc-500"></div><span className="text-[10px] text-zinc-400 font-medium uppercase">Not Visited ({visualStats.notVisited})</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-zinc-700 text-[8px] flex items-center justify-center font-bold text-zinc-100"></div><span className="text-[10px] text-zinc-400 font-medium uppercase">Marked ({visualStats.marked})</span></div>
            <div className="flex items-center gap-2 col-span-2"><div className="w-4 h-4 rounded-full bg-zinc-100 text-[8px] flex items-center justify-center font-bold text-black relative"><div className="absolute -right-1 -bottom-1 w-1.5 h-1.5 bg-black rounded-full border border-white"></div></div><span className="text-[10px] text-zinc-400 font-medium uppercase">Ans & Marked ({visualStats.markedAnswered})</span></div>
          </div>
        </div>
        <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-widest">{activeSubject}</span>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500 hover:text-zinc-200"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {Object.keys(groupedQuestions).sort().map((groupName) => (
            <div key={groupName}>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">{groupName}<div className="h-px flex-1 bg-zinc-800"></div></h4>
              <div className="grid grid-cols-5 gap-2.5">
                {groupedQuestions[groupName].map((q) => {
                  const statusClass = getStatusColor(q);
                  const globalIndex = testData.questions.findIndex(tq => tq.id === q.id);
                  return (
                    <button key={q.id} onClick={() => { setCurrentQuestionIndex(globalIndex); setIsSidebarOpen(false); }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all relative shadow-sm ${statusClass} ${globalIndex === currentQuestionIndex ? 'ring-2 ring-white scale-110 z-10 shadow-lg' : 'hover:scale-105'}`}>
                      {q.questionNumber}{!!answers[q.id] && marked.has(q.id) && <div className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 bg-black rounded-full border border-zinc-100 shadow-sm"></div>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 z-10">
          <button onClick={() => setSubmitModalOpen(true)} className="w-full py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg text-sm transition-all active:translate-y-0.5 shadow-lg shadow-white/5 mb-4 uppercase tracking-widest">SUBMIT TEST</button>
          <div className="text-center"><span className="text-[10px] font-medium text-zinc-600 tracking-wider">DESIGNED BY @AKASHJR</span></div>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-200 font-sans selection:bg-zinc-700">
        <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 z-20">
          <div className="font-bold text-zinc-100 flex items-center gap-3 min-w-0">
            <button onClick={() => setExitModalOpen(true)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"><ArrowLeft size={16} /></button>
            <div className="flex flex-col min-w-0"><span className="leading-tight text-sm tracking-widest uppercase font-mono truncate max-w-[120px] sm:max-w-xs">{testData.testName}</span><span className="text-[10px] text-zinc-500 font-mono font-medium">ID: {currentQuestionIndex + 1}/{testData.totalQuestions}</span></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-zinc-950 px-4 py-1.5 rounded-lg border border-zinc-800/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <Clock size={16} className="text-zinc-500" /><span className={`font-mono font-bold text-lg tracking-wider ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-zinc-100'}`}>{formatTime(timeLeft)}</span>
            </div>
            <button onClick={() => setIsPaused(true)} className="p-2 sm:p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 shadow-sm"><Pause size={16} fill="currentColor" className="opacity-50" /></button>
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50"><Menu size={16} /></button>
          </div>
        </header>
        <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-end px-4 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          {subjects.map(sub => (
            <button key={sub} onClick={() => setActiveSubject(sub)}
              className={`px-4 sm:px-6 py-2 rounded-t-lg text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all border-t border-x border-b-0 translate-y-[1px] whitespace-nowrap ${activeSubject === sub ? 'bg-zinc-800 border-zinc-700 text-zinc-100 z-10' : 'bg-zinc-900/50 border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}>
              {sub}
            </button>
          ))}
        </div>
        <div className="flex-1 flex overflow-hidden relative">
          <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-2 sm:gap-4"><span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-100 text-sm shadow-inner shrink-0">{currentQuestion.questionNumber}</span><span className="px-2 sm:px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 font-bold uppercase tracking-widest shadow-sm truncate max-w-[100px] sm:max-w-none">{TYPE_MAPPING[currentQuestion.type] || currentQuestion.type}</span></div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono font-bold">
                <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800/50 mr-2 shadow-sm"><Clock size={12} className="text-zinc-500" /><span className="tracking-widest">{formatTime(questionTimes[currentQuestion.id] || 0)}</span></div>
                <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">+{currentQuestion.markingScheme.correct}</div>
                <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{currentQuestion.markingScheme.incorrect}</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
              <div className="w-full max-w-[98%] space-y-6 sm:space-y-8">
                <div className="bg-white rounded-lg border border-zinc-800 overflow-hidden min-h-[200px] shadow-lg relative">{currentQuestion.imageUrl ? <img src={currentQuestion.imageUrl} className="w-full h-auto object-contain" alt="Question" /> : <div className="flex flex-col items-center justify-center p-12 gap-2 text-zinc-400"><AlertCircle size={32} /></div>}</div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2"><span className="w-1 h-4 bg-zinc-700 rounded-full"></span>SELECT RESPONSE</h3>
                  {(currentQuestion.type === 'MCQ' || currentQuestion.type === 'MSQ') && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      {Array.from({ length: numOptions }).map((_, i) => {
                        const val = (i + 1).toString(), label = String.fromCharCode(65 + i), currentAns = answers[currentQuestion.id] || "",
                          isSelected = currentQuestion.type === 'MSQ' ? currentAns.split(',').includes(val) : currentAns === val;
                        return (
                          <button key={i} onClick={() => handleAnswerSelect(val)}
                            className={`h-12 sm:h-14 rounded-xl border flex items-center px-3 sm:px-4 gap-3 sm:gap-4 transition-all group relative overflow-hidden ${isSelected ? 'bg-zinc-100 border-zinc-100 text-black shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}>
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-500'}`}>{label}</div>
                            <span className="text-xs sm:text-sm font-medium uppercase">Option {label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {currentQuestion.type === 'NAT' && <div className="max-w-md mx-auto"><input type="text" placeholder="Value..." value={answers[currentQuestion.id] || ""} onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-center font-mono text-xl text-zinc-200 focus:border-zinc-600 outline-none transition-all placeholder:text-zinc-700" /></div>}
                </div>
              </div>
            </div>
            <div className="h-16 border-t border-zinc-800 bg-zinc-900 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xl z-10">
              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => { const newAns = { ...answers }; delete newAns[currentQuestion.id]; setAnswers(newAns); }} className="px-3 sm:px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 text-xs font-bold flex items-center gap-2 transition-colors"><RotateCcw size={14} /><span className="hidden sm:inline">Clear</span></button>
                <button onClick={() => { const newMarked = new Set(marked); if (newMarked.has(currentQuestion.id)) newMarked.delete(currentQuestion.id); else newMarked.add(currentQuestion.id); setMarked(newMarked); }}
                  className={`px-3 sm:px-4 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-colors ${marked.has(currentQuestion.id) ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}><Bookmark size={14} fill={marked.has(currentQuestion.id) ? "currentColor" : "none"} /><span className="hidden sm:inline">{marked.has(currentQuestion.id) ? "Marked" : "Review"}</span></button>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={isFirst} className="px-4 sm:px-6 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors">Previous</button>
                <button onClick={() => setCurrentQuestionIndex(Math.min(testData.questions.length - 1, currentQuestionIndex + 1))} className="px-6 sm:px-8 py-2 rounded-lg bg-zinc-100 text-black hover:bg-white text-xs font-bold transition-all active:translate-y-0.5 shadow-lg shadow-white/5 uppercase tracking-widest">{isLast ? "Finish" : "Next"}</button>
              </div>
            </div>
          </main>
          <aside className="hidden md:flex w-[320px] bg-zinc-900 border-l border-zinc-800 flex-col shrink-0 z-10 h-full max-h-full">{sidebarContent}</aside>
          {isSidebarOpen && <div className="md:hidden fixed inset-0 z-50 flex justify-end"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} /><aside className="relative w-[300px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">{sidebarContent}</aside></div>}
        </div>
        {isPaused && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-xl animate-in fade-in duration-300 p-4"><div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300 w-full max-w-sm"><div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl ring-4 ring-zinc-900/50"><Pause size={40} className="text-zinc-200" fill="currentColor" /></div><div className="text-center space-y-4"><h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">Test Paused</h2><p className="text-base sm:text-lg font-bold tracking-wide bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-600 bg-clip-text text-transparent drop-shadow-sm">Take a break. Your progress is saved.</p><div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800 text-zinc-400 font-mono text-sm"><Clock size={14} />Break: <span className="text-zinc-200">{formatTime(breakTime)}</span></div></div><button onClick={() => setIsPaused(false)} className="group flex items-center gap-3 px-8 py-3 sm:px-10 sm:py-4 bg-zinc-100 hover:bg-white text-black rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-white/10 active:scale-95 w-full justify-center"><Play size={20} fill="currentColor" />Resume Test</button></div></div>}
        {isSubmitModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"><div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"><button onClick={() => setSubmitModalOpen(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200 transition-colors z-10"><X size={20} /></button><div className="bg-zinc-900 border-b border-zinc-800 p-6 sm:p-8 text-center relative"><div className="relative z-10 flex flex-col items-center gap-4"><div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-xl"><Trophy size={24} className="text-zinc-100" /></div><div><h2 className="text-2xl font-bold text-zinc-100">Submit Test</h2><p className="text-zinc-500 text-sm">Are you sure you want to finish?</p></div></div></div><div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto"><div className="grid grid-cols-2 sm:grid-cols-3 gap-3"><div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2"><div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider"><Clock size={14} /> Time Left</div><div className="text-xl font-mono font-bold text-zinc-200">{formatTime(timeLeft)}</div></div><div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2"><div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider"><Trophy size={14} /> Potential</div><div className="text-xl font-mono font-bold text-zinc-200">{marksAttempted}/{totalMarks}</div></div><div className="bg-zinc-100 border border-zinc-100 p-4 rounded-xl flex flex-col gap-2"><div className="flex items-center gap-2 text-zinc-600 text-xs font-bold uppercase tracking-wider"><CheckCircle2 size={14} /> Attempted</div><div className="text-xl font-mono font-bold text-black">{attemptedCount}</div></div></div><div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"><div className="flex items-center gap-2 mb-4"><div className="p-1.5 bg-zinc-800 rounded text-zinc-400"><FileQuestion size={16} /></div><span className="font-bold text-sm text-zinc-200">Overview</span></div><div className="flex justify-between text-xs text-zinc-500 mb-2"><span>Completion</span><span className="font-mono text-zinc-300">{attemptedCount}/{totalQuestions}</span></div><div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-zinc-100 transition-all duration-500" style={{ width: `${(attemptedCount / totalQuestions) * 100}%` }} /></div></div>{totalQuestions - attemptedCount > 0 && <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex gap-3 items-start"><AlertTriangle size={18} className="text-red-500/50 shrink-0 mt-0.5" /><p className="text-xs text-red-200/50 leading-relaxed">You have <strong className="text-red-400">{totalQuestions - attemptedCount} unanswered questions</strong>.</p></div>}<button onClick={finishTest} className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:translate-y-0.5 uppercase tracking-widest">Submit Test</button></div></div></div>}
        {isExitModalOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"><div className="w-full max-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"><div className="p-6 text-center"><div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><AlertTriangle size={24} className="text-red-500" /></div><h3 className="text-lg font-bold text-zinc-100 mb-2">Exit Test?</h3><p className="text-sm text-zinc-500 mb-6 font-mono uppercase tracking-tighter">All progress for this session will be lost.</p><div className="grid grid-cols-2 gap-3"><button onClick={() => setExitModalOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-bold text-sm transition-colors uppercase">Cancel</button><button onClick={onExit} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors uppercase">Exit</button></div></div></div></div>}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-300 relative font-sans overflow-hidden">
        <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 z-20">
          <div className="font-bold text-zinc-100 flex items-center gap-3 min-w-0">
            <button onClick={onExit} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"><ArrowLeft size={16} /></button>
            <div className="flex flex-col min-w-0">
              <span className="leading-tight text-sm tracking-widest uppercase font-mono truncate">Q-Taker</span>
              <span className="text-[10px] text-zinc-500 font-mono font-medium">Session Initializer</span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".zip" className="hidden" />
          <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-center relative z-10">
            <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-zinc-700/50">
              <Upload size={24} className="text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2 uppercase tracking-widest">Load Test Package</h2>
            <p className="text-zinc-500 text-sm mb-8 font-mono uppercase tracking-tighter">Upload the encrypted ZIP provided by your instructor.</p>
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg transition-all shadow-lg active:translate-y-0.5 uppercase tracking-widest">Select Package</button>
          </div>
        </div>
      </div>
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[360px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => { setPasswordModalOpen(false); setSelectedZip(null); }} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
            <div className="flex flex-col items-center gap-4 mb-6"><div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-100 shadow-lg"><Lock size={20} /></div><div className="text-center"><h3 className="text-lg font-bold text-zinc-100 uppercase tracking-widest">Decrypt Package</h3><p className="text-[10px] text-zinc-500 mt-1 uppercase">Enter test password.</p></div></div>
            <form onSubmit={handleDecrypt} className="space-y-4">
              <input type="password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setDecryptError(""); }} placeholder="TEST PASSWORD"
                className={`w-full bg-zinc-900 border ${decryptError ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-zinc-500/50'} text-zinc-200 text-sm rounded-xl py-3 px-4 outline-none transition-all placeholder:text-zinc-700 font-mono`} />
              {decryptError && <p className="text-[10px] text-red-400 text-center font-bold animate-in slide-in-from-top-1 uppercase">{decryptError}</p>}
              <button type="submit" disabled={!password || isDecrypting}
                className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest">
                {isDecrypting ? <><Loader2 size={14} className="animate-spin" />DECRYPTING...</> : <><ChevronRight size={14} />START TEST</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
