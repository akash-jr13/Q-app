
import React from 'react';

export type QuestionStatus = 'correct' | 'incorrect' | 'unanswered' | 'partial';
export type AttemptCategory = 'perfect' | 'wasted' | 'overtime' | 'confused' | 'other';
export type MistakeType = 'Conceptual' | 'Calculation' | 'Silly' | 'Guess' | 'Time-Pressure' | 'None';

export const Metric = ({ label, value, sub, color = "text-zinc-100" }: { label: string, value: string | number, sub?: string, color?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
    <div className={`text-2xl font-mono font-bold tracking-tighter ${color}`}>{value}</div>
    {sub && <span className="text-[9px] font-mono text-zinc-600 uppercase italic truncate">{sub}</span>}
  </div>
);

// Fix: Explicitly define props and use React.FC to allow optional children and standard React props like 'key'
interface IntelWidgetProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
  icon?: any;
}

export const IntelWidget: React.FC<IntelWidgetProps> = ({ title, children, className = "", icon: Icon }) => (
  <div className={`bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/5 flex flex-col ${className}`}>
    <div className="px-6 py-3 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-800/20 shrink-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={12} className="text-zinc-500" />}
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="flex gap-1">
        <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
        <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
      </div>
    </div>
    <div className="p-6 flex-1">
      {children}
    </div>
  </div>
);

// Fix: Explicitly define props and use React.FC to allow optional children and standard React props like 'key'
interface PanelProps {
  title: string;
  icon?: any;
  children?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ title, icon: Icon, children, headerRight }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
    <div className="bg-zinc-800/30 px-6 py-4 border-b border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex justify-between items-center">
      <span className="flex items-center gap-2">
        {Icon && <Icon size={14} />}
        {title}
      </span>
      {headerRight}
    </div>
    <div className="overflow-x-auto">
      {children}
    </div>
  </div>
);

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const formatTimeDetailed = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m} min & ${s} sec`;
  return `${s} sec`;
};
