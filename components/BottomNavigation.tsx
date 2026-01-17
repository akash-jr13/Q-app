
import React from 'react';
import {
    Home,
    BookOpen,
    Layers,
    BarChart2,
    PenTool
} from 'lucide-react';
import { AppMode } from '../types';

interface BottomNavigationProps {
    activeMode: AppMode;
    setMode: (mode: AppMode) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeMode, setMode }) => {
    const navItems = [
        { id: 'home' as AppMode, label: 'Home', icon: Home },
        { id: 'study' as AppMode, label: 'Study', icon: BookOpen },
        { id: 'practice' as AppMode, label: 'Practice', icon: Layers },
        { id: 'analysis' as AppMode, label: 'Analysis', icon: BarChart2 },
        { id: 'tools' as AppMode, label: 'Tools', icon: PenTool },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center z-[100] pointer-events-none pb-6 px-4 md:pb-8">
            <nav className="h-16 w-full max-w-lg bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.05] rounded-2xl flex items-center justify-around pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:border-white/10">
                {navItems.map((item) => {
                    const isActive = activeMode === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setMode(item.id)}
                            className="flex flex-col items-center justify-center gap-1 group relative flex-1"
                        >
                            <item.icon
                                size={18}
                                className={`transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-[#3c4043] group-hover:text-[#9aa0a6] group-hover:scale-105'
                                    }`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`text-[8px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${isActive ? 'text-white' : 'text-[#3c4043] group-hover:text-[#9aa0a6]'
                                }`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute -bottom-1.5 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
