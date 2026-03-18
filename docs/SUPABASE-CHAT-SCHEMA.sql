-- Chat data schema (copy/paste into Supabase SQL editor if needed)
-- Note: the full schema is also present in supabase/migrations/*.

-- Chat sessions (one per user run)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario text not null default 'constructive_feedback',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;

-- Chat messages (all turns in a session)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

-- RLS: sessions owned by the authenticated user
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='chat_sessions' and policyname='Users can view own sessions'
  ) then
    create policy "Users can view own sessions"
      on public.chat_sessions for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='chat_sessions' and policyname='Users can create own sessions'
  ) then
    create policy "Users can create own sessions"
      on public.chat_sessions for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- RLS: messages allowed only via session ownership
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='chat_messages' and policyname='Users can view own messages'
  ) then
    create policy "Users can view own messages"
      on public.chat_messages for select
      using (session_id in (select id from public.chat_sessions where user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='chat_messages' and policyname='Users can insert own messages'
  ) then
    create policy "Users can insert own messages"
      on public.chat_messages for insert
      with check (session_id in (select id from public.chat_sessions where user_id = auth.uid()));
  end if;
end $$;

