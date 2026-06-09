-- Align skills table with Phase 1-3 engine (new core skills, Phase 2 activation skills).

insert into public.skills (id, name, category, platform_phase, acronym, description, gap_signals, when_to_use, sort_order)
values
  ('circles_of_control', 'Circles of control', 'core', 3, null,
   'Sort what is within control, influence, or outside control — creates distance from overwhelm.',
   array['can''t control anything','overwhelmed by uncertainty','stuck worrying'],
   'Sustainability Pivot when flooded by uncontrollable factors.', 45),
  ('thinking_error_tracking', 'Thinking error tracking', 'core', 2, null,
   'Notice unhelpful thinking habits without lecturing.',
   array['always happens','worst case','everyone thinks','black and white'],
   'Recurring distorted thoughts during conceptualisation or pivot.', 35),
  ('boundary_communication', 'Boundary communication', 'development_activation', 2, null,
   'Plan how to communicate a boundary clearly — what to say, when, and what rule it protects.',
   array['can''t say no','need to set a boundary','afraid to push back'],
   'Phase Two micro-stepping for workplace boundaries.', 55)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  platform_phase = excluded.platform_phase,
  description = excluded.description,
  gap_signals = excluded.gap_signals,
  when_to_use = excluded.when_to_use,
  sort_order = excluded.sort_order,
  updated_at = now();

update public.skills set platform_phase = 2, sort_order = 50, updated_at = now()
  where id = 'behavioral_activation';
update public.skills set platform_phase = 2, sort_order = 60, updated_at = now()
  where id = 'micro_goals';
