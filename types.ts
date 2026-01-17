
import React from 'react';

export type AppMode =
  | 'home'
  | 'study'
  | 'lectures'
  | 'practice'
  | 'analysis'
  | 'workflow'
  | 'tools'
  | 'settings'
  | 'peer'
  | 'archive'
  | 'author'
  | 'auth';

export interface WorkspaceState {
  id: string;
  name: string;
  lastModified: string;
  elements: WorkspaceElement[];
  edges?: WorkflowEdge[];
}

export interface WorkspaceElement {
  id: string;
  type: 'note' | 'task' | 'topic' | 'resource' | 'milestone' | string;
  x: number;
  y: number;
  data: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'step';
}

export interface WorkflowNodeData {
  title: string;
  status: 'pending' | 'active' | 'completed';
  description?: string;
  tags?: string[];
  dueDate?: string;
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

// Question authoring types for offline-first system
export interface AuthoredQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  nested_tags?: Record<string, string>;
  question_image_url?: string;
  option_image_urls?: string[]; // Maps to options array index
  created_at: string;
  updated_at: string;
}

export interface QuestionBank {
  name: string;
  version: string;
  created_at: string;
  questions: AuthoredQuestion[];
  metadata: {
    author: string;
    description: string;
    encrypted: boolean;
  };
}

// =====================================================================
// ENHANCED QUESTION DATABASE TYPES
// =====================================================================

// Exam Paper metadata
export interface ExamPaper {
  id: string;
  year: number;
  exam_name: string; // 'JEE Main', 'JEE Advanced', 'NEET', etc.
  shift?: string; // 'Shift 1', 'Shift 2', etc.
  paper_number?: number; // For multi-paper exams
  total_marks: number;
  total_questions?: number;
  duration_minutes?: number;
  description?: string;
  created_at: string;
}

// Chapter/Topic structure (hierarchical)
export interface Chapter {
  id: string;
  subject: string;
  chapter_name: string;
  parent_chapter_id?: string; // For subtopics
  order_index: number;
  description?: string;
  created_at: string;
  // Computed fields
  subchapters?: Chapter[];
  question_count?: number;
}

// Tag for flexible categorization
export interface QuestionTag {
  id: string;
  name: string;
  category?: string; // 'difficulty', 'concept', 'source', 'skill', etc.
  color?: string; // For UI display
  created_at: string;
}

// Enhanced question with all relationships
export interface EnhancedQuestion extends AuthoredQuestion {
  author_id?: string;
  is_verified?: boolean;
  // Relationships
  exam_papers?: ExamPaper[];
  chapters?: Chapter[];
  question_tags?: QuestionTag[];
}

// Question-Paper link (with metadata)
export interface QuestionPaperLink {
  id: string;
  question_id: string;
  paper_id: string;
  question_number: number; // Position in paper
  marks: number;
  created_at: string;
}

// Question-Chapter link
export interface QuestionChapterLink {
  id: string;
  question_id: string;
  chapter_id: string;
  is_primary: boolean; // Mark one chapter as primary
  created_at: string;
}

// Filter options for querying questions
export interface QuestionFilter {
  subject?: string;
  difficulty?: string;
  year?: number;
  exam_name?: string;
  chapter_id?: string;
  tag_ids?: string[];
  search_text?: string;
  limit?: number;
  offset?: number;
}

// View mode for question browsing
export type QuestionViewMode = 'all' | 'chapter' | 'year';

// Statistics aggregations
export interface QuestionStats {
  total_questions: number;
  by_difficulty: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  by_subject: Record<string, number>;
  by_year?: Record<number, number>;
  by_chapter?: Record<string, number>;
}
