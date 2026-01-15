import React, { useState } from 'react';
import { 
  Rocket,
  Minus,
  Plus,
  Crop,
  MousePointer2,
  Loader2,
  Trash2,
  Check,
  ChevronDown,
  Lock,
  X
} from 'lucide-react';
import { Accordion } from './Accordion';
import { useApp } from '../context/AppContext';
import { QuestionTemplate } from '../types';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const SECTIONS = [
  "Physics Section 1",
  "Physics Section 2",
  "Physics Section 3",
  "Physics Section 4",
  "Chemistry Section 1",
  "Chemistry Section 2",
  "Chemistry Section 3",
  "Chemistry Section 4",
  "Mathematics Section 1",
  "Mathematics Section 2",
  "Mathematics Section 3",
  "Mathematics Section 4"
];

// --- Crypto Helpers ---

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
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
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

  return {
    encryptedData: new Uint8Array(encryptedBuffer),
    salt: salt,
    iv: iv
  };
}

// --- End Crypto Helpers ---

// Helpers for Matrix Matching
const getMatrixDimensions = (countStr: string) => {
  const parts = countStr.toLowerCase().split('x');
  const r = parseInt(parts[0]);
  const c = parts[1] ? parseInt(parts[1]) : r;
  return {
    rows: isNaN(r) ? 4 : r,
    cols: isNaN(c) ? (isNaN(r) ? 4 : r) : c
  };
};

// Row labels: A, B, C...
const getRowLabel = (index: number) => String.fromCharCode(65 + index);
// Col labels: P, Q, R...
const getColLabel = (index: number) => String.fromCharCode(80 + index);

// Reusable styled label
const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export const Sidebar: React.FC = () => {
  const { 
    currentPage, 
    setCurrentPage, 
    numPages,
    selectedQuestionId,
    questions,
    updateQuestion,
    deleteQuestion,
    questionTemplate,
    setQuestionTemplate,
    interactionMode,
    setInteractionMode,
    pdfDocument,
    testName
  } = useApp();
  
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  // Determine which data to show/edit
  const activeData = selectedQuestion || questionTemplate;

  // Type-safe handler
  const handleUpdate = (field: keyof QuestionTemplate, value: any) => {
    // If changing type, reset correctOption to avoid conflicts
    const updates: any = { [field]: value };
    if (field === 'type') {
      updates.correctOption = '';
      // Set reasonable defaults for optionsCount when switching types
      if (value === 'MSM') updates.optionsCount = '4x4';
      else if (value === 'NAT') updates.optionsCount = '0';
      else if (activeData.optionsCount.includes('x')) updates.optionsCount = '4';
    }

    if (selectedQuestion) {
      updateQuestion(selectedQuestion.id, updates);
    } else {
      setQuestionTemplate(prev => ({ ...prev, ...updates }));
    }
  };

  const handleMarkingUpdate = (field: 'correct' | 'incorrect' | 'partial', value: number) => {
    if (selectedQuestion) {
      updateQuestion(selectedQuestion.id, {
        markingScheme: {
          ...selectedQuestion.markingScheme,
          [field]: value
        }
      });
    } else {
      setQuestionTemplate(prev => ({
        ...prev,
        markingScheme: {
          ...prev.markingScheme,
          [field]: value
        }
      }));
    }
  };

  // Logic for Correct Option updates
  const handleOptionToggle = (val: string) => {
    if (activeData.type === 'MCQ') {
      handleUpdate('correctOption', val);
    } else if (activeData.type === 'MSQ') {
      const current = activeData.correctOption ? activeData.correctOption.split(',') : [];
      if (current.includes(val)) {
        handleUpdate('correctOption', current.filter(v => v !== val).join(','));
      } else {
        handleUpdate('correctOption', [...current, val].sort().join(','));
      }
    }
  };

  // Logic for MSM Match Toggling
  const handleMatrixToggle = (rowLabel: string, colLabel: string) => {
    // Format: "A-P,Q;B-R"
    const pairs = activeData.correctOption.split(';').filter(Boolean);
    const map: Record<string, string[]> = {};
    
    pairs.forEach(p => {
      const [r, cStr] = p.split('-');
      if (r && cStr) map[r] = cStr.split(',');
    });

    const currentCols = map[rowLabel] || [];
    if (currentCols.includes(colLabel)) {
       map[rowLabel] = currentCols.filter(c => c !== colLabel);
       if (map[rowLabel].length === 0) delete map[rowLabel];
    } else {
       map[rowLabel] = [...currentCols, colLabel].sort();
    }

    // Reconstruct string
    const newStr = Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([r, cs]) => `${r}-${cs.join(',')}`)
      .join(';');
    
    handleUpdate('correctOption', newStr);
  };

  const initiateExport = () => {
    if (!pdfDocument) {
        alert("PDF Document is not loaded.");
        return;
    }
    if (questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }
    if (!testName || testName.trim() === "") {
        alert("Test Name is required. Please enter it in the top header.");
        return;
    }
    const questionsMissingAnswer = questions.filter(q => !q.correctOption || q.correctOption.trim() === "");
    if (questionsMissingAnswer.length > 0) {
        const missingNumbers = questionsMissingAnswer.map(q => q.questionNumber).join(", ");
        alert(`Questions missing correct answer: ${missingNumbers}.`);
        return;
    }
    
    setExportModalOpen(true);
  };

  const processSecureExport = async () => {
    if (!password.trim()) {
      alert("Please enter a password to encrypt the test package.");
      return;
    }

    const finalTestName = testName.trim();
    setIsProcessing(true);
    
    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder("images");
      
      const questionsByPage: Record<number, typeof questions> = {};
      questions.forEach(q => {
        if (!questionsByPage[q.page]) questionsByPage[q.page] = [];
        questionsByPage[q.page].push(q);
      });

      const sortedQuestions = [...questions].sort((a, b) => a.questionNumber - b.questionNumber);
      
      // 1. Prepare Metadata
      const metadata = {
        testName: finalTestName,
        totalQuestions: questions.length,
        createdAt: new Date().toISOString(),
        questions: sortedQuestions.map(q => ({
            id: q.id,
            questionNumber: q.questionNumber,
            imagePath: `images/Q${q.questionNumber}.png`,
            subject: q.subject,
            section: q.section,
            type: q.type,
            optionsCount: q.optionsCount,
            markingScheme: q.markingScheme,
            correctOption: q.correctOption
        }))
      };

      // 2. Encrypt Metadata
      const { encryptedData, salt, iv } = await encryptData(JSON.stringify(metadata), password);

      // 3. Add Files to ZIP
      // Store encrypted binary
      zip.file("encrypted_metadata.bin", encryptedData);
      
      // Store public security params (Salt & IV)
      zip.file("security.json", JSON.stringify({
        salt: buffToBase64(salt),
        iv: buffToBase64(iv)
      }, null, 2));

      // 4. Render and Store Images
      for (const pageNumStr of Object.keys(questionsByPage)) {
        const pageNum = parseInt(pageNumStr);
        const pageQuestions = questionsByPage[pageNum];
        
        // Ensure PDF is loaded/valid reference
        if(!pdfDocument) throw new Error("PDF Document lost");

        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: 3.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (!context) continue;

        await page.render({ canvasContext: context, viewport }).promise;

        for (const q of pageQuestions) {
           const cropX = q.x * viewport.width;
           const cropY = q.y * viewport.height;
           const cropW = q.width * viewport.width;
           const cropH = q.height * viewport.height;

           const qCanvas = document.createElement('canvas');
           qCanvas.width = cropW;
           qCanvas.height = cropH;
           const qContext = qCanvas.getContext('2d');
           
           if (qContext) {
             qContext.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
             const blob = await new Promise<Blob | null>(resolve => qCanvas.toBlob(resolve, 'image/png'));
             if (blob && imagesFolder) {
                imagesFolder.file(`Q${q.questionNumber}.png`, blob);
             }
           }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const safeName = finalTestName.replace(/[^a-z0-9_\-\s]/gi, '_').trim() || "test_package";
      saveAs(content, `${safeName}.zip`);
      setExportModalOpen(false);
      setPassword("");

    } catch (error) {
      console.error(error);
      alert("Failed to generate encrypted package.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { rows, cols } = activeData.type === 'MSM' 
      ? getMatrixDimensions(activeData.optionsCount)
      : { rows: parseInt(activeData.optionsCount) || 4, cols: 0 };

  return (
    <>
      <aside className="w-[360px] h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden shrink-0 z-10 shadow-xl">
        
        {/* Action Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 z-20 space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            <button
              onClick={() => setInteractionMode('crop')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                interactionMode === 'crop' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <Crop size={14} />
              Crop
            </button>
            <button
              onClick={() => setInteractionMode('edit')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                interactionMode === 'edit' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <MousePointer2 size={14} />
              Edit
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between bg-zinc-950 rounded-lg border border-zinc-800 px-2 py-1.5">
             <button 
               className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-30 transition-colors"
               onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
               disabled={currentPage <= 1}
             >
               <Minus size={14}/>
             </button>
             <div className="flex flex-col items-center">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Page</span>
               <span className="text-sm font-mono font-medium text-zinc-200">{numPages > 0 ? currentPage : 0} <span className="text-zinc-600">/ {numPages}</span></span>
             </div>
             <button 
               className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-30 transition-colors"
               onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
               disabled={currentPage >= numPages || numPages === 0}
             >
               <Plus size={14}/>
             </button>
          </div>

          <button 
            onClick={initiateExport}
            disabled={!pdfDocument}
            className={`w-full bg-zinc-100 hover:bg-white text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all active:translate-y-0.5 ${
              (!pdfDocument) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Rocket size={14} />
            Export Package
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <Accordion 
            title={selectedQuestion ? `Editing Q${selectedQuestion.questionNumber}` : `New Q${questionTemplate.questionNumber}`} 
            defaultOpen={true}
          >
            <div className="space-y-5 py-2">
              
              {/* Subject Select */}
              <div>
                <Label required={!selectedQuestion}>Subject</Label>
                <div className="relative group">
                  <select 
                    value={activeData.subject}
                    onChange={(e) => handleUpdate('subject', e.target.value)}
                    className={`w-full bg-zinc-950 border text-zinc-300 text-xs rounded-lg p-2.5 outline-none appearance-none transition-all ${
                       !selectedQuestion && !activeData.subject ? 'border-red-900/50 focus:border-red-500/50' : 'border-zinc-800 focus:border-zinc-600'
                    }`}
                  >
                    <option value="">Select Subject...</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-zinc-600 pointer-events-none group-hover:text-zinc-400 transition-colors" size={14} />
                </div>
              </div>

              {/* Section Select */}
              <div>
                <Label>Section</Label>
                <div className="relative group">
                  <select 
                    value={activeData.section}
                    onChange={(e) => handleUpdate('section', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2.5 outline-none appearance-none focus:border-zinc-600 transition-all"
                  >
                    <option value="">Select Section...</option>
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-zinc-600 pointer-events-none group-hover:text-zinc-400 transition-colors" size={14} />
                </div>
              </div>

              {/* Q Number */}
              <div>
                 <Label>Question No.</Label>
                 <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden group focus-within:border-zinc-600 transition-colors">
                   <button 
                      className="p-2.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                      onClick={() => handleUpdate('questionNumber', Math.max(1, activeData.questionNumber - 1))}
                   >
                      <Minus size={14}/>
                   </button>
                   <div className="flex-1 text-center border-x border-zinc-900 bg-zinc-900/50 py-2.5">
                     <span className="text-sm font-mono font-bold text-zinc-200">{activeData.questionNumber}</span>
                   </div>
                   <button 
                      className="p-2.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                      onClick={() => handleUpdate('questionNumber', activeData.questionNumber + 1)}
                   >
                      <Plus size={14}/>
                   </button>
                 </div>
              </div>

              {/* Type & Config */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <div className="relative">
                    <select 
                      value={activeData.type}
                      onChange={(e) => handleUpdate('type', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2.5 outline-none appearance-none font-bold focus:border-zinc-600 transition-all"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="MSQ">MSQ</option>
                      <option value="NAT">NAT</option>
                      <option value="MSM">MSM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>{activeData.type === 'MSM' ? 'Layout' : 'Options'}</Label>
                  <input 
                    type={activeData.type === 'MSM' ? 'text' : 'number'}
                    value={activeData.optionsCount}
                    onChange={(e) => handleUpdate('optionsCount', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2.5 text-center outline-none focus:border-zinc-600 transition-all font-mono" 
                    disabled={activeData.type === 'NAT'}
                    placeholder={activeData.type === 'MSM' ? "4x4" : "4"}
                  />
                </div>
              </div>

              {selectedQuestionId && (
                <button
                    onClick={() => deleteQuestion(selectedQuestionId)}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-4"
                >
                    <Trash2 size={14} />
                    Delete Question
                </button>
              )}
            </div>
          </Accordion>

          <Accordion title="Marking Scheme">
             <div className="py-2 grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Correct</span>
                  <div className="flex items-center justify-between">
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-green-400 hover:bg-zinc-800 rounded transition-colors" onClick={() => handleMarkingUpdate('correct', (activeData.markingScheme.correct) - 1)}><Minus size={12} /></button>
                    <span className="font-mono font-bold text-green-500 text-sm">+{activeData.markingScheme.correct}</span>
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-green-400 hover:bg-zinc-800 rounded transition-colors" onClick={() => handleMarkingUpdate('correct', (activeData.markingScheme.correct) + 1)}><Plus size={12} /></button>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Incorrect</span>
                  <div className="flex items-center justify-between">
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors" onClick={() => handleMarkingUpdate('incorrect', (activeData.markingScheme.incorrect) - 1)}><Minus size={12} /></button>
                    <span className="font-mono font-bold text-red-500 text-sm">{activeData.markingScheme.incorrect}</span>
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors" onClick={() => handleMarkingUpdate('incorrect', (activeData.markingScheme.incorrect) + 1)}><Plus size={12} /></button>
                  </div>
                </div>

                {activeData.type === 'MSQ' && (
                  <div className="col-span-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800 space-y-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Partial Marking</span>
                      <div className="flex items-center justify-center gap-6">
                        <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors" onClick={() => handleMarkingUpdate('partial', (activeData.markingScheme.partial || 0) - 1)}><Minus size={12} /></button>
                        <span className="font-mono font-bold text-blue-500 text-sm">+{activeData.markingScheme.partial || 0}</span>
                        <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors" onClick={() => handleMarkingUpdate('partial', (activeData.markingScheme.partial || 0) + 1)}><Plus size={12} /></button>
                      </div>
                  </div>
                )}
             </div>
          </Accordion>

          <Accordion title={<span className="flex items-center gap-1">Correct Answer <span className="text-red-500">*</span></span>}>
             <div className="py-2">
               {/* NAT */}
               {activeData.type === 'NAT' && (
                  <div>
                    <input 
                      type="text" 
                      placeholder="Enter value (e.g. 5 or 5.5)"
                      value={activeData.correctOption || ''}
                      onChange={(e) => handleUpdate('correctOption', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg p-3 focus:border-zinc-600 outline-none font-mono text-center text-lg tracking-widest"
                    />
                    <p className="text-[10px] text-zinc-500 mt-2 text-center">Accepts integer or decimal values</p>
                  </div>
               )}

               {/* MCQ & MSQ */}
               {(activeData.type === 'MCQ' || activeData.type === 'MSQ') && (
                 <div className="grid grid-cols-4 gap-2">
                   {Array.from({ length: Math.max(1, rows) }).map((_, i) => {
                     const optionValue = (i + 1).toString();
                     const currentSelections = activeData.correctOption ? activeData.correctOption.split(',') : [];
                     const isSelected = currentSelections.includes(optionValue);
                     
                     return (
                       <button
                         key={i}
                         onClick={() => handleOptionToggle(optionValue)}
                         className={`aspect-square flex items-center justify-center rounded-lg border text-sm font-bold transition-all relative overflow-hidden group ${
                           isSelected
                             ? 'bg-zinc-100 border-zinc-100 text-black shadow-lg shadow-white/10'
                             : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                         }`}
                       >
                         {isSelected && <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />}
                         {i + 1}
                       </button>
                     );
                   })}
                 </div>
               )}

               {/* MSM (Matrix) */}
               {activeData.type === 'MSM' && (
                  <div className="overflow-x-auto pb-2">
                      <div className="min-w-max grid gap-2" style={{ gridTemplateColumns: `auto repeat(${cols}, minmax(36px, 1fr))` }}>
                          {/* Header Row */}
                          <div className="h-8"></div>
                          {Array.from({ length: cols }).map((_, c) => (
                              <div key={`col-${c}`} className="flex items-center justify-center font-bold text-zinc-500 text-xs h-9">
                                  {getColLabel(c)}
                              </div>
                          ))}

                          {/* Rows */}
                          {Array.from({ length: rows }).map((_, r) => {
                               const rowLabel = getRowLabel(r);
                               const pairs = activeData.correctOption.split(';').filter(Boolean);
                               const rowMatches = pairs.find(p => p.startsWith(rowLabel + '-'))?.split('-')[1]?.split(',') || [];

                               return (
                                  <React.Fragment key={`row-${r}`}>
                                      <div className="flex items-center justify-center font-bold text-zinc-500 text-xs w-8">
                                          {rowLabel}
                                      </div>
                                      {Array.from({ length: cols }).map((_, c) => {
                                          const colLabel = getColLabel(c);
                                          const isChecked = rowMatches.includes(colLabel);
                                          return (
                                              <button
                                                  key={`cell-${r}-${c}`}
                                                  onClick={() => handleMatrixToggle(rowLabel, colLabel)}
                                                  className={`h-9 w-full border rounded-md flex items-center justify-center transition-all ${
                                                      isChecked 
                                                        ? 'bg-zinc-200 border-zinc-200 shadow-sm' 
                                                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                                                  }`}
                                              >
                                                  {isChecked && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                                              </button>
                                          );
                                      })}
                                  </React.Fragment>
                               );
                          })}
                      </div>
                  </div>
               )}
             </div>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 shrink-0">
           <span className="text-[10px] font-medium text-zinc-600 tracking-wider">DESIGNED BY @AKASHJR</span>
        </div>
      </aside>

      {/* Encryption Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[400px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 relative">
            
            <button 
              onClick={() => !isProcessing && setExportModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
                <Lock size={20} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-zinc-100">Secure Export</h3>
                <p className="text-sm text-zinc-500">Encrypt this test package with a password.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Set Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-4 py-3 focus:border-zinc-600 outline-none transition-all placeholder:text-zinc-600"
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-[11px] text-blue-400 leading-relaxed">
                  <span className="font-bold">Note:</span> Students will need this exact password to decrypt and attempt the test. Don't lose it!
                </p>
              </div>

              <button
                onClick={processSecureExport}
                disabled={!password || isProcessing}
                className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-lg mt-2 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Encrypt & Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};