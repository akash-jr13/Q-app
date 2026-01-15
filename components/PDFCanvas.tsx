import React, { useRef, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';

export const PDFCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    pdfDocument, 
    currentPage, 
    scale, 
    addQuestion, 
    questions, 
    updateQuestion,
    selectedQuestionId,
    selectQuestion,
    interactionMode,
    questionTemplate,
    setQuestionTemplate
  } = useApp();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [dragAction, setDragAction] = useState<null | {
    type: 'move' | 'resize';
    handle?: string;
    startX: number;
    startY: number;
    initialRect: { x: number; y: number; width: number; height: number };
  }>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        setPageDimensions({ width: viewport.width, height: viewport.height });
        await page.render({ canvasContext: context!, viewport: viewport }).promise;
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    };
    renderPage();
  }, [pdfDocument, currentPage, scale]);

  const getRelativeCoords = (e: React.PointerEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (interactionMode === 'edit') {
       if ((e.target as HTMLElement).closest('.crop-box')) return;
       selectQuestion(null);
       return;
    }
    if ((e.target as HTMLElement).closest('.crop-box')) return;
    if (interactionMode === 'crop' && !questionTemplate.subject) {
      alert("Please select a Subject in the sidebar before cropping.");
      return;
    }
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pos = getRelativeCoords(e);
    setStartPos(pos);
    setCurrentPos(pos);
    selectQuestion(null);
  };

  const handleMoveStart = (e: React.PointerEvent, id: string) => {
    if (interactionMode !== 'edit') {
      e.stopPropagation();
      selectQuestion(id);
      return;
    }
    e.stopPropagation();
    selectQuestion(id);
    const q = questions.find(q => q.id === id);
    if (!q) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const { x, y } = getRelativeCoords(e);
    setDragAction({
      type: 'move',
      startX: x,
      startY: y,
      initialRect: { x: q.x, y: q.y, width: q.width, height: q.height }
    });
  };

  const handleResizeStart = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedQuestionId) return;
    const q = questions.find(q => q.id === selectedQuestionId);
    if (!q) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const { x, y } = getRelativeCoords(e);
    setDragAction({
      type: 'resize',
      handle,
      startX: x,
      startY: y,
      initialRect: { x: q.x, y: q.y, width: q.width, height: q.height }
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { x, y } = getRelativeCoords(e);
    if (isDrawing) {
      setCurrentPos({ x, y });
    } else if (dragAction && selectedQuestionId) {
      const dx = (x - dragAction.startX) / pageDimensions.width;
      const dy = (y - dragAction.startY) / pageDimensions.height;
      let { x: newX, y: newY, width: newW, height: newH } = dragAction.initialRect;
      if (dragAction.type === 'move') {
        newX += dx; newY += dy;
      } else if (dragAction.type === 'resize' && dragAction.handle) {
        const h = dragAction.handle;
        if (h.includes('e')) newW += dx;
        if (h.includes('w')) { newX += dx; newW -= dx; }
        if (h.includes('s')) newH += dy;
        if (h.includes('n')) { newY += dy; newH -= dy; }
      }
      if (newW < 0.01) newW = 0.01;
      if (newH < 0.01) newH = 0.01;
      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      updateQuestion(selectedQuestionId, { x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setIsDrawing(false);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      if (width > 10 && height > 10) {
        addQuestion({
          ...questionTemplate,
          id: uuidv4(),
          page: currentPage,
          x: x / pageDimensions.width,
          y: y / pageDimensions.height,
          width: width / pageDimensions.width,
          height: height / pageDimensions.height,
        });
        setQuestionTemplate(prev => ({ ...prev, questionNumber: prev.questionNumber + 1 }));
      }
    }
    if (dragAction) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDragAction(null);
    }
  };

  return (
    <div className="relative inline-block shadow-2xl my-8 border border-zinc-800 bg-zinc-900">
      <div 
        ref={containerRef}
        className={`relative touch-none ${interactionMode === 'crop' ? 'cursor-crosshair' : 'cursor-default'}`}
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ width: pageDimensions.width, height: pageDimensions.height, touchAction: 'none' }}
      >
        <canvas ref={canvasRef} className="block bg-zinc-900" />
        
        {questions.filter(q => q.page === currentPage).map(q => {
          const isSelected = selectedQuestionId === q.id;
          return (
            <div
              key={q.id}
              className={`crop-box absolute transition-all group flex items-start justify-start backdrop-blur-[1px] ${
                isSelected 
                  ? 'border-2 border-zinc-400 bg-zinc-500/20 z-20 shadow-lg' 
                  : 'border border-zinc-600/30 bg-zinc-500/5 z-10 hover:border-zinc-500/50'
              } ${interactionMode === 'edit' && isSelected ? 'cursor-move' : 'cursor-pointer'}`}
              style={{ left: `${q.x * 100}%`, top: `${q.y * 100}%`, width: `${q.width * 100}%`, height: `${q.height * 100}%` }}
              onPointerDown={(e) => handleMoveStart(e, q.id)}
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 ml-[-2px] mt-[-22px] rounded-md shadow-sm tracking-tight ${
                 isSelected ? 'bg-zinc-400 text-zinc-900' : 'bg-zinc-700 text-zinc-400'
              }`}>
                Q{q.questionNumber}
              </span>

              {interactionMode === 'edit' && isSelected && (
                <>
                  <div onPointerDown={(e) => handleResizeStart(e, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-zinc-400 border border-zinc-600 cursor-nw-resize z-30 shadow-sm" />
                  <div onPointerDown={(e) => handleResizeStart(e, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-zinc-400 border border-zinc-600 cursor-ne-resize z-30 shadow-sm" />
                  <div onPointerDown={(e) => handleResizeStart(e, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-zinc-400 border border-zinc-600 cursor-sw-resize z-30 shadow-sm" />
                  <div onPointerDown={(e) => handleResizeStart(e, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-zinc-400 border border-zinc-600 cursor-se-resize z-30 shadow-sm" />
                </>
              )}
            </div>
          );
        })}

        {isDrawing && (
          <div
            className="absolute border border-zinc-400 border-dashed bg-zinc-500/20 pointer-events-none z-30"
            style={{
              left: Math.min(startPos.x, currentPos.x),
              top: Math.min(startPos.y, currentPos.y),
              width: Math.abs(currentPos.x - startPos.x),
              height: Math.abs(currentPos.y - startPos.y)
            }}
          />
        )}
      </div>
    </div>
  );
};