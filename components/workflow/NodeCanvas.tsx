import React, { useRef, useState, useCallback } from 'react';
import { WorkspaceElement, WorkflowEdge, WorkflowNodeData } from '../../types';
import { TaskNode, ResourceNode, MilestoneNode, TopicNode } from './WorkflowNodes';

interface NodeCanvasProps {
    elements: WorkspaceElement[];
    edges: WorkflowEdge[];
    onElementsChange: (elements: WorkspaceElement[]) => void;
    onEdgesChange: (edges: WorkflowEdge[]) => void;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    scale: number;
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({
    elements,
    edges,
    onElementsChange,
    onEdgesChange,
    selectedId,
    onSelect,
    scale
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const [tempEdgeEnd, setTempEdgeEnd] = useState({ x: 0, y: 0 });

    // Handle node updates from children
    const handleNodeUpdate = (id: string, data: Partial<WorkflowNodeData>) => {
        const newElements = elements.map(el =>
            el.id === id ? { ...el, data: { ...el.data, ...data } } : el
        );
        onElementsChange(newElements);
    };

    const handleMouseDown = (e: React.MouseEvent, elementId?: string) => {
        // Check if we clicked a handle
        const target = e.target as HTMLElement;
        if (target.dataset.handle) {
            e.stopPropagation();
            const nodeId = target.dataset.nodeId;
            if (nodeId) {
                setConnectingNodeId(nodeId);
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    setTempEdgeEnd({
                        x: (e.clientX - rect.left - pan.x) / scale,
                        y: (e.clientY - rect.top - pan.y) / scale
                    });
                }
            }
            return;
        }

        if (elementId) {
            e.stopPropagation();
            onSelect(elementId);
            setIsDragging(true);
            const element = elements.find(el => el.id === elementId);
            if (element) {
                // Calculate offset accounting for scale
                setDragOffset({
                    x: e.clientX / scale - element.x,
                    y: e.clientY / scale - element.y
                });
            }
        } else {
            // Start panning if clicking empty space
            onSelect(null);
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (connectingNodeId && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setTempEdgeEnd({
                x: (e.clientX - rect.left - pan.x) / scale,
                y: (e.clientY - rect.top - pan.y) / scale
            });
        } else if (isDragging && selectedId) {
            const newElements = elements.map(el => {
                if (el.id === selectedId) {
                    return {
                        ...el,
                        x: e.clientX / scale - dragOffset.x,
                        y: e.clientY / scale - dragOffset.y
                    };
                }
                return el;
            });
            onElementsChange(newElements);
        } else if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    }, [isDragging, selectedId, dragOffset, elements, scale, onElementsChange, isPanning, lastMousePos, connectingNodeId, pan]);

    const handleMouseUp = (e: React.MouseEvent) => {
        if (connectingNodeId) {
            // Check if dropped on a node
            // This requires detecting what's under the cursor, or checking proximity
            // Simplified: check if we are over a node
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const x = (e.clientX - rect.left - pan.x) / scale;
                const y = (e.clientY - rect.top - pan.y) / scale;

                // Find node under cursor
                const targetNode = elements.find(el =>
                    el.id !== connectingNodeId &&
                    x >= el.x && x <= el.x + 250 && // success area approx
                    y >= el.y && y <= el.y + 100
                );

                if (targetNode) {
                    const newEdge: WorkflowEdge = {
                        id: `e${connectingNodeId}-${targetNode.id}-${Date.now()}`,
                        source: connectingNodeId,
                        target: targetNode.id
                    };
                    onEdgesChange([...edges, newEdge]);
                }
            }
            setConnectingNodeId(null);
        }
        setIsDragging(false);
        setIsPanning(false);
    };

    // Render Bezier curves for edges
    const renderEdges = () => {
        const rendered = edges.map(edge => {
            const source = elements.find(el => el.id === edge.source);
            const target = elements.find(el => el.id === edge.target);

            if (!source || !target) return null;

            // Simple center-to-center or smart attach points could be implemented here
            // For now, let's assume right-to-left flow for simplicity or just center-center
            const sx = source.x + 200; // Right side of source (approx width)
            const sy = source.y + 40;  // Middle of source (approx height)
            const tx = target.x;       // Left side of target
            const ty = target.y + 40;  // Middle of target

            const path = `M ${sx} ${sy} C ${sx + 50} ${sy}, ${tx - 50} ${ty}, ${tx} ${ty}`;

            return (
                <g key={edge.id}>
                    <path
                        d={path}
                        fill="none"
                        stroke="#3f3f46"
                        strokeWidth="2"
                    />
                </g>
            );
        });

        if (connectingNodeId) {
            const source = elements.find(el => el.id === connectingNodeId);
            if (source) {
                const sx = source.x + 200;
                const sy = source.y + 40;
                const path = `M ${sx} ${sy} C ${sx + 50} ${sy}, ${tempEdgeEnd.x - 50} ${tempEdgeEnd.y}, ${tempEdgeEnd.x} ${tempEdgeEnd.y}`;
                rendered.push(
                    <path
                        key="temp"
                        d={path}
                        fill="none"
                        stroke="#e4e4e7"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                    />
                );
            }
        }
        return rendered;
    };

    return (
        <div
            ref={canvasRef}
            className="w-full h-full overflow-hidden relative select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={(e) => handleMouseDown(e)}
        >
            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, #52525b 1px, transparent 0)`,
                    backgroundSize: `${24 * scale}px ${24 * scale}px`,
                    backgroundPosition: `${pan.x}px ${pan.y}px`,
                    transform: `scale(${1})` // Grid scaling handled by backgroundSize
                }}
            />

            {/* Content Container with Transform */}
            <div
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%'
                }}
            >
                {/* Edges Layer */}
                <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
                    {renderEdges()}
                </svg>

                {/* Nodes Layer */}
                {elements.map(element => (
                    <div
                        key={element.id}
                        className="absolute"
                        style={{
                            left: element.x,
                            top: element.y,
                            zIndex: selectedId === element.id ? 10 : 1
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element.id)}
                    >
                        {element.type === 'task' && <TaskNode node={element} selected={selectedId === element.id} onUpdate={handleNodeUpdate} />}
                        {element.type === 'resource' && <ResourceNode node={element} selected={selectedId === element.id} onUpdate={handleNodeUpdate} />}
                        {element.type === 'milestone' && <MilestoneNode node={element} selected={selectedId === element.id} onUpdate={handleNodeUpdate} />}
                        {element.type === 'topic' && <TopicNode node={element} selected={selectedId === element.id} onUpdate={handleNodeUpdate} />}
                    </div>
                ))}
            </div>
        </div>
    );
};
