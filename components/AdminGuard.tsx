import React, { useState, useEffect } from 'react';
import { Lock, KeyRound } from 'lucide-react';

interface AdminGuardProps {
    children: React.ReactNode;
    onExit: () => void;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onExit }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        // Check session storage for temporary admin access
        const sessionAuth = sessionStorage.getItem('admin_authenticated');
        if (sessionAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded password for local use
        if (password === 'admin123' || password === 'root') {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_authenticated', 'true');
            setError(false);
        } else {
            setError(true);
            setPassword('');
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="absolute inset-0 z-50 bg-theme-primary flex items-center justify-center transition-colors">
            <div className="max-w-sm w-full p-8 rounded-[2.5rem] bg-theme-secondary border border-theme-primary shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-theme-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-theme-primary shadow-inner">
                        <Lock size={24} className="text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-bold text-theme-primary tracking-tight">Restricted Area</h2>
                    <p className="text-[11px] text-theme-secondary uppercase tracking-widest font-bold">
                        Admin Authorization Required
                    </p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div className="space-y-1">
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={16} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Access Key"
                                className="w-full bg-theme-panel border border-theme-primary rounded-2xl py-3.5 pl-11 pr-4 text-sm text-theme-primary placeholder:text-theme-secondary opacity-80 outline-none focus:border-emerald-500/50 transition-all font-mono"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest pl-1">
                                Access Denied: Invalid Key
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-95"
                    >
                        Authenticate
                    </button>

                    <button
                        type="button"
                        onClick={onExit}
                        className="w-full py-2 text-theme-secondary hover:text-theme-primary text-[10px] font-bold uppercase tracking-widest transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};
