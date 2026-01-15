
import React, { useState } from 'react';
import { 
  Rocket,
  Minus,
  Plus,
  Crop,
  MousePointer2,
  Loader2,
  Trash2,
  ChevronDown,
  Lock,
  X,
  ArrowLeft,
  Clock,
  BrainCircuit,
  Tag
} from 'lucide-react';
import { Accordion } from '../Accordion';
import { useApp } from '../../context/AppContext';
import { QuestionTemplate, DifficultyLevel, SkillTag } from '../../types';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const SECTIONS = [
  "Physics Section 1", "Physics Section 2", "Physics Section 3", "Physics Section 4",
  "Chemistry Section 1", "Chemistry Section 2", "Chemistry Section 3", "Chemistry Section 4",
  "Mathematics Section 1", "Mathematics Section 2", "Mathematics Section 3", "Mathematics Section 4"
];

const SKILL_OPTIONS: SkillTag[] = ['Memory', 'Calculation', 'Logic', 'Theory'];

const DIFF_COLORS: Record<DifficultyLevel, string> = {
  Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20'
};

const buffToBase64 = (buffer: Uint8Array): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
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
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

async function encryptData(plainText: string, password: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);
  const enc = new TextEncoder();
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(plainText)
  );
  return { encryptedData: new Uint8Array(encryptedBuffer), salt, iv };
}

const getMatrixDimensions = (countStr: string) => {
  const parts = countStr.toLowerCase().split('x');
  const r = parseInt(parts[0]);
  const c = parts[1] ? parseInt(parts[1]) : r;
  return { rows: isNaN(r) ? 4 : r, cols: isNaN(c) ? (isNaN(r) ? 4 : r) : c };
};

const getRowLabel = (index: number) => String.fromCharCode(65 + index);
const getColLabel = (index: number) => String.fromCharCode(80 + index);

const Label: React.FC<{ children: React.ReactNode; required?: boolean; icon?: any }> = ({ children, required, icon: Icon }) => (
  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
    {Icon && <Icon size={12} className="text-zinc-600" />}
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export const Sidebar: React.FC = () => {
  const { 
    currentPage, setCurrentPage, numPages, selectedQuestionId, questions,
    updateQuestion, deleteQuestion, questionTemplate, setQuestionTemplate,
    interactionMode, setInteractionMode, pdfDocument, testName, onExit
  } = useApp();
  
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const activeData = selectedQuestion || questionTemplate;

  const handleUpdate = (field: keyof QuestionTemplate, value: any) => {
    const updates: any = { [field]: value };
    if (field === 'type') {
      updates.correctOption = '';
      if (value === 'MSM') updates.optionsCount = '4x4';
      else if (value === 'NAT') updates.optionsCount = '0';
      else if (activeData.optionsCount.includes('x')) updates.optionsCount = '4';
    }
    if (selectedQuestion) {
      updateQuestion(selectedQuestion.id, updates);
      if (field !== 'questionNumber' && field !== 'correctOption') {
        setQuestionTemplate(prev => ({ ...prev, ...updates }));
      }
    } else {
      setQuestionTemplate(prev => ({ ...prev, ...updates }));
    }
  };

  const handleMarkingUpdate = (field: 'correct' | 'incorrect' | 'partial', value: number) => {
    if (selectedQuestion) {
      updateQuestion(selectedQuestion.id, { markingScheme: { ...selectedQuestion.markingScheme, [field]: value } });
    }
    setQuestionTemplate(prev => ({ ...prev, markingScheme: { ...prev.markingScheme, [field]: value } }));
  };

  const handleOptionToggle = (val: string) => {
    if (activeData.type === 'MCQ') handleUpdate('correctOption', val);
    else if (activeData.type === 'MSQ') {
      const current = activeData.correctOption ? activeData.correctOption.split(',') : [];
      handleUpdate('correctOption', current.includes(val) ? current.filter(v => v !== val).join(',') : [...current, val].sort().join(','));
    }
  };

  const handleMatrixToggle = (rowLabel: string, colLabel: string) => {
    const pairs = activeData.correctOption.split(';').filter(Boolean);
    const map: Record<string, string[]> = {};
    pairs.forEach(p => { const [r, cStr] = p.split('-'); if (r && cStr) map[r] = cStr.split(','); });
    const currentCols = map[rowLabel] || [];
    if (currentCols.includes(colLabel)) {
       map[rowLabel] = currentCols.filter(c => c !== colLabel);
       if (map[rowLabel].length === 0) delete map[rowLabel];
    } else {
       map[rowLabel] = [...currentCols, colLabel].sort();
    }
    const newStr = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([r, cs]) => `${r}-${cs.join(',')}`).join(';');
    handleUpdate('correctOption', newStr);
  };

  const initiateExport = () => {
    if (!pdfDocument) return alert("PDF Document is not loaded.");
    if (questions.length === 0) return alert("Please add at least one question.");
    if (!testName?.trim()) return alert("Test Name is required.");
    const missing = questions.filter(q => !q.correctOption?.trim());
    if (missing.length) return alert(`Questions missing correct answer: ${missing.map(q => q.questionNumber).join(", ")}.`);
    setExportModalOpen(true);
  };

  const processSecureExport = async () => {
    if (!password.trim()) return alert("Enter a password.");
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder("images");
      const metadata = {
        testName: testName.trim(), totalQuestions: questions.length, createdAt: new Date().toISOString(),
        questions: [...questions].sort((a, b) => a.questionNumber - b.questionNumber).map(q => ({
          ...q, imagePath: `images/Q${q.questionNumber}.png`
        }))
      };
      const { encryptedData, salt, iv } = await encryptData(JSON.stringify(metadata), password);
      zip.file("encrypted_metadata.bin", encryptedData);
      zip.file("security.json", JSON.stringify({ salt: buffToBase64(salt), iv: buffToBase64(iv) }, null, 2));
      for (const pageNum of new Set(questions.map(q => q.page))) {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: 3.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
        for (const q of questions.filter(qu => qu.page === pageNum)) {
          const qCanvas = document.createElement('canvas');
          qCanvas.width = q.width * viewport.width; qCanvas.height = q.height * viewport.height;
          qCanvas.getContext('2d')?.drawImage(canvas, q.x * viewport.width, q.y * viewport.height, qCanvas.width, qCanvas.height, 0, 0, qCanvas.width, qCanvas.height);
          const blob = await new Promise<Blob | null>(res => qCanvas.toBlob(res));
          if (blob) imagesFolder?.file(`Q${q.questionNumber}.png`, blob);
        }
      }
      saveAs(await zip.generateAsync({ type: "blob" }), `${testName.replace(/[^a-z0-9]/gi, '_')}.zip`);
      setExportModalOpen(false); setPassword("");
    } catch (e) { alert("Export failed."); } finally { setIsProcessing(false); }
  };

  const { rows, cols } = activeData.type === 'MSM' ? getMatrixDimensions(activeData.optionsCount) : { rows: parseInt(activeData.optionsCount) || 4, cols: 0 };

  return (
    <>
      <aside className="w-[360px] h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden shrink-0 z-10 shadow-xl">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 z-20 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={onExit} className="h-9 w-9 flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-all shrink-0"><ArrowLeft size={16} /></button>
            <div className="flex-1 grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button onClick={() => setInteractionMode('crop')} className={`flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${interactionMode === 'crop' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Crop size={14} />Crop</button>
              <button onClick={() => setInteractionMode('edit')} className={`flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${interactionMode === 'edit' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><MousePointer2 size={14} />Edit</button>
            </div>
          </div>
          <div className="flex items-center justify-between bg-zinc-950 rounded-lg border border-zinc-800 px-2 py-1.5">
             <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-30" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}><Minus size={14}/></button>
             <div className="flex flex-col items-center">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Page</span>
               <span className="text-sm font-mono font-medium text-zinc-200">{numPages > 0 ? currentPage : 0} <span className="text-zinc-600">/ {numPages}</span></span>
             </div>
             <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-30" onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages || numPages === 0}><Plus size={14}/></button>
          </div>
          <button onClick={initiateExport} disabled={!pdfDocument} className="w-full bg-zinc-100 hover:bg-white text-black py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-sm active:translate-y-0.5 disabled:opacity-50 tracking-widest"><Rocket size={14} />Export Package</button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <Accordion title={selectedQuestion ? `Editing Q${selectedQuestion.questionNumber}` : `New Q${questionTemplate.questionNumber}`} defaultOpen={true}>
            <div className="space-y-5 py-2">
              
              {/* --- Core Identity --- */}
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <Label required={!selectedQuestion}>Subject</Label>
                    <div className="relative">
                      <select value={activeData.subject} onChange={(e) => handleUpdate('subject', e.target.value)} className={`w-full bg-zinc-950 border text-zinc-300 text-[11px] rounded-lg px-2.5 py-2 outline-none appearance-none ${!selectedQuestion && !activeData.subject ? 'border-red-900/50' : 'border-zinc-800'}`}>
                        <option value="">Subject...</option><option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Mathematics">Mathematics</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 text-zinc-600 pointer-events-none" size={12} />
                    </div>
                 </div>
                 <div>
                    <Label>Section</Label>
                    <div className="relative">
                      <select value={activeData.section} onChange={(e) => handleUpdate('section', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] rounded-lg px-2.5 py-2 outline-none appearance-none"><option value="">Section...</option>{SECTIONS.map((sec) => (<option key={sec} value={sec}>{sec}</option>))}</select>
                      <ChevronDown className="absolute right-3 top-2.5 text-zinc-600 pointer-events-none" size={12} />
                    </div>
                 </div>
              </div>

              {/* --- Intelligence Gathering --- */}
              <div>
                <Label icon={Tag}>Topic / Concept</Label>
                <input 
                  type="text" 
                  value={activeData.topic}
                  onChange={(e) => handleUpdate('topic', e.target.value)}
                  placeholder="e.g. Thermodynamics, Kinematics..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <Label icon={Clock}>Ideal Time</Label>
                    <div className="relative">
                      <select value={activeData.idealTime} onChange={(e) => handleUpdate('idealTime', parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] rounded-lg px-2.5 py-2 outline-none appearance-none font-mono">
                        <option value={30}>30 sec</option>
                        <option value={60}>60 sec</option>
                        <option value={120}>120 sec</option>
                        <option value={180}>180 sec</option>
                        <option value={300}>300 sec</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 text-zinc-600 pointer-events-none" size={12} />
                    </div>
                 </div>
                 <div>
                    <Label icon={BrainCircuit}>Skill Category</Label>
                    <div className="relative">
                      <select value={activeData.skillTag} onChange={(e) => handleUpdate('skillTag', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] rounded-lg px-2.5 py-2 outline-none appearance-none">
                        {SKILL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 text-zinc-600 pointer-events-none" size={12} />
                    </div>
                 </div>
              </div>

              {/* --- Difficulty --- */}
              <div>
                <Label>Difficulty Assessment</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map(d => (
                    <button key={d} type="button" onClick={() => handleUpdate('difficulty', d)} className={`px-2 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all ${activeData.difficulty === d ? DIFF_COLORS[d] + ' ring-1 ring-white/10' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* --- Type & Config --- */}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label><select value={activeData.type} onChange={(e) => handleUpdate('type', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2.5 outline-none"><option value="MCQ">MCQ</option><option value="MSQ">MSQ</option><option value="NAT">NAT</option><option value="MSM">MSM</option></select></div>
                <div><Label>{activeData.type === 'MSM' ? 'Layout' : 'Options'}</Label><input type={activeData.type === 'MSM' ? 'text' : 'number'} value={activeData.optionsCount} onChange={(e) => handleUpdate('optionsCount', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2.5 text-center outline-none" disabled={activeData.type === 'NAT'} /></div>
              </div>

              {selectedQuestionId && <button onClick={() => deleteQuestion(selectedQuestionId)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 mt-4"><Trash2 size={14} />Delete Question</button>}
            </div>
          </Accordion>

          <Accordion title="Marking Scheme">
             <div className="py-2 grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Correct</span>
                  <div className="flex items-center justify-between"><button className="w-6 h-6 text-zinc-500 hover:text-white" onClick={() => handleMarkingUpdate('correct', activeData.markingScheme.correct - 1)}><Minus size={12} /></button><span className="font-mono font-bold text-emerald-500">+{activeData.markingScheme.correct}</span><button className="w-6 h-6 text-zinc-500 hover:text-white" onClick={() => handleMarkingUpdate('correct', activeData.markingScheme.correct + 1)}><Plus size={12} /></button></div>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Incorrect</span>
                  <div className="flex items-center justify-between"><button className="w-6 h-6 text-zinc-500 hover:text-white" onClick={() => handleMarkingUpdate('incorrect', activeData.markingScheme.incorrect - 1)}><Minus size={12} /></button><span className="font-mono font-bold text-red-500">{activeData.markingScheme.incorrect}</span><button className="w-6 h-6 text-zinc-500 hover:text-white" onClick={() => handleMarkingUpdate('incorrect', activeData.markingScheme.incorrect + 1)}><Plus size={12} /></button></div>
                </div>
             </div>
          </Accordion>

          <Accordion title="Correct Answer Verification">
             <div className="py-2">
               {activeData.type === 'NAT' ? <input type="text" placeholder="Value..." value={activeData.correctOption || ''} onChange={(e) => handleUpdate('correctOption', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg p-3 text-center font-mono text-lg outline-none focus:border-zinc-500" /> : (activeData.type === 'MCQ' || activeData.type === 'MSQ') ? <div className="grid grid-cols-4 gap-2">{Array.from({ length: rows }).map((_, i) => { const val = (i + 1).toString(); const isSelected = (activeData.correctOption || '').split(',').includes(val); return <button key={i} onClick={() => handleOptionToggle(val)} className={`aspect-square flex items-center justify-center rounded-lg border text-sm font-bold transition-all ${isSelected ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>{i + 1}</button>; })}</div> : activeData.type === 'MSM' ? <div className="overflow-x-auto grid gap-2" style={{ gridTemplateColumns: `auto repeat(${cols}, minmax(36px, 1fr))` }}><div className="h-8"></div>{Array.from({ length: cols }).map((_, c) => <div key={c} className="flex justify-center font-bold text-zinc-500 text-xs">{getColLabel(c)}</div>)}{Array.from({ length: rows }).map((_, r) => { const rowLabel = getRowLabel(r); const rowMatches = activeData.correctOption.split(';').find(p => p.startsWith(rowLabel + '-'))?.split('-')[1]?.split(',') || []; return <React.Fragment key={r}><div className="flex justify-center font-bold text-zinc-500 text-xs w-8">{rowLabel}</div>{Array.from({ length: cols }).map((_, c) => { const colLabel = getColLabel(c); const isChecked = rowMatches.includes(colLabel); return <button key={c} onClick={() => handleMatrixToggle(rowLabel, colLabel)} className={`h-9 border rounded-md flex justify-center items-center ${isChecked ? 'bg-zinc-200 border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>{isChecked && <div className="w-2 h-2 bg-black rounded-full" />}</button>; })}</React.Fragment>; })}</div> : null}
             </div>
          </Accordion>
        </div>
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 text-[10px] font-medium text-zinc-600 uppercase tracking-widest">DESIGNED BY @AKASHJR</div>
      </aside>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-[400px] bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative">
            <button onClick={() => !isProcessing && setExportModalOpen(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200"><X size={16} /></button>
            <div className="mb-6 flex flex-col items-center gap-3"><div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex justify-center items-center"><Lock size={20} /></div><div className="text-center"><h3 className="text-lg font-semibold text-zinc-100">Secure Export</h3><p className="text-sm text-zinc-500">Encrypt this test package.</p></div></div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Strong password" autoFocus className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-4 py-3 outline-none" />
              <button onClick={processSecureExport} disabled={!password || isProcessing} className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-lg flex justify-center items-center gap-2">{isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}Encrypt & Download</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
