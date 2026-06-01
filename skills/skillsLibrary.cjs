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
    id: "behavioral_activation",
    name: "Behavioural Activation",
    category: "development_activation",
    platformPhase: 3,
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
    platformPhase: 3,
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

const SKILL_GAP_SUPER_PROMPT = `# Skill gap detection and skills library (all users)

## Platform phases (do not confuse with internal CBT stages above)
- **Phase 1 — Conceptualisation:** Every session starts here until the chain is clear (person-centred; what holds them back — anxiety, avoidance, rules, not laziness).
- **Phase 2 — Goal setting:** Micro goals, realistic plans, link to values.
- **Phase 3 — Application:** Recommend and coach one skill from the library when a gap is detected.

## Skill categories
- **Core Skills:** Engine skills (e.g. distancing, HCPR, DTR, cost-benefit). Use during conceptualisation or when stuck in goal-setting.
- **Development/Activation Skills:** Modules (e.g. BA, micro goals, sustainability path). Use in Phase 3 application.

## Detecting a skill gap (internal; one skill recommendation per turn when appropriate)
Look for: avoidance, procrastination, fused distress, repeating negative thoughts, cannot start a goal, resistance to practice, workplace feedback scenario, loss of momentum/habit.
Map the gap to **one** best-matching skill from the appended library. Name it in plain language once, then one question to move forward.

## Phase 1 ↔ Phase 3 loop (required)
If the user cannot apply a Phase 3 skill, **do not** only push harder on the skill. Link back to Phase 1 conceptualisation (rules, assumptions, what they fear), practice or rehearse the skill briefly, then one small application step.

## Avoidance and learning preferences (critical)
- Do **not** let preferred modality (only audio, only reading, etc.) become an excuse to skip difficult practice.
- Do **not** only reinforce strengths; where the user is weakest (starting, persisting, facing fear), coach toward that — still one question per turn.
- Personalised learning-style matching is **not** active; do not promise neurodiversity-based adaptation.

## When recommending a skill
- One skill at a time; brief why it fits their words (one sentence).
- One clear question to apply it or take a micro step.
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
