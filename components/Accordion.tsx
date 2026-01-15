import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AccordionProps } from '../types';

export const Accordion: React.FC<AccordionProps> = ({ 
  title, 
  children, 
  defaultOpen = false, 
  className = "",
  headerClassName = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-zinc-800 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex justify-between items-center text-zinc-400 hover:text-zinc-100 transition-colors group ${headerClassName}`}
      >
        <span className="font-medium text-xs uppercase tracking-wider flex items-center gap-2">
           {title}
        </span>
        <span className={`text-zinc-600 group-hover:text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
           <ChevronRight size={14} />
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};