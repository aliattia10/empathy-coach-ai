-- Phase 3: Development Skills library, user workbooks, reflections, journal, activity.
-- Catalogue is separate from CBT-style public.skills (optional FK) so EI categories stay clear.

-- ---------------------------------------------------------------------------
-- Workbook catalogue (seeded EI practice cards from ShiftED AI Spec V1 mock)
-- ---------------------------------------------------------------------------
create table if not exists public.workbooks (
  id text primary key,
  skill_id text references public.skills (id) on delete set null,
  ei_category text not null,
  title text not null,
  description text not null,
  duration_min int not null default 5 check (duration_min > 0),
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  body text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workbooks_category on public.workbooks (ei_category);
create index if not exists idx_workbooks_active on public.workbooks (is_active) where is_active = true;

alter table public.workbooks enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'workbooks'
      and policyname = 'Anyone authenticated can read active workbooks'
  ) then
    create policy "Anyone authenticated can read active workbooks"
      on public.workbooks for select
      using (is_active = true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'workbooks'
      and policyname = 'Admins manage workbooks'
  ) then
    create policy "Admins manage workbooks"
      on public.workbooks for all
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

insert into public.workbooks (id, ei_category, title, description, duration_min, level, body, sort_order)
values
  ('wb_active_listening', 'Active Listening', 'Active Listening Basics',
   'Practice fully attending to what someone shares before responding, rather than preparing your reply.',
   5, 'Beginner', null, 10),
  ('wb_naming_emotions', 'Empathy', 'Naming Emotions with Empathy',
   'Build the muscle of recognising and naming the emotion behind someone''s words before responding to the content.',
   7, 'Beginner', null, 20),
  ('wb_perspective_taking', 'Perspective-Taking', 'Walking in Their Shoes (Perspective-Taking)',
   'Step into the other person''s lived experience to better understand the context behind their views.',
   10, 'Intermediate', null, 30),
  ('wb_curious_questioning', 'Curious Questioning', 'Asking Open, Curious Questions (Curious Questioning)',
   'Replace assumptions and yes/no questions with open prompts that invite genuine sharing.',
   5, 'Beginner', null, 40),
  ('wb_emotional_regulation', 'Emotional Regulation', 'Pause Before Reacting (Emotional Regulation)',
   'Build a brief space between feeling triggered and responding, so your reply matches your intention.',
   5, 'Intermediate', null, 50),
  ('wb_cultural_humility', 'Cultural Humility', 'Cultural Humility Practice',
   'Approach unfamiliar identities and experiences as a learner rather than an expert.',
   8, 'Intermediate', null, 60),
  ('wb_conflict_navigation', 'Conflict Navigation', 'Staying in Hard Conversations (Conflict Navigation)',
   'Practice staying engaged when a conversation feels tense, instead of withdrawing or escalating.',
   8, 'Intermediate', null, 70),
  ('wb_self_reflection', 'Self-Reflection', 'Reflecting on Your Reactions (Self-Reflection)',
   'Turn attention inward to notice what your reactions reveal about your own beliefs and history.',
   7, 'Beginner', null, 80)
on conflict (id) do update set
  ei_category = excluded.ei_category,
  title = excluded.title,
  description = excluded.description,
  duration_min = excluded.duration_min,
  level = excluded.level,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Per-user workbook progress
-- ---------------------------------------------------------------------------
create table if not exists public.user_workbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workbook_id text not null references public.workbooks (id) on delete cascade,
  status text not null check (status in ('added', 'in_progress', 'completed', 'skipped')),
  source text not null check (source in ('library', 'recommendation')),
  chat_session_id uuid references public.chat_sessions (id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  completion_rating int check (completion_rating is null or (completion_rating between 1 and 10)),
  completion_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workbook_id)
);

create index if not exists idx_user_workbooks_user on public.user_workbooks (user_id);
create index if not exists idx_user_workbooks_status on public.user_workbooks (user_id, status);

alter table public.user_workbooks enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_workbooks'
      and policyname = 'Users manage own workbooks'
  ) then
    create policy "Users manage own workbooks"
      on public.user_workbooks for all
      using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
      with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- In-chat recommendation decisions
-- ---------------------------------------------------------------------------
create table if not exists public.workbook_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_session_id uuid not null references public.chat_sessions (id) on delete cascade,
  message_id uuid references public.chat_messages (id) on delete set null,
  workbook_id text not null references public.workbooks (id) on delete cascade,
  decision text check (decision is null or decision in ('added', 'skipped', 'started', 'pending')),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_workbook_recs_session on public.workbook_recommendations (chat_session_id);
create index if not exists idx_workbook_recs_user on public.workbook_recommendations (user_id);

alter table public.workbook_recommendations enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'workbook_recommendations'
      and policyname = 'Users manage own workbook recommendations'
  ) then
    create policy "Users manage own workbook recommendations"
      on public.workbook_recommendations for all
      using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
      with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Reflection Moment answers
-- ---------------------------------------------------------------------------
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_session_id uuid references public.chat_sessions (id) on delete set null,
  prompt_key text not null default 'surprised_most',
  answer text,
  skipped boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_reflections_user on public.reflections (user_id);

alter table public.reflections enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'reflections'
      and policyname = 'Users manage own reflections'
  ) then
    create policy "Users manage own reflections"
      on public.reflections for all
      using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
      with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Journal entries
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_session_id uuid references public.chat_sessions (id) on delete set null,
  workbook_id text references public.workbooks (id) on delete set null,
  title text,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_entries_user on public.journal_entries (user_id);

alter table public.journal_entries enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'journal_entries'
      and policyname = 'Users manage own journal entries'
  ) then
    create policy "Users manage own journal entries"
      on public.journal_entries for all
      using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
      with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Lightweight activity / time-spent (no message content)
-- ---------------------------------------------------------------------------
create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_heartbeat_at timestamptz not null default now(),
  path text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activity_user on public.user_activity (user_id);
create index if not exists idx_user_activity_open on public.user_activity (user_id, ended_at)
  where ended_at is null;

alter table public.user_activity enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_activity'
      and policyname = 'Users manage own activity'
  ) then
    create policy "Users manage own activity"
      on public.user_activity for all
      using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
      with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
  end if;
end $$;
