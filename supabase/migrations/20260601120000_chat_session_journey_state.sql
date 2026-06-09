-- Journey state for Platform Phase 1–3 (Phase 2 micro-goals, Phase 3 sustainability loop)

alter table public.chat_sessions
  add column if not exists platform_phase smallint not null default 1
    check (platform_phase between 1 and 3),
  add column if not exists phase_one_confirmed boolean not null default false,
  add column if not exists conceptualisation_summary text,
  add column if not exists target_outcome text,
  add column if not exists active_micro_goal text,
  add column if not exists micro_goal_confidence smallint
    check (micro_goal_confidence is null or micro_goal_confidence between 1 and 10),
  add column if not exists sustainability_pivot_active boolean not null default false,
  add column if not exists last_check_in_at timestamptz,
  add column if not exists presenting_challenge text,
  add column if not exists belief_strength_pct smallint
    check (belief_strength_pct is null or belief_strength_pct between 0 and 100),
  add column if not exists phase_one_step smallint not null default 1
    check (phase_one_step between 1 and 3),
  add column if not exists architectural_backtrack_active boolean not null default false;

comment on column public.chat_sessions.platform_phase is '1=conceptualisation, 2=micro-goals, 3=sustainability execution';
comment on column public.chat_sessions.phase_one_confirmed is 'Reflective Handshake gate passed';
comment on column public.chat_sessions.sustainability_pivot_active is 'True when Phase 3 failure/stress pivot is in progress';
comment on column public.chat_sessions.phase_one_step is '1=scenario extraction, 2=component breakdown, 3=handshake pending';
comment on column public.chat_sessions.architectural_backtrack_active is 'True during Phase 3 backtrack to update assumptions';
