-- StudyDeck Supabase schema.
-- Run this in the Supabase SQL editor before deploying the app.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  stack text[] not null default '{}',
  status text not null default 'Planning',
  progress integer not null default 0 check (progress between 0 and 100),
  start_date date not null,
  due_at timestamptz not null,
  estimated_hours numeric(8, 2) not null default 0,
  tone text not null default 'cyan',
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  course text not null,
  description text not null default '',
  due_at timestamptz not null,
  priority text not null default 'Medium',
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.lectures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course text not null,
  title text not null,
  day smallint not null check (day between 0 and 6),
  start_time time not null,
  end_time time not null,
  location text not null default '',
  tone text not null default 'cyan'
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject text not null,
  topic text not null default '',
  minutes integer not null check (minutes > 0),
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists assignments_user_id_idx on public.assignments (user_id);
create index if not exists lectures_user_id_idx on public.lectures (user_id);
create index if not exists study_sessions_user_id_idx on public.study_sessions (user_id);

alter table public.projects enable row level security;
alter table public.assignments enable row level security;
alter table public.lectures enable row level security;
alter table public.study_sessions enable row level security;

drop policy if exists "Users can read own projects" on public.projects;
drop policy if exists "Users can insert own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;

create policy "Users can read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own assignments" on public.assignments;
drop policy if exists "Users can insert own assignments" on public.assignments;
drop policy if exists "Users can update own assignments" on public.assignments;
drop policy if exists "Users can delete own assignments" on public.assignments;

create policy "Users can read own assignments"
  on public.assignments for select
  using (auth.uid() = user_id);

create policy "Users can insert own assignments"
  on public.assignments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own assignments"
  on public.assignments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own assignments"
  on public.assignments for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own lectures" on public.lectures;
drop policy if exists "Users can insert own lectures" on public.lectures;
drop policy if exists "Users can update own lectures" on public.lectures;
drop policy if exists "Users can delete own lectures" on public.lectures;

create policy "Users can read own lectures"
  on public.lectures for select
  using (auth.uid() = user_id);

create policy "Users can insert own lectures"
  on public.lectures for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lectures"
  on public.lectures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own lectures"
  on public.lectures for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own sessions" on public.study_sessions;
drop policy if exists "Users can insert own sessions" on public.study_sessions;
drop policy if exists "Users can update own sessions" on public.study_sessions;
drop policy if exists "Users can delete own sessions" on public.study_sessions;

create policy "Users can read own sessions"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.study_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.study_sessions for delete
  using (auth.uid() = user_id);
