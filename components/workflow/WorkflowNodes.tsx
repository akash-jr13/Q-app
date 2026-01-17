import React from 'react';
import {
    CheckCircle2,
    Circle,
    Flag,
    PlayCircle,
    Clock,
    BookOpen
} from 'lucide-react';
import { WorkspaceElement, WorkflowNodeData } from '../../types';

interface NodeProps {
    node: WorkspaceElement;
    selected: boolean;
    onUpdate: (id: string, data: Partial<WorkflowNodeData>) => void;
}

const NodeContainer: React.FC<{
    children: React.ReactNode;
    selected: boolean;
    type: string;
    status?: string;
}> = ({ children, selected, type, status }) => {
    const borderColor = selected
        ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
        : type === 'milestone'
            ? 'border-indigo-500/50'
            : status === 'completed'
                ? 'border-emerald-500/50'
                : 'border-white/10';

    const bg = type === 'milestone'
        ? 'bg-indigo-950/20 backdrop-blur-xl'
        : 'bg-[#0a0a0a]/90 backdrop-blur-md';

    return (
        <div className={`
            min-w-[200px] max-w-[280px] rounded-xl border ${borderColor} ${bg}
            transition-all duration-200 group relative
        `}>
            {children}
        </div>
    );
};

export const TaskNode: React.FC<NodeProps> = ({ node, selected, onUpdate }) => {
    const data = node.data as WorkflowNodeData;

    return (
        <NodeContainer selected={selected} type="task" status={data.status}>
            <div className="p-3">
                <div className="flex items-start gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate(node.id, {
                                status: data.status === 'completed' ? 'active' : 'completed'
                            });
                        }}
                        className={`mt-0.5 transition-colors ${data.status === 'completed' ? 'text-emerald-500' : 'text-zinc-600 hover:text-white'
                            }`}
                    >
                        {data.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>

                    <div className="flex-1 min-w-0">
                        <textarea
                            value={data.title}
                            onChange={(e) => onUpdate(node.id, { title: e.target.value })}
                            className="w-full bg-transparent text-sm font-medium text-white outline-none resize-none leading-snug placeholder:text-zinc-700"
                            placeholder="Task Name..."
                            rows={Math.max(1, Math.ceil(data.title.length / 25))}
                            style={{ height: 'auto', minHeight: '20px' }}
                            onMouseDown={e => e.stopPropagation()}
                        />
                        {data.description && (
                            <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                                {data.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                    <div className="flex items-center gap-2">
                        {data.dueDate && (
                            <span className="flex items-center gap-1 text-[9px] text-[#eab308] bg-[#eab308]/10 px-1.5 py-0.5 rounded font-mono uppercase">
                                <Clock size={8} /> {data.dueDate}
                            </span>
                        )}
                    </div>
                    <div className="flex -space-x-1.5">
                        {[1, 2].map(i => (
                            <div key={i} className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[6px] text-zinc-400">
                                U{i}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Connection Handles */}
            <div className="absolute top-1/2 -left-1 w-2 h-2 bg-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2" />
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2" />
        </NodeContainer>
    );
};

export const ResourceNode: React.FC<NodeProps> = ({ node, selected }) => {
    const data = node.data as WorkflowNodeData;

    return (
        <NodeContainer selected={selected} type="resource">
            <div className="p-3">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                        <BookOpen size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block mb-0.5">Resource</span>
                        <h4 className="text-xs font-medium text-white truncate">{data.title}</h4>
                    </div>
                </div>
                <button className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-zinc-300 transition-colors flex items-center justify-center gap-2">
                    <PlayCircle size={12} /> Open Material
                </button>
            </div>
            {/* Connection Handles */}
            <div className="absolute top-1/2 -left-1 w-2 h-2 bg-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2" />
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2" />
        </NodeContainer>
    );
};

export const MilestoneNode: React.FC<NodeProps> = ({ node, selected }) => {
    const data = node.data as WorkflowNodeData;

    return (
        <NodeContainer selected={selected} type="milestone">
            <div className="p-1 px-3 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Flag size={14} fill="currentColor" />
                </div>
                <div>
                    <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest block">Milestone</span>
                    <span className="text-xs font-bold text-white tracking-wide">{data.title}</span>
                </div>
            </div>
            {/* Connection Handles */}
            <div className="absolute top-1/2 -left-1 w-2 h-2 bg-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2" />
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2" />
        </NodeContainer>
    );
};

export const TopicNode: React.FC<NodeProps> = ({ node, selected }) => {
    const data = node.data as WorkflowNodeData;

    return (
        <div className={`
            px-4 py-2 rounded-full border bg-[#0a0a0a] backdrop-blur transition-all
            ${selected ? 'border-emerald-500 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}
       `}>
            <span className="text-sm font-medium font-mono">{data.title}</span>

            {/* Connection Handles */}
            <div
                className="absolute top-1/2 -left-3 w-4 h-4 rounded-full flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 hover:bg-emerald-500/20"
                data-handle="true"
                data-node-id={node.id}
            >
                <div className="w-2 h-2 bg-zinc-500 rounded-full pointer-events-none" />
            </div>
            <div
                className="absolute top-1/2 -right-3 w-4 h-4 rounded-full flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 hover:bg-emerald-500/20"
                data-handle="true"
                data-node-id={node.id}
            >
                <div className="w-2 h-2 bg-zinc-500 rounded-full pointer-events-none" />
            </div>
        </div>
    );
};
