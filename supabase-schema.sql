-- ── InterviewIQ Supabase Schema ────────────────────────────────
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- Sessions table
create table if not exists sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  role            text,
  level           text,
  company         text,
  overall_score   integer,
  grade           text,
  headline        text,
  duration_secs   integer,
  notes           text,
  questions       jsonb  default '[]',
  strengths       jsonb  default '[]',
  focus_areas     jsonb  default '[]',
  next_steps      jsonb  default '[]',
  encouragement   text,
  started_at      timestamptz default now(),
  created_at      timestamptz default now()
);

-- Streaks table
create table if not exists streaks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null unique,
  current_streak     integer default 0,
  longest_streak     integer default 0,
  last_practice_date date,
  practice_dates     jsonb  default '[]',
  updated_at         timestamptz default now()
);

-- Enable Row Level Security (users can only see their own data)
alter table sessions enable row level security;
alter table streaks  enable row level security;

-- Sessions: users can only read/write their own rows
create policy "sessions_self" on sessions
  for all using (auth.uid() = user_id);

-- Streaks: users can only read/write their own rows
create policy "streaks_self" on streaks
  for all using (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists sessions_user_id_idx on sessions(user_id, started_at desc);
