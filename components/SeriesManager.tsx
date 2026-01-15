
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, ArrowLeft, Layers, Save, X, Trophy, FileText, Rocket, Book, AlertTriangle, ToggleLeft, ToggleRight, FileUp, FileCheck, Loader2 } from 'lucide-react';
import { Series, TestSeriesItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../utils/db';

interface SeriesManagerProps {
  onExit: () => void;
}

const ICON_OPTIONS = ['Trophy', 'Layers', 'FileText', 'Rocket', 'Book'];

export const SeriesManager: React.FC<SeriesManagerProps> = ({ onExit }) => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTestIdForUpload, setActiveTestIdForUpload] = useState<string | null>(null);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    setIsLoading(true);
    try {
      const stored = await dbStore.getAll<Series>('series');
      if (stored && stored.length > 0) {
        setSeriesList(stored);
      } else {
        // Handle migration from localStorage if exists
        const oldStored = localStorage.getItem('qt_series');
        if (oldStored) {
          const list = JSON.parse(oldStored);
          setSeriesList(list);
          for (const s of list) {
            await dbStore.set('series', s);
          }
          localStorage.removeItem('qt_series');
        }
      }
    } catch (e) {
      console.error("Failed to load series", e);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!seriesToDelete) return;
    try {
      await dbStore.delete('series', seriesToDelete);
      setSeriesList(prev => prev.filter(s => s.id !== seriesToDelete));
      setSeriesToDelete(null);
    } catch (e) {
      alert("Failed to delete series.");
    }
  };

  const startEdit = (series?: Series) => {
    setEditingSeries(series ? JSON.parse(JSON.stringify(series)) : {
      id: uuidv4(),
      title: '',
      description: '',
      totalTests: 0,
      iconName: 'Layers',
      tests: []
    });
    setIsModalOpen(true);
  };

  const saveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries) return;

    const updatedSeries = { ...editingSeries, totalTests: editingSeries.tests.length };
    try {
      await dbStore.set('series', updatedSeries);
      setSeriesList(prev => {
        const index = prev.findIndex(s => s.id === updatedSeries.id);
        if (index > -1) {
          const newList = [...prev];
          newList[index] = updatedSeries;
          return newList;
        }
        return [...prev, updatedSeries];
      });
      setIsModalOpen(false);
    } catch (e) {
      alert("Failed to save series. The data might be too large even for IndexedDB, or your disk is full.");
    }
  };

  const addTestToSeries = () => {
    if (!editingSeries) return;
    const newTest: TestSeriesItem = {
      id: uuidv4(),
      title: `New Test ${editingSeries.tests.length + 1}`,
      duration: '180 min',
      questions: 90,
      totalMarks: 300,
      tags: ['New'],
      isEnabled: false
    };
    setEditingSeries({
      ...editingSeries,
      tests: [...editingSeries.tests, newTest]
    });
  };

  const updateTestInSeries = (testId: string, updates: Partial<TestSeriesItem>) => {
    if (!editingSeries) return;
    setEditingSeries({
      ...editingSeries,
      tests: editingSeries.tests.map(t => t.id === testId ? { ...t, ...updates } : t)
    });
  };

  const removeTestFromSeries = (testId: string) => {
    if (!editingSeries) return;
    setEditingSeries({
      ...editingSeries,
      tests: editingSeries.tests.filter(t => t.id !== testId)
    });
  };

  const toggleTestEnabled = (testId: string) => {
    if (!editingSeries) return;
    const test = editingSeries.tests.find(t => t.id === testId);
    if (!test) return;
    updateTestInSeries(testId, { isEnabled: !test.isEnabled });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTestIdForUpload || !editingSeries) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      updateTestInSeries(activeTestIdForUpload, {
        packageData: base64String,
        packageName: file.name
      });
      setActiveTestIdForUpload(null);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileUpload = (testId: string) => {
    setActiveTestIdForUpload(testId);
    fileInputRef.current?.click();
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Trophy': return <Trophy size={16} />;
      case 'Layers': return <Layers size={16} />;
      case 'FileText': return <FileText size={16} />;
      case 'Rocket': return <Rocket size={16} />;
      case 'Book': return <Book size={16} />;
      default: return <Layers size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans p-4 md:p-8 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <input
        type="file"
        accept=".zip"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="w-full max-w-[98%] mx-auto space-y-6 md:space-y-8 relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-center bg-zinc-900 p-4 md:p-6 rounded-2xl border border-zinc-800 shadow-xl gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onExit}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-zinc-100 uppercase tracking-widest font-mono">Series Manager</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Manage student practice catalogs</p>
            </div>
          </div>
          <button
            onClick={() => startEdit()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg uppercase tracking-widest active:scale-[0.98]"
          >
            <Plus size={16} /> New Series
          </button>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="animate-spin text-zinc-500" />
            <span className="text-zinc-500 font-mono text-xs uppercase">Loading Catalog...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {seriesList.map(series => (
              <div
                key={series.id}
                className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all flex flex-col group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800 text-zinc-400 group-hover:border-zinc-600 transition-colors">
                    {getIcon(series.iconName)}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(series); }}
                      className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all active:scale-90"
                      title="Edit Series"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSeriesToDelete(series.id); }}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all active:scale-90"
                      title="Delete Series"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-1 truncate">{series.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2 mb-6 h-8 overflow-hidden">{series.description}</p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-800">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    {series.tests.length} Tests
                  </span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-tighter font-mono">{series.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {seriesToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2 uppercase tracking-widest">Delete Series?</h3>
            <p className="text-xs text-zinc-500 mb-8 font-mono uppercase tracking-tighter leading-relaxed">
              Are you sure you want to remove this series? This action will permanently delete all associated metadata for this catalog.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSeriesToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-bold text-[10px] transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] transition-all uppercase tracking-widest shadow-lg shadow-red-900/20 active:scale-95"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && editingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <header className="p-6 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
              <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-widest font-mono">
                {seriesList.some(s => s.id === editingSeries.id) ? 'Edit Series' : 'Create Series'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-200 p-1 hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
            </header>

            <form onSubmit={saveSeries} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Series Title</label>
                    <input
                      required
                      value={editingSeries.title}
                      onChange={e => setEditingSeries({ ...editingSeries, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-500 transition-all font-mono text-zinc-200"
                      placeholder="e.g. JEE Mains Mock Series"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setEditingSeries({ ...editingSeries, iconName: name as any })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${editingSeries.iconName === name ? 'bg-zinc-100 border-zinc-100 text-black shadow-lg shadow-white/5 scale-105' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                        >
                          {getIcon(name)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea
                    rows={4}
                    value={editingSeries.description}
                    onChange={e => setEditingSeries({ ...editingSeries, description: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-500 transition-all font-mono text-zinc-200 resize-none"
                    placeholder="Enter a short summary for students..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tests in Series ({editingSeries.tests.length})</h3>
                  <button
                    type="button"
                    onClick={addTestToSeries}
                    className="flex items-center gap-1.5 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors uppercase"
                  >
                    <Plus size={12} /> Add Test
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {editingSeries.tests.map((test) => (
                    <div key={test.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-[9px] font-bold text-zinc-600 uppercase mb-1 block">Title</label>
                        <input
                          value={test.title}
                          onChange={e => updateTestInSeries(test.id, { title: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-zinc-600 transition-colors"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] font-bold text-zinc-600 uppercase mb-1 block">Duration</label>
                        <input
                          value={test.duration}
                          onChange={e => updateTestInSeries(test.id, { duration: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-zinc-600 transition-colors font-mono"
                        />
                      </div>
                      <div className="w-16">
                        <label className="text-[9px] font-bold text-zinc-600 uppercase mb-1 block">Qs</label>
                        <input
                          type="number"
                          value={test.questions}
                          onChange={e => updateTestInSeries(test.id, { questions: parseInt(e.target.value) || 0 })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-zinc-600 transition-colors font-mono text-center"
                        />
                      </div>
                      <div className="w-16">
                        <label className="text-[9px] font-bold text-zinc-600 uppercase mb-1 block">Marks</label>
                        <input
                          type="number"
                          value={test.totalMarks}
                          onChange={e => updateTestInSeries(test.id, { totalMarks: parseInt(e.target.value) || 0 })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-zinc-600 transition-colors font-mono text-center"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col items-center">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase mb-1 block">Status</label>
                          <button
                            type="button"
                            onClick={() => toggleTestEnabled(test.id)}
                            title={test.isEnabled ? "Disable Test" : "Enable Test"}
                            className={`p-2 rounded-lg border transition-all ${test.isEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}
                          >
                            {test.isEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                        </div>

                        <div className="flex flex-col items-center">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase mb-1 block">Package</label>
                          <button
                            type="button"
                            onClick={() => triggerFileUpload(test.id)}
                            title={test.packageData ? `Update Package: ${test.packageName}` : "Attach Test Package (.zip)"}
                            className={`p-2 rounded-lg border transition-all ${test.packageData ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}
                          >
                            {test.packageData ? <FileCheck size={18} /> : <FileUp size={18} />}
                          </button>
                        </div>

                        <div className="flex flex-col items-center">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase mb-1 block">Del</label>
                          <button
                            type="button"
                            onClick={() => removeTestFromSeries(test.id)}
                            className="p-2 text-zinc-600 hover:text-red-400 transition-colors active:scale-90"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {editingSeries.tests.length === 0 && (
                    <div className="py-10 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-600 font-mono text-xs uppercase tracking-widest">
                      No tests added to this series yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-zinc-900 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-zinc-100 hover:bg-white text-black px-10 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                  <Save size={16} /> Save Series
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
