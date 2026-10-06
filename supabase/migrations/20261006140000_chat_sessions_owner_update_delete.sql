alter table public.chat_sessions enable row level security;

drop policy if exists "Users can update own sessions" on public.chat_sessions;
create policy "Users can update own sessions"
  on public.chat_sessions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.chat_sessions;
create policy "Users can delete own sessions"
  on public.chat_sessions for delete to authenticated
  using (auth.uid() = user_id);

grant update, delete on public.chat_sessions to authenticated;
