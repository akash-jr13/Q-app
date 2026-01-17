
import React from 'react';

export type AppMode =
  | 'home'
  | 'study'
  | 'practice'
  | 'analysis'
  | 'tools'
  | 'settings'
  | 'auth';

export interface WorkspaceState {
  id: string;
  name: string;
  lastModified: string;
  elements: WorkspaceElement[];
}

export interface WorkspaceElement {
  id: string;
  type: string;
  x: number;
  y: number;
  data: any;
}

// Difficulty levels for questions
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

// Skill tags for classification
export type SkillTag = 'Memory' | 'Calculation' | 'Logic' | 'Theory';

// Marking scheme structure
export interface MarkingScheme {
  correct: number;
  incorrect: number;
  partial?: number;
}

// Template for creating new questions
export interface QuestionTemplate {
  subject: string;
  section: string;
  questionNumber: number;
  type: string;
  difficulty: DifficultyLevel;
  topic: string;
  skillTag: SkillTag | string;
  idealTime: number;
  optionsCount: string;
  markingScheme: MarkingScheme;
  correctOption: string;
}

// Full question data with positioning on PDF
export interface QuestionData extends QuestionTemplate {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
}

// Interaction modes for the PDF mapper
export type InteractionMode = 'crop' | 'edit';

// Props for the Accordion component
export interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
}

// Context type used by the AppProvider in context/AppContext.tsx
export interface AppContextType {
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  pdfDocument: any;
  setPdfDocument: (doc: any) => void;
  scale: number;
  setScale: (scale: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  numPages: number;
  setNumPages: (num: number) => void;
  questions: QuestionData[];
  selectedQuestionId: string | null;
  addQuestion: (q: QuestionData) => void;
  updateQuestion: (id: string, updates: Partial<QuestionData>) => void;
  deleteQuestion: (id: string) => void;
  selectQuestion: (id: string | null) => void;
  questionTemplate: QuestionTemplate;
  setQuestionTemplate: React.Dispatch<React.SetStateAction<QuestionTemplate>>;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  testName: string;
  setTestName: (name: string) => void;
  onExit: () => void;
}

// Item in the test attempt history
export interface TestHistoryItem {
  id: string;
  testName: string;
  timestamp: string;
  score: number;
  totalMarks: number;
  percentage: string;
  accuracy: number;
  timeTaken: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  storedData?: {
    questions: any[];
    answers: Record<string, string>;
    questionTimes: Record<string, number>;
    mistakes?: Record<string, any>;
  };
}

// Individual test in a series
export interface TestSeriesItem {
  id: string;
  title: string;
  duration: string;
  questions: number;
  totalMarks: number;
  tags: string[];
  isEnabled: boolean;
  packageData?: string;
  packageName?: string;
}

// Test series collection
export interface Series {
  id: string;
  title: string;
  description: string;
  totalTests: number;
  iconName: 'Trophy' | 'Layers' | 'FileText' | 'Rocket' | 'Book';
  tests: TestSeriesItem[];
}
