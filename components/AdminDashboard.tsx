
import React from 'react';
import { PenTool, Layers, ArrowLeft, ChevronRight } from 'lucide-react';

interface AdminDashboardProps {
  onSelectMapper: () => void;
  onSelectSeries: () => void;
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectMapper, onSelectSeries, onExit }) => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      
      <button 
        onClick={onExit}
        className="fixed top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800 transition-all text-xs font-bold uppercase tracking-widest z-20"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      <div className="max-w-4xl w-full z-10 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 uppercase font-mono">
            Teacher Dashboard
          </h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Select an administrative task to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create New Test */}
          <button 
            onClick={onSelectMapper}
            className="group relative flex flex-col items-center bg-zinc-900/50 border border-zinc-800 p-10 rounded-[2.5rem] hover:border-zinc-500 hover:bg-zinc-900 transition-all text-center hover:shadow-2xl active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center mb-6 text-zinc-100 border border-zinc-800 group-hover:border-zinc-500 transition-all shadow-xl">
              <PenTool size={28} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2 uppercase tracking-widest">Create New Test</h2>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-[240px] font-mono uppercase">
              Upload PDF, crop questions, and export encrypted test packages
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold text-zinc-500 group-hover:text-zinc-100 transition-colors uppercase tracking-widest">
              Open Mapper <ChevronRight size={14} />
            </div>
          </button>

          {/* Manage Test Series */}
          <button 
            onClick={onSelectSeries}
            className="group relative flex flex-col items-center bg-zinc-900/50 border border-zinc-800 p-10 rounded-[2.5rem] hover:border-zinc-500 hover:bg-zinc-900 transition-all text-center hover:shadow-2xl active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center mb-6 text-zinc-100 border border-zinc-800 group-hover:border-zinc-500 transition-all shadow-xl">
              <Layers size={28} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2 uppercase tracking-widest">Manage Test Series</h2>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-[240px] font-mono uppercase">
              Add, edit, or delete mock test series and individual practice sets
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold text-zinc-500 group-hover:text-zinc-100 transition-colors uppercase tracking-widest">
              Open Series Manager <ChevronRight size={14} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
