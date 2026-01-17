
import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, ChevronRight, Target, Loader2, AlertCircle, ShieldCheck, DatabaseZap, Terminal, ArrowLeft } from 'lucide-react';
import { CloudService, UserProfile } from '../utils/cloud';

interface AuthInterfaceProps {
    onAuthSuccess: (profile: UserProfile) => void;
    onExit?: () => void;
}

export const AuthInterface: React.FC<AuthInterfaceProps> = ({ onAuthSuccess, onExit }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isConfigOk, setIsConfigOk] = useState(true);
    const [showDebug, setShowDebug] = useState(false);

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [targetExam, setTargetExam] = useState("");

    useEffect(() => {
        setIsConfigOk(CloudService.isConfigured());
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConfigOk) {
            setError("Cloud configuration not detected.");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            if (mode === 'signup') {
                const res = await CloudService.signUp(email, password, fullName, targetExam);
                if (res.error) throw new Error(res.error);

                // Switch to login mode on successful signup
                setMode('login');
                setSuccess("Registration successful. Access verified.");
            } else {
                const res = await CloudService.login(email, password);
                if (res.error) throw new Error(res.error);

                // Store session
                localStorage.setItem('supabase_token', res.session.access_token);

                // Fetch full profile
                const profile = await CloudService.getProfile(res.session.access_token);
                if (profile) {
                    onAuthSuccess(profile);
                } else {
                    throw new Error("Session established, but profile sync failed.");
                }
            }
        } catch (err: any) {
            setError(err.message || "Uplink failure.");
            console.error("Auth Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-200 relative overflow-hidden font-sans">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

            {onExit && (
                <button
                    onClick={onExit}
                    className="fixed top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800 transition-all text-xs font-bold uppercase tracking-widest z-20"
                >
                    <ArrowLeft size={16} />
                    Return to Landing
                </button>
            )}

            <div className="w-full max-w-[400px] z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full mb-2">
                        <ShieldCheck size={12} className={isConfigOk ? "text-emerald-500" : "text-amber-500"} />
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${isConfigOk ? "text-zinc-500" : "text-amber-500 font-bold"}`}>
                            {isConfigOk ? "Identity Uplink Ready" : "Local-Only Session Active"}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter text-zinc-100 uppercase font-mono">
                        Identity Gate
                    </h1>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest leading-relaxed">
                        Secure authorization for centralized<br />performance intelligence
                    </p>
                </div>

                {!isConfigOk && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2">
                        <div className="flex gap-3 items-start">
                            <DatabaseZap size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Setup Incomplete</h4>
                                <p className="text-[9px] text-amber-200/60 leading-relaxed uppercase tracking-tighter font-mono">
                                    Supabase credentials missing. Session will not persist across reloads.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="w-full py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Terminal size={12} />
                            {showDebug ? "Hide Diagnostics" : "Run Troubleshooter"}
                        </button>

                        {showDebug && (
                            <div className="p-3 bg-black rounded-lg border border-zinc-800 font-mono text-[9px] space-y-2 overflow-x-auto">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Uplink URL:</span>
                                    <span className={CloudService.isConfigured() ? "text-emerald-500" : "text-red-500"}>
                                        {CloudService.isConfigured() ? "VERIFIED" : "UNSET"}
                                    </span>
                                </div>
                                <div className="pt-2 text-zinc-600 italic">
                                    Verify environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden ring-1 ring-white/5">
                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        {mode === 'signup' && (
                            <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                                <div className="relative group">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 text-sm"
                                    />
                                </div>
                                <div className="relative group">
                                    <Target size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Objective (e.g. JEE 2026)"
                                        value={targetExam}
                                        onChange={(e) => setTargetExam(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
                            <input
                                required
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 text-sm font-mono"
                            />
                        </div>

                        <div className="relative group">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
                            <input
                                required
                                type="password"
                                placeholder="Access Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 text-sm font-mono"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl animate-in slide-in-from-top-1">
                                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-red-400 font-bold uppercase leading-tight">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl animate-in slide-in-from-top-1">
                                <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-emerald-400 font-bold uppercase leading-tight">{success}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-zinc-100 hover:bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 shadow-xl shadow-white/5 uppercase tracking-widest text-xs"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Decrypting...</span>
                                </div>
                            ) : (
                                <>
                                    {mode === 'login' ? 'Initiate Session' : 'Authorize Identity'}
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-zinc-800 flex flex-col gap-4">
                        <button
                            disabled={isLoading}
                            onClick={() => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setError("");
                                setSuccess("");
                            }}
                            className="text-zinc-500 hover:text-zinc-300 text-[10px] font-bold uppercase tracking-widest transition-colors text-center disabled:opacity-50"
                        >
                            {mode === 'login' ? "New User? Create Identity" : "Existing Identity? Log In"}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-zinc-800 uppercase tracking-widest">
                    <Lock size={12} className="opacity-50" />
                    E2E Encrypted Protocol
                </div>
            </div>
        </div>
    );
};
