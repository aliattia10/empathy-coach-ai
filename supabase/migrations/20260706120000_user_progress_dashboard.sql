-- User progress dashboard: AI-generated goals checklist per journey

alter table public.chat_sessions
  add column if not exists user_goals jsonb not null default '[]'::jsonb,
  add column if not exists progress_summary text;

comment on column public.chat_sessions.user_goals is
  'Array of {id, title, completed, completed_at, source, created_at} — shown in Progress dashboard';
comment on column public.chat_sessions.progress_summary is
  'Plain-language situation summary for the Progress dashboard header';
