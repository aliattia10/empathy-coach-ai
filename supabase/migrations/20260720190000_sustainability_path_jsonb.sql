-- Persist Sustainability Path order + completion (Miro right rail).
alter table public.chat_sessions
  add column if not exists sustainability_path jsonb not null default '[]'::jsonb;

comment on column public.chat_sessions.sustainability_path is
  'Ordered Sustainability Path steps: [{id,title,completed,completed_at,sort_order}]';
