/** Client mirror of skills/workbooksLibrary.cjs — keep ids in sync with public.workbooks. */

export type WorkbookLevel = "Beginner" | "Intermediate" | "Advanced";

export type WorkbookDefinition = {
  id: string;
  eiCategory: string;
  title: string;
  description: string;
  durationMin: number;
  level: WorkbookLevel;
  skillId?: string | null;
  image?: string | null;
  body?: string | null;
};

export const EI_CATEGORIES = [
  "Active Listening",
  "Empathy",
  "Perspective-Taking",
  "Curious Questioning",
  "Emotional Regulation",
  "Cultural Humility",
  "Conflict Navigation",
  "Self-Reflection",
  "Wellbeing & Resilience",
  "Values & Strengths",
  "Stress & Regulation",
  "Grief & Loss",
] as const;

export type EiCategory = (typeof EI_CATEGORIES)[number];

export const WORKBOOK_CATALOGUE: WorkbookDefinition[] = 
[
  {
    "id": "wb_active_listening",
    "eiCategory": "Active Listening",
    "title": "Active Listening Basics",
    "description": "Practice fully attending to what someone shares before responding, rather than preparing your reply.",
    "durationMin": 5,
    "level": "Beginner",
    "skillId": null,
    "image": null,
    "body": "## Steps\n1. Pick a recent conversation where you jumped to advice.\n2. Write what they said (content) and what they might have felt.\n3. Draft one reflection + one open question you could use next time.\n## Reflect\nWhat changed when you slowed down?"
  },
  {
    "id": "wb_naming_emotions",
    "eiCategory": "Empathy",
    "title": "Naming Emotions with Empathy",
    "description": "Build the muscle of recognising and naming the emotion behind someone's words before responding to the content.",
    "durationMin": 7,
    "level": "Beginner",
    "skillId": null,
    "image": "/infographics/feeling-wheel.webp",
    "body": "## Steps\n1. Use the feeling wheel (or screenshot) to move from a vague word (\"bad\") to a more precise feeling.\n2. Name your own feeling in a current work situation.\n3. Guess a colleague's feeling in one recent exchange — check assumptions gently.\n## Reflect\nWhich precise feeling word was hardest to own?"
  },
  {
    "id": "wb_perspective_taking",
    "eiCategory": "Perspective-Taking",
    "title": "Walking in Their Shoes (Perspective-Taking)",
    "description": "Step into the other person's lived experience to better understand the context behind their views.",
    "durationMin": 10,
    "level": "Intermediate",
    "skillId": null,
    "image": null,
    "body": "## Steps\n1. Choose a disagreement at work.\n2. Write their likely pressures, fears, and goals in their words.\n3. Note one thing you might have missed from your seat.\n## Reflect\nWhat would you do differently in the next conversation?"
  },
  {
    "id": "wb_curious_questioning",
    "eiCategory": "Curious Questioning",
    "title": "Asking Open, Curious Questions (Curious Questioning)",
    "description": "Replace assumptions and yes/no questions with open prompts that invite genuine sharing.",
    "durationMin": 5,
    "level": "Beginner",
    "skillId": null,
    "image": null,
    "body": "## Steps\n1. List three closed questions you used recently.\n2. Rewrite each as an open prompt (what/how).\n3. Try one in a low-stakes chat today.\n## Reflect\nWhat did you learn that you would have missed?"
  },
  {
    "id": "wb_emotional_regulation",
    "eiCategory": "Emotional Regulation",
    "title": "Pause Before Reacting (Emotional Regulation)",
    "description": "Build a brief space between feeling triggered and responding, so your reply matches your intention.",
    "durationMin": 5,
    "level": "Intermediate",
    "skillId": "grounding_and_breathing",
    "image": null,
    "body": "## Steps\n1. Name a trigger situation.\n2. Choose one pause tool (box breath, 5-4-3-2-1, or Dropping Anchor).\n3. Script the first sentence you will say after the pause.\n## Reflect\nDid the pause change the tone of your reply?"
  },
  {
    "id": "wb_cultural_humility",
    "eiCategory": "Cultural Humility",
    "title": "Cultural Humility Practice",
    "description": "Approach unfamiliar identities and experiences as a learner rather than an expert.",
    "durationMin": 8,
    "level": "Intermediate",
    "skillId": null,
    "image": null,
    "body": "## Steps\n1. Recall a moment you assumed sameness.\n2. Write one curious question you could have asked instead.\n3. Note a help-seeking or expression norm that may differ from yours.\n## Reflect\nWhere will you stay a learner this week?"
  },
  {
    "id": "wb_conflict_navigation",
    "eiCategory": "Conflict Navigation",
    "title": "Staying in Hard Conversations (Conflict Navigation)",
    "description": "Practice staying engaged when a conversation feels tense, instead of withdrawing or escalating.",
    "durationMin": 8,
    "level": "Intermediate",
    "skillId": "feedback_conversation",
    "image": null,
    "body": "## Steps\n1. Name the hard conversation you are avoiding.\n2. Draft situation–behaviour–impact in plain language.\n3. Add one empathy line and one clear ask.\n## Reflect\nWhat would \"staying\" look like for 10 more minutes?"
  },
  {
    "id": "wb_self_reflection",
    "eiCategory": "Self-Reflection",
    "title": "Reflecting on Your Reactions (Self-Reflection)",
    "description": "Turn attention inward to notice what your reactions reveal about your own beliefs and history.",
    "durationMin": 7,
    "level": "Beginner",
    "skillId": null,
    "image": null,
    "body": "## Steps\n1. Pick a strong reaction from this week.\n2. What story did you tell yourself (hot thought)?\n3. What need was underneath?\n## Reflect\nWhat will you watch for next time the same trigger appears?"
  },
  {
    "id": "wb_wellbeing_lens",
    "eiCategory": "Wellbeing & Resilience",
    "title": "My wellbeing lens",
    "description": "Build a personal wellbeing vocabulary: what wellbeing means to you, daily needs, and who you are when you are well.",
    "durationMin": 12,
    "level": "Beginner",
    "skillId": "values_clarification",
    "image": "/infographics/self-care-wheel.webp",
    "body": "## Steps\n1. What does wellbeing mean to you (your lens)?\n2. List daily needs that keep you well.\n3. Who are you when you are well (3 words)?\n4. Glance at the self-care wheel — pick one neglected spoke for this week.\n## Reflect\nWhat is one small act that protects that spoke?"
  },
  {
    "id": "wb_self_care_dimensions",
    "eiCategory": "Wellbeing & Resilience",
    "title": "Five dimensions of self-care",
    "description": "Scan physical, psychological, emotional, spiritual, and professional self-care — choose one upgrade.",
    "durationMin": 10,
    "level": "Beginner",
    "skillId": "stress_regulation",
    "image": "/infographics/5-dimensions-self-care.webp",
    "body": "## Steps\n1. Rate each dimension 1–10 using the infographic as a prompt.\n2. Circle the lowest score.\n3. Design a 10-minute action for that dimension this week.\n## Reflect\nWhat usually blocks this kind of care?"
  },
  {
    "id": "wb_adaptive_coping",
    "eiCategory": "Wellbeing & Resilience",
    "title": "Adaptive coping wheel",
    "description": "Browse adaptive coping strategies for difficult times and pick two you will actually try.",
    "durationMin": 8,
    "level": "Beginner",
    "skillId": "stress_regulation",
    "image": "/infographics/adaptive-coping-wheel.webp",
    "body": "## Steps\n1. Name the difficult situation.\n2. From the coping wheel, choose one soothing and one problem-focused strategy.\n3. Schedule when you will use each.\n## Reflect\nWhich unhelpful coping will these replace?"
  },
  {
    "id": "wb_job_satisfaction",
    "eiCategory": "Wellbeing & Resilience",
    "title": "Job satisfaction wheel",
    "description": "Map facets of job satisfaction and identify one lever you can influence.",
    "durationMin": 10,
    "level": "Intermediate",
    "skillId": "circles_of_control",
    "image": "/infographics/job-satisfaction-wheel.webp",
    "body": "## Steps\n1. Score each spoke of the job satisfaction wheel.\n2. Mark which are in your control / influence / outside.\n3. Pick one influence spoke for a micro-experiment.\n## Reflect\nWhat will you try before changing jobs or burning out?"
  },
  {
    "id": "wb_pleasure_mastery",
    "eiCategory": "Wellbeing & Resilience",
    "title": "Pleasure vs mastery planner",
    "description": "Schedule balanced activities that bring enjoyment and a sense of accomplishment — core behavioural activation practice.",
    "durationMin": 10,
    "level": "Beginner",
    "skillId": "behavioral_activation",
    "image": null,
    "body": "## Steps\n1. List 3 pleasure activities and 3 mastery activities (tiny is fine).\n2. Place one of each in tomorrow's calendar with a time.\n3. Rate mood before/after 1–10.\n## Reflect\nDid avoidance (e.g. scrolling) try to steal the slot?"
  },
  {
    "id": "wb_values_compass",
    "eiCategory": "Values & Strengths",
    "title": "Values compass",
    "description": "Clarify what matters most and set one values-based micro-goal.",
    "durationMin": 12,
    "level": "Intermediate",
    "skillId": "values_clarification",
    "image": "/infographics/ikigai.webp",
    "body": "## Steps\n1. List people, principles, and contributions you value.\n2. Optional: glance at Ikigai prompts (what you love / are good at / world needs / can be paid for) as inspiration — not a rigid quiz.\n3. Write one micro-action that moves toward a value this week.\n## Reflect\nWhat away-move usually pulls you off course?"
  },
  {
    "id": "wb_strengths_spot",
    "eiCategory": "Values & Strengths",
    "title": "Strengths spotting",
    "description": "Name signature strengths and apply one to a current workplace challenge.",
    "durationMin": 10,
    "level": "Beginner",
    "skillId": "strengths_spotting",
    "image": "/infographics/character-strengths-wheel.webp",
    "body": "## Steps\n1. From a recent win, list 2–3 strengths you used.\n2. Ask (or imagine) what a colleague would add.\n3. Apply one strength to this week's stuck task.\n## Reflect\nHow did leading with strength change the task?"
  },
  {
    "id": "wb_gratitude_savour",
    "eiCategory": "Values & Strengths",
    "title": "Gratitude and savouring",
    "description": "Practice noticing and lingering on positive moments without forcing fake positivity.",
    "durationMin": 7,
    "level": "Beginner",
    "skillId": "gratitude_and_savouring",
    "image": "/infographics/reflecting-on-happiness.webp",
    "body": "## Steps\n1. Write three small things that went OK today.\n2. Pick one to savour for 30 seconds (senses + meaning).\n3. Optional: note a flow activity you could schedule.\n## Reflect\nWhat got in the way of noticing good moments?"
  },
  {
    "id": "wb_growth_zone",
    "eiCategory": "Values & Strengths",
    "title": "Entering your growth zone",
    "description": "Distinguish comfort, growth, and panic zones; pick a stretch step that stays learnable.",
    "durationMin": 8,
    "level": "Intermediate",
    "skillId": "growth_mindset",
    "image": "/infographics/entering-growth-zone.webp",
    "body": "## Steps\n1. Name a skill you are avoiding.\n2. Place current practice in comfort / growth / panic.\n3. Design a slightly smaller stretch that stays in growth.\n## Reflect\nWhat feedback will tell you it was the right size?"
  },
  {
    "id": "wb_stress_window",
    "eiCategory": "Stress & Regulation",
    "title": "Window of tolerance check-in",
    "description": "Notice when you are wired or shut down and choose one regulation + one load-reduction move.",
    "durationMin": 8,
    "level": "Intermediate",
    "skillId": "stress_regulation",
    "image": null,
    "body": "## Steps\n1. Where are you now — hyper, hypo, or OK?\n2. Pick one body-based regulation (breath, ground, brief walk).\n3. Pick one demand you can defer or delegate (circles of control).\n## Reflect\nWhat early warning sign will you watch for tomorrow?"
  },
  {
    "id": "wb_spheres_control",
    "eiCategory": "Stress & Regulation",
    "title": "Spheres of personal control",
    "description": "Sort stressors into most / some / no control and aim effort where it counts.",
    "durationMin": 8,
    "level": "Beginner",
    "skillId": "circles_of_control",
    "image": "/infographics/spheres-of-personal-control.webp",
    "body": "## Steps\n1. Brain-dump current stressors.\n2. Place each in most / some / no control (use the infographic).\n3. Choose one action only in the inner spheres.\n## Reflect\nWhat will you practice letting be outside your control?"
  },
  {
    "id": "wb_boundaries_map",
    "eiCategory": "Stress & Regulation",
    "title": "Seven types of boundaries",
    "description": "Identify which boundary type is leaking and draft one clear sentence to protect it.",
    "durationMin": 10,
    "level": "Intermediate",
    "skillId": "boundary_communication",
    "image": "/infographics/7-types-of-boundaries.webp",
    "body": "## Steps\n1. Review the seven boundary types on the infographic.\n2. Mark which is most porous at work.\n3. Draft one I-statement + when you will say it.\n## Reflect\nWhat fear shows up when you imagine saying it?"
  },
  {
    "id": "wb_grounding_kit",
    "eiCategory": "Stress & Regulation",
    "title": "Personal grounding kit",
    "description": "Build a short menu of grounding and breathing tools (5-4-3-2-1, SOBER, breath, PMR) for high-arousal moments.",
    "durationMin": 8,
    "level": "Beginner",
    "skillId": "grounding_and_breathing",
    "image": null,
    "body": "## Steps\n1. Try 5-4-3-2-1 once and note what helped.\n2. Add one breath pattern you will remember under stress.\n3. Optional: list comfort items for a personal HOPEBOX-style kit (signpost only — not a clinical safety plan).\n## Audio (URLs TODO)\nDiaphragmatic breathing; Dropping Anchor; S.O.B.E.R.; 5-4-3-2-1; PMR — titles only until hosted.\n## Reflect\nWhich tool will you reach for first next time?"
  },
  {
    "id": "wb_grief_support_map",
    "eiCategory": "Grief & Loss",
    "title": "Grief support map",
    "description": "Gently map supports, needs, and next kind steps after a loss — coaching scope with NHS signposting.",
    "durationMin": 12,
    "level": "Intermediate",
    "skillId": "grief_and_loss",
    "image": null,
    "body": "## Steps\n1. Name the loss in your own words (no need for detail).\n2. Who/what already supports you?\n3. What would a kinder workday look like this week?\n4. Note NHS bereavement / CNTW self-help if you want reading.\n## Reflect\nWhat do you need others to know without over-explaining?\nShiftED is not bereavement therapy."
  },
  {
    "id": "wb_opening_problem_list",
    "eiCategory": "Self-Reflection",
    "title": "Opening problem list",
    "description": "List top challenges and conceptualise one (situation, trigger, thoughts, feelings, behaviours).",
    "durationMin": 10,
    "level": "Beginner",
    "skillId": "problem_list_conceptualisation",
    "image": null,
    "body": "## Steps\n1. List up to five current challenges.\n2. Star the one that, if eased 10%, would help the others.\n3. Map situation → trigger → hot thought → feeling → behaviour.\n## Reflect\nWhat is the smallest next question to explore with the coach?"
  },
  {
    "id": "wb_sustainability_plan",
    "eiCategory": "Wellbeing & Resilience",
    "title": "Sustainability coping plan",
    "description": "After early progress, plan habits, warning signs, and recovery moves so change sticks.",
    "durationMin": 12,
    "level": "Advanced",
    "skillId": "sustainability_path",
    "image": null,
    "body": "## Steps\n1. What progress are you protecting?\n2. Early warning signs you are slipping?\n3. Helpful coping vs unhelpful coping list.\n4. One daily and one weekly sustaining habit.\n## Reflect\nWho can notice with you if warning signs appear?"
  }
];

export const WORKBOOK_BY_ID = Object.fromEntries(
  WORKBOOK_CATALOGUE.map((w) => [w.id, w]),
) as Record<string, WorkbookDefinition>;

export function isKnownWorkbookId(id: string): boolean {
  return id in WORKBOOK_BY_ID;
}

export type UserWorkbookStatus = "added" | "in_progress" | "completed" | "skipped";
