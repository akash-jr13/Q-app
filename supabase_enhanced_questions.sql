-- =====================================================================
-- ENHANCED QUESTION DATABASE SCHEMA
-- Multi-Dimensional Organization (Chapter-wise + Year-wise)
-- =====================================================================
-- This schema allows questions to be organized by BOTH exam papers AND 
-- chapters without data duplication, using junction tables for 
-- many-to-many relationships.
-- =====================================================================

-- =====================================================================
-- STEP 1: CORE TABLES
-- =====================================================================

-- 1.1 Enhanced Questions Table (extends existing)
-- This is the single source of truth for all questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options: ["Option A", "Option B", ...]
  correct_index INT NOT NULL CHECK (correct_index >= 0 AND correct_index < 10),
  explanation TEXT,
  subject TEXT NOT NULL,
  topic TEXT, -- Legacy field, kept for backward compatibility
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags TEXT[] DEFAULT '{}', -- Legacy tags, migrated to question_tags table
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Exam Papers Table
-- Stores metadata about exam papers (year, exam name, shift, etc.)
CREATE TABLE IF NOT EXISTS public.exam_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INT NOT NULL,
  exam_name TEXT NOT NULL, -- 'JEE Main', 'JEE Advanced', 'NEET', etc.
  shift TEXT, -- 'Shift 1', 'Shift 2', etc.
  paper_number INT, -- For multi-paper exams (Paper 1, Paper 2)
  total_marks INT NOT NULL DEFAULT 300,
  total_questions INT,
  duration_minutes INT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(year, exam_name, shift, paper_number)
);

-- 1.3 Chapters Table
-- Hierarchical structure for subjects → chapters → subtopics
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  parent_chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subject, chapter_name, parent_chapter_id)
);

-- 1.4 Tags Table
-- Reusable tag system for flexible categorization
CREATE TABLE IF NOT EXISTS public.question_tags_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- 'difficulty', 'concept', 'source', 'skill', etc.
  color TEXT, -- For UI display
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- STEP 2: JUNCTION TABLES (Many-to-Many Relationships)
-- =====================================================================

-- 2.1 Question-Paper Junction
-- Links questions to exam papers (one question can appear in multiple papers)
CREATE TABLE IF NOT EXISTS public.question_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  paper_id UUID REFERENCES public.exam_papers(id) ON DELETE CASCADE NOT NULL,
  question_number INT NOT NULL, -- Position in the paper (Q1, Q2, etc.)
  marks INT NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, paper_id)
);

-- 2.2 Question-Chapter Junction
-- Links questions to chapters (one question can belong to multiple chapters)
CREATE TABLE IF NOT EXISTS public.question_chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- Mark one chapter as primary
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, chapter_id)
);

-- 2.3 Question-Tag Junction
-- Links questions to tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.question_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.question_tags_master(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, tag_id)
);

-- =====================================================================
-- STEP 3: INDEXES FOR PERFORMANCE
-- =====================================================================

-- Questions table indexes
CREATE INDEX IF NOT EXISTS idx_questions_author ON public.questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_questions_created ON public.questions(created_at DESC);

-- Exam papers indexes
CREATE INDEX IF NOT EXISTS idx_exam_papers_year ON public.exam_papers(year DESC);
CREATE INDEX IF NOT EXISTS idx_exam_papers_exam_name ON public.exam_papers(exam_name);
CREATE INDEX IF NOT EXISTS idx_exam_papers_year_exam ON public.exam_papers(year, exam_name);

-- Chapters indexes
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject);
CREATE INDEX IF NOT EXISTS idx_chapters_parent ON public.chapters(parent_chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON public.chapters(subject, order_index);

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_question_papers_question ON public.question_papers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_papers_paper ON public.question_papers(paper_id);
CREATE INDEX IF NOT EXISTS idx_question_chapters_question ON public.question_chapters(question_id);
CREATE INDEX IF NOT EXISTS idx_question_chapters_chapter ON public.question_chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_question ON public.question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag ON public.question_tags(tag_id);

-- =====================================================================
-- STEP 4: ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_tags_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_tags ENABLE ROW LEVEL SECURITY;

-- Questions policies
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create questions" ON public.questions;
CREATE POLICY "Authenticated users can create questions"
  ON public.questions FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own questions" ON public.questions;
CREATE POLICY "Authors can update their own questions"
  ON public.questions FOR UPDATE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own questions" ON public.questions;
CREATE POLICY "Authors can delete their own questions"
  ON public.questions FOR DELETE
  USING (auth.uid() = author_id);

-- Exam papers policies (read-only for most users)
DROP POLICY IF EXISTS "Anyone can view exam papers" ON public.exam_papers;
CREATE POLICY "Anyone can view exam papers"
  ON public.exam_papers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create exam papers" ON public.exam_papers;
CREATE POLICY "Authenticated users can create exam papers"
  ON public.exam_papers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Chapters policies (read-only for most users)
DROP POLICY IF EXISTS "Anyone can view chapters" ON public.chapters;
CREATE POLICY "Anyone can view chapters"
  ON public.chapters FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create chapters" ON public.chapters;
CREATE POLICY "Authenticated users can create chapters"
  ON public.chapters FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tags policies
DROP POLICY IF EXISTS "Anyone can view tags" ON public.question_tags_master;
CREATE POLICY "Anyone can view tags"
  ON public.question_tags_master FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.question_tags_master;
CREATE POLICY "Authenticated users can create tags"
  ON public.question_tags_master FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Junction table policies (inherit from parent tables)
DROP POLICY IF EXISTS "Anyone can view question-paper links" ON public.question_papers;
CREATE POLICY "Anyone can view question-paper links"
  ON public.question_papers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create question-paper links" ON public.question_papers;
CREATE POLICY "Authenticated users can create question-paper links"
  ON public.question_papers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view question-chapter links" ON public.question_chapters;
CREATE POLICY "Anyone can view question-chapter links"
  ON public.question_chapters FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create question-chapter links" ON public.question_chapters;
CREATE POLICY "Authenticated users can create question-chapter links"
  ON public.question_chapters FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view question-tag links" ON public.question_tags;
CREATE POLICY "Anyone can view question-tag links"
  ON public.question_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create question-tag links" ON public.question_tags;
CREATE POLICY "Authenticated users can create question-tag links"
  ON public.question_tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================================
-- STEP 5: VIEWS FOR AGGREGATED DATA
-- =====================================================================

-- 5.1 Question stats by subject
CREATE OR REPLACE VIEW public.question_stats_by_subject AS
SELECT 
  subject,
  COUNT(*) as total_questions,
  COUNT(CASE WHEN difficulty = 'Easy' THEN 1 END) as easy_count,
  COUNT(CASE WHEN difficulty = 'Medium' THEN 1 END) as medium_count,
  COUNT(CASE WHEN difficulty = 'Hard' THEN 1 END) as hard_count
FROM public.questions
GROUP BY subject;

-- 5.2 Question stats by year
CREATE OR REPLACE VIEW public.question_stats_by_year AS
SELECT 
  ep.year,
  ep.exam_name,
  COUNT(DISTINCT qp.question_id) as total_questions,
  COUNT(DISTINCT ep.id) as total_papers
FROM public.exam_papers ep
LEFT JOIN public.question_papers qp ON ep.id = qp.paper_id
GROUP BY ep.year, ep.exam_name
ORDER BY ep.year DESC;

-- 5.3 Question stats by chapter
CREATE OR REPLACE VIEW public.question_stats_by_chapter AS
SELECT 
  c.subject,
  c.chapter_name,
  COUNT(DISTINCT qc.question_id) as total_questions,
  COUNT(CASE WHEN q.difficulty = 'Easy' THEN 1 END) as easy_count,
  COUNT(CASE WHEN q.difficulty = 'Medium' THEN 1 END) as medium_count,
  COUNT(CASE WHEN q.difficulty = 'Hard' THEN 1 END) as hard_count
FROM public.chapters c
LEFT JOIN public.question_chapters qc ON c.id = qc.chapter_id
LEFT JOIN public.questions q ON qc.question_id = q.id
WHERE c.parent_chapter_id IS NULL -- Only top-level chapters
GROUP BY c.subject, c.chapter_name
ORDER BY c.subject, c.order_index;

-- =====================================================================
-- STEP 6: HELPER FUNCTIONS
-- =====================================================================

-- 6.1 Function to get questions with all relationships
CREATE OR REPLACE FUNCTION public.get_questions_with_relations(
  p_subject TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_year INT DEFAULT NULL,
  p_exam_name TEXT DEFAULT NULL,
  p_chapter_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  options JSONB,
  correct_index INT,
  explanation TEXT,
  subject TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ,
  chapters JSONB,
  exam_papers JSONB,
  tags JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.options,
    q.correct_index,
    q.explanation,
    q.subject,
    q.difficulty,
    q.created_at,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', c.id,
        'name', c.chapter_name,
        'subject', c.subject
      )) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    ) as chapters,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ep.id,
        'year', ep.year,
        'exam_name', ep.exam_name,
        'shift', ep.shift
      )) FILTER (WHERE ep.id IS NOT NULL),
      '[]'::jsonb
    ) as exam_papers,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'category', t.category
      )) FILTER (WHERE t.id IS NOT NULL),
      '[]'::jsonb
    ) as tags
  FROM public.questions q
  LEFT JOIN public.question_chapters qc ON q.id = qc.question_id
  LEFT JOIN public.chapters c ON qc.chapter_id = c.id
  LEFT JOIN public.question_papers qp ON q.id = qp.question_id
  LEFT JOIN public.exam_papers ep ON qp.paper_id = ep.id
  LEFT JOIN public.question_tags qt ON q.id = qt.question_id
  LEFT JOIN public.question_tags_master t ON qt.tag_id = t.id
  WHERE 
    (p_subject IS NULL OR q.subject = p_subject)
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND (p_year IS NULL OR ep.year = p_year)
    AND (p_exam_name IS NULL OR ep.exam_name = p_exam_name)
    AND (p_chapter_id IS NULL OR c.id = p_chapter_id)
  GROUP BY q.id
  ORDER BY q.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 6.2 Function to update question timestamp
CREATE OR REPLACE FUNCTION public.update_question_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS update_questions_timestamp ON public.questions;
CREATE TRIGGER update_questions_timestamp
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_question_timestamp();

-- =====================================================================
-- STEP 7: SEED DEFAULT DATA
-- =====================================================================

-- 7.1 Seed default chapters for JEE subjects
INSERT INTO public.chapters (subject, chapter_name, order_index) VALUES
-- Physics
('Physics', 'Mechanics', 1),
('Physics', 'Thermodynamics', 2),
('Physics', 'Electrostatics', 3),
('Physics', 'Current Electricity', 4),
('Physics', 'Magnetism', 5),
('Physics', 'Electromagnetic Induction', 6),
('Physics', 'Optics', 7),
('Physics', 'Modern Physics', 8),
('Physics', 'Waves', 9),
('Physics', 'Rotational Motion', 10),

-- Chemistry
('Chemistry', 'Physical Chemistry', 1),
('Chemistry', 'Inorganic Chemistry', 2),
('Chemistry', 'Organic Chemistry', 3),
('Chemistry', 'Atomic Structure', 4),
('Chemistry', 'Chemical Bonding', 5),
('Chemistry', 'Thermodynamics', 6),
('Chemistry', 'Equilibrium', 7),
('Chemistry', 'Redox Reactions', 8),
('Chemistry', 'Coordination Compounds', 9),
('Chemistry', 'Hydrocarbons', 10),

-- Mathematics
('Mathematics', 'Algebra', 1),
('Mathematics', 'Calculus', 2),
('Mathematics', 'Coordinate Geometry', 3),
('Mathematics', 'Trigonometry', 4),
('Mathematics', 'Vectors', 5),
('Mathematics', '3D Geometry', 6),
('Mathematics', 'Probability', 7),
('Mathematics', 'Statistics', 8),
('Mathematics', 'Matrices', 9),
('Mathematics', 'Complex Numbers', 10)
ON CONFLICT (subject, chapter_name, parent_chapter_id) DO NOTHING;

-- 7.2 Seed common tags
INSERT INTO public.question_tags_master (name, category, color) VALUES
('JEE Main', 'source', '#3b82f6'),
('JEE Advanced', 'source', '#8b5cf6'),
('NEET', 'source', '#10b981'),
('PYQ', 'type', '#f59e0b'),
('Conceptual', 'skill', '#06b6d4'),
('Numerical', 'skill', '#ec4899'),
('Theory', 'skill', '#6366f1'),
('Application', 'skill', '#14b8a6'),
('Important', 'priority', '#ef4444'),
('Tricky', 'priority', '#f97316')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all tables created successfully
-- 3. Run migration script to link existing questions to chapters/papers
-- 4. Update frontend to use new schema
-- =====================================================================
