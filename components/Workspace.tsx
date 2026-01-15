
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Minus, 
  Grid, 
  Layers, 
  ChevronRight,
  X,
  Share2,
  Save,
  Command
} from 'lucide-react';
import { WorkspaceState } from '../types';

interface WorkspaceProps {
  state: WorkspaceState;
  onExit: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ state, onExit }) => {
  const [tool, setTool] = useState<'select' | 'rect' | 'circle' | 'text'>('select');
  const [isPanelOpen, setPanelOpen] = useState(true);

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden relative">
      {/* Interactive Grid Background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #52525b 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Utility Bar */}
      <header className="h-14 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all border border-transparent hover:border-zinc-800"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-px bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">{state.name}</span>
            <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">Draft Saved: Just Now</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100 transition-all">
             <Share2 size={12} /> Share
           </button>
           <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white border border-transparent text-black text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95">
             <Save size={12} /> Sync
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Interaction Canvas */}
        <main className="flex-1 relative cursor-crosshair group">
           {/* Center Canvas Placeholder */}
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Command size={48} />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] font-mono">Workspace Initiated</span>
           </div>

           {/* Floating Bottom Dock */}
           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl p-2 rounded-2xl border border-zinc-800 shadow-2xl z-50">
              <button 
                onClick={() => setTool('select')}
                className={`p-3 rounded-xl transition-all ${tool === 'select' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              >
                <MousePointer2 size={18} />
              </button>
              <div className="w-px h-6 bg-zinc-800 mx-1" />
              <button 
                onClick={() => setTool('rect')}
                className={`p-3 rounded-xl transition-all ${tool === 'rect' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              >
                <Square size={18} />
              </button>
              <button 
                onClick={() => setTool('circle')}
                className={`p-3 rounded-xl transition-all ${tool === 'circle' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              >
                <Circle size={18} />
              </button>
              <button 
                onClick={() => setTool('text')}
                className={`p-3 rounded-xl transition-all ${tool === 'text' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              >
                <Type size={18} />
              </button>
           </div>
        </main>

        {/* Right Attribute Inspector Panel */}
        <aside className={`h-full bg-zinc-950 border-l border-zinc-900 transition-all duration-300 flex flex-col ${isPanelOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
           <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-zinc-500" />
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Inspector</h3>
              </div>
              <button onClick={() => setPanelOpen(false)} className="text-zinc-600 hover:text-zinc-100 transition-colors">
                <X size={16} />
              </button>
           </div>
           
           <div className="flex-1 p-6 space-y-8 overflow-y-auto">
              {/* Transform Section */}
              <div className="space-y-4">
                 <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Global Transform</span>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg">
                       <label className="text-[8px] font-mono text-zinc-500 block mb-1">X-AXIS</label>
                       <input disabled value="0.00" className="bg-transparent text-xs text-zinc-400 font-mono w-full outline-none" />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg">
                       <label className="text-[8px] font-mono text-zinc-500 block mb-1">Y-AXIS</label>
                       <input disabled value="0.00" className="bg-transparent text-xs text-zinc-400 font-mono w-full outline-none" />
                    </div>
                 </div>
              </div>

              {/* Layout Audit */}
              <div className="space-y-4">
                 <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Node Registry</span>
                 <div className="py-20 text-center border border-dashed border-zinc-900 rounded-2xl">
                    <p className="text-[10px] text-zinc-800 font-mono uppercase tracking-widest">No Active Nodes</p>
                 </div>
              </div>
           </div>

           <div className="p-6 border-t border-zinc-900 text-center">
              <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest">Session Logic 2.1.0</span>
           </div>
        </aside>

        {/* Floating Panel Trigger (when closed) */}
        {!isPanelOpen && (
          <button 
            onClick={() => setPanelOpen(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-100 transition-all shadow-xl z-30"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Global Status Bar */}
      <footer className="h-8 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-4 text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
           <div className="flex items-center gap-1.5"><Grid size={10} /> Grid: 24px</div>
           <div className="flex items-center gap-1.5"><Minus size={10} /> Zoom: 100%</div>
        </div>
        <div className="text-[9px] font-mono font-bold text-zinc-700 uppercase tracking-widest">
           Ready for Component Injection
        </div>
      </footer>
    </div>
  );
};
