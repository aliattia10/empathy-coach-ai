-- Paste in Supabase SQL Editor for project wxxwxvauseqftyorhkkp
-- Fixes: "Couldn't save your consent" (missing table and/or upsert without UPDATE RLS)

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null default '1',
  consented_at timestamptz not null default now(),
  unique (user_id, version)
);

alter table public.user_consents enable row level security;

drop policy if exists "Users can view own consents" on public.user_consents;
create policy "Users can view own consents"
  on public.user_consents for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own consents" on public.user_consents;
create policy "Users can insert own consents"
  on public.user_consents for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own consents" on public.user_consents;
create policy "Users can update own consents"
  on public.user_consents for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_consents to authenticated;

notify pgrst, 'reload schema';
