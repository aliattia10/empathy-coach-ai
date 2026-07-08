-- Session-specific phase checklist (read-only progress — auto-completed from coaching state)

alter table public.chat_sessions
  add column if not exists phase_checklist jsonb not null default '[]'::jsonb;

comment on column public.chat_sessions.phase_checklist is
  'Session-specific protocol milestones [{id,key,title,completed,phase}] — auto-tracked, not user-toggled';
