
import React, { useState, useRef } from 'react';
import {
    Book,
    Video,
    FileText,
    Search,
    Plus,
    ArrowRight,
    BookOpen,
    ChevronRight,
    Maximize2,
    Columns,
    Bookmark,
    Clock,
    ExternalLink,
    MessageSquare,
    Highlighter,
    X,
    Settings,
    Trash2,
    Sun,
    Moon
} from 'lucide-react';
import { ResizableSplit } from './ResizableSplit';

interface Resource {
    id: string;
    title: string;
    type: 'pdf' | 'video' | 'note';
    author?: string;
    progress: number;
    url?: string;
    tags: string[];
}


const DEFAULT_RESOURCES: Resource[] = [
    {
        id: '1',
        title: 'Concepts of Physics - Vol 1',
        type: 'pdf',
        author: 'H.C. Verma',
        progress: 45,
        tags: ['Physics', 'Mechanics'],
        url: 'https://arxiv.org/pdf/quant-ph/0201082.pdf' // Placeholder PDF
    },
    {
        id: '2',
        title: 'Organic Chemistry: Mechanism Series',
        type: 'video',
        author: 'Advanced Academy',
        progress: 72,
        tags: ['Chemistry', 'Organic'],
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Rickroll placeholder for testing
    },
    {
        id: '3',
        title: 'Integration by Parts - Techniques',
        type: 'note',
        progress: 100,
        tags: ['Math', 'Calculus'],
    }
];

export const StudyInterface: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeResources, setActiveResources] = useState<Resource[]>([DEFAULT_RESOURCES[0]]);
    const [isSplitView, setIsSplitView] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const [pdfDarkMode, setPdfDarkMode] = useState(true);

    const [importTab, setImportTab] = useState<'pdf' | 'video' | 'note'>('pdf');
    const [videoUrl, setVideoUrl] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Unified Resource State
    const [resources, setResources] = useState<Resource[]>(DEFAULT_RESOURCES);

    const resetImportState = () => {
        setImportTab('pdf');
        setVideoUrl('');
        setNoteTitle('');
        setShowImportModal(false);
    };

    const deleteResource = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setResources(prev => prev.filter(r => r.id !== id));
        setActiveResources(prev => prev.filter(r => r.id !== id));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const newResource: Resource = {
                id: `local-${Date.now()}`,
                title: file.name.replace('.pdf', ''),
                type: 'pdf',
                author: 'Local Upload',
                progress: 0,
                tags: ['Imported'],
                url: URL.createObjectURL(file)
            };
            setResources(prev => [...prev, newResource]);
            resetImportState();
            launchResource(newResource);
        }
    };

    const handleVideoImport = () => {
        if (!videoUrl) return;
        // Simple YouTube embed transformation
        let embedUrl = videoUrl;
        if (videoUrl.includes('youtube.com/watch?v=')) {
            embedUrl = videoUrl.replace('watch?v=', 'embed/');
        } else if (videoUrl.includes('youtu.be/')) {
            embedUrl = videoUrl.replace('youtu.be/', 'www.youtube.com/embed/');
        }

        const newResource: Resource = {
            id: `video-${Date.now()}`,
            title: 'Imported Video Module',
            type: 'video',
            author: 'External Source',
            progress: 0,
            tags: ['Video', 'Lecture'],
            url: embedUrl
        };
        setResources(prev => [...prev, newResource]);
        resetImportState();
        launchResource(newResource);
    };

    const handleCreateNote = () => {
        if (!noteTitle) return;
        const newResource: Resource = {
            id: `note-${Date.now()}`,
            title: noteTitle,
            type: 'note',
            author: 'User',
            progress: 0,
            tags: ['Notes', 'Canvas'],
        };
        setResources(prev => [...prev, newResource]);
        resetImportState();
        launchResource(newResource);
    };

    const launchResource = (resource: Resource) => {
        if (isSplitView) {
            // In split view, replace the second slot or add if only one
            if (activeResources.length === 1) {
                setActiveResources([...activeResources, resource]);
            } else {
                setActiveResources([activeResources[0], resource]);
            }
        } else {
            setActiveResources([resource]);
        }
    };

    const toggleSplitView = () => {
        if (!isSplitView && activeResources.length === 1) {
            // Just duplicating for now or keeping empty slot logic
        }
        setIsSplitView(!isSplitView);
        if (isSplitView && activeResources.length > 1) {
            setActiveResources([activeResources[0]]);
        }
    };

    const renderSidebar = () => (
        <div className="h-full bg-[#050505] flex flex-col border-r border-white/[0.03] select-none">
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#3c4043]">
                        <BookOpen size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Resource Manager</span>
                    </div>
                    <button
                        onClick={() => setIsManaging(!isManaging)}
                        className={`transition-all ${isManaging ? 'text-emerald-500 rotate-180' : 'text-[#3c4043] hover:text-white'}`}
                        title="Manage Assets"
                    >
                        <Settings size={14} />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c4043]" size={14} />
                    <input
                        type="text"
                        placeholder="FILTER ASSETS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold text-white uppercase tracking-widest outline-none focus:border-white/20 transition-all placeholder:text-[#3c4043]"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar pb-32">
                {resources.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map(resource => (
                    <div key={resource.id} className="relative group">
                        <button
                            onClick={() => launchResource(resource)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeResources.some(ar => ar.id === resource.id) ? 'bg-[#1e1e1e] border border-white/5 shadow-xl scale-[1.02]' : 'hover:bg-white/[0.02]'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${resource.type === 'pdf' ? 'bg-red-500/10 text-red-500' :
                                resource.type === 'video' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                {resource.type === 'pdf' ? <Book size={18} /> :
                                    resource.type === 'video' ? <Video size={18} /> :
                                        <FileText size={18} />}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h4 className={`text-[12px] font-medium truncate ${activeResources.some(ar => ar.id === resource.id) ? 'text-white' : 'text-[#9aa0a6]'}`}>
                                    {resource.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#444] transition-all" style={{ width: `${resource.progress}%` }} />
                                    </div>
                                    <span className="text-[8px] font-mono text-[#3c4043]">{resource.progress}%</span>
                                </div>
                            </div>
                        </button>

                        {isManaging && (
                            <button
                                onClick={(e) => deleteResource(resource.id, e)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white hover:border-transparent transition-all shadow-lg animate-in zoom-in-50 duration-200"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}

                <button
                    onClick={() => setShowImportModal(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 p-4 border border-dashed border-white/5 rounded-2xl text-[#3c4043] hover:text-[#9aa0a6] hover:border-white/10 transition-all group"
                >
                    <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Import Asset</span>
                </button>
            </div>
        </div>
    );

    const renderResourceViewer = (resource: Resource, index: number) => {
        return (
            <div key={`${resource.id}-${index}`} className="flex-1 flex flex-col bg-black relative h-full">
                {/* Viewer Header */}
                <div className="h-12 border-b border-white/[0.03] bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${resource.type === 'pdf' ? 'bg-red-500/10 text-red-500' :
                            resource.type === 'video' ? 'bg-blue-500/10 text-blue-500' :
                                'bg-emerald-500/10 text-emerald-500'
                            }`}>
                            {resource.type}
                        </span>
                        <h3 className="text-[11px] font-medium text-[#9aa0a6] truncate max-w-[200px]">{resource.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 text-[#3c4043] hover:text-white transition-colors"><Highlighter size={14} /></button>
                        <button className="p-1.5 text-[#3c4043] hover:text-white transition-colors"><Bookmark size={14} /></button>
                        <div className="w-[1px] h-4 bg-white/5 mx-1" />
                        <button
                            onClick={() => {
                                const newRes = [...activeResources];
                                newRes.splice(index, 1);
                                setActiveResources(newRes);
                                if (newRes.length === 0) setIsSplitView(false);
                            }}
                            className="p-1.5 text-[#3c4043] hover:text-red-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Actual Viewer Area */}
                <div className="flex-1 relative overflow-hidden bg-[#050505]">
                    {resource.type === 'pdf' && (
                        <div className="w-full h-full flex flex-col">
                            {/* Mock PDF Toolbar */}
                            <div className="h-10 bg-[#111] border-b border-white/5 flex items-center justify-between px-4 text-[10px] font-mono text-[#3c4043]">
                                <div className="flex gap-4">
                                    <span>PAGE: 01 / 84</span>
                                    <span>ZOOM: 110%</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => setPdfDarkMode(!pdfDarkMode)}
                                        className="hover:text-white transition-colors flex items-center gap-2"
                                        title={pdfDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                    >
                                        {pdfDarkMode ? <Sun size={12} /> : <Moon size={12} />}
                                        <span>{pdfDarkMode ? 'LIGHT MODE' : 'DARK MODE'}</span>
                                    </button>
                                    <div className="w-[1px] h-3 bg-[#3c4043]/50 mx-2" />
                                    <button className="hover:text-white transition-colors">SEARCH TEXT</button>
                                </div>
                            </div>
                            <iframe
                                src={resource.url}
                                className={`flex-1 w-full h-full border-none transition-all duration-300 ${pdfDarkMode ? 'invert-[0.9] hue-rotate-180 bg-zinc-900' : 'bg-white'}`}
                                title={resource.title}
                            />
                        </div>
                    )}

                    {resource.type === 'video' && (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex-1 bg-black aspect-video flex items-center justify-center">
                                <iframe
                                    src={resource.url}
                                    className="w-full h-full border-none"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            {/* Timestamp Bookmarks Bar */}
                            <div className="p-6 space-y-4 border-t border-white/5 bg-[#0a0a0a]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[#3c4043] uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={12} /> Smart Bookmarks
                                    </span>
                                    <button className="text-[9px] font-bold text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5 hover:bg-white/10 transition-all">
                                        + Add Marker
                                    </button>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                                    {[
                                        { time: '04:12', label: 'Mechanism Overview' },
                                        { time: '12:45', label: 'Example Problem 1' },
                                        { time: '22:10', label: 'Common Errors' }
                                    ].map((m, i) => (
                                        <button key={i} className="shrink-0 group flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all text-left">
                                            <div className="text-[9px] font-mono text-emerald-500 font-bold">{m.time}</div>
                                            <div className="text-[10px] text-[#9aa0a6] group-hover:text-white transition-colors max-w-[120px] truncate">{m.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {resource.type === 'note' && (
                        <div className="w-full h-full p-10 overflow-y-auto custom-scrollbar bg-[#0a0005]">
                            <div className="max-w-3xl mx-auto space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[#3c4043]">
                                        <FileText size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Neural Note Protocol</span>
                                    </div>
                                    <h2 className="text-3xl font-medium text-white italic">Strategic Integration Notes</h2>
                                </div>
                                <div className="prose prose-invert prose-sm">
                                    <p className="text-[#9aa0a6] leading-relaxed">
                                        Integration by parts is a powerful technique derived from the product rule of differentiation.
                                        The fundamental formula is <code className="bg-white/5 p-1 rounded">∫u dv = uv - ∫v du</code>.
                                    </p>
                                    <ul className="space-y-4 text-[#9aa0a6] list-none p-0">
                                        <li className="flex gap-4 group">
                                            <span className="text-emerald-500 font-mono">01.</span>
                                            <span>Select <strong className="text-white">u</strong> using the ILATE rule (Inverse, Log, Algebraic, Trig, Expo).</span>
                                        </li>
                                        <li className="flex gap-4 group">
                                            <span className="text-emerald-500 font-mono">02.</span>
                                            <span>Ensure <strong className="text-white">dv</strong> is easily integrable.</span>
                                        </li>
                                    </ul>
                                </div>
                                {/* Linked References */}
                                <div className="pt-10 border-t border-white/5 space-y-4">
                                    <div className="text-[10px] font-bold text-[#3c4043] uppercase tracking-widest">Bidirectional Links</div>
                                    <div className="flex flex-col gap-3">
                                        <button className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Book size={14} className="text-red-500" />
                                                <span className="text-[11px] text-[#e8eaed]">HC Verma Pg. 412: Example 4.1</span>
                                            </div>
                                            <ExternalLink size={14} className="text-[#3c4043] group-hover:text-white" />
                                        </button>
                                        <button className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Video size={14} className="text-blue-500" />
                                                <span className="text-[11px] text-[#e8eaed]">Lec 4: Organic Mechanisms [12:45]</span>
                                            </div>
                                            <ExternalLink size={14} className="text-[#3c4043] group-hover:text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Resource Control Bar */}
                <div className="h-10 bg-[#0a0a0a] border-t border-white/[0.03] flex items-center justify-between px-6 shrink-0 z-20">
                    <div className="flex items-center gap-4 text-[8px] font-mono font-bold text-[#3c4043] uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><MessageSquare size={10} /> 4 Annotations</span>
                        <span className="flex items-center gap-1.5"><Clock size={10} /> Read Time: 1h 12m</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="text-[8px] font-bold text-[#9aa0a6] uppercase tracking-widest hover:text-white transition-colors">Export Logic</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderMainArea = () => {
        if (activeResources.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-20 gap-8">
                    <div className="w-24 h-24 rounded-full border border-dashed border-white/10 flex items-center justify-center text-[#3c4043] animate-pulse">
                        <BookOpen size={48} />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-medium text-white italic">Neural Library Offline</h2>
                        <p className="text-[10px] text-[#3c4043] font-bold uppercase tracking-[0.2em] max-w-[300px] leading-relaxed">
                            Select a protocol from the left repository to initiate the smart learning module.
                        </p>
                    </div>
                </div>
            );
        }

        if (isSplitView && activeResources.length >= 1) {
            const leftRes = activeResources[0];
            const rightRes = activeResources[1] || activeResources[0]; // fallback to same if only one

            return (
                <ResizableSplit
                    primary={renderResourceViewer(leftRes, 0)}
                    secondary={renderResourceViewer(rightRes, 1)}
                    initialSize={window.innerWidth / 2 - 200}
                    minSize={300}
                    maxSize={window.innerWidth - 600}
                    primaryPosition="start"
                />
            );
        }

        return renderResourceViewer(activeResources[0], 0);
    };

    return (
        <div className="h-screen bg-black flex flex-col overflow-hidden">
            {/* Global Study Header */}
            <div className="h-16 shrink-0 border-b border-white/[0.03] px-10 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-xl z-30">
                <div className="flex items-center gap-6">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[#3c4043]">
                            <Book size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono">Cognitive Link v4.2</span>
                        </div>
                        <h1 className="text-xl font-medium tracking-tight text-white flex items-center gap-3">
                            Resource Workspace
                        </h1>
                    </div>

                    <div className="h-8 w-[1px] bg-white/5 mx-2" />

                    <nav className="flex items-center gap-2 bg-[#1e1e1e]/50 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setIsSplitView(false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${!isSplitView ? 'bg-[#3c4043] text-white shadow-lg' : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                                }`}
                        >
                            <Maximize2 size={14} /> Full Module
                        </button>
                        <button
                            onClick={toggleSplitView}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${isSplitView ? 'bg-[#3c4043] text-white shadow-lg' : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                                }`}
                        >
                            <Columns size={14} /> Split View
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Global progress indicator */}
                    <div className="flex items-center gap-4 bg-[#1e1e1e]/80 p-2 rounded-2xl border border-white/5">
                        <div className="flex flex-col items-end px-2">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">System Load</span>
                            <span className="text-[12px] font-mono text-white">42.2%</span>
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
                        >
                            <Plus size={14} fill="currentColor" /> Import Asset
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <ResizableSplit
                    primary={renderSidebar()}
                    secondary={renderMainArea()}
                    initialSize={320}
                    minSize={280}
                    maxSize={500}
                    primaryPosition="start"
                />
            </div>

            {/* Global Bottom Status */}
            <footer className="h-10 shrink-0 bg-[#050505] border-t border-white/[0.03] px-6 flex items-center justify-between z-30">
                <div className="flex gap-6 text-[9px] font-mono font-bold text-[#3c4043] uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><ArrowRight size={10} /> Throughput: 142MB/s</div>
                    <div className="flex items-center gap-1.5"><Clock size={10} /> Last Sync: 2m ago</div>
                </div>
                <div className="text-[9px] font-mono font-bold text-[#3c4043] uppercase tracking-widest flex items-center gap-2">
                    Intellectual Assets Decrypted <ChevronRight size={10} />
                </div>
            </footer>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-10 animate-in fade-in duration-200">
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-medium text-white">Import Neural Asset</h2>
                                <p className="text-[10px] text-[#9aa0a6] font-bold uppercase tracking-widest">Connect external knowledge source</p>
                            </div>
                            <button onClick={() => setShowImportModal(false)} className="text-[#3c4043] hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mb-6">
                            {(['pdf', 'video', 'note'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setImportTab(tab)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${importTab === tab ? 'bg-[#3c4043] text-white shadow-lg' : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                                        }`}
                                >
                                    {tab === 'pdf' ? 'PDF Document' : tab === 'video' ? 'Video Stream' : 'Neural Canvas'}
                                </button>
                            ))}
                        </div>

                        {importTab === 'pdf' && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.02] hover:border-white/20 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                                    <Plus size={32} className="text-[#3c4043] group-hover:text-white transition-colors" />
                                </div>
                                <div className="text-center space-y-1">
                                    <div className="text-sm font-medium text-white">Click to Upload PDF</div>
                                    <div className="text-[10px] text-[#3c4043] font-bold uppercase tracking-widest">Maximum Size: 50MB</div>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                            </div>
                        )}

                        {importTab === 'video' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#9aa0a6] uppercase tracking-widest">YouTube URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/30 transition-all outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleVideoImport}
                                    className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-emerald-400 transition-colors"
                                >
                                    Initialize Stream
                                </button>
                            </div>
                        )}

                        {importTab === 'note' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#9aa0a6] uppercase tracking-widest">Canvas Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Electrostatics Strategy..."
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/30 transition-all outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateNote}
                                    className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-emerald-400 transition-colors"
                                >
                                    Create Protocol
                                </button>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#9aa0a6] hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancel Protocol
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};
