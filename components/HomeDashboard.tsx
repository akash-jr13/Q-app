
import React, { useState } from 'react';
import { Responsive, WidthProvider, Layout, ResponsiveLayouts } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
    TodayWidget,
    QuickResumeWidget,
    FormulaWidget,
    StatsWidget,
    CountdownWidget,
    FocusTimerWidget
} from './DashboardWidgets';
import { LayoutDashboard, Save, Plus } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_LAYOUTS: ResponsiveLayouts = {
    lg: [
        { i: 'today', x: 0, y: 0, w: 2, h: 4 },
        { i: 'resume', x: 2, y: 0, w: 2, h: 2 },
        { i: 'stats', x: 4, y: 0, w: 2, h: 4 },
        { i: 'formula', x: 2, y: 2, w: 2, h: 2 },
        { i: 'countdown', x: 6, y: 0, w: 2, h: 4 },
        { i: 'focustimmer', x: 8, y: 0, w: 2, h: 4 },
    ],
};

const EXAM_LAYOUTS: ResponsiveLayouts = {
    lg: [
        { i: 'countdown', x: 0, y: 0, w: 4, h: 4 },
        { i: 'today', x: 4, y: 0, w: 2, h: 4 },
        { i: 'formula', x: 6, y: 0, w: 2, h: 4 },
        { i: 'stats', x: 8, y: 0, w: 2, h: 4 },
        { i: 'resume', x: 0, y: 4, w: 4, h: 2 },
        { i: 'focustimmer', x: 4, y: 4, w: 4, h: 4 },
    ],
};

export const HomeDashboard: React.FC<{ onResume: () => void }> = ({ onResume }) => {
    const [layouts, setLayouts] = useState<ResponsiveLayouts>(() => {
        const saved = localStorage.getItem('understood_dashboard_layouts');
        return saved ? JSON.parse(saved) : DEFAULT_LAYOUTS;
    });

    const [currentLayoutName, setCurrentLayoutName] = useState<'Daily' | 'Exam Week'>('Daily');

    const saveLayout = (newLayouts: ResponsiveLayouts) => {
        setLayouts(newLayouts);
        localStorage.setItem('understood_dashboard_layouts', JSON.stringify(newLayouts));
    };

    const setView = (name: 'Daily' | 'Exam Week') => {
        setCurrentLayoutName(name);
        const newL = name === 'Daily' ? DEFAULT_LAYOUTS : EXAM_LAYOUTS;
        setLayouts(newL);
        localStorage.setItem('understood_dashboard_layouts', JSON.stringify(newL));
    };

    const onLayoutChange = (_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
        saveLayout(allLayouts);
    };

    const widgetMap: { [key: string]: React.ReactNode } = {
        'today': <TodayWidget />,
        'resume': <QuickResumeWidget onResume={onResume} />,
        'stats': <StatsWidget />,
        'formula': <FormulaWidget />,
        'countdown': <CountdownWidget />,
        'focustimmer': <FocusTimerWidget />,
    };

    return (
        <div className="w-full h-full bg-[#000000] text-[#e8eaed] p-10 overflow-y-auto">
            {/* Dashboard Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#3c4043]">
                        <LayoutDashboard size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Operations Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-medium tracking-tight text-white flex items-center gap-3">
                        Digital Cockpit
                        <span className="px-2 py-0.5 bg-[#1e1e1e] text-[9px] font-bold text-[#9aa0a6] rounded border border-white/5 uppercase tracking-widest">v4.0.0</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2 bg-[#1e1e1e]/50 p-1.5 rounded-xl border border-white/5">
                    <button
                        onClick={() => setView('Daily')}
                        className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all uppercase tracking-widest ${currentLayoutName === 'Daily' ? 'bg-[#3c4043] text-white shadow-lg' : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                            }`}
                    >
                        Daily Mode
                    </button>
                    <button
                        onClick={() => setView('Exam Week')}
                        className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all uppercase tracking-widest ${currentLayoutName === 'Exam Week' ? 'bg-[#3c4043] text-white shadow-lg' : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                            }`}
                    >
                        Exam Focus
                    </button>
                    <div className="w-[1px] h-4 bg-white/5 mx-2" />
                    <button
                        className="p-2 text-[#3c4043] hover:text-[#e8eaed] transition-colors"
                        title="Save Layout"
                    >
                        <Save size={16} />
                    </button>
                    <button
                        className="p-2 text-[#3c4043] hover:text-emerald-500 transition-colors"
                        title="Add Widget"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Grid Canvas */}
            <div className="relative -mx-4 pb-20">
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={100}
                    draggableHandle=".group" // The entire widget header area is usually a drag handle if we use the parent component correctly, but here we'll allow moving from the top
                    onLayoutChange={onLayoutChange}
                    margin={[24, 24]}
                >
                    {Object.keys(widgetMap).map((key) => (
                        <div key={key} className="relative group/grid-item">
                            {widgetMap[key]}
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>

            {/* Persistence Indicator */}
            <div className="fixed bottom-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-[#121212] border border-white/5 rounded-full text-[9px] font-bold text-[#3c4043] uppercase tracking-widest pointer-events-none">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                Configuration Synced to Neural Link
            </div>
        </div>
    );
};
