
import React, { useState, useEffect } from 'react';
import { Github, Loader2, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
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
                setMode('login');
                setSuccess("Account created. Please verify email.");
            } else {
                const res = await CloudService.login(email, password);
                if (res.error) throw new Error(res.error);

                localStorage.setItem('supabase_token', res.session.access_token);
                const profile = await CloudService.getProfile(res.session.access_token);

                if (profile) onAuthSuccess(profile);
                else throw new Error("Profile sync failed.");
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-zinc-800/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Split Card Container */}
            <div className="w-full max-w-[1000px] h-[600px] bg-[#09090b] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex relative z-10 animate-in fade-in zoom-in-95 duration-500 ring-1 ring-white/5">

                {/* Left Side - Visual Branding */}
                <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-10 overflow-hidden bg-black">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/50 via-zinc-950 to-black z-0" />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay" />

                    {/* Logo/Header */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 22H22L12 2Z" />
                                </svg>
                            </div>
                            <span className="font-bold text-lg tracking-tight">Understood</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl font-bold leading-tight">
                            Synthesize your learning journey.
                        </h2>
                        <div className="flex gap-2">
                            <div className="h-1 w-8 bg-white rounded-full" />
                            <div className="h-1 w-2 bg-zinc-800 rounded-full" />
                            <div className="h-1 w-2 bg-zinc-800 rounded-full" />
                        </div>
                    </div>

                    {/* Bottom Element */}
                    <div className="relative z-10 text-xs text-zinc-500 font-mono uppercase tracking-widest">
                        Performance Intelligence v1.0
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-zinc-900">
                    <div className="max-w-[360px] mx-auto w-full space-y-8">

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {mode === 'login' ? 'Welcome back' : 'Create an account'}
                            </h2>
                            <p className="text-sm text-zinc-400">
                                {mode === 'login' ? 'Enter your details to access your workspace.' : 'Enter your details to get started.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-left-2">
                                    <input
                                        required
                                        type="text"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm placeholder:text-zinc-600"
                                    />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Target (e.g. JEE)"
                                        value={targetExam}
                                        onChange={(e) => setTargetExam(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm placeholder:text-zinc-600"
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <input
                                    required
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm placeholder:text-zinc-600"
                                />
                                <div className="relative">
                                    <input
                                        required
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            {mode === 'signup' && (
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded border-zinc-800 bg-zinc-900 text-white focus:ring-0 w-4 h-4" id="terms" required />
                                    <label htmlFor="terms" className="text-xs text-zinc-400 select-none">I agree to the <span className="underline cursor-pointer hover:text-white">Terms & Conditions</span></label>
                                </div>
                            )}

                            {error && (
                                <div className="text-red-400 text-xs flex items-center gap-2 animate-in slide-in-from-top-1">
                                    <AlertCircle size={12} /> {error}
                                </div>
                            )}
                            {success && (
                                <div className="text-emerald-400 text-xs flex items-center gap-2 animate-in slide-in-from-top-1">
                                    <CheckCircle size={12} /> {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold h-10 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : (mode === 'login' ? 'Log in' : 'Create account')}
                            </button>
                        </form>

                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-zinc-800/50" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                    <span className="bg-zinc-900 px-2 text-zinc-600">Or register with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors text-xs font-medium text-zinc-300">
                                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-blue-500" />
                                    Google
                                </button>
                                <button className="flex items-center justify-center gap-2 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors text-xs font-medium text-zinc-300">
                                    <Github size={14} />
                                    Apple
                                </button>
                            </div>
                        </div>

                        <div className="text-center pt-2">
                            <span className="text-sm text-zinc-500">
                                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            </span>
                            <button
                                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                                className="text-sm text-white hover:underline font-medium"
                            >
                                {mode === 'login' ? 'Sign up' : 'Log in'}
                            </button>
                        </div>

                        {onExit && (
                            <button
                                onClick={onExit}
                                className="w-full text-xs text-zinc-600 hover:text-zinc-400 flex items-center justify-center gap-2 mt-4 transition-colors"
                            >
                                <ShieldCheck size={12} />
                                Continue as Guest
                            </button>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
