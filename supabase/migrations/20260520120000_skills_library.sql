-- Skills library for Phase 3 application and engine Core Skills (structured upload path).

create table if not exists public.skills (
  id text primary key,
  name text not null,
  category text not null check (category in ('core', 'development_activation')),
  platform_phase int not null check (platform_phase between 1 and 3),
  acronym text,
  description text not null,
  gap_signals text[] not null default '{}',
  when_to_use text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_skills_category on public.skills (category);
create index if not exists idx_skills_active on public.skills (is_active) where is_active = true;

alter table public.skills enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'skills' and policyname = 'Anyone authenticated can read active skills'
  ) then
    create policy "Anyone authenticated can read active skills"
      on public.skills for select
      using (is_active = true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'skills' and policyname = 'Admins manage skills'
  ) then
    create policy "Admins manage skills"
      on public.skills for all
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

insert into public.skills (id, name, category, platform_phase, acronym, description, gap_signals, when_to_use, sort_order)
values
  ('distancing', 'Distancing', 'core', 1, null,
   'Create psychological distance from automatic stress responses.',
   array['overwhelmed','spiralling','can''t think straight','fused with the thought'],
   'User is flooded; needs space before problem-solving.', 10),
  ('hcpr_thought_challenge', 'Helpful Constructive Positive Real (HCPR) thought check', 'core', 2, 'HCPR',
   'Structured thought challenging using helpful, constructive, positive, real criteria.',
   array['negative automatic thought','catastrophising','mind reading','stuck on one thought'],
   'Specific thought is blocking progress.', 20),
  ('dtr', 'Daily Thought Record (thought on trial)', 'core', 2, 'DTR',
   'Examine evidence for and against a hot thought.',
   array['same thought keeps returning','ruminating','not sure if it''s true'],
   'Recurring thought needs evidence weighing.', 30),
  ('cost_benefit', 'Cost-benefit check', 'core', 2, null,
   'Weigh costs and benefits of believing or avoiding.',
   array['won''t try','avoiding because','stuck choosing'],
   'Resistance or ambivalence about action.', 40),
  ('behavioral_activation', 'Behavioural Activation', 'development_activation', 3, 'BA',
   'Plan valued activities and small approach steps.',
   array['no motivation','avoiding activities','not doing anything','procrastinating tasks'],
   'Low activity or avoidance of valued tasks.', 50),
  ('micro_goals', 'Micro goals', 'development_activation', 3, null,
   'Break goals into very small observable steps.',
   array['goal too big','don''t know where to start','can''t begin'],
   'Has a goal but cannot start.', 60),
  ('sustainability_path', 'Sustainability path skill', 'development_activation', 3, null,
   'Support long-term habit and regulation along sustainability training.',
   array['keep slipping back','can''t maintain','started then stopped'],
   'Needs habituation after initial progress.', 70),
  ('feedback_conversation', 'Constructive feedback practice', 'development_activation', 3, null,
   'Workplace feedback: situation, behaviour, impact, empathy.',
   array['difficult conversation','feedback to team','conflict at work'],
   'Preparing difficult workplace feedback.', 80)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  platform_phase = excluded.platform_phase,
  acronym = excluded.acronym,
  description = excluded.description,
  gap_signals = excluded.gap_signals,
  when_to_use = excluded.when_to_use,
  sort_order = excluded.sort_order,
  updated_at = now();
