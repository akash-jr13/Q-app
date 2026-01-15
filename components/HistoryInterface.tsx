
import React, { useState, useEffect } from 'react';
import { Home, Trash2, Clock, Calendar, Trophy, Percent, Activity, ChevronRight, BarChart2, Loader2 } from 'lucide-react';
import { TestHistoryItem } from '../types';
import { dbStore } from '../utils/db';

interface HistoryInterfaceProps {
  onExit: () => void;
  onAnalyze: (data: any) => void;
}

export const HistoryInterface: React.FC<HistoryInterfaceProps> = ({ onExit, onAnalyze }) => {
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const stored = await dbStore.getAll<TestHistoryItem>('history');
      if (stored && stored.length > 0) {
        setHistory(stored.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        // Migration from localStorage
        const oldStored = localStorage.getItem('qt_history');
        if (oldStored) {
          const list = JSON.parse(oldStored);
          setHistory(list);
          for (const item of list) {
            await dbStore.set('history', item);
          }
          localStorage.removeItem('qt_history');
        }
      }
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (confirm("Are you sure you want to clear all test history? This cannot be undone.")) {
      try {
        await dbStore.clear('history');
        setHistory([]);
      } catch (e) {
        alert("Failed to clear history.");
      }
    }
  };

  const deleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dbStore.delete('history', id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      alert("Failed to delete entry.");
    }
  };

  const handleCardClick = (item: TestHistoryItem) => {
      if (item.storedData) {
          onAnalyze({
              testName: item.testName,
              questions: item.storedData.questions,
              answers: item.storedData.answers,
              questionTimes: item.storedData.questionTimes
          });
      } else {
          alert("Detailed analysis data is not available for this legacy entry.");
      }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-sm text-zinc-300 selection:bg-zinc-800 selection:text-zinc-100 relative">
      <div className="fixed inset-0 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />

      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-20 shadow-lg">
         <div className="max-w-5xl mx-auto flex justify-between items-center">
             <div className="flex items-center gap-4">
                 <button onClick={onExit} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors">
                     <Home size={16} />
                 </button>
                 <h1 className="text-lg font-bold text-zinc-100 tracking-wide">Test History</h1>
             </div>
             {history.length > 0 && (
                 <button 
                    onClick={clearHistory}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors"
                 >
                     <Trash2 size={14} /> <span className="hidden sm:inline">Clear Log</span>
                 </button>
             )}
         </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 relative z-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="animate-spin text-zinc-500" />
              <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Retrieving History...</span>
            </div>
          ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                  <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
                      <Clock size={24} className="opacity-50" />
                  </div>
                  <p className="font-mono text-sm">No test history found.</p>
              </div>
          ) : (
              <div className="grid gap-4">
                  {history.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleCardClick(item)}
                        className="group bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all shadow-sm relative overflow-hidden cursor-pointer"
                      >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-zinc-800/20 to-transparent rounded-bl-full pointer-events-none group-hover:from-zinc-800/40 transition-colors" />
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                              <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex items-start justify-between md:block">
                                      <h3 className="text-base md:text-lg font-bold text-zinc-100 truncate pr-2">{item.testName}</h3>
                                      <span className="md:hidden text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full whitespace-nowrap">
                                        {formatDate(item.timestamp).split(',')[0]}
                                      </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-zinc-500 font-mono">
                                      <span className="hidden md:flex items-center gap-1.5"><Calendar size={12} /> {formatDate(item.timestamp)}</span>
                                      <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDuration(item.timeTaken)}</span>
                                      {item.storedData && (
                                          <span className="flex items-center gap-1.5 text-emerald-500/80 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                              <BarChart2 size={10} /> Analysis Available
                                          </span>
                                      )}
                                  </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto">
                                  <div className="flex-1 md:flex-none grid grid-cols-3 gap-2 md:gap-8">
                                      <div className="text-center">
                                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                            <Trophy size={10} /> <span className="hidden sm:inline">Score</span>
                                          </div>
                                          <div className="text-lg md:text-xl font-mono font-bold text-emerald-400">
                                              {item.score}<span className="text-zinc-600 text-sm">/{item.totalMarks}</span>
                                          </div>
                                      </div>
                                      <div className="text-center border-l border-zinc-800 pl-2 md:pl-8">
                                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                            <Percent size={10} /> <span className="hidden sm:inline">Result</span>
                                          </div>
                                          <div className="text-lg md:text-xl font-mono font-bold text-zinc-200">
                                              {item.percentage}%
                                          </div>
                                      </div>
                                      <div className="text-center border-l border-zinc-800 pl-2 md:pl-8">
                                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                            <Activity size={10} /> <span className="hidden sm:inline">Accuracy</span>
                                          </div>
                                          <div className="text-lg md:text-xl font-mono font-bold text-blue-400">
                                              {item.accuracy}%
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 md:border-none md:pl-0">
                                    <div className="hidden md:block text-zinc-600 group-hover:text-zinc-300 transition-colors">
                                        <ChevronRight size={20} />
                                    </div>
                                    <button 
                                        onClick={(e) => deleteItem(item.id, e)}
                                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors md:ml-2"
                                        title="Delete Entry"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${parseFloat(item.percentage) >= 75 ? 'bg-emerald-500' : parseFloat(item.percentage) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${item.percentage}%` }}
                              />
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};
