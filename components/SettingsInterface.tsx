
import React from 'react';
import { UserProfile } from '../utils/cloud';
import { useNavigate } from 'react-router-dom';

interface SettingsInterfaceProps {
    userProfile: UserProfile | null;
    setUserProfile: (profile: UserProfile | null) => void;
}

export const SettingsInterface: React.FC<SettingsInterfaceProps> = ({ userProfile, setUserProfile }) => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.removeItem('supabase_token');
        setUserProfile(null);
        navigate('/auth');
    };

    return (
        <main className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-widest font-mono text-white">Profile Settings</h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 uppercase text-xs font-bold">Email</span>
                        <span className="font-mono text-white">{userProfile?.email}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 uppercase text-xs font-bold">Full Name</span>
                        <span className="text-white">{userProfile?.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 uppercase text-xs font-bold">Target Exam</span>
                        <span className="text-emerald-500 font-bold">{userProfile?.targetExam}</span>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-800 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Developer Zone</h3>
                    <button
                        onClick={() => navigate('/archive')}
                        className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-all group"
                    >
                        <span className="text-zinc-300 font-mono text-sm group-hover:text-emerald-500 transition-colors">{`>>`} ACCESS QUESTION ARCHIVE</span>
                        <span className="text-[10px] font-bold bg-zinc-900 px-2 py-1 rounded text-zinc-500 border border-zinc-800 group-hover:border-emerald-500/50 group-hover:text-emerald-500">ADMIN ONLY</span>
                    </button>
                </div>

                <button
                    onClick={handleSignOut}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all"
                >
                    Sign Out / Terminate Session
                </button>
            </div>
        </main>
    );
};
