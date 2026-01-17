-- -----------------------------------------------------------------------------
-- CENTRALIZED QUESTION ARCHIVE SCHEMA
-- Run this in your Supabase SQL Editor to enable the Question Database
-- -----------------------------------------------------------------------------

-- 1. CREATE QUESTIONS TABLE
create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references auth.users(id) not null,
  question_text text not null,
  options jsonb not null, -- Expected format: ["Option A", "Option B", "Option C", "Option D"]
  correct_index int not null, -- 0-3
  explanation text,
  subject text not null,
  topic text,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  tags text[] default '{}',
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- 2. SECURITY (Row Level Security)
alter table public.questions enable row level security;

-- ALLOW READ: Everyone can see verified questions, or all questions if centralized
-- For a truly centralized system where users contribute:
create policy "Anyone can view questions"
  on public.questions for select
  using (true);

-- ALLOW INSERT: Authenticated users can archive questions
create policy "Authenticated users can create questions"
  on public.questions for insert
  with check (auth.uid() = author_id);

-- ALLOW UPDATE/DELETE: Authors can edit their own questions
create policy "Authors can update their own questions"
  on public.questions for update
  using (auth.uid() = author_id);

create policy "Authors can delete their own questions"
  on public.questions for delete
  using (auth.uid() = author_id);

-- 3. INDEXES for fast tag/subject searching
create index if not exists questions_tags_idx on public.questions using gin (tags);
create index if not exists questions_subject_idx on public.questions (subject);
create index if not exists questions_difficulty_idx on public.questions (difficulty);

-- 4. VIEW FOR AGGREGATED METRICS (Optional)
-- e.g., count questions per subject
create or replace view public.question_stats as
select subject, count(*) as count
from public.questions
group by subject;
