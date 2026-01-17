import React, { useState, useEffect } from 'react';
import {
    MonitorPlay,
    Plus,
    Trash2,
    Search,
    Play,
    ExternalLink,
    Clock,
    BookOpen
} from 'lucide-react';

interface Lecture {
    id: string;
    title: string;
    url: string;
    subject: 'Physics' | 'Chemistry' | 'Maths';
    addedAt: string;
    thumbnail?: string;
}

const DEFAULT_LECTURES: Lecture[] = [
    {
        id: '1',
        title: 'Rotational Mechanics - Complete Playlist',
        url: 'https://www.youtube.com/embed/playlist?list=PL_A4M5IAkMaeYt3o_sU9F0yUFLoK4F70_', // Placeholder
        subject: 'Physics',
        addedAt: new Date().toISOString()
    },
    {
        id: '2',
        title: 'GOC (General Organic Chemistry) - One Shot',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        subject: 'Chemistry',
        addedAt: new Date().toISOString()
    }
];

export const LecturesInterface: React.FC = () => {
    const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry' | 'Maths'>('Physics');
    const [lectures, setLectures] = useState<Lecture[]>(() => {
        const saved = localStorage.getItem('lectures_data');
        return saved ? JSON.parse(saved) : DEFAULT_LECTURES;
    });
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLectureUrl, setNewLectureUrl] = useState('');
    const [newLectureTitle, setNewLectureTitle] = useState('');

    useEffect(() => {
        localStorage.setItem('lectures_data', JSON.stringify(lectures));
    }, [lectures]);

    const getEmbedUrl = (url: string) => {
        // Simple transformer for YouTube URLs
        let finalUrl = url;
        if (url.includes('watch?v=')) {
            finalUrl = url.replace('watch?v=', 'embed/');
        } else if (url.includes('youtu.be/')) {
            finalUrl = url.replace('youtu.be/', 'www.youtube.com/embed/');
        }
        return finalUrl;
    };

    const handleAddLecture = () => {
        if (!newLectureUrl || !newLectureTitle) return;

        const newLecture: Lecture = {
            id: Date.now().toString(),
            title: newLectureTitle,
            url: getEmbedUrl(newLectureUrl),
            subject: activeSubject,
            addedAt: new Date().toISOString()
        };

        setLectures([...lectures, newLecture]);
        setShowAddModal(false);
        setNewLectureUrl('');
        setNewLectureTitle('');
    };

    const handleDeleteLecture = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setLectures(lectures.filter(l => l.id !== id));
        if (selectedLecture?.id === id) setSelectedLecture(null);
    };

    const filteredLectures = lectures.filter(l => l.subject === activeSubject);

    return (
        <div className="h-screen bg-black flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-16 shrink-0 border-b border-white/[0.03] px-8 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-xl z-30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[#3c4043]">
                        <MonitorPlay size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Lecture Hall</span>
                    </div>
                </div>

                <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-white/5">
                    {(['Physics', 'Chemistry', 'Maths'] as const).map(subject => (
                        <button
                            key={subject}
                            onClick={() => { setActiveSubject(subject); setSelectedLecture(null); }}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${activeSubject === subject
                                ? 'bg-[#3c4043] text-white shadow-sm'
                                : 'text-[#9aa0a6] hover:text-white'
                                }`}
                        >
                            {subject}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                >
                    <Plus size={14} /> Add Lecture
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Visual Sidebar List */}
                <div className="w-80 border-r border-white/[0.03] bg-[#050505] flex flex-col">
                    <div className="p-4 border-b border-white/[0.03]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c4043]" size={14} />
                            <input
                                placeholder="Search lectures..."
                                className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[11px] text-[#e8eaed] placeholder:text-[#3c4043] outline-none focus:border-white/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {filteredLectures.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-[#3c4043] gap-2">
                                <BookOpen size={24} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">No Lectures Found</span>
                            </div>
                        ) : filteredLectures.map(lecture => (
                            <div
                                key={lecture.id}
                                onClick={() => setSelectedLecture(lecture)}
                                className={`group relative p-3 rounded-xl cursor-pointer border border-transparent transition-all ${selectedLecture?.id === lecture.id
                                    ? 'bg-[#1e1e1e] border-white/10'
                                    : 'hover:bg-white/[0.02] hover:border-white/5'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedLecture?.id === lecture.id ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[#1e1e1e] text-[#3c4043]'
                                        }`}>
                                        <Play size={14} fill="currentColor" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-[12px] font-medium leading-tight mb-1 truncate ${selectedLecture?.id === lecture.id ? 'text-white' : 'text-[#9aa0a6]'
                                            }`}>
                                            {lecture.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[9px] text-[#3c4043] font-mono">
                                            <Clock size={10} />
                                            <span>{new Date(lecture.addedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteLecture(lecture.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#3c4043] hover:text-red-500 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Player Area */}
                <div className="flex-1 bg-black flex flex-col">
                    {selectedLecture ? (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex-1 relative bg-[#0a0a0a]">
                                <iframe
                                    src={selectedLecture.url}
                                    title={selectedLecture.title}
                                    className="w-full h-full border-none"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <div className="h-16 bg-[#050505] border-t border-white/[0.03] px-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-white font-medium text-sm">{selectedLecture.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-[#9aa0a6] font-bold uppercase tracking-widest">{selectedLecture.subject}</span>
                                        <span className="w-1 h-1 bg-[#3c4043] rounded-full" />
                                        <a href={selectedLecture.url} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1">
                                            Open Original <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#3c4043] gap-4">
                            <div className="w-20 h-20 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                                <MonitorPlay size={32} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-medium mb-1">Select a Lecture</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest">Choose from the list or add a new URL</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <h3 className="text-white font-medium text-lg">Add New Lecture</h3>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#9aa0a6] uppercase tracking-widest">Title</label>
                                <input
                                    value={newLectureTitle}
                                    onChange={(e) => setNewLectureTitle(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-white/30 outline-none"
                                    placeholder="Lecture Topic..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#9aa0a6] uppercase tracking-widest">YouTube URL / Playlist</label>
                                <input
                                    value={newLectureUrl}
                                    onChange={(e) => setNewLectureUrl(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-white/30 outline-none"
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-[#9aa0a6] hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddLecture}
                                className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                            >
                                Add Lecture
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
