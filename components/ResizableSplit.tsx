
import React, { useState, useCallback, useRef } from 'react';

interface ResizableSplitProps {
    primary: React.ReactNode;
    secondary: React.ReactNode;
    initialSize?: number;
    minSize?: number;
    maxSize?: number;
    direction?: 'horizontal' | 'vertical';
    primaryPosition?: 'start' | 'end'; // 'start' means left/top, 'end' means right/bottom
}

export const ResizableSplit: React.FC<ResizableSplitProps> = ({
    primary,
    secondary,
    initialSize = 300,
    minSize = 100,
    maxSize = 800,
    direction = 'horizontal',
    primaryPosition = 'start'
}) => {
    const [size, setSize] = useState(initialSize);
    const isResizing = useRef(false);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    }, [direction]);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;

        if (direction === 'horizontal') {
            let newSize;
            if (primaryPosition === 'start') {
                newSize = e.clientX;
            } else {
                newSize = window.innerWidth - e.clientX;
            }

            if (newSize < minSize) newSize = minSize;
            if (newSize > maxSize) newSize = maxSize;
            setSize(newSize);
        } else {
            // vertical logic if needed
            let newSize;
            if (primaryPosition === 'start') {
                newSize = e.clientY;
            } else {
                newSize = window.innerHeight - e.clientY;
            }
            if (newSize < minSize) newSize = minSize;
            if (newSize > maxSize) newSize = maxSize;
            setSize(newSize);
        }
    }, [minSize, maxSize, direction, primaryPosition]);

    const primaryStyle = direction === 'horizontal' ? { width: `${size}px` } : { height: `${size}px` };

    return (
        <div className={`flex w-full h-full overflow-hidden ${direction === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
            {primaryPosition === 'end' && (
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                    {secondary}
                </div>
            )}

            {primaryPosition === 'end' && (
                <div
                    onMouseDown={startResizing}
                    className={`group relative flex items-center justify-center bg-transparent transition-colors hover:bg-white/10 z-30 ${direction === 'horizontal' ? 'w-1 cursor-col-resize h-full' : 'h-1 cursor-row-resize w-full'
                        }`}
                >
                    <div className={`bg-white/5 group-hover:bg-white/20 transition-all ${direction === 'horizontal' ? 'w-[1px] h-full' : 'h-[1px] w-full'
                        }`} />
                </div>
            )}

            <div style={primaryStyle} className="relative shrink-0 overflow-hidden">
                {primary}
            </div>

            {primaryPosition === 'start' && (
                <div
                    onMouseDown={startResizing}
                    className={`group relative flex items-center justify-center bg-transparent transition-colors hover:bg-white/10 z-30 ${direction === 'horizontal' ? 'w-1 cursor-col-resize h-full' : 'h-1 cursor-row-resize w-full'
                        }`}
                >
                    <div className={`bg-white/5 group-hover:bg-white/20 transition-all ${direction === 'horizontal' ? 'w-[1px] h-full' : 'h-[1px] w-full'
                        }`} />
                </div>
            )}

            {primaryPosition === 'start' && (
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                    {secondary}
                </div>
            )}
        </div>
    );
};
