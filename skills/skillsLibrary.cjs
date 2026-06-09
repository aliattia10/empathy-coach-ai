/**
 * ShiftED skills library — Core (engine) vs Development/Activation (modules).
 * Injected into live LLM system prompt for all users.
 * Source: training playbook + May 2026 weekly meeting decisions.
 *
 * CommonJS (.cjs) because package.json has "type": "module".
 */

/** @typedef {"core" | "development_activation"} SkillCategory */
/** @typedef {1 | 2 | 3} PlatformPhase */

const SKILLS = [
  {
    id: "distancing",
    name: "Distancing",
    category: "core",
    platformPhase: 1,
    acronym: null,
    description:
      "Create psychological distance from automatic stress responses so the user can observe thoughts and feelings without fusing with them.",
    gapSignals: [
      "overwhelmed",
      "can't think straight",
      "spiralling",
      "everything feels urgent",
      "fused with the thought",
    ],
    whenToUse: "User is flooded or fused with distress; needs space before problem-solving.",
  },
  {
    id: "hcpr_thought_challenge",
    name: "Helpful Constructive Positive Real (HCPR) thought check",
    category: "core",
    platformPhase: 2,
    acronym: "HCPR",
    description:
      "Challenge unhelpful thoughts using helpful, constructive, positive, and real criteria — structured thought challenging.",
    gapSignals: [
      "negative automatic thought",
      "they always",
      "i'm useless",
      "catastrophising",
      "mind reading",
      "stuck on one thought",
    ],
    whenToUse: "A specific thought is blocking progress; user can name the thought.",
  },
  {
    id: "dtr",
    name: "Daily Thought Record (thought on trial)",
    category: "core",
    platformPhase: 2,
    acronym: "DTR",
    description:
      "Examine evidence for and against a hot thought, like putting a thought on trial — used when simpler checks are not enough.",
    gapSignals: [
      "same thought keeps returning",
      "need evidence",
      "not sure if it's true",
      "ruminating",
    ],
    whenToUse: "User needs structured evidence weighing for a recurring thought.",
  },
  {
    id: "cost_benefit",
    name: "Cost-benefit check",
    category: "core",
    platformPhase: 2,
    acronym: null,
    description:
      "Weigh short- and longer-term costs and benefits of believing an action or avoidance — a direct tool when user will not shift.",
    gapSignals: [
      "won't try",
      "what's the point",
      "avoiding because",
      "stuck choosing",
    ],
    whenToUse: "User is resistant or ambivalent; needs a concrete decision frame.",
  },
  {
    id: "circles_of_control",
    name: "Circles of control",
    category: "core",
    platformPhase: 3,
    acronym: null,
    description:
      "Sort what is within their control, influence, or outside control — creates distance from overwhelm and focuses effort.",
    gapSignals: [
      "can't control anything",
      "everything depends on others",
      "overwhelmed by uncertainty",
      "stuck worrying",
    ],
    whenToUse: "User is flooded by uncontrollable factors; Sustainability Pivot distancing tool.",
  },
  {
    id: "thinking_error_tracking",
    name: "Thinking error tracking",
    category: "core",
    platformPhase: 2,
    acronym: null,
    description:
      "Notice unhelpful thinking habits (mind reading, catastrophising, all-or-nothing) without lecturing — light structured awareness.",
    gapSignals: [
      "always happens",
      "they never",
      "worst case",
      "everyone thinks",
      "black and white",
    ],
    whenToUse: "Recurring distorted thoughts; pair with HCPR or DTR when needed.",
  },
  {
    id: "boundary_communication",
    name: "Boundary communication",
    category: "development_activation",
    platformPhase: 2,
    acronym: null,
    description:
      "Plan how to communicate a boundary clearly to a colleague, family member, or manager — what to say, when, and what rule it protects.",
    gapSignals: [
      "can't say no",
      "need to set a boundary",
      "always available",
      "they expect me to",
      "afraid to push back",
    ],
    whenToUse: "Phase Two micro-stepping for emotional intelligence and workplace boundaries.",
  },
  {
    id: "behavioral_activation",
    name: "Behavioural Activation",
    category: "development_activation",
    platformPhase: 2,
    acronym: "BA",
    description:
      "Plan valued activities and small approach steps to improve mood and momentum — linked to sustainability path.",
    gapSignals: [
      "not doing anything",
      "no motivation",
      "avoiding activities",
      "stuck at home",
      "procrastinating tasks",
    ],
    whenToUse: "Low activity, avoidance of valued tasks, need structured activation.",
  },
  {
    id: "micro_goals",
    name: "Micro goals",
    category: "development_activation",
    platformPhase: 2,
    acronym: null,
    description:
      "Break goals into very small, observable steps the user can attempt soon — plain language, not clinical scales.",
    gapSignals: [
      "goal too big",
      "don't know where to start",
      "overwhelmed by task",
      "can't begin",
    ],
    whenToUse: "User has a goal but cannot start; needs granular next step.",
  },
  {
    id: "sustainability_path",
    name: "Sustainability path skill",
    category: "development_activation",
    platformPhase: 3,
    acronym: null,
    description:
      "Module skills that support long-term habit and emotional regulation along the sustainability training path.",
    gapSignals: [
      "keep slipping back",
      "can't maintain",
      "started well then stopped",
    ],
    whenToUse: "User needs habituation after initial progress; sustainability focus.",
  },
  {
    id: "feedback_conversation",
    name: "Constructive feedback practice",
    category: "development_activation",
    platformPhase: 3,
    acronym: null,
    description:
      "Workplace scenario practice: situation, behaviour, impact, empathy — aligns with constructive feedback coaching.",
    gapSignals: [
      "difficult conversation",
      "feedback to team",
      "manager",
      "conflict at work",
    ],
    whenToUse: "User scenario is delivering or preparing difficult workplace feedback.",
  },
];

const ACRONYM_KEY = [
  { term: "BA", meaning: "Behavioural Activation (Development/Activation skill)" },
  { term: "HCPR", meaning: "Helpful, Constructive, Positive, Real — thought challenging toolkit" },
  { term: "DTR", meaning: "Daily Thought Record / thought on trial" },
  { term: "Core Skills", meaning: "Engine skills that run with conceptualisation (e.g. distancing, thought tools)" },
  {
    term: "Development/Activation Skills",
    meaning: "External modules applied in Phase 3 (e.g. BA, micro goals, sustainability path)",
  },
  { term: "Phase 1", meaning: "Person-centred conceptualisation (situation, trigger, beliefs, response)" },
  { term: "Phase 2", meaning: "Goal setting and planning" },
  { term: "Phase 3", meaning: "Skill application and practice" },
];

const SKILL_GAP_SUPER_PROMPT = `# Skills library — deploy with Adaptive Escalation Loop (all users)

## Skill categories
- **Core Skills (Sustainability / distancing):** distancing, HCPR, DTR, cost-benefit, circles of control. Deploy in Phase One conceptualisation, Phase Two when stuck, or in the **Sustainability Pivot Loop** when stress or failure blocks action.
- **Development/Activation Skills:** BA, micro goals, sustainability path, constructive feedback practice. Deploy in Phase Two micro-stepping and Phase Three execution — **not** when the user is flooded or has just failed a step (pivot to Core first).

## Detecting a skill gap (one skill per turn when appropriate)
Look for: avoidance, procrastination, fused distress, repeating negative thoughts, cannot start a goal, resistance to practice, execution failure since last login, loss of momentum/habit.
Map to **one** best-matching skill below. Name it in plain language once, then one question.

## Sustainability Pivot Loop — which skill to deploy
When Phase Three detects failure or high stress: halt BA / forward action; pick the Core Skill that best creates distance from the stress response. After stabilisation, Architectural Backtrack to Phase One, then Re-activation in Phase Two.

## Avoidance and learning preferences (critical)
- Do **not** let preferred modality become an excuse to skip difficult practice.
- Develop weak modalities; do not only reinforce strengths.
- Personalised learning-style matching is **not** active.

## When recommending a skill
- One skill; one sentence why it fits; one clear question.
- Never dump toolkits or acronym lists unless the user asks.`;

function formatSkillsForPrompt() {
  const core = SKILLS.filter((s) => s.category === "core");
  const dev = SKILLS.filter((s) => s.category === "development_activation");

  const formatSkill = (s) => {
    const signals = s.gapSignals.slice(0, 5).join("; ");
    return `- **${s.name}**${s.acronym ? ` (${s.acronym})` : ""} [${s.category}, Phase ${s.platformPhase}]: ${s.description} Gap cues: ${signals}.`;
  };

  return [
    SKILL_GAP_SUPER_PROMPT,
    "",
    "### Core Skills",
    ...core.map(formatSkill),
    "",
    "### Development/Activation Skills",
    ...dev.map(formatSkill),
    "",
    "### Acronym key (internal clarity; do not recite to user)",
    ...ACRONYM_KEY.map((a) => `- ${a.term}: ${a.meaning}`),
  ].join("\n");
}

module.exports = {
  SKILLS,
  ACRONYM_KEY,
  SKILL_GAP_SUPER_PROMPT,
  formatSkillsForPrompt,
};
