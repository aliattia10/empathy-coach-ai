/**
 * Phase 3 Development Skills workbooks.
 * IDs must match public.workbooks — coach may only recommend these ids.
 * Expanded with ShiftedAI Resources wellbeing / stress / values / grief practices.
 */

const WORKBOOKS = [
  {
    id: "wb_active_listening",
    eiCategory: "Active Listening",
    title: "Active Listening Basics",
    description:
      "Practice fully attending to what someone shares before responding, rather than preparing your reply.",
    durationMin: 5,
    level: "Beginner",
    skillId: null,
    image: null,
    body: `## Steps
1. Pick a recent conversation where you jumped to advice.
2. Write what they said (content) and what they might have felt.
3. Draft one reflection + one open question you could use next time.
## Reflect
What changed when you slowed down?`,
  },
  {
    id: "wb_naming_emotions",
    eiCategory: "Empathy",
    title: "Naming Emotions with Empathy",
    description:
      "Build the muscle of recognising and naming the emotion behind someone's words before responding to the content.",
    durationMin: 7,
    level: "Beginner",
    skillId: null,
    image: "/infographics/feeling-wheel.webp",
    body: `## Steps
1. Use the feeling wheel (or screenshot) to move from a vague word ("bad") to a more precise feeling.
2. Name your own feeling in a current work situation.
3. Guess a colleague's feeling in one recent exchange — check assumptions gently.
## Reflect
Which precise feeling word was hardest to own?`,
  },
  {
    id: "wb_perspective_taking",
    eiCategory: "Perspective-Taking",
    title: "Walking in Their Shoes (Perspective-Taking)",
    description:
      "Step into the other person's lived experience to better understand the context behind their views.",
    durationMin: 10,
    level: "Intermediate",
    skillId: null,
    image: null,
    body: `## Steps
1. Choose a disagreement at work.
2. Write their likely pressures, fears, and goals in their words.
3. Note one thing you might have missed from your seat.
## Reflect
What would you do differently in the next conversation?`,
  },
  {
    id: "wb_curious_questioning",
    eiCategory: "Curious Questioning",
    title: "Asking Open, Curious Questions (Curious Questioning)",
    description:
      "Replace assumptions and yes/no questions with open prompts that invite genuine sharing.",
    durationMin: 5,
    level: "Beginner",
    skillId: null,
    image: null,
    body: `## Steps
1. List three closed questions you used recently.
2. Rewrite each as an open prompt (what/how).
3. Try one in a low-stakes chat today.
## Reflect
What did you learn that you would have missed?`,
  },
  {
    id: "wb_emotional_regulation",
    eiCategory: "Emotional Regulation",
    title: "Pause Before Reacting (Emotional Regulation)",
    description:
      "Build a brief space between feeling triggered and responding, so your reply matches your intention.",
    durationMin: 5,
    level: "Intermediate",
    skillId: "grounding_and_breathing",
    image: null,
    body: `## Steps
1. Name a trigger situation.
2. Choose one pause tool (box breath, 5-4-3-2-1, or Dropping Anchor).
3. Script the first sentence you will say after the pause.
## Reflect
Did the pause change the tone of your reply?`,
  },
  {
    id: "wb_cultural_humility",
    eiCategory: "Cultural Humility",
    title: "Cultural Humility Practice",
    description:
      "Approach unfamiliar identities and experiences as a learner rather than an expert.",
    durationMin: 8,
    level: "Intermediate",
    skillId: null,
    image: null,
    body: `## Steps
1. Recall a moment you assumed sameness.
2. Write one curious question you could have asked instead.
3. Note a help-seeking or expression norm that may differ from yours.
## Reflect
Where will you stay a learner this week?`,
  },
  {
    id: "wb_conflict_navigation",
    eiCategory: "Conflict Navigation",
    title: "Staying in Hard Conversations (Conflict Navigation)",
    description:
      "Practice staying engaged when a conversation feels tense, instead of withdrawing or escalating.",
    durationMin: 8,
    level: "Intermediate",
    skillId: "feedback_conversation",
    image: null,
    body: `## Steps
1. Name the hard conversation you are avoiding.
2. Draft situation–behaviour–impact in plain language.
3. Add one empathy line and one clear ask.
## Reflect
What would "staying" look like for 10 more minutes?`,
  },
  {
    id: "wb_self_reflection",
    eiCategory: "Self-Reflection",
    title: "Reflecting on Your Reactions (Self-Reflection)",
    description:
      "Turn attention inward to notice what your reactions reveal about your own beliefs and history.",
    durationMin: 7,
    level: "Beginner",
    skillId: null,
    image: null,
    body: `## Steps
1. Pick a strong reaction from this week.
2. What story did you tell yourself (hot thought)?
3. What need was underneath?
## Reflect
What will you watch for next time the same trigger appears?`,
  },
  // New categories from ShiftedAI Resources
  {
    id: "wb_wellbeing_lens",
    eiCategory: "Wellbeing & Resilience",
    title: "My wellbeing lens",
    description:
      "Build a personal wellbeing vocabulary: what wellbeing means to you, daily needs, and who you are when you are well.",
    durationMin: 12,
    level: "Beginner",
    skillId: "values_clarification",
    image: "/infographics/self-care-wheel.webp",
    body: `## Steps
1. What does wellbeing mean to you (your lens)?
2. List daily needs that keep you well.
3. Who are you when you are well (3 words)?
4. Glance at the self-care wheel — pick one neglected spoke for this week.
## Reflect
What is one small act that protects that spoke?`,
  },
  {
    id: "wb_self_care_dimensions",
    eiCategory: "Wellbeing & Resilience",
    title: "Five dimensions of self-care",
    description:
      "Scan physical, psychological, emotional, spiritual, and professional self-care — choose one upgrade.",
    durationMin: 10,
    level: "Beginner",
    skillId: "stress_regulation",
    image: "/infographics/5-dimensions-self-care.webp",
    body: `## Steps
1. Rate each dimension 1–10 using the infographic as a prompt.
2. Circle the lowest score.
3. Design a 10-minute action for that dimension this week.
## Reflect
What usually blocks this kind of care?`,
  },
  {
    id: "wb_adaptive_coping",
    eiCategory: "Wellbeing & Resilience",
    title: "Adaptive coping wheel",
    description:
      "Browse adaptive coping strategies for difficult times and pick two you will actually try.",
    durationMin: 8,
    level: "Beginner",
    skillId: "stress_regulation",
    image: "/infographics/adaptive-coping-wheel.webp",
    body: `## Steps
1. Name the difficult situation.
2. From the coping wheel, choose one soothing and one problem-focused strategy.
3. Schedule when you will use each.
## Reflect
Which unhelpful coping will these replace?`,
  },
  {
    id: "wb_job_satisfaction",
    eiCategory: "Wellbeing & Resilience",
    title: "Job satisfaction wheel",
    description:
      "Map facets of job satisfaction and identify one lever you can influence.",
    durationMin: 10,
    level: "Intermediate",
    skillId: "circles_of_control",
    image: "/infographics/job-satisfaction-wheel.webp",
    body: `## Steps
1. Score each spoke of the job satisfaction wheel.
2. Mark which are in your control / influence / outside.
3. Pick one influence spoke for a micro-experiment.
## Reflect
What will you try before changing jobs or burning out?`,
  },
  {
    id: "wb_pleasure_mastery",
    eiCategory: "Wellbeing & Resilience",
    title: "Pleasure vs mastery planner",
    description:
      "Schedule balanced activities that bring enjoyment and a sense of accomplishment — core behavioural activation practice.",
    durationMin: 10,
    level: "Beginner",
    skillId: "behavioral_activation",
    image: null,
    body: `## Steps
1. List 3 pleasure activities and 3 mastery activities (tiny is fine).
2. Place one of each in tomorrow's calendar with a time.
3. Rate mood before/after 1–10.
## Reflect
Did avoidance (e.g. scrolling) try to steal the slot?`,
  },
  {
    id: "wb_values_compass",
    eiCategory: "Values & Strengths",
    title: "Values compass",
    description:
      "Clarify what matters most and set one values-based micro-goal.",
    durationMin: 12,
    level: "Intermediate",
    skillId: "values_clarification",
    image: "/infographics/ikigai.webp",
    body: `## Steps
1. List people, principles, and contributions you value.
2. Optional: glance at Ikigai prompts (what you love / are good at / world needs / can be paid for) as inspiration — not a rigid quiz.
3. Write one micro-action that moves toward a value this week.
## Reflect
What away-move usually pulls you off course?`,
  },
  {
    id: "wb_strengths_spot",
    eiCategory: "Values & Strengths",
    title: "Strengths spotting",
    description:
      "Name signature strengths and apply one to a current workplace challenge.",
    durationMin: 10,
    level: "Beginner",
    skillId: "strengths_spotting",
    image: "/infographics/character-strengths-wheel.webp",
    body: `## Steps
1. From a recent win, list 2–3 strengths you used.
2. Ask (or imagine) what a colleague would add.
3. Apply one strength to this week's stuck task.
## Reflect
How did leading with strength change the task?`,
  },
  {
    id: "wb_gratitude_savour",
    eiCategory: "Values & Strengths",
    title: "Gratitude and savouring",
    description:
      "Practice noticing and lingering on positive moments without forcing fake positivity.",
    durationMin: 7,
    level: "Beginner",
    skillId: "gratitude_and_savouring",
    image: "/infographics/reflecting-on-happiness.webp",
    body: `## Steps
1. Write three small things that went OK today.
2. Pick one to savour for 30 seconds (senses + meaning).
3. Optional: note a flow activity you could schedule.
## Reflect
What got in the way of noticing good moments?`,
  },
  {
    id: "wb_growth_zone",
    eiCategory: "Values & Strengths",
    title: "Entering your growth zone",
    description:
      "Distinguish comfort, growth, and panic zones; pick a stretch step that stays learnable.",
    durationMin: 8,
    level: "Intermediate",
    skillId: "growth_mindset",
    image: "/infographics/entering-growth-zone.webp",
    body: `## Steps
1. Name a skill you are avoiding.
2. Place current practice in comfort / growth / panic.
3. Design a slightly smaller stretch that stays in growth.
## Reflect
What feedback will tell you it was the right size?`,
  },
  {
    id: "wb_stress_window",
    eiCategory: "Stress & Regulation",
    title: "Window of tolerance check-in",
    description:
      "Notice when you are wired or shut down and choose one regulation + one load-reduction move.",
    durationMin: 8,
    level: "Intermediate",
    skillId: "stress_regulation",
    image: null,
    body: `## Steps
1. Where are you now — hyper, hypo, or OK?
2. Pick one body-based regulation (breath, ground, brief walk).
3. Pick one demand you can defer or delegate (circles of control).
## Reflect
What early warning sign will you watch for tomorrow?`,
  },
  {
    id: "wb_spheres_control",
    eiCategory: "Stress & Regulation",
    title: "Spheres of personal control",
    description:
      "Sort stressors into most / some / no control and aim effort where it counts.",
    durationMin: 8,
    level: "Beginner",
    skillId: "circles_of_control",
    image: "/infographics/spheres-of-personal-control.webp",
    body: `## Steps
1. Brain-dump current stressors.
2. Place each in most / some / no control (use the infographic).
3. Choose one action only in the inner spheres.
## Reflect
What will you practice letting be outside your control?`,
  },
  {
    id: "wb_boundaries_map",
    eiCategory: "Stress & Regulation",
    title: "Seven types of boundaries",
    description:
      "Identify which boundary type is leaking and draft one clear sentence to protect it.",
    durationMin: 10,
    level: "Intermediate",
    skillId: "boundary_communication",
    image: "/infographics/7-types-of-boundaries.webp",
    body: `## Steps
1. Review the seven boundary types on the infographic.
2. Mark which is most porous at work.
3. Draft one I-statement + when you will say it.
## Reflect
What fear shows up when you imagine saying it?`,
  },
  {
    id: "wb_grounding_kit",
    eiCategory: "Stress & Regulation",
    title: "Personal grounding kit",
    description:
      "Build a short menu of grounding and breathing tools (5-4-3-2-1, SOBER, breath, PMR) for high-arousal moments.",
    durationMin: 8,
    level: "Beginner",
    skillId: "grounding_and_breathing",
    image: null,
    body: `## Steps
1. Try 5-4-3-2-1 once and note what helped.
2. Add one breath pattern you will remember under stress.
3. Optional: list comfort items for a personal HOPEBOX-style kit (signpost only — not a clinical safety plan).
## Audio (URLs TODO)
Diaphragmatic breathing; Dropping Anchor; S.O.B.E.R.; 5-4-3-2-1; PMR — titles only until hosted.
## Reflect
Which tool will you reach for first next time?`,
  },
  {
    id: "wb_grief_support_map",
    eiCategory: "Grief & Loss",
    title: "Grief support map",
    description:
      "Gently map supports, needs, and next kind steps after a loss — coaching scope with NHS signposting.",
    durationMin: 12,
    level: "Intermediate",
    skillId: "grief_and_loss",
    image: null,
    body: `## Steps
1. Name the loss in your own words (no need for detail).
2. Who/what already supports you?
3. What would a kinder workday look like this week?
4. Note NHS bereavement / CNTW self-help if you want reading.
## Reflect
What do you need others to know without over-explaining?
ShiftED is not bereavement therapy.`,
  },
  {
    id: "wb_opening_problem_list",
    eiCategory: "Self-Reflection",
    title: "Opening problem list",
    description:
      "List top challenges and conceptualise one (situation, trigger, thoughts, feelings, behaviours).",
    durationMin: 10,
    level: "Beginner",
    skillId: "problem_list_conceptualisation",
    image: null,
    body: `## Steps
1. List up to five current challenges.
2. Star the one that, if eased 10%, would help the others.
3. Map situation → trigger → hot thought → feeling → behaviour.
## Reflect
What is the smallest next question to explore with the coach?`,
  },
  {
    id: "wb_sustainability_plan",
    eiCategory: "Wellbeing & Resilience",
    title: "Sustainability coping plan",
    description:
      "After early progress, plan habits, warning signs, and recovery moves so change sticks.",
    durationMin: 12,
    level: "Advanced",
    skillId: "sustainability_path",
    image: null,
    body: `## Steps
1. What progress are you protecting?
2. Early warning signs you are slipping?
3. Helpful coping vs unhelpful coping list.
4. One daily and one weekly sustaining habit.
## Reflect
Who can notice with you if warning signs appear?`,
  },
];

const WORKBOOK_IDS = new Set(WORKBOOKS.map((w) => w.id));

function formatWorkbooksForPrompt(opts = {}) {
  const condensed = !!opts.condensed;

  if (condensed) {
    const ids = WORKBOOKS.map((w) => w.id).join(", ");
    return [
      "# Workbooks (recommend by id only; at most one [[WORKBOOK]] block)",
      `\`[[WORKBOOK]]{"id":"<id>","reason":"…"}[[/WORKBOOK]]\``,
      `Ids: ${ids}`,
    ].join("\n");
  }

  const list = WORKBOOKS.map(
    (w) =>
      `- ${w.id} | ${w.eiCategory} | ${w.title} (${w.durationMin} min, ${w.level}): ${w.description}`,
  ).join("\n");

  const header = `# Development Skills workbooks (Phase 3 — Integration & Action)
These workbooks are the Tools to Develop Emotional Intelligence + wellbeing library.
When you identify a skill gap that a workbook addresses, briefly name the skill in natural language
then emit ONE machine block on its own line at the end (after [[PROGRESS]] if present, or alone):
\`[[WORKBOOK]]{"id":"<exact_id_from_list>","reason":"one short sentence"}[[/WORKBOOK]]\`
Rules:
- id MUST be an exact id from the catalogue below — never free-text workbook names.
- At most one [[WORKBOOK]] block per reply.
- The user always chooses: Add to Profile / Skip for now / Start Now. Never force practice.
- ShiftED is not therapy.
- Prefer recommending when Phase Three check-in or action practice reveals a clear gap.
- After a workbook or goal completion, reference their outcome and reflection in the next check-in (Feedback Loop — product definition still open).`;

  return `${header}\n\nCatalogue:\n${list}`;
}

function formatUserWorkbookStateForPrompt(state) {
  if (!state || typeof state !== "object") return "";
  const lines = [];
  const open = Array.isArray(state.openWorkbooks) ? state.openWorkbooks : [];
  const completed = Array.isArray(state.completedWorkbooks) ? state.completedWorkbooks : [];
  const recent = Array.isArray(state.recentReflections) ? state.recentReflections : [];

  if (open.length === 0 && completed.length === 0 && recent.length === 0) return "";

  lines.push("# User practice state (Phase 3 tools — internal)");
  if (open.length) {
    lines.push("Open / in-progress workbooks:");
    for (const w of open) {
      lines.push(`  - ${w.id || w.workbook_id}: ${w.status || "added"}${w.title ? ` (${w.title})` : ""}`);
    }
  }
  if (completed.length) {
    lines.push("Recently completed workbooks (reference in check-in / feedback loop):");
    for (const w of completed.slice(0, 5)) {
      const rating = typeof w.completion_rating === "number" ? ` rating ${w.completion_rating}/10` : "";
      const desc = w.completion_description ? ` — ${String(w.completion_description).slice(0, 120)}` : "";
      lines.push(`  - ${w.id || w.workbook_id}${rating}${desc}`);
    }
  }
  if (recent.length) {
    lines.push("Recent Reflection Moment answers:");
    for (const r of recent.slice(0, 3)) {
      if (r.skipped) lines.push("  - (skipped)");
      else if (r.answer) lines.push(`  - ${String(r.answer).slice(0, 160)}`);
    }
  }
  return lines.join("\n");
}

module.exports = {
  WORKBOOKS,
  WORKBOOK_IDS,
  formatWorkbooksForPrompt,
  formatUserWorkbookStateForPrompt,
};
