
import React, { useState, useEffect } from 'react';
import { Home, Layers, ChevronRight, FileText, Clock, Trophy, ArrowLeft, Play, Lock, Rocket, Book, Loader2 } from 'lucide-react';
import { Series } from '../types';
import { dbStore } from '../utils/db';

interface TestSeriesInterfaceProps {
  onExit: () => void;
  onStartTest: (name: string, data: string) => void;
}

export const TestSeriesInterface: React.FC<TestSeriesInterfaceProps> = ({ onExit, onStartTest }) => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    setIsLoading(true);
    try {
      const stored = await dbStore.getAll<Series>('series');
      setSeriesList(stored || []);
    } catch (e) {
      console.error("Failed to load series", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestClick = (test: any) => {
      if (!test.isEnabled) return;
      
      if (test.packageData) {
          onStartTest(test.title, test.packageData);
      } else {
          alert(`The test engine for ${test.title} requires an uploaded package. This entry has no package attached yet.`);
      }
  };

  const getIconComponent = (name: string) => {
    switch (name) {
      case 'Trophy': return Trophy;
      case 'Layers': return Layers;
      case 'FileText': return FileText;
      case 'Rocket': return Rocket;
      case 'Book': return Book;
      default: return Layers;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-300 selection:bg-zinc-800 selection:text-zinc-100 relative flex flex-col">
       <div className="fixed inset-0 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />
       
       <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-20 shadow-lg flex justify-between items-center">
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => selectedSeries ? setSelectedSeries(null) : onExit()} 
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-700/50"
                 >
                     {selectedSeries ? <ArrowLeft size={16} /> : <Home size={16} />}
                 </button>
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 border border-zinc-700/50">
                        <Layers size={16} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-zinc-100 tracking-wide leading-tight uppercase font-mono">Q-Test Series</h1>
                        {selectedSeries && <p className="text-[10px] text-zinc-500 font-mono uppercase truncate max-w-[150px]">{selectedSeries.title}</p>}
                    </div>
                 </div>
            </div>
       </div>

       <div className="flex-1 p-4 md:p-8 relative z-10 max-w-6xl mx-auto w-full">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={32} className="animate-spin text-zinc-500" />
                    <span className="text-zinc-500 font-mono text-xs uppercase">Connecting to Database...</span>
                </div>
            ) : seriesList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600 font-mono text-sm uppercase">
                    No active test series available.
                </div>
            ) : !selectedSeries ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {seriesList.map((series) => {
                        const IconComp = getIconComponent(series.iconName);
                        return (
                            <button 
                                key={series.id}
                                onClick={() => setSelectedSeries(series)}
                                className="group flex flex-col bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 text-left transition-all hover:shadow-2xl hover:shadow-zinc-900/50 hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-zinc-700/10 transition-colors" />
                                <div className="mb-4 w-12 h-12 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <IconComp size={24} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-white">{series.title}</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-6 h-8 line-clamp-2">{series.description}</p>
                                <div className="mt-auto flex items-center justify-between w-full pt-4 border-t border-zinc-800/50">
                                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                                        {series.tests.length} TESTS
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-500 group-hover:text-zinc-200 group-hover:bg-zinc-800 transition-colors">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-6">
                    <div className="flex flex-col gap-2 mb-8">
                         <h2 className="text-3xl font-bold text-zinc-100">{selectedSeries.title}</h2>
                         <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">{selectedSeries.description}</p>
                    </div>
                    <div className="grid gap-3">
                        {selectedSeries.tests.map((test, idx) => {
                            const isAvailable = test.isEnabled && !!test.packageData;
                            return (
                                <div 
                                    key={test.id}
                                    className={`group flex flex-col sm:flex-row sm:items-center justify-between border p-4 rounded-xl transition-all ${
                                        isAvailable 
                                        ? 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-default' 
                                        : 'bg-zinc-900/20 border-zinc-900 opacity-60 grayscale'
                                    }`}
                                >
                                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold font-mono text-xs shrink-0">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm transition-colors ${isAvailable ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-600'}`}>
                                                {test.title}
                                                {!test.isEnabled && <span className="ml-2 text-[10px] bg-red-950/30 text-red-500 px-2 py-0.5 rounded border border-red-900/30 font-mono uppercase tracking-widest">Disabled</span>}
                                                {test.isEnabled && !test.packageData && <span className="ml-2 text-[10px] bg-amber-950/30 text-amber-500 px-2 py-0.5 rounded border border-amber-900/30 font-mono uppercase tracking-widest">No Package</span>}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {test.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-zinc-800/50 text-zinc-500 rounded border border-zinc-800 uppercase font-mono tracking-tighter">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-14 sm:pl-0">
                                        <div className="flex gap-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {test.duration}</span>
                                            <span className="flex items-center gap-1.5"><FileText size={12} /> {test.questions} Qs</span>
                                            <span className="flex items-center gap-1.5"><Trophy size={12} /> {test.totalMarks} Marks</span>
                                        </div>
                                        <button 
                                            onClick={() => handleTestClick(test)}
                                            disabled={!isAvailable}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98] uppercase tracking-widest shadow-lg ${
                                                isAvailable 
                                                ? 'bg-zinc-100 hover:bg-white text-black shadow-white/5' 
                                                : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            {isAvailable ? (
                                                <>
                                                    <Play size={12} fill="currentColor" />
                                                    Start
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={12} />
                                                    Locked
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};
