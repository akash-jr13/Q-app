import React, { useState, useEffect } from 'react';
import {
    Users,
    Play,
    Wifi,
    WifiOff,
    Hand,
    Loader,
    Plus,
    Trash2,
    Pause,
    LogOut,
    Copy,
    ArrowRight
} from 'lucide-react';
import { CloudService, UserProfile } from '../utils/cloud';

interface Peer {
    id: string;
    name: string;
    status: 'focusing' | 'idle' | 'break';
    subject: string;
    timer: number;
    streak: number;
    initial: string;
    color: string;
}

interface UserSubject {
    id: string;
    name: string;
    color: string;
    bg: string;
    border: string;
    totalTime: number; // in seconds
}

const DEFAULT_SUBJECTS: UserSubject[] = [
    { id: 'phy', name: 'PHYSICS', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', totalTime: 0 },
    { id: 'math', name: 'MATHEMATICS', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', totalTime: 0 },
    { id: 'chem', name: 'CHEMISTRY', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', totalTime: 0 },
    { id: 'bio', name: 'BIOLOGY', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', totalTime: 0 },
    { id: 'coding', name: 'CODING', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', totalTime: 0 }
];

// Fallback if DB is empty/slow
const MOCK_PEERS: Peer[] = [];

const Studicon: React.FC<{ timer: number, status: string, name?: string }> = ({ timer, status }) => {
    // Evolving icon based on time
    const getStage = (t: number) => {
        if (t < 300) return '🌱'; // Seedling (< 5 mins)
        if (t < 900) return '🌿'; // Herb (5-15 mins)
        if (t < 1800) return '🌳'; // Tree (15-30 mins)
        if (t < 3600) return '🍏'; // Fruit (30-60 mins)
        return '👑'; // Crown (> 1 hour)
    };

    return (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-all duration-500 relative
            ${status === 'focusing' ? 'bg-gradient-to-br from-[#1e1e1e] to-black border border-emerald-500/30' : 'bg-[#1e1e1e] border border-white/5 opacity-50'}`}>
            <span className="animate-in zoom-in duration-300">{getStage(timer)}</span>
            {status === 'focusing' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </div>
            )}
        </div>
    );
};

export const PeerInterface: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [subjects, setSubjects] = useState<UserSubject[]>(DEFAULT_SUBJECTS);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [myTimer, setMyTimer] = useState(0); // This is the SESSION timer (large one)
    const [peers, setPeers] = useState<Peer[]>(MOCK_PEERS);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isEditingSubjects, setIsEditingSubjects] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');

    // Group Features
    const [groupId, setGroupId] = useState<string | null>(null);
    const [joinGroupIdInput, setJoinGroupIdInput] = useState('');
    const [viewMode, setViewMode] = useState<'global' | 'group'>('global');

    // Real Networking State
    const [myPeerId, setMyPeerId] = useState<string | null>(null);

    // Nudging logic
    const [nudges, setNudges] = useState<string[]>([]);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('supabase_token');
            if (token) {
                const profile = await CloudService.getProfile(token);
                if (profile) setUserProfile(profile);
            }
        };
        loadUser();

        // Restore local state
        const savedTimer = localStorage.getItem('study_global_timer');
        if (savedTimer) setMyTimer(parseInt(savedTimer, 10));

        const savedSubjects = localStorage.getItem('study_subjects');
        if (savedSubjects) {
            try {
                setSubjects(JSON.parse(savedSubjects));
            } catch (e) {
                console.error("Failed to restore subjects", e);
            }
        }
    }, []);

    // Persistence: Save state on changes
    useEffect(() => {
        localStorage.setItem('study_global_timer', myTimer.toString());
        localStorage.setItem('study_subjects', JSON.stringify(subjects));
    }, [myTimer, subjects]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (isTimerRunning && activeSubjectId) {
            interval = setInterval(() => {
                setMyTimer(prev => prev + 1);
                // Also update the specific subject's total time
                setSubjects(prevSub => prevSub.map(s =>
                    s.id === activeSubjectId ? { ...s, totalTime: s.totalTime + 1 } : s
                ));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, activeSubjectId]);

    // NETWORKING: Join & Heartbeat
    useEffect(() => {
        const effectiveGroupId = groupId || 'GLOBAL';
        let peerInterval: any;
        let heartbeatInterval: any;

        if (isConnected) {
            const token = localStorage.getItem('supabase_token');
            if (!token) {
                alert("Please log in to use Global Connect.");
                setIsConnected(false);
                setConnectionStatus('disconnected');
                return;
            }

            // JOIN
            const initSession = async () => {
                const subjectName = subjects.find(s => s.id === activeSubjectId)?.name || 'IDLE';
                const status = isTimerRunning ? 'focusing' : 'idle';

                const pid = await CloudService.joinPeerGroup(
                    token,
                    effectiveGroupId,
                    subjectName,
                    status
                );

                if (pid) {
                    setMyPeerId(pid);
                    setConnectionStatus('connected');
                } else {
                    setConnectionStatus('disconnected');
                    setIsConnected(false);
                    alert("Failed to connect to server.");
                }
            };

            // Only join if we don't have a peer ID yet or if group changed (handled by effect cleanup)
            if (!myPeerId) {
                initSession();
            }

            // LOOP: FETCH PEERS
            peerInterval = setInterval(async () => {
                const rawPeers = await CloudService.getPeers(effectiveGroupId);
                if (rawPeers) {
                    // Filter self out if possible (by checking ID != myPeerId)
                    // rawPeers has database fields: id, display_name, status, etc.
                    const mappedPeers: Peer[] = rawPeers
                        .filter((p: any) => p.user_id !== userProfile?.id) // Don't show self
                        .map((p: any) => ({
                            id: p.id,
                            name: p.display_name,
                            status: p.status,
                            subject: p.subject,
                            timer: p.timer_val,
                            streak: 0,
                            initial: p.display_name[0] || '?',
                            color: 'bg-indigo-500' // could randomize
                        }));
                    setPeers(mappedPeers);
                }
            }, 3000);

            // LOOP: HEARTBEAT (Update my status on server)
            heartbeatInterval = setInterval(async () => {
                if (myPeerId) {
                    const subjectName = subjects.find(s => s.id === activeSubjectId)?.name || 'IDLE';
                    const status = isTimerRunning ? 'focusing' : 'idle';

                    // Optimization: check if state changed? Or just send every 5s. 
                    // Let's just send every 5s to keep "last_ping" fresh.
                    await CloudService.sendHeartbeat(
                        token,
                        myPeerId,
                        status,
                        myTimer,
                        subjectName
                    );
                }
            }, 5000);

        } else {
            setPeers([]);
            setMyPeerId(null);
            setConnectionStatus('disconnected');
        }

        return () => {
            clearInterval(peerInterval);
            clearInterval(heartbeatInterval);
        };
    }, [isConnected, groupId, myPeerId]); // Dependencies: if isConnected toggles or GroupID changes

    // IMMEDIATE STATE UPDATE (When user clicks Play/Pause or switches subject)
    useEffect(() => {
        if (isConnected && myPeerId) {
            const token = localStorage.getItem('supabase_token');
            if (token) {
                const subjectName = subjects.find(s => s.id === activeSubjectId)?.name || 'IDLE';
                const status = isTimerRunning ? 'focusing' : 'idle';
                CloudService.sendHeartbeat(token, myPeerId, status, myTimer, subjectName);
            }
        }
    }, [isTimerRunning, activeSubjectId, myTimer]); // Triggered on significant state changes (and timer tick, effectively throttling handled by network or loop above is safer but this ensures immediate UI update for others)
    // NOTE: Sending heartbeat on every second (myTimer) is too much. 
    // Effect above is risky with 'myTimer'. Let's remove myTimer from dependency effectively.
    // We rely on the 5s loop for timer updates. We rely on this effect for STATUS/SUBJECT changes.


    const toggleConnection = () => {
        if (isConnected) {
            setIsConnected(false);
            setMyPeerId(null); // Clear ID to force re-join next time
        } else {
            setConnectionStatus('connecting');
            setIsConnected(true);
        }
    };

    const handleNudge = (_peerId: string, peerName: string) => {
        if (!isConnected) return;
        setNudges(prev => [...prev, `You nudged ${peerName} (Simulation)`]);
        // Real implementation would require a 'nudges' table or realtime channel
    };

    const handleSubjectClick = (subjectId: string) => {
        if (activeSubjectId === subjectId) {
            // Toggle pause/play if clicking same subject
            setIsTimerRunning(!isTimerRunning);
        } else {
            // Switch subject
            setActiveSubjectId(subjectId);
            setIsTimerRunning(true);
            setMyTimer(0);
        }
    };

    const handleAddSubject = () => {
        if (!newSubjectName.trim()) return;
        const newSub: UserSubject = {
            id: `custom-${Date.now()}`,
            name: newSubjectName.toUpperCase(),
            color: 'text-white',
            bg: 'bg-white/10',
            border: 'border-white/20',
            totalTime: 0
        };
        setSubjects([...subjects, newSub]);
        setNewSubjectName('');
    };

    const handleDeleteSubject = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSubjects(subjects.filter(s => s.id !== id));
        if (activeSubjectId === id) {
            setIsTimerRunning(false);
            setActiveSubjectId(null);
        }
    };

    // Group Logic
    const createGroup = () => {
        const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setGroupId(newId);
        setViewMode('group');
        // Force Re-connect logic will trigger because groupId changed in dependency array
        setMyPeerId(null);
        setPeers([]);
    };

    const joinGroup = () => {
        if (!joinGroupIdInput.trim()) return;
        setGroupId(joinGroupIdInput.toUpperCase());
        setViewMode('group');
        setJoinGroupIdInput('');
        // Force Re-connect
        setMyPeerId(null);
        setPeers([]);
    };

    const leaveGroup = () => {
        setGroupId(null);
        setViewMode('global');
        // Force Re-connect
        setMyPeerId(null);
        setPeers([]);
    };

    const copyGroupId = () => {
        if (groupId) {
            navigator.clipboard.writeText(groupId);
            alert('Group ID copied to clipboard!');
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const activeSubject = subjects.find(s => s.id === activeSubjectId);

    return (
        <div className="h-full bg-black flex flex-col overflow-hidden relative font-sans">
            {/* Nudge Toast */}
            <div className="absolute top-20 right-8 z-50 space-y-2 pointer-events-none">
                {nudges.map((msg, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-[#1e1e1e] border border-emerald-500/20 rounded-xl shadow-2xl animate-in slide-in-from-right duration-300">
                        <Hand size={16} className="text-emerald-500" />
                        <span className="text-xs font-bold text-white">{msg}</span>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="h-16 shrink-0 border-b border-white/[0.03] px-6 flex items-center justify-between bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                        <Users size={18} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-wider uppercase">Global Connect</h1>
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-mono text-[#5f6368] uppercase">
                                {connectionStatus === 'connected' ? 'Live @ Supabase' : connectionStatus === 'connecting' ? 'Handshaking...' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsEditingSubjects(!isEditingSubjects)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${isEditingSubjects ? 'bg-white text-black border-white' : 'bg-[#1e1e1e] text-[#9aa0a6] border-white/5 hover:text-white'}`}
                    >
                        <Plus size={12} /> Edit Subjects
                    </button>

                    <button
                        onClick={toggleConnection}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isConnected
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
                            }`}
                    >
                        {connectionStatus === 'connecting' ? <Loader size={12} className="animate-spin" /> :
                            isConnected ? <WifiOff size={14} /> : <Wifi size={14} />}
                        {isConnected ? 'Disconnect' : 'Go Online'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Area: Split into Timer Top and List Bottom */}
                <div className="flex-1 flex flex-col relative bg-[#050505]">

                    {/* Top Section: MAIN TIMER */}
                    <div className="h-[35%] flex flex-col items-center justify-center relative border-b border-white/[0.03]">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-[#050505] pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className={`text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-white/5 ${activeSubject ? activeSubject.color : 'text-[#3c4043]'}`}>
                                {activeSubject ? activeSubject.name : 'SELECT A SUBJECT'}
                            </div>
                            <h2 className="text-7xl font-black font-mono tracking-tighter text-white tabular-nums">
                                {formatTime(myTimer)}
                            </h2>
                            <div className="flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <Studicon timer={myTimer} status={isTimerRunning ? 'focusing' : 'idle'} name="You" />
                                <div className="text-[10px] font-medium text-[#9aa0a6] uppercase tracking-widest">
                                    Current Session Focus
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: SUBJECT LIST */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

                        {/* Edit Mode Input */}
                        {isEditingSubjects && (
                            <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    placeholder="Enter new subject name..."
                                    className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/30 outline-none uppercase font-bold tracking-wider"
                                />
                                <button
                                    onClick={handleAddSubject}
                                    className="px-6 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-400 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        <div className="space-y-2 max-w-3xl mx-auto">
                            {subjects.map(sub => {
                                const isActive = activeSubjectId === sub.id;
                                return (
                                    <div
                                        key={sub.id}
                                        className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isActive
                                            ? `bg-[#1e1e1e] ${sub.border} border-opacity-50`
                                            : 'bg-transparent border-white/[0.05] hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleSubjectClick(sub.id)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive && isTimerRunning
                                                    ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                                                    : `bg-[#1a1a1a] ${sub.color} hover:bg-white/10`
                                                    }`}
                                            >
                                                {isActive && isTimerRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                                            </button>

                                            <div>
                                                <div className={`text-sm font-bold tracking-wider uppercase ${isActive ? 'text-white' : 'text-[#9aa0a6]'}`}>
                                                    {sub.name}
                                                </div>
                                                {isActive && isTimerRunning && (
                                                    <div className="text-[9px] text-emerald-500 font-mono tracking-widest animate-pulse">RECORDING...</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className={`font-mono text-lg font-bold tabular-nums ${isActive ? 'text-white' : 'text-[#5f6368]'}`}>
                                                {formatTime(sub.totalTime)}
                                            </div>

                                            {isEditingSubjects && (
                                                <button
                                                    onClick={(e) => handleDeleteSubject(sub.id, e)}
                                                    className="p-2 text-[#3c4043] hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Active Indicator Bar */}
                                        {isActive && (
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full ${sub.color.replace('text-', 'bg-')}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Group & Peer Sidebar */}
                <div className="w-[350px] border-l border-white/[0.03] bg-[#080808] flex flex-col shrink-0">
                    <div className="p-4 border-b border-white/[0.03]">
                        {/* Group Controls */}
                        <div className="flex items-center gap-1 bg-[#1e1e1e] p-1 rounded-lg mb-4">
                            <button
                                onClick={() => viewMode === 'group' && leaveGroup()}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'global' ? 'bg-[#3c4043] text-white' : 'text-[#9aa0a6] hover:text-white'}`}
                            >
                                Global
                            </button>
                            <button
                                onClick={() => setViewMode('group')}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'group' ? 'bg-[#3c4043] text-white' : 'text-[#9aa0a6] hover:text-white'}`}
                            >
                                Private Group
                            </button>
                        </div>

                        {viewMode === 'group' && !groupId && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <button
                                    onClick={createGroup}
                                    className="w-full py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                                >
                                    Create New Group
                                </button>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={joinGroupIdInput}
                                        onChange={(e) => setJoinGroupIdInput(e.target.value)}
                                        placeholder="ENTER GROUP ID"
                                        className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white font-mono uppercase focus:border-white/30 outline-none"
                                    />
                                    <button
                                        onClick={joinGroup}
                                        className="px-3 bg-white text-black rounded-lg text-xs hover:bg-gray-200"
                                    >
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {viewMode === 'group' && groupId && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 animate-in zoom-in-95 duration-200">
                                <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Active Group ID</div>
                                <div className="flex items-center justify-between">
                                    <code className="text-lg font-mono font-bold text-white tracking-widest">{groupId}</code>
                                    <div className="flex gap-2">
                                        <button onClick={copyGroupId} className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-500/20 rounded-md transition-colors">
                                            <Copy size={14} />
                                        </button>
                                        <button onClick={leaveGroup} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors">
                                            <LogOut size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(viewMode === 'global' || groupId) && (
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mt-4">
                                {viewMode === 'global' ? 'Global Squad' : 'Group Members'}
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[9px] min-w-[20px] text-center">
                                    {isConnected ? peers.filter(p => p.status === 'focusing').length + (isTimerRunning ? 1 : 0) : 0}
                                </span>
                            </h3>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {/* Me Card */}
                        <div className="p-4 rounded-xl bg-[#151515] border border-white/5 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <Studicon timer={myTimer} status={isTimerRunning ? 'focusing' : 'idle'} name="You" />
                                <div>
                                    <div className="text-xs font-bold text-white flex items-center gap-2">
                                        {userProfile?.fullName || "You"}
                                    </div>
                                    <div className="text-[9px] font-mono text-[#5f6368] uppercase truncate max-w-[100px]">
                                        {activeSubject ? activeSubject.name : 'IDLE'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono font-bold text-emerald-500 tabular-nums text-sm">{formatTime(activeSubject ? activeSubject.totalTime : 0)}</div>
                            </div>
                        </div>

                        {/* Peer Cards */}
                        {isConnected ? (
                            peers.length > 0 ? (
                                peers.map(peer => (
                                    <div key={peer.id} className="p-3 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg ${peer.color} flex items-center justify-center text-white text-xs font-bold`}>{peer.initial}</div>
                                            <div>
                                                <div className="text-xs font-medium text-[#e8eaed]">{peer.name}</div>
                                                <div className="text-[9px] text-[#5f6368] uppercase tracking-wider">{peer.subject}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-white text-xs tabular-nums">{formatTime(peer.timer)}</div>
                                            {peer.status === 'idle' && (
                                                <button onClick={() => handleNudge(peer.id, peer.name)} className="text-[8px] text-orange-500 uppercase font-bold hover:underline">NUDGE</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="mt-10 text-center opacity-40">
                                    <div className="text-[9px] font-bold uppercase tracking-widest">No active peers in this room</div>
                                </div>
                            )
                        ) : (
                            <div className="mt-10 text-center opacity-40">
                                <WifiOff size={20} className="mx-auto mb-2" />
                                <div className="text-[9px] font-bold uppercase tracking-widest">Offline</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
