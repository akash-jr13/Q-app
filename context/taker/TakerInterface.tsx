import React, { useRef, useState, useEffect } from 'react';
import { Upload, ArrowLeft, Lock, Loader2, ChevronRight, Clock, AlertCircle, Check, Bookmark, RotateCcw, Menu, X, Trophy, AlertTriangle, FileQuestion, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { QuestionData } from '../../types';

interface TakerInterfaceProps {
  onExit: () => void;
}

interface TestMetadata {
  testName: string;
  totalQuestions: number;
  questions: (QuestionData & { imagePath: string; imageUrl?: string })[];
}

// --- Crypto Helpers ---

const base64ToBuff = (b64: string): Uint8Array => {
  const binary = window.atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256"
    },
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
    throw new Error("Incorrect Password or Corrupted Data");
  }
}


// --- Component ---

export const TakerInterface: React.FC<TakerInterfaceProps> = ({ onExit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for File Loading
  const [selectedZip, setSelectedZip] = useState<File | null>(null);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

  // State for Active Test
  const [testData, setTestData] = useState<TestMetadata | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // New State for Timer & Status
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); // 3 Hours default
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [isSubmitModalOpen, setSubmitModalOpen] = useState(false);

  // Question Timer State
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});

  // Global Timer Effect
  useEffect(() => {
    if (!testData) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [testData]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (testData) {
        testData.questions.forEach(q => {
          if (q.imageUrl) URL.revokeObjectURL(q.imageUrl);
        });
      }
    };
  }, [testData]);

  const currentQuestion = testData?.questions[currentQuestionIndex];

  // Question Timer Effect
  useEffect(() => {
    if (!currentQuestion) return;
    const timer = setInterval(() => {
      setQuestionTimes(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestion]);

  // Track Visited & Sync Subject
  useEffect(() => {
    if (currentQuestion) {
      setVisited(prev => new Set(prev).add(currentQuestion.id));
      if (currentQuestion.subject && activeSubject !== currentQuestion.subject) {
        setActiveSubject(currentQuestion.subject);
      }
    }
  }, [currentQuestionIndex, currentQuestion]);

  // Init Active Subject
  useEffect(() => {
    if (testData && testData.questions.length > 0 && !activeSubject) {
      setActiveSubject(testData.questions[0].subject);
    }
  }, [testData]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedZip(file);
      setPasswordModalOpen(true);
      setDecryptError("");
      setPassword("");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZip || !password) return;

    setIsDecrypting(true);
    setDecryptError("");

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(selectedZip);

      const securityFile = zipContent.file("security.json");
      const metadataFile = zipContent.file("encrypted_metadata.bin");

      if (!securityFile || !metadataFile) {
        throw new Error("Invalid Test Package format.");
      }

      const securityJson = JSON.parse(await securityFile.async("string"));
      const salt = base64ToBuff(securityJson.salt);
      const iv = base64ToBuff(securityJson.iv);

      const encryptedMetadata = await metadataFile.async("uint8array");
      const decryptedString = await decryptData(encryptedMetadata, password, salt, iv);
      const metadata: TestMetadata = JSON.parse(decryptedString);

      const questionsWithImages = await Promise.all(metadata.questions.map(async (q) => {
        const imgFile = zipContent.file(q.imagePath);
        let imageUrl = undefined;
        if (imgFile) {
          const blob = await imgFile.async("blob");
          imageUrl = URL.createObjectURL(blob);
        }
        return { ...q, imageUrl };
      }));

      setTestData({ ...metadata, questions: questionsWithImages });
      setPasswordModalOpen(false);

    } catch (err: any) {
      console.error(err);
      setDecryptError(err.message === "Incorrect Password or Corrupted Data" ? "Incorrect password provided." : "Failed to load package. File may be corrupted.");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (!testData) return;
    const q = testData.questions[currentQuestionIndex];
    let newAns = option;
    if (q.type === 'MSQ') {
      const currentAns = answers[q.id] ? answers[q.id].split(',') : [];
      if (currentAns.includes(option)) {
        newAns = currentAns.filter(a => a !== option).join(',');
      } else {
        newAns = [...currentAns, option].sort().join(',');
      }
    }
    // Toggle check: if clicking selected radio again, don't unselect for MCQ usually, but for UI flex lets allow update
    setAnswers(prev => ({ ...prev, [q.id]: newAns }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (q: QuestionData) => {
    const isAnswered = !!answers[q.id] && answers[q.id].length > 0;
    const isMarked = marked.has(q.id);
    const isVisited = visited.has(q.id);

    // ZINC THEME COLORS
    if (isAnswered && isMarked) return 'bg-zinc-100 text-black border border-zinc-100'; // Marked & Answered
    if (isMarked) return 'bg-zinc-700 text-zinc-100 border border-zinc-600'; // Marked
    if (isAnswered) return 'bg-zinc-100 text-black border border-zinc-100'; // Answered
    if (isVisited) return 'bg-zinc-900 text-zinc-300 border border-zinc-700'; // Visited (Not Answered)
    return 'bg-transparent text-zinc-600 border border-zinc-800'; // Not Visited
  };

  // --- RENDER: TEST INTERFACE ---
  if (testData && currentQuestion) {
    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === testData.questions.length - 1;

    // Determine Options Layout
    const optionsCountStr = currentQuestion.optionsCount || "4";
    const numOptions = parseInt(optionsCountStr.split('x')[0]) || 4;
    const subjects = Array.from(new Set(testData.questions.map(q => q.subject)));

    // Filter questions for the sidebar palette
    const filteredQuestions = testData.questions.filter(q => q.subject === activeSubject);

    // Group questions by Section or Type for segregation
    const groupedQuestions = filteredQuestions.reduce((acc, q) => {
      // Use section if it exists and is specific, otherwise fallback to type
      const groupName = (q.section && q.section.trim() !== "" && !q.section.match(/^Physics$|^Chemistry$|^Mathematics$/i))
        ? q.section
        : q.type;

      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(q);
      return acc;
    }, {} as Record<string, QuestionData[]>);

    const sortedGroups = Object.keys(groupedQuestions).sort();

    // Stats for sidebar & modal
    const totalQuestions = testData.totalQuestions;
    const attemptedCount = testData.questions.filter(q => answers[q.id] && answers[q.id].length > 0).length;
    const markedCount = marked.size;
    const notAttemptedCount = totalQuestions - attemptedCount;
    const notVisitedCount = testData.questions.filter(q => !visited.has(q.id)).length;

    // Derived Stats for Modal
    // Calculate total possible marks and marks attempted (sum of positive marks of attempted questions)
    const totalMarks = testData.questions.reduce((acc, q) => acc + q.markingScheme.correct, 0);
    const marksAttempted = testData.questions.reduce((acc, q) => {
      return (answers[q.id] && answers[q.id].length > 0) ? acc + q.markingScheme.correct : acc;
    }, 0);


    // Adjusted stats for visual consistency with typical palette logic
    const visualStats = {
      answered: testData.questions.filter(q => answers[q.id] && !marked.has(q.id)).length,
      notAnswered: testData.questions.filter(q => visited.has(q.id) && !answers[q.id] && !marked.has(q.id)).length,
      marked: testData.questions.filter(q => marked.has(q.id) && !answers[q.id]).length,
      markedAnswered: testData.questions.filter(q => marked.has(q.id) && answers[q.id]).length,
      notVisited: notVisitedCount
    };


    return (
      <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-200 font-sans selection:bg-zinc-700">

        {/* TOP HEADER */}
        <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 z-20">
          <div className="font-bold text-zinc-100 truncate flex items-center gap-3">
            <button onClick={onExit} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div className="flex flex-col">
              <span className="leading-tight">{testData.testName}</span>
              <span className="text-[10px] text-zinc-500 font-mono font-medium">ID: {currentQuestionIndex + 1}/{testData.totalQuestions}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-950 px-4 py-1.5 rounded-lg border border-zinc-800 shadow-sm">
              <Clock size={16} className="text-zinc-500" />
              <span className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-zinc-200'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="hidden sm:flex bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg active:translate-y-0.5"
            >
              Submit
            </button>
          </div>
        </header>

        {/* SUBJECT TABS */}
        <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-end px-4 gap-2 shrink-0 overflow-x-auto">
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => setActiveSubject(sub)}
              className={`px-6 py-2 rounded-t-lg text-xs font-bold uppercase tracking-wide transition-all border-t border-x border-b-0 translate-y-[1px] ${activeSubject === sub
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100 z-10'
                : 'bg-zinc-900/50 border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: QUESTION AREA */}
          <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">

            {/* Q Header */}
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-100 text-sm shadow-inner">
                  {currentQuestion.questionNumber}
                </span>
                {/* Segregated Type Pill */}
                <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 font-bold uppercase tracking-widest shadow-sm">
                  {currentQuestion.type}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono font-bold">
                <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800/50 mr-2 shadow-sm">
                  <Clock size={12} className="text-zinc-500" />
                  <span className="tracking-widest">{formatTime(questionTimes[currentQuestion.id] || 0)}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Check size={12} /> +{currentQuestion.markingScheme.correct}
                </div>
                <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  <AlertCircle size={12} /> {currentQuestion.markingScheme.incorrect}
                </div>
              </div>
            </div>

            {/* Q Content & Options */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <div className="w-full max-w-5xl space-y-8">

                {/* Image */}
                <div className="bg-white rounded-lg border border-zinc-800 overflow-hidden min-h-[200px] shadow-lg relative">
                  {currentQuestion.imageUrl ? (
                    <img
                      src={currentQuestion.imageUrl}
                      alt={`Q${currentQuestion.questionNumber}`}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 gap-2 text-zinc-400">
                      <AlertCircle size={32} />
                      <span className="text-xs">Image load failed</span>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-zinc-700 rounded-full"></span>
                    Select Response
                  </h3>

                  {(currentQuestion.type === 'MCQ' || currentQuestion.type === 'MSQ') && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: numOptions }).map((_, i) => {
                        const val = (i + 1).toString();
                        const label = String.fromCharCode(65 + i);
                        const currentAns = answers[currentQuestion.id] || "";
                        const isSelected = currentQuestion.type === 'MSQ'
                          ? currentAns.split(',').includes(val)
                          : currentAns === val;

                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswerSelect(val)}
                            className={`h-14 rounded-xl border flex items-center px-4 gap-4 transition-all group relative overflow-hidden ${isSelected
                              ? 'bg-zinc-100 border-zinc-100 text-black shadow-lg'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                              }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-500'
                              }`}>
                              {label}
                            </div>
                            <span className="text-sm font-medium">Option {label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'NAT' && (
                    <div className="max-w-md mx-auto">
                      <input
                        type="text"
                        placeholder="Enter numerical value..."
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-center font-mono text-xl text-zinc-200 focus:border-zinc-600 outline-none transition-all placeholder:text-zinc-700"
                      />
                    </div>
                  )}

                  {currentQuestion.type === 'MSM' && (
                    <div className="text-center p-8 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-sm">
                      Matrix Match input is not yet supported in this view.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer Navigation */}
            <div className="h-16 border-t border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between shrink-0 shadow-2xl z-10">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const newAns = { ...answers };
                    delete newAns[currentQuestion.id];
                    setAnswers(newAns);
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <RotateCcw size={14} />
                  Clear
                </button>
                <button
                  onClick={() => {
                    const newMarked = new Set(marked);
                    if (newMarked.has(currentQuestion.id)) newMarked.delete(currentQuestion.id);
                    else newMarked.add(currentQuestion.id);
                    setMarked(newMarked);
                  }}
                  className={`px-4 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-colors ${marked.has(currentQuestion.id)
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                >
                  <Bookmark size={14} fill={marked.has(currentQuestion.id) ? "currentColor" : "none"} />
                  {marked.has(currentQuestion.id) ? "Marked" : "Review"}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={isFirst}
                  className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(testData.questions.length - 1, currentQuestionIndex + 1))}
                  className="px-8 py-2 rounded-lg bg-zinc-100 text-black hover:bg-white text-xs font-bold transition-all active:translate-y-0.5 shadow-lg shadow-white/5"
                >
                  {isLast ? "Finish" : "Next"}
                </button>
              </div>
            </div>

          </main>

          {/* RIGHT: SIDEBAR */}
          <aside className="w-[320px] bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 z-10">

            {/* Legend with Zinc Colors */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/30">
              <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-zinc-100 border border-zinc-100 text-[8px] flex items-center justify-center font-bold text-black shadow-sm"></div>
                  <span className="text-[10px] text-zinc-400 font-medium">Answered ({visualStats.answered})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 text-[8px] flex items-center justify-center font-bold text-zinc-300"></div>
                  <span className="text-[10px] text-zinc-400 font-medium">Not Answered ({visualStats.notAnswered})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-zinc-800 text-[8px] flex items-center justify-center font-bold text-zinc-500"></div>
                  <span className="text-[10px] text-zinc-400 font-medium">Not Visited ({visualStats.notVisited})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-zinc-700 text-[8px] flex items-center justify-center font-bold text-zinc-100"></div>
                  <span className="text-[10px] text-zinc-400 font-medium">Marked ({visualStats.marked})</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <div className="w-4 h-4 rounded-full bg-zinc-100 text-[8px] flex items-center justify-center font-bold text-black relative">
                    <div className="absolute -right-1 -bottom-1 w-1.5 h-1.5 bg-black rounded-full border border-white"></div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">Ans & Marked ({visualStats.markedAnswered})</span>
                </div>
              </div>
            </div>

            {/* Current Selection Header */}
            <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-200">{activeSubject}</span>
              <Menu size={14} className="text-zinc-500" />
            </div>

            {/* Segregated Grid */}
            <div className="flex-1 overflow-y-auto p-4 content-start space-y-6">
              {sortedGroups.length > 0 ? (
                sortedGroups.map((groupName) => (
                  <div key={groupName}>
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      {groupName}
                      <div className="h-px flex-1 bg-zinc-800"></div>
                    </h4>
                    <div className="grid grid-cols-5 gap-2.5">
                      {groupedQuestions[groupName].map((q) => {
                        const statusClass = getStatusColor(q);
                        const globalIndex = testData.questions.findIndex(tq => tq.id === q.id);
                        const isCurrent = globalIndex === currentQuestionIndex;
                        const isMarkedAndAnswered = !!answers[q.id] && marked.has(q.id);

                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(globalIndex)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all relative shadow-sm ${statusClass} ${isCurrent ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-105'
                              }`}
                          >
                            {q.questionNumber}
                            {isMarkedAndAnswered && (
                              <div className="absolute -right-0.5 -bottom-0.5 w-2 h-2 bg-black rounded-full border border-zinc-100"></div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-xs">No questions found in this section.</div>
              )}
            </div>

            {/* Submit */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
              <button
                onClick={() => setSubmitModalOpen(true)}
                className="w-full py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg text-sm transition-all active:translate-y-0.5 shadow-lg shadow-white/5 mb-4"
              >
                Submit Test
              </button>
              <div className="text-center">
                <span className="text-[10px] font-medium text-zinc-600 tracking-wider">DESIGNED BY @AKASHJR</span>
              </div>
            </div>

          </aside>
        </div>

        {/* SUBMIT MODAL */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200 transition-colors z-10"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="bg-zinc-900 border-b border-zinc-800 p-8 text-center relative">
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-xl">
                    <Trophy size={24} className="text-zinc-100" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-100">Submit Test</h2>
                    <p className="text-zinc-500 text-sm">Are you sure you want to finish?</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Time Left */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                      <Clock size={14} /> Time Left
                    </div>
                    <div className="text-xl font-mono font-bold text-zinc-200">
                      {formatTime(timeLeft)}
                    </div>
                  </div>

                  {/* Max Marks */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                      <Trophy size={14} /> Score
                    </div>
                    <div className="text-xl font-mono font-bold text-zinc-200">
                      {marksAttempted}/{totalMarks}
                    </div>
                  </div>

                  {/* Attempted */}
                  <div className="bg-zinc-100 border border-zinc-100 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-600 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 size={14} /> Attempted
                    </div>
                    <div className="text-xl font-mono font-bold text-black">
                      {attemptedCount}
                    </div>
                  </div>

                  {/* Marked */}
                  <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <Bookmark size={14} /> Marked
                    </div>
                    <div className="text-xl font-mono font-bold text-zinc-100">
                      {markedCount}
                    </div>
                  </div>

                  {/* Not Attempted */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                      <AlertCircle size={14} /> Unanswered
                    </div>
                    <div className="text-xl font-mono font-bold text-zinc-200">
                      {notAttemptedCount}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-zinc-800 rounded text-zinc-400">
                      <FileQuestion size={16} />
                    </div>
                    <span className="font-bold text-sm text-zinc-200">Overview</span>
                  </div>

                  <div className="flex justify-between text-xs text-zinc-500 mb-2">
                    <span>Completion</span>
                    <span className="font-mono text-zinc-300">{attemptedCount}/{totalQuestions}</span>
                  </div>

                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-100 transition-all duration-500"
                      style={{ width: `${(attemptedCount / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Warning */}
                {notAttemptedCount > 0 && (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex gap-3 items-start">
                    <AlertTriangle size={18} className="text-red-500/50 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-200/50 leading-relaxed">
                      You have <strong className="text-red-400">{notAttemptedCount} unanswered questions</strong>.
                    </p>
                  </div>
                )}

                {/* Footer Button */}
                <button
                  onClick={() => { onExit(); }}
                  className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:translate-y-0.5"
                >
                  Submit Test
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // --- RENDER: LOAD SCREEN ---
  return (
    <>
      <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-950 text-zinc-300 relative font-sans overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".zip"
          className="hidden"
        />

        <button
          onClick={onExit}
          className="fixed top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800 transition-all text-[10px] font-bold shadow-sm z-10"
        >
          <ArrowLeft size={12} />
          EXIT
        </button>

        <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-center relative z-10">
          <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-zinc-700/50">
            <Upload size={24} className="text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Load Test Package</h2>
          <p className="text-zinc-500 text-sm mb-8">
            Upload the encrypted <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">.zip</code> file provided by your instructor to begin the assessment.
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg transition-all shadow-lg active:translate-y-0.5"
          >
            Select Package
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[360px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setPasswordModalOpen(false);
                setSelectedZip(null);
              }}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-100 shadow-lg">
                <Lock size={20} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-zinc-100">Decrypt Package</h3>
                <p className="text-xs text-zinc-500 mt-1">Enter the test password provided by your instructor.</p>
              </div>
            </div>

            <form onSubmit={handleDecrypt} className="space-y-4">
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setDecryptError("");
                }}
                placeholder="Test Password"
                className={`w-full bg-zinc-900 border ${decryptError ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-zinc-500/50'} text-zinc-200 text-sm rounded-xl py-3 px-4 outline-none transition-all placeholder:text-zinc-600`}
              />

              {decryptError && (
                <p className="text-xs text-red-400 text-center font-medium animate-in slide-in-from-top-1">
                  {decryptError}
                </p>
              )}

              <button
                type="submit"
                disabled={!password || isDecrypting}
                className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDecrypting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    Start Test
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};