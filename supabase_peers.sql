-- -----------------------------------------------------------------------------
-- PEER CONNECT SQL SETUP
-- Run this entire script in your Supabase SQL Editor to enable Global Connect.
-- -----------------------------------------------------------------------------

-- 1. CLEANUP (Optional: Remove old table if it exists to start fresh)
-- drop table if exists public.study_peers;

-- 2. CREATE TABLE
create table if not exists public.study_peers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  group_id text not null,       -- 'GLOBAL' or a 6-char Private Code
  display_name text not null,
  subject text not null,        -- e.g. 'PHYSICS'
  status text not null,         -- 'focusing', 'idle', 'break'
  timer_val int default 0,      -- Seconds studied in current session
  last_ping timestamptz default now(), -- Used to filter out offline users
  meta_data jsonb default '{}'::jsonb
);

-- 3. SECURITY (Row Level Security)
alter table public.study_peers enable row level security;

-- ALLOW READ: Anyone can see everyone (for now, to ensure visibility)
create policy "Public Read Access"
  on public.study_peers for select
  using (true);

-- ALLOW INSERT: Authenticated users can join tables
create policy "Authenticated Insert"
  on public.study_peers for insert
  with check (auth.uid() = user_id);

-- ALLOW UPDATE: Authenticated users can update ONLY their own row
create policy "Update Own Status"
  on public.study_peers for update
  using (auth.uid() = user_id);

-- 4. REALTIME ENABLEMENT
-- This allows the server to broadcast changes to connected clients instantly.
-- (Required if you upgrade to WebSocket connections later)
alter publication supabase_realtime add table study_peers;

-- 5. INDEXES (Performance)
create index if not exists study_peers_group_id_idx on public.study_peers (group_id);
create index if not exists study_peers_last_ping_idx on public.study_peers (last_ping);

-- 6. PERIODIC CLEANUP FUNCTION (Advanced)
-- Run this HTTP request via a Cron job or Edge Function to clean stale users:
-- DELETE FROM public.study_peers WHERE last_ping < NOW() - INTERVAL '5 minutes';
