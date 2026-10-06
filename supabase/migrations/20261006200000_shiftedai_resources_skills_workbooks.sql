-- ShiftedAI Resources: upsert expanded skills + workbooks (idempotent).
-- Do NOT run against production from this agent — migration file only.

insert into public.skills (id, name, category, platform_phase, acronym, description, gap_signals, when_to_use, sort_order)
values
  ('distancing', 'Distancing', 'core', 1, null,
   'Create psychological distance from automatic stress responses so the user can observe thoughts and feelings without fusing with them. Self-distanced language (''what would you notice if advising a colleague?'') helps perspective.',
   array['overwhelmed','can''t think straight','spiralling','everything feels urgent','fused with the thought'],
   'User is flooded or fused with distress; needs space before problem-solving.', 10),
  ('hcpr_thought_challenge', 'Helpful Constructive Positive Real (HCPR) thought check', 'core', 2, 'HCPR',
   'Challenge unhelpful thoughts using Helpful, Constructive, Positive, and Real criteria — ShiftED''s primary thought tool (HCPR Tool Kit). One lens per turn; then a balanced alternative in the user''s words.',
   array['negative automatic thought','they always','i''m useless','catastrophising','mind reading','stuck on one thought'],
   'A specific thought is blocking progress; user can name the thought.', 20),
  ('dtr', 'Daily Thought Record (thought on trial)', 'core', 2, 'DTR',
   'Examine evidence for and against a hot thought (thought diaries / thought-on-trial) when simpler HCPR checks are not enough.',
   array['same thought keeps returning','need evidence','not sure if it''s true','ruminating'],
   'User needs structured evidence weighing for a recurring thought.', 30),
  ('cost_benefit', 'Cost-benefit check', 'core', 2, null,
   'Weigh short- and longer-term costs and benefits of an action, belief, or avoidance — including costs of unhelpful coping (e.g. endless scrolling).',
   array['won''t try','what''s the point','avoiding because','stuck choosing'],
   'User is resistant or ambivalent; needs a concrete decision frame.', 40),
  ('circles_of_control', 'Circles of control', 'core', 3, null,
   'Sort what is within control, influence, or outside control (spheres of personal control). Creates distance from overwhelm and focuses effort — often with sustainability path.',
   array['can''t control anything','everything depends on others','overwhelmed by uncertainty','stuck worrying'],
   'User is flooded by uncontrollable factors; Sustainability Pivot distancing tool.', 50),
  ('thinking_error_tracking', 'Thinking error tracking', 'core', 2, null,
   'Notice unhelpful thinking styles (mind reading, catastrophising, all-or-nothing, discounting positives) without lecturing — light structured awareness before HCPR/DTR.',
   array['always happens','they never','worst case','everyone thinks','black and white'],
   'Recurring distorted thoughts; pair with HCPR or DTR when needed.', 60),
  ('abcd_model', 'ABCD model', 'core', 2, 'ABCD',
   'Map Activating event → Beliefs → Consequences → Disputation when users need a fuller thought–feeling–behaviour sketch alongside HCPR.',
   array['activating event','beliefs and consequences','ABC','why did I react'],
   'User can describe a trigger episode and needs a structured map before disputation.', 70),
  ('grounding_and_breathing', 'Grounding and breathing', 'core', 1, 'SOBER',
   'In-the-moment regulation: 5-4-3-2-1, diaphragmatic/box breathing, Dropping Anchor, S.O.B.E.R., brief PMR or imagery. Use before problem-solving when flooded. Guided audio titles exist; URLs pending hosting.',
   array['panicky','can''t breathe','racing heart','overwhelmed right now','can''t think','need to ground'],
   'Acute arousal, panic, or dissociation — regulate first.', 80),
  ('boundary_communication', 'Boundary communication', 'development_activation', 2, null,
   'Plan how to communicate a boundary clearly (time, workload, emotional, digital, etc.) — what to say, when, and what need it protects. Includes learning to say no and assertiveness framing.',
   array['can''t say no','need to set a boundary','always available','they expect me to','afraid to push back'],
   'Phase Two micro-stepping for emotional intelligence and workplace boundaries.', 90),
  ('behavioral_activation', 'Behavioural Activation', 'development_activation', 2, 'BA',
   'Plan valued activities and small approach steps using pleasure vs mastery and activity scheduling. Treat scrolling/avoidance of monotonous tasks as a common workplace loop.',
   array['not doing anything','no motivation','avoiding activities','stuck at home','procrastinating tasks','scrolling instead'],
   'Low activity, avoidance of valued tasks, need structured activation.', 100),
  ('micro_goals', 'Micro goals', 'development_activation', 2, null,
   'Break goals into very small, observable steps; values-based goals; solution-focused scaling (1–10 confidence). Plain language — not clinical scales with users.',
   array['goal too big','don''t know where to start','overwhelmed by task','can''t begin'],
   'User has a goal but cannot start; needs granular next step.', 110),
  ('sustainability_path', 'Sustainability path skill', 'development_activation', 3, null,
   'Long-term habit and emotional regulation along the Self-Sustaining Path: problem list, coping plan, burnout beliefs, recovery habits after initial progress.',
   array['keep slipping back','can''t maintain','started well then stopped','burnout'],
   'User needs habituation after initial progress; sustainability focus.', 120),
  ('feedback_conversation', 'Constructive feedback practice', 'development_activation', 3, null,
   'Workplace scenario practice: situation, behaviour, impact, empathy — aligns with constructive feedback and conflict-navigation coaching.',
   array['difficult conversation','feedback to team','manager','conflict at work'],
   'User scenario is delivering or preparing difficult workplace feedback.', 130),
  ('stress_regulation', 'Stress regulation (window of tolerance)', 'development_activation', 2, 'WoT',
   'Notice hyper- vs hypo-arousal relative to a usable window of tolerance; pair regulation with load reduction and recovery habits. Links circles_of_control and sustainability_path.',
   array['too stressed','wired then crash','window of tolerance','can''t cope with load','burned out'],
   'Chronic stress/burnout framing once acute panic is settled.', 140),
  ('behavioural_experiment', 'Behavioural experiment', 'development_activation', 2, null,
   'Design a small real-world test of a negative prediction; compare expected vs actual outcome. Workplace-safe only — not clinical phobia exposure.',
   array['test my prediction','what if I''m wrong','they''ll think','safety behaviour'],
   'User holds a testable interpersonal or performance prediction.', 150),
  ('structured_problem_solving', 'Structured problem solving', 'development_activation', 2, 'SPS',
   'Define the problem, brainstorm options, weigh, choose, plan, review — one step per turn.',
   array['don''t know what to do','too many options','problem solve','stuck choosing next step'],
   'Clear external problem with multiple workable options.', 160),
  ('worry_time', 'Worry time', 'development_activation', 2, null,
   'Contain free-floating worry to a short daily window; park daytime what-ifs; problem-solve only actionable items inside the window.',
   array['can''t stop worrying','what if all day','worry spiral','generalised worry'],
   'Repetitive what-if chains without a single hot thought to challenge yet.', 170),
  ('values_clarification', 'Values clarification', 'development_activation', 3, null,
   'Clarify life/work directions that matter (people, principles, contribution) and align micro-actions — ACT-informed, coaching scope.',
   array['what matters','lost purpose','values','why am I doing this'],
   'Motivation/meaning gap; linking goals to values.', 180),
  ('strengths_spotting', 'Strengths spotting', 'development_activation', 3, null,
   'Identify character strengths in self and others and apply one strength to the current stuck point.',
   array['my strengths','what I''m good at','only see weaknesses','signature strengths'],
   'Deficit-focused self-view; need resource activation.', 190),
  ('gratitude_and_savouring', 'Gratitude and savouring', 'development_activation', 3, null,
   'Deliberately notice and linger on positive moments, kindness, awe, or flow — small workplace-safe doses. Avoid forcing positivity in crisis.',
   array['nothing good','grey day','grateful','savour','flow'],
   'Flat affect or negativity bias when safety is not the issue.', 200),
  ('resilience_reframing', 'Resilience reframing', 'development_activation', 2, null,
   'Positive-CBT style reframe: workable alternative thoughts and past coping evidence without toxic positivity. Often pairs with HCPR.',
   array['can''t bounce back','always goes wrong','I''m finished','no silver lining'],
   'After a setback when a balanced alternative thought would help.', 210),
  ('growth_mindset', 'Growth mindset', 'development_activation', 3, null,
   'Treat skills as improvable; use feedback as data; stretch into the growth zone without leaping into panic zone.',
   array['I''m just not good at','feedback hurts','fixed about','prove myself'],
   'Identity fused with performance feedback.', 220),
  ('self_compassion', 'Self-compassion', 'development_activation', 2, null,
   'Soften harsh self-attack; speak as you would to a respected colleague; common-humanity framing.',
   array['hard on myself','I don''t deserve','self-criticism','hate myself for'],
   'Shame-driven self-attack blocking learning.', 230),
  ('grief_and_loss', 'Grief and loss', 'development_activation', 3, null,
   'Supportive coaching around bereavement and transition — normalise varied grief, map supports, gentle continuing bonds if wanted. Signpost NHS/specialist care; not bereavement therapy.',
   array['grief','bereaved','lost someone','funeral','anniversary of'],
   'Loss is central; stay in coaching scope and signpost.', 240),
  ('problem_list_conceptualisation', 'Problem list and conceptualisation', 'core', 1, null,
   'Opening-phase skill: build a plain problem list and conceptualise the priority item (situation, trigger, beliefs, response) — one element per turn.',
   array['so many problems','where do I start','everything is a mess','problem list'],
   'Early session overload; need a structured opening map.', 250)
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

insert into public.workbooks (id, skill_id, ei_category, title, description, duration_min, level, body, sort_order)
values
  ('wb_active_listening', null, 'Active Listening', 'Active Listening Basics',
   'Practice fully attending to what someone shares before responding, rather than preparing your reply.',
   5, 'Beginner', '## Steps
1. Pick a recent conversation where you jumped to advice.
2. Write what they said (content) and what they might have felt.
3. Draft one reflection + one open question you could use next time.
## Reflect
What changed when you slowed down?', 10),
  ('wb_naming_emotions', null, 'Empathy', 'Naming Emotions with Empathy',
   'Build the muscle of recognising and naming the emotion behind someone''s words before responding to the content.',
   7, 'Beginner', '## Steps
1. Use the feeling wheel (or screenshot) to move from a vague word ("bad") to a more precise feeling.
2. Name your own feeling in a current work situation.
3. Guess a colleague''s feeling in one recent exchange — check assumptions gently.
## Reflect
Which precise feeling word was hardest to own?', 20),
  ('wb_perspective_taking', null, 'Perspective-Taking', 'Walking in Their Shoes (Perspective-Taking)',
   'Step into the other person''s lived experience to better understand the context behind their views.',
   10, 'Intermediate', '## Steps
1. Choose a disagreement at work.
2. Write their likely pressures, fears, and goals in their words.
3. Note one thing you might have missed from your seat.
## Reflect
What would you do differently in the next conversation?', 30),
  ('wb_curious_questioning', null, 'Curious Questioning', 'Asking Open, Curious Questions (Curious Questioning)',
   'Replace assumptions and yes/no questions with open prompts that invite genuine sharing.',
   5, 'Beginner', '## Steps
1. List three closed questions you used recently.
2. Rewrite each as an open prompt (what/how).
3. Try one in a low-stakes chat today.
## Reflect
What did you learn that you would have missed?', 40),
  ('wb_emotional_regulation', 'grounding_and_breathing', 'Emotional Regulation', 'Pause Before Reacting (Emotional Regulation)',
   'Build a brief space between feeling triggered and responding, so your reply matches your intention.',
   5, 'Intermediate', '## Steps
1. Name a trigger situation.
2. Choose one pause tool (box breath, 5-4-3-2-1, or Dropping Anchor).
3. Script the first sentence you will say after the pause.
## Reflect
Did the pause change the tone of your reply?', 50),
  ('wb_cultural_humility', null, 'Cultural Humility', 'Cultural Humility Practice',
   'Approach unfamiliar identities and experiences as a learner rather than an expert.',
   8, 'Intermediate', '## Steps
1. Recall a moment you assumed sameness.
2. Write one curious question you could have asked instead.
3. Note a help-seeking or expression norm that may differ from yours.
## Reflect
Where will you stay a learner this week?', 60),
  ('wb_conflict_navigation', 'feedback_conversation', 'Conflict Navigation', 'Staying in Hard Conversations (Conflict Navigation)',
   'Practice staying engaged when a conversation feels tense, instead of withdrawing or escalating.',
   8, 'Intermediate', '## Steps
1. Name the hard conversation you are avoiding.
2. Draft situation–behaviour–impact in plain language.
3. Add one empathy line and one clear ask.
## Reflect
What would "staying" look like for 10 more minutes?', 70),
  ('wb_self_reflection', null, 'Self-Reflection', 'Reflecting on Your Reactions (Self-Reflection)',
   'Turn attention inward to notice what your reactions reveal about your own beliefs and history.',
   7, 'Beginner', '## Steps
1. Pick a strong reaction from this week.
2. What story did you tell yourself (hot thought)?
3. What need was underneath?
## Reflect
What will you watch for next time the same trigger appears?', 80),
  ('wb_wellbeing_lens', 'values_clarification', 'Wellbeing & Resilience', 'My wellbeing lens',
   'Build a personal wellbeing vocabulary: what wellbeing means to you, daily needs, and who you are when you are well.',
   12, 'Beginner', '## Steps
1. What does wellbeing mean to you (your lens)?
2. List daily needs that keep you well.
3. Who are you when you are well (3 words)?
4. Glance at the self-care wheel — pick one neglected spoke for this week.
## Reflect
What is one small act that protects that spoke?', 90),
  ('wb_self_care_dimensions', 'stress_regulation', 'Wellbeing & Resilience', 'Five dimensions of self-care',
   'Scan physical, psychological, emotional, spiritual, and professional self-care — choose one upgrade.',
   10, 'Beginner', '## Steps
1. Rate each dimension 1–10 using the infographic as a prompt.
2. Circle the lowest score.
3. Design a 10-minute action for that dimension this week.
## Reflect
What usually blocks this kind of care?', 100),
  ('wb_adaptive_coping', 'stress_regulation', 'Wellbeing & Resilience', 'Adaptive coping wheel',
   'Browse adaptive coping strategies for difficult times and pick two you will actually try.',
   8, 'Beginner', '## Steps
1. Name the difficult situation.
2. From the coping wheel, choose one soothing and one problem-focused strategy.
3. Schedule when you will use each.
## Reflect
Which unhelpful coping will these replace?', 110),
  ('wb_job_satisfaction', 'circles_of_control', 'Wellbeing & Resilience', 'Job satisfaction wheel',
   'Map facets of job satisfaction and identify one lever you can influence.',
   10, 'Intermediate', '## Steps
1. Score each spoke of the job satisfaction wheel.
2. Mark which are in your control / influence / outside.
3. Pick one influence spoke for a micro-experiment.
## Reflect
What will you try before changing jobs or burning out?', 120),
  ('wb_pleasure_mastery', 'behavioral_activation', 'Wellbeing & Resilience', 'Pleasure vs mastery planner',
   'Schedule balanced activities that bring enjoyment and a sense of accomplishment — core behavioural activation practice.',
   10, 'Beginner', '## Steps
1. List 3 pleasure activities and 3 mastery activities (tiny is fine).
2. Place one of each in tomorrow''s calendar with a time.
3. Rate mood before/after 1–10.
## Reflect
Did avoidance (e.g. scrolling) try to steal the slot?', 130),
  ('wb_values_compass', 'values_clarification', 'Values & Strengths', 'Values compass',
   'Clarify what matters most and set one values-based micro-goal.',
   12, 'Intermediate', '## Steps
1. List people, principles, and contributions you value.
2. Optional: glance at Ikigai prompts (what you love / are good at / world needs / can be paid for) as inspiration — not a rigid quiz.
3. Write one micro-action that moves toward a value this week.
## Reflect
What away-move usually pulls you off course?', 140),
  ('wb_strengths_spot', 'strengths_spotting', 'Values & Strengths', 'Strengths spotting',
   'Name signature strengths and apply one to a current workplace challenge.',
   10, 'Beginner', '## Steps
1. From a recent win, list 2–3 strengths you used.
2. Ask (or imagine) what a colleague would add.
3. Apply one strength to this week''s stuck task.
## Reflect
How did leading with strength change the task?', 150),
  ('wb_gratitude_savour', 'gratitude_and_savouring', 'Values & Strengths', 'Gratitude and savouring',
   'Practice noticing and lingering on positive moments without forcing fake positivity.',
   7, 'Beginner', '## Steps
1. Write three small things that went OK today.
2. Pick one to savour for 30 seconds (senses + meaning).
3. Optional: note a flow activity you could schedule.
## Reflect
What got in the way of noticing good moments?', 160),
  ('wb_growth_zone', 'growth_mindset', 'Values & Strengths', 'Entering your growth zone',
   'Distinguish comfort, growth, and panic zones; pick a stretch step that stays learnable.',
   8, 'Intermediate', '## Steps
1. Name a skill you are avoiding.
2. Place current practice in comfort / growth / panic.
3. Design a slightly smaller stretch that stays in growth.
## Reflect
What feedback will tell you it was the right size?', 170),
  ('wb_stress_window', 'stress_regulation', 'Stress & Regulation', 'Window of tolerance check-in',
   'Notice when you are wired or shut down and choose one regulation + one load-reduction move.',
   8, 'Intermediate', '## Steps
1. Where are you now — hyper, hypo, or OK?
2. Pick one body-based regulation (breath, ground, brief walk).
3. Pick one demand you can defer or delegate (circles of control).
## Reflect
What early warning sign will you watch for tomorrow?', 180),
  ('wb_spheres_control', 'circles_of_control', 'Stress & Regulation', 'Spheres of personal control',
   'Sort stressors into most / some / no control and aim effort where it counts.',
   8, 'Beginner', '## Steps
1. Brain-dump current stressors.
2. Place each in most / some / no control (use the infographic).
3. Choose one action only in the inner spheres.
## Reflect
What will you practice letting be outside your control?', 190),
  ('wb_boundaries_map', 'boundary_communication', 'Stress & Regulation', 'Seven types of boundaries',
   'Identify which boundary type is leaking and draft one clear sentence to protect it.',
   10, 'Intermediate', '## Steps
1. Review the seven boundary types on the infographic.
2. Mark which is most porous at work.
3. Draft one I-statement + when you will say it.
## Reflect
What fear shows up when you imagine saying it?', 200),
  ('wb_grounding_kit', 'grounding_and_breathing', 'Stress & Regulation', 'Personal grounding kit',
   'Build a short menu of grounding and breathing tools (5-4-3-2-1, SOBER, breath, PMR) for high-arousal moments.',
   8, 'Beginner', '## Steps
1. Try 5-4-3-2-1 once and note what helped.
2. Add one breath pattern you will remember under stress.
3. Optional: list comfort items for a personal HOPEBOX-style kit (signpost only — not a clinical safety plan).
## Audio (URLs TODO)
Diaphragmatic breathing; Dropping Anchor; S.O.B.E.R.; 5-4-3-2-1; PMR — titles only until hosted.
## Reflect
Which tool will you reach for first next time?', 210),
  ('wb_grief_support_map', 'grief_and_loss', 'Grief & Loss', 'Grief support map',
   'Gently map supports, needs, and next kind steps after a loss — coaching scope with NHS signposting.',
   12, 'Intermediate', '## Steps
1. Name the loss in your own words (no need for detail).
2. Who/what already supports you?
3. What would a kinder workday look like this week?
4. Note NHS bereavement / CNTW self-help if you want reading.
## Reflect
What do you need others to know without over-explaining?
ShiftED is not bereavement therapy.', 220),
  ('wb_opening_problem_list', 'problem_list_conceptualisation', 'Self-Reflection', 'Opening problem list',
   'List top challenges and conceptualise one (situation, trigger, thoughts, feelings, behaviours).',
   10, 'Beginner', '## Steps
1. List up to five current challenges.
2. Star the one that, if eased 10%, would help the others.
3. Map situation → trigger → hot thought → feeling → behaviour.
## Reflect
What is the smallest next question to explore with the coach?', 230),
  ('wb_sustainability_plan', 'sustainability_path', 'Wellbeing & Resilience', 'Sustainability coping plan',
   'After early progress, plan habits, warning signs, and recovery moves so change sticks.',
   12, 'Advanced', '## Steps
1. What progress are you protecting?
2. Early warning signs you are slipping?
3. Helpful coping vs unhelpful coping list.
4. One daily and one weekly sustaining habit.
## Reflect
Who can notice with you if warning signs appear?', 240)
on conflict (id) do update set
  skill_id = excluded.skill_id,
  ei_category = excluded.ei_category,
  title = excluded.title,
  description = excluded.description,
  duration_min = excluded.duration_min,
  level = excluded.level,
  body = excluded.body,
  sort_order = excluded.sort_order,
  updated_at = now();
