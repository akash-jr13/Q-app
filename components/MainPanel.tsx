import React, { useRef } from 'react';
import { Plus, FileText, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PDFCanvas } from './PDFCanvas';

export const MainPanel: React.FC = () => {
  const { pdfFile, setPdfFile, setPdfDocument, setNumPages, testName, setTestName } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = (window as any).pdfjsLib;
      
      if (!pdfjsLib) {
        console.error("PDF.js library not loaded");
        return;
      }

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      
      setPdfDocument(doc);
      setNumPages(doc.numPages);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="flex-1 bg-zinc-950 h-screen flex flex-col overflow-hidden relative">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept=".pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Bar */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 gap-6 shrink-0 bg-zinc-950/80 backdrop-blur-md z-20">
        
        {/* Left: Branding & File Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold tracking-tight">
             <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-black">
               <FileText size={16} strokeWidth={3} />
             </div>
             <span className="hidden sm:inline">Q-Mapper</span>
          </div>

          <div className="h-6 w-px bg-zinc-800 mx-2"></div>

          <div className="flex flex-col">
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Enter Test Name *"
              className={`bg-transparent text-sm font-medium text-zinc-200 outline-none placeholder:text-zinc-600 transition-colors w-64 ${
                 !testName ? 'placeholder:text-red-400/50' : ''
              }`}
            />
            <span className="text-[10px] text-zinc-500 font-mono max-w-[200px] truncate">
              {pdfFile ? pdfFile.name : "No PDF Loaded"}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-4">
          <button 
            onClick={triggerFileInput}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700 hover:border-zinc-600"
          >
            <Upload size={14} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
            {pdfFile ? "Change PDF" : "Upload PDF"}
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 overflow-auto bg-zinc-950 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] flex justify-center p-8">
        
        {pdfFile ? (
          <PDFCanvas />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
               <Upload size={24} className="opacity-50"/>
            </div>
            <p className="text-sm font-medium">Select a PDF to begin mapping</p>
          </div>
        )}

      </div>
    </main>
  );
};