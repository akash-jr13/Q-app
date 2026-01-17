import React, { useState } from 'react';
import {
  ArrowLeft,
  MousePointer2,
  Minus,
  Grid,
  Layers,
  ChevronRight,
  X,
  Share2,
  Save,
  Flag,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import { WorkspaceState, WorkspaceElement, WorkflowEdge } from '../types';
import { ResizableSplit } from './ResizableSplit';
import { NodeCanvas } from './workflow/NodeCanvas';

interface WorkspaceProps {
  state: WorkspaceState;
  onExit: () => void;
  onSave: (state: WorkspaceState) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ state: initialState, onExit, onSave }) => {
  const [elements, setElements] = useState<WorkspaceElement[]>(
    initialState.elements.length > 0 ? initialState.elements : [
      { id: '1', type: 'milestone', x: 100, y: 100, data: { title: 'Start Journey', status: 'active' } },
      { id: '2', type: 'task', x: 400, y: 150, data: { title: 'Review Physics Basics', status: 'active', description: 'Cover Vectors and Kinematics' } },
      { id: '3', type: 'resource', x: 400, y: 300, data: { title: 'H.C. Verma Vol 1', status: 'pending' } }
    ]
  );
  const [edges, setEdges] = useState<WorkflowEdge[]>(
    initialState.edges || [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' }
    ]
  );

  const [scale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPanelOpen, setPanelOpen] = useState(true);

  // Tools now map to creating specific nodes
  const [activeTool, setActiveTool] = useState<'select' | 'task' | 'milestone' | 'resource'>('select');

  const handleAddNode = (type: string) => {
    const newNode: WorkspaceElement = {
      id: Date.now().toString(),
      type,
      x: 300, // Center-ish relative to view ideally
      y: 200,
      data: {
        title: type === 'milestone' ? 'New Milestone' : 'New Task',
        status: 'pending',
        description: ''
      }
    };
    setElements([...elements, newNode]);
    setSelectedId(newNode.id);
    setActiveTool('select');
  };

  const renderInspector = () => {
    const selectedElement = elements.find(el => el.id === selectedId);

    return (
      <aside className="h-full bg-zinc-950 flex flex-col">
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20 px-4 h-12">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-zinc-500" />
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Inspector</h3>
          </div>
          <button onClick={() => setPanelOpen(false)} className="text-zinc-600 hover:text-zinc-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
          {selectedElement ? (
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">Properties</span>
                <div className="space-y-3">
                  <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg">
                    <label className="text-[8px] font-mono text-zinc-500 block mb-1">NODE ID</label>
                    <code className="text-[10px] text-zinc-400 font-mono">{selectedElement.id}</code>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg">
                    <label className="text-[8px] font-mono text-zinc-500 block mb-1">TYPE</label>
                    <span className="text-xs text-emerald-500 font-bold uppercase">{selectedElement.type}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">Position</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg">
                    <label className="text-[8px] font-mono text-zinc-500 block mb-1">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setElements(elements.map(el => el.id === selectedId ? { ...el, x: val } : el));
                      }}
                      className="bg-transparent text-xs text-zinc-400 font-mono w-full outline-none"
                    />
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg">
                    <label className="text-[8px] font-mono text-zinc-500 block mb-1">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setElements(elements.map(el => el.id === selectedId ? { ...el, y: val } : el));
                      }}
                      className="bg-transparent text-xs text-zinc-400 font-mono w-full outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Node Registry</span>
              <div className="py-20 text-center border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center gap-3">
                <MousePointer2 size={16} className="text-zinc-700" />
                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Select a node to edit</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-900 text-center">
          <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest">Logic 2.1.0</span>
        </div>
      </aside>
    );
  }

  const handleSave = () => {
    onSave({
      ...initialState,
      elements,
      edges,
      lastModified: new Date().toISOString()
    });
  };

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden relative">
      <header className="h-14 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all border border-transparent hover:border-zinc-800"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-px bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">{initialState.name}</span>
            <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">Draft Saved: Just Now</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100 transition-all">
            <Share2 size={12} /> Share
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white border border-transparent text-black text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95">
            <Save size={12} /> Sync
          </button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {isPanelOpen ? (
          <ResizableSplit
            secondary={
              <NodeCanvas
                elements={elements}
                edges={edges}
                onElementsChange={setElements}
                onEdgesChange={setEdges}
                selectedId={selectedId}
                onSelect={setSelectedId}
                scale={scale}
              />
            }
            primary={renderInspector()}
            initialSize={320}
            minSize={240}
            maxSize={480}
            primaryPosition="end"
          />
        ) : (
          <NodeCanvas
            elements={elements}
            edges={edges}
            onElementsChange={setElements}
            onEdgesChange={setEdges}
            selectedId={selectedId}
            onSelect={setSelectedId}
            scale={scale}
          />
        )}

        {/* Floating Tools */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl p-2 rounded-2xl border border-zinc-800 shadow-2xl z-50">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-3 rounded-xl transition-all ${activeTool === 'select' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
          >
            <MousePointer2 size={18} />
          </button>
          <div className="w-px h-6 bg-zinc-800 mx-1" />
          <button
            onClick={() => handleAddNode('task')}
            className={`p-3 rounded-xl transition-all ${activeTool === 'task' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
            title="Add Task"
          >
            <CheckSquare size={18} />
          </button>
          <button
            onClick={() => handleAddNode('milestone')}
            className={`p-3 rounded-xl transition-all ${activeTool === 'milestone' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
            title="Add Milestone"
          >
            <Flag size={18} />
          </button>
          <button
            onClick={() => handleAddNode('resource')}
            className={`p-3 rounded-xl transition-all ${activeTool === 'resource' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
            title="Add Resource"
          >
            <BookOpen size={18} />
          </button>
        </div>

        {!isPanelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-100 transition-all shadow-xl z-30"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <footer className="h-8 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-4 text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><Grid size={10} /> Grid: 24px</div>
          <div className="flex items-center gap-1.5"><Minus size={10} /> Zoom: {Math.round(scale * 100)}%</div>
        </div>
        <div className="text-[9px] font-mono font-bold text-zinc-700 uppercase tracking-widest">
          Node Engine Active
        </div>
      </footer>
    </div>
  );
};
