
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppContextType, QuestionData, InteractionMode, QuestionTemplate } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; onExit: () => void }> = ({ children, onExit }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('crop');
  const [testName, setTestName] = useState('');

  const [questionTemplate, setQuestionTemplate] = useState<QuestionTemplate>({
    subject: '',
    section: '',
    questionNumber: 1,
    type: 'MCQ',
    difficulty: 'Medium',
    topic: '',
    skillTag: 'Logic',
    idealTime: 120, // 2 minutes default
    optionsCount: '4',
    markingScheme: { correct: 4, incorrect: -1, partial: 0 },
    correctOption: ''
  });

  const addQuestion = (q: QuestionData) => {
    setQuestions(prev => [...prev, q]);
    setSelectedQuestionId(q.id);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionData>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    const questionToDelete = questions.find(q => q.id === id);
    if (questionToDelete) {
      const deletedNumber = questionToDelete.questionNumber;
      const updatedQuestions = questions
        .filter(q => q.id !== id)
        .map(q => {
          if (q.questionNumber > deletedNumber) {
            return { ...q, questionNumber: q.questionNumber - 1 };
          }
          return q;
        });
      setQuestions(updatedQuestions);
      const maxNumber = updatedQuestions.length > 0 
        ? Math.max(...updatedQuestions.map(q => q.questionNumber)) 
        : 0;
      setQuestionTemplate(prev => ({ ...prev, questionNumber: maxNumber + 1 }));
    } else {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
    if (selectedQuestionId === id) setSelectedQuestionId(null);
  };

  const selectQuestion = (id: string | null) => {
    setSelectedQuestionId(id);
    if (id) {
        const q = questions.find(qu => qu.id === id);
        if (q) setCurrentPage(q.page);
    }
  };

  return (
    <AppContext.Provider
      value={{
        pdfFile,
        setPdfFile,
        pdfDocument,
        setPdfDocument,
        scale,
        setScale,
        currentPage,
        setCurrentPage,
        numPages,
        setNumPages,
        questions,
        selectedQuestionId,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        selectQuestion,
        questionTemplate,
        setQuestionTemplate,
        interactionMode,
        setInteractionMode,
        testName,
        setTestName,
        onExit
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
