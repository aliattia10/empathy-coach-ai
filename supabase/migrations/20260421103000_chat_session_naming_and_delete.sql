alter table public.chat_sessions
add column if not exists session_name text;

create policy "Users can delete own sessions"
  on public.chat_sessions
  for delete
  using (auth.uid() = user_id);
