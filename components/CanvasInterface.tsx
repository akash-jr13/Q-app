
import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Trash2, RotateCcw, Pen, MousePointer2 } from 'lucide-react';

interface CanvasInterfaceProps {
  onExit: () => void;
}

export const CanvasInterface: React.FC<CanvasInterfaceProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#e4e4e7'); // zinc-200
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = containerRef.current;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      
      const tempImage = canvas.toDataURL();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const img = new Image();
        img.src = tempImage;
        img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory(prev => [...prev.slice(-29), canvas.toDataURL()]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const lastState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    const img = new Image();
    img.src = lastState;
    const dpr = window.devicePixelRatio || 1;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    saveToHistory();
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'eraser' ? '#09090b' : color; 
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    saveToHistory();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const colors = ['#e4e4e7', '#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa'];

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 relative overflow-hidden touch-none">
      {/* Background Textures */}
      <div className="absolute inset-0 bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-50" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111114_1px,transparent_1px),linear-gradient(to_bottom,#111114_1px,transparent_1px)] [background-size:160px_160px] pointer-events-none" />

      {/* Drawing Space */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0"
        />
      </div>

      {/* Control Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-zinc-900/80 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-zinc-800 shadow-2xl z-50 animate-in slide-in-from-bottom-4 duration-500 ring-1 ring-white/5">
        
        {/* Toolset */}
        <div className="flex gap-2 p-1.5 bg-zinc-950 rounded-2xl border border-zinc-900 shadow-inner">
          <button 
            onClick={() => setTool('pen')}
            className={`p-3 rounded-xl transition-all ${tool === 'pen' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Pen Tool (P)"
          >
            <Pen size={20} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setTool('eraser')}
            className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-zinc-100 text-black shadow-lg scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Eraser (E)"
          >
            <Eraser size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="h-8 w-px bg-zinc-800" />

        {/* Palette */}
        <div className="flex gap-4">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 shadow-sm ${color === c && tool === 'pen' ? 'border-white scale-110 ring-4 ring-white/10' : 'border-zinc-800 hover:border-zinc-600'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-8 w-px bg-zinc-800" />

        {/* Utilities */}
        <div className="flex items-center gap-2">
          <button 
            onClick={undo} 
            disabled={history.length === 0} 
            className="p-3 text-zinc-500 hover:text-zinc-100 disabled:opacity-10 transition-all hover:bg-zinc-800 rounded-xl"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={clearCanvas} 
            className="p-3 text-zinc-500 hover:text-red-400 transition-all hover:bg-red-500/10 rounded-xl"
            title="Reset Canvas"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="h-8 w-px bg-zinc-800" />

        {/* Size Slider */}
        <div className="flex items-center gap-4 px-2">
          <div className="w-24 h-6 relative flex items-center group">
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full accent-zinc-100 bg-zinc-950 h-1.5 rounded-full appearance-none cursor-pointer border border-zinc-800 transition-all group-hover:h-2"
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 font-bold w-4 text-center">{brushSize}px</span>
        </div>
      </div>
    </div>
  );
};
