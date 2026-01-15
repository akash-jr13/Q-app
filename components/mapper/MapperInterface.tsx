import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MainPanel } from './MainPanel';
import { useApp } from '../../context/AppContext';

export const MapperInterface: React.FC = () => {
  const { pdfFile, questions } = useApp();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Prevent reload if a PDF is loaded or questions have been created
      if (pdfFile || questions.length > 0) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pdfFile, questions]);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-200 font-sans selection:bg-white/20 selection:text-white overflow-hidden">
      <Sidebar />
      <MainPanel />
    </div>
  );
};