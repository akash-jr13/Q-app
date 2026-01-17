
// Dashboard aggregation component
import React from 'react';
import { TodayWidget, QuickResumeWidget, StatsWidget, FocusTimerWidget, FormulaWidget, CountdownWidget } from './DashboardWidgets';

export const DigitalCockpit: React.FC<{ onResume: () => void }> = ({ onResume }) => {
    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-theme-primary tracking-tight">Digital Cockpit</h2>
                        <p className="text-theme-secondary mt-1 font-mono text-sm">PERFORMANCE METRICS & FIELD OPERATIONS</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-lg uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            System Online
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Column 1 */}
                    <div className="space-y-6 flex flex-col h-full">
                        <div className="flex-1">
                            <TodayWidget />
                        </div>
                        <div className="flex-1">
                            <CountdownWidget />
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-6 flex flex-col h-full">
                        <div className="flex-[2]">
                            <QuickResumeWidget onResume={onResume} />
                        </div>
                        <div className="flex-1">
                            <FocusTimerWidget />
                        </div>
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-6 flex flex-col h-full">
                        <div className="flex-1">
                            <StatsWidget />
                        </div>
                        <div className="flex-[2]">
                            <FormulaWidget />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
