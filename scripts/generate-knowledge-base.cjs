/**
 * Generates adapted knowledge-base markdown docs + index.json from ShiftedAI Resources inventory.
 * Content is paraphrased coaching summaries (not verbatim copyrighted worksheets).
 * Run: node scripts/generate-knowledge-base.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const KB = path.join(ROOT, "knowledge-base");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function yamlHeader(meta) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(meta)) {
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.map((x) => JSON.stringify(x)).join(", ")}]`);
    } else if (typeof v === "string") {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function writeDoc(relPath, meta, body) {
  const full = path.join(KB, relPath);
  ensureDir(path.dirname(full));
  const content = yamlHeader(meta) + body.trim() + "\n";
  fs.writeFileSync(full, content, "utf8");
  return {
    id: meta.id,
    path: `knowledge-base/${relPath}`,
    layer: meta.layer,
    category: meta.category,
    docType: meta.docType || meta.layer,
    intentTriggers: meta["intent-triggers"] || [],
    emotionTriggers: meta["emotion-triggers"] || [],
    skillDependencies: meta["skill-dependencies"] || [],
    skillIds: meta.skillIds || [],
    source: meta.source || "",
    summary: meta.summary || body.split("\n").find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---")) || "",
    title: meta.title || (body.match(/^#\s+(.+)/m) || [, meta.id])[1],
  };
}

const index = [];

function add(rel, meta, body) {
  index.push(writeDoc(rel, meta, body));
}

// ---------------------------------------------------------------------------
// PROTOCOLS (crisis first)
// ---------------------------------------------------------------------------
add(
  "protocols/crisis-response.md",
  {
    id: "protocol-crisis-response",
    layer: "protocol",
    category: "safety",
    docType: "protocol",
    "intent-triggers": ["suicide", "kill myself", "self-harm", "want to die", "end it all", "no reason to live"],
    "emotion-triggers": ["hopelessness", "despair", "acute distress"],
    "skill-dependencies": [],
    skillIds: [],
    source: "11-suicide-prevention (PAPYRUS HOPEBOX; Stanley-Brown Safety Planning quick guide); NHS CNTW Self Harm; existing SUPER-PROMPT-CRISIS-TRIAGE",
    summary: "Mandatory crisis triage: clarify intent, assess risk across turns, signpost UK resources. Never run clinical safety planning.",
    title: "Crisis response protocol",
    "last-reviewed": "2026-10",
  },
  `# Crisis response protocol

## What This Is
Hard rules for when users mention suicide, dying, or self-harm. ShiftED is empathy and critical-thinking training for managers — **not therapy, not emergency services**.

## When to Apply
Any mention of suicide, self-harm, wanting to die, or acute hopelessness — including ambiguous figures of speech.

## Core Content
1. **One clear question per turn** during triage unless immediate danger is stated.
2. First distinguish **literal intent** from strong wording about embarrassment, regret, or frustration.
3. If intent is real or unclear, ask calmly about plan and history **across separate turns**.
4. When risk is high or the user asks for help, share the short UK set:
   - Samaritans **116 123** (24/7)
   - NHS **111** (mental health option) / NHS 24 **111** in Scotland
   - Mind **0300 123 3393**
   - Text **SHOUT** to **85258**
   - For under-35s concerned about suicide: PAPYRUS HOPELINE247 **0800 068 4141**
5. You may **mention** the idea of a personal HOPEBOX / self-soothe kit (comfort items for each sense) as a general wellbeing tip — but **never** run Stanley-Brown clinical safety planning, risk scoring, or therapeutic safety-plan construction.
6. Remain plain-language; urge emergency services (999) if immediate danger.

## How to Introduce This to a User
Calm, direct, non-dramatic. One question. Numbers only when triage indicates need or the user asks.

## What to Avoid
- Dumping a helpline wall on figurative language
- Role-playing as a clinician or writing a formal safety plan
- Continuing coaching skills while crisis triage is unfinished
`,
);

add(
  "protocols/scope-limits.md",
  {
    id: "protocol-scope-limits",
    layer: "protocol",
    category: "safety",
    docType: "protocol",
    "intent-triggers": ["are you a therapist", "diagnose me", "treat my", "medication", "trauma therapy"],
    "emotion-triggers": [],
    "skill-dependencies": [],
    source: "00-root/Skills and Knowledge Base.docx; product framing",
    summary: "ShiftED coaches empathy and critical thinking for managers — not therapy, diagnosis, or clinical treatment.",
    title: "Scope limits",
    "last-reviewed": "2026-10",
  },
  `# Scope limits

## What This Is
Non-negotiable boundaries on what the coach will and will not do.

## Core Content
- **In scope:** workplace empathy, critical thinking, emotional intelligence practice, CBT-informed coaching skills for managers, workbook practice.
- **Out of scope:** diagnosis, medication advice, trauma processing, clinical exposure for phobias (e.g. needle phobia), clinical safety planning, replacing professional care.
- Clinical-only materials stay in the resource library as **signposting**, not coaching skills.
- Always frame: "This is training practice, not therapy."

## What to Avoid
Claiming clinical expertise; running specialist clinical protocols; inventing diagnoses.
`,
);

add(
  "protocols/safeguarding.md",
  {
    id: "protocol-safeguarding",
    layer: "protocol",
    category: "safety",
    docType: "protocol",
    "intent-triggers": ["child at risk", "hurt a child", "vulnerable adult", "abuse"],
    "emotion-triggers": [],
    "skill-dependencies": [],
    source: "00-root/Skills and Knowledge Base.docx",
    summary: "If a child or vulnerable adult may be at risk, stop coaching practice and signpost to appropriate UK safeguarding / emergency channels.",
    title: "Safeguarding",
    "last-reviewed": "2026-10",
  },
  `# Safeguarding

## Core Content
If disclosure suggests a child or vulnerable adult is at risk of harm:
1. Do not dig for graphic detail.
2. Encourage contacting emergency services (999) if immediate danger.
3. Signpost to local safeguarding / social care and UK helplines as appropriate.
4. Do not continue skill practice on that thread until safety is addressed.
`,
);

add(
  "protocols/escalation-paths.md",
  {
    id: "protocol-escalation-paths",
    layer: "protocol",
    category: "safety",
    docType: "protocol",
    "intent-triggers": ["need real help", "emergency", "can't cope"],
    "emotion-triggers": ["panic", "crisis"],
    "skill-dependencies": ["protocol-crisis-response"],
    source: "11-suicide-prevention; ResourcesPage UK lines",
    summary: "When and how to hand off from coaching practice to human services.",
    title: "Escalation paths",
    "last-reviewed": "2026-10",
  },
  `# Escalation paths

## Core Content
| Situation | Action |
|-----------|--------|
| Immediate danger to life | Urge 999 / emergency; Samaritans 116 123 |
| Suicidal ideation / self-harm | Crisis protocol + UK helplines (+ PAPYRUS if young person) |
| Ongoing mental health need | NHS 111 / GP / Mind; NHS CNTW self-help guides on Resources page |
| Workplace-only coaching stuck | Stay in scope; one skill; or suggest human coach/manager support |
`,
);

// ---------------------------------------------------------------------------
// FRAMEWORKS
// ---------------------------------------------------------------------------
const frameworks = [
  [
    "frameworks/CBT/overview.md",
    {
      id: "fw-cbt-overview",
      layer: "framework",
      category: "CBT",
      "intent-triggers": ["thoughts feelings behaviour", "cbt", "thinking patterns"],
      "emotion-triggers": ["anxiety", "low mood"],
      "skill-dependencies": ["hcpr_thought_challenge", "dtr", "behavioral_activation"],
      source: "02-anxiety-info-sheets; 03-depression-back-from-the-bluez; 04-depression-info-sheets (adapted)",
      summary: "CBT links thoughts, feelings, and behaviours in reciprocal cycles — coaching helps interrupt unhelpful loops.",
    },
    `# CBT overview

## What This Is
Cognitive behavioural ideas used in ShiftED as **coaching literacy**, not therapy delivery.

## Core Content
Thoughts, feelings, body sensations, and behaviours reinforce each other. Small changes in behaviour or thought appraisal can loosen a stuck cycle. Introduce one element at a time in plain language.

## What to Avoid
Lecturing on CBT theory; claiming to treat clinical disorders.
`,
  ],
  [
    "frameworks/CBT/cognitive-distortions.md",
    {
      id: "fw-cbt-cognitive-distortions",
      layer: "framework",
      category: "CBT",
      "intent-triggers": ["always", "never", "catastrophising", "mind reading", "black and white", "thinking error"],
      "emotion-triggers": ["anxiety", "shame", "guilt"],
      "skill-dependencies": ["thinking_error_tracking", "hcpr_thought_challenge"],
      source: "Anxiety Info 04; Bluez 05; Depression Info 11; Cog Distortions.pdf (adapted)",
      summary: "Common unhelpful thinking habits (all-or-nothing, catastrophising, mind-reading) — notice without lecturing.",
    },
    `# Cognitive distortions / unhelpful thinking styles

## What This Is
Patterns such as all-or-nothing thinking, catastrophising, mind-reading, over-generalising, discounting positives, and fortune-telling.

## When to Apply
When the user's language shows repeating distorted appraisals of work or self.

## How to Introduce This to a User
Name the pattern lightly once ("sounds a bit like predicting the worst") then invite one counter-example. Pair with HCPR or DTR when a hot thought is clear.
`,
  ],
  [
    "frameworks/CBT/thought-challenging.md",
    {
      id: "fw-cbt-thought-challenging",
      layer: "framework",
      category: "CBT",
      "intent-triggers": ["challenge this thought", "is this true", "hot thought"],
      "emotion-triggers": ["anxiety", "shame"],
      "skill-dependencies": ["hcpr_thought_challenge", "dtr", "abcd_model"],
      source: "HCPR Tool Kit; Anxiety Info 03; Bluez 03/06; Depression thought sheets (adapted)",
      summary: "Structured ways to examine a hot thought: HCPR criteria, evidence for/against, ABC(D) disputation.",
    },
    `# Thought challenging

## Core Content
ShiftED's primary thought tool is **HCPR** (Helpful, Constructive, Positive, Real). For recurring stuck thoughts, escalate to a brief Daily Thought Record style evidence weigh-up. Keep one question per turn.
`,
  ],
  [
    "frameworks/CBT/behavioural-activation.md",
    {
      id: "fw-cbt-behavioural-activation",
      layer: "framework",
      category: "CBT",
      "intent-triggers": ["no motivation", "avoiding", "scrolling instead", "pleasure mastery", "activity schedule"],
      "emotion-triggers": ["low mood", "lethargy", "boredom"],
      "skill-dependencies": ["behavioral_activation", "micro_goals"],
      source: "Depression Info 05-06; Pleasure Vs Mastery; Bluez 02; For Josh / Tim cases (adapted)",
      summary: "Activity scheduling and pleasure vs mastery restore momentum when avoidance and low mood reinforce each other.",
    },
    `# Behavioural activation (framework)

## Core Content
Withdrawal reduces rewarding activity, which deepens low mood. Scheduling small valued actions — balancing enjoyment (pleasure) and accomplishment (mastery) — interrupts the cycle. In workplace coaching, treat phone-scrolling as common avoidance of monotonous tasks.
`,
  ],
  [
    "frameworks/CBT/core-beliefs.md",
    {
      id: "fw-cbt-core-beliefs",
      layer: "framework",
      category: "CBT",
      "intent-triggers": ["deep down I believe", "I'm a failure", "core belief"],
      "emotion-triggers": ["shame", "hopelessness"],
      "skill-dependencies": ["hcpr_thought_challenge", "dtr"],
      source: "Bluez 08; Depression Info 12; Core Beliefs Worksheet (adapted summary)",
      summary: "Deeper rules about self/others/world that fuel recurring NATs — explore lightly in coaching; do not dig clinically.",
    },
    `# Core beliefs (summary)

## Core Content
Surface automatic thoughts often sit on deeper rules ("I must never fail"). In ShiftED, notice themes across sessions without forcing belief restructuring. Prefer present-focused HCPR and micro-goals unless the user explicitly wants to explore a deeper rule.
`,
  ],
  [
    "frameworks/anxiety/anxiety-and-worry.md",
    {
      id: "fw-anxiety-and-worry",
      layer: "framework",
      category: "anxiety",
      "intent-triggers": ["worried", "anxious", "what if", "can't stop worrying", "GAD"],
      "emotion-triggers": ["anxiety", "fear", "unease"],
      "skill-dependencies": ["worry_time", "grounding_and_breathing", "hcpr_thought_challenge"],
      source: "Anxiety Info 01/15; 12-worry; Your Anxiety Self-Help Toolkit (adapted)",
      summary: "Anxiety is a threat response; worry maintains it via what-if chains. Coaching uses grounding, worry-time, and thought checks.",
    },
    `# Anxiety and worry

## Core Content
Anxiety mobilises body and mind for threat. Worry tries to solve future problems in the head, often without action. Vicious cycles include safety behaviours and avoidance. Coaching tools: grounding, scheduled worry-time, behavioural experiments — not clinical exposure for specific phobias.
`,
  ],
  [
    "frameworks/anxiety/vicious-cycle-and-safety-behaviours.md",
    {
      id: "fw-anxiety-vicious-cycle",
      layer: "framework",
      category: "anxiety",
      "intent-triggers": ["safety behaviour", "avoidance", "checking", "reassurance"],
      "emotion-triggers": ["anxiety"],
      "skill-dependencies": ["behavioural_experiment", "stress_regulation"],
      source: "Anxiety Info 02, 06, 07 (adapted)",
      summary: "Avoidance and safety behaviours reduce anxiety short-term and maintain it long-term.",
    },
    `# Vicious cycle of anxiety & safety behaviours

## Core Content
Short-term relief from checking, avoiding, or seeking reassurance teaches the brain the situation was dangerous. Graded approach and behavioural experiments test predictions — keep workplace-appropriate and non-clinical.
`,
  ],
  [
    "frameworks/depression/cycle-of-depression.md",
    {
      id: "fw-depression-cycle",
      layer: "framework",
      category: "depression",
      "intent-triggers": ["low mood", "depressed", "nothing helps", "stuck in bed"],
      "emotion-triggers": ["sadness", "numbness", "hopelessness"],
      "skill-dependencies": ["behavioral_activation", "micro_goals", "resilience_reframing"],
      source: "Depression Info 01-04; The Cycle of Depression; Your Depression Self-Help Toolkit; Bluez 01 (adapted)",
      summary: "Low mood reduces activity; reduced activity worsens mood — break with small activation steps.",
    },
    `# Cycle of low mood

## Core Content
Symptoms sap energy → fewer valued activities → more negative thoughts → lower mood. Behavioural activation and micro-goals are first-line coaching moves. Signpost NHS / GP if symptoms are severe or persistent — ShiftED is not treatment.
`,
  ],
  [
    "frameworks/stress-response/brain-and-stress.md",
    {
      id: "fw-stress-response",
      layer: "framework",
      category: "stress-response",
      "intent-triggers": ["fight or flight", "stressed", "overwhelmed body", "adrenaline"],
      "emotion-triggers": ["stress", "panic", "overwhelm"],
      "skill-dependencies": ["grounding_and_breathing", "stress_regulation", "circles_of_control"],
      source: "01-resources-root BASIC BRAIN FUNCTION; Anxiety Info 10-11; Burnout toolkit (adapted)",
      summary: "Fight/flight/freeze is adaptive; chronic activation fuels burnout. Window of tolerance frames usable coaching range.",
    },
    `# Brain function and the stress response

## Core Content
Threat systems speed heart rate, narrow attention, and push fight, flight, or freeze. Useful short-term; costly when stuck on. Coaching: regulate first (breathing/grounding), then circles of control and sustainability habits. Window of tolerance: too high = hyperarousal; too low = shutdown; middle = learnable.
`,
  ],
  [
    "frameworks/positive-psychology/overview.md",
    {
      id: "fw-positive-psychology",
      layer: "framework",
      category: "positive-psychology",
      "intent-triggers": ["strengths", "gratitude", "flourish", "positive psychology"],
      "emotion-triggers": ["hope", "curiosity"],
      "skill-dependencies": ["strengths_spotting", "gratitude_and_savouring", "resilience_reframing"],
      source: "10-positive-psychology packs + coaching manuals (adapted; copyrighted originals not reproduced)",
      summary: "Build on strengths, positive emotion, and meaning alongside addressing problems — adapted summaries only.",
    },
    `# Positive psychology (overview)

## Core Content
Alongside problem-focused CBT tools, ShiftED can retrieve strengths-spotting, gratitude/savouring, growth mindset, and valued living. Source packs are copyrighted (PositivePsychology.com) — use adapted coaching language only; do not paste worksheets.
`,
  ],
  [
    "frameworks/ACT/values-and-committed-action.md",
    {
      id: "fw-act-values",
      layer: "framework",
      category: "ACT",
      "intent-triggers": ["what matters", "values", "purpose", "towards away"],
      "emotion-triggers": ["emptiness", "confusion"],
      "skill-dependencies": ["values_clarification", "micro_goals"],
      source: "10-positive-psychology/meaning-valued-living (adapted); My Well-Being Toolkit",
      summary: "Values are directions, not goals; committed action moves toward what matters even when feelings pull away.",
    },
    `# Values and committed action (ACT-informed)

## Core Content
Clarify what matters (people, principles, contribution), notice towards vs away moves, set values-based micro-goals. Workplace coaching focuses on leadership and relationship values — not clinical ACT protocols.
`,
  ],
  [
    "frameworks/grief/grief-and-bereavement.md",
    {
      id: "fw-grief",
      layer: "framework",
      category: "grief",
      "intent-triggers": ["grief", "bereavement", "lost someone", "mourning"],
      "emotion-triggers": ["grief", "sadness", "longing"],
      "skill-dependencies": ["grief_and_loss", "self_compassion"],
      source: "Depression Info 15; NHS CNTW Bereavement; grief-bereavement pack (adapted summaries)",
      summary: "Grief is varied and non-linear; coaching offers support and signposting, not bereavement therapy.",
    },
    `# Grief and bereavement (framework)

## Core Content
Responses to loss vary. Tasks may include accepting the reality of loss, processing pain, adjusting, and finding continuing bonds — presented as options, not stages to force. Signpost NHS bereavement resources; use grief_and_loss skill carefully within coaching scope.
`,
  ],
  [
    "frameworks/worry-GAD/what-is-worry.md",
    {
      id: "fw-worry-gad",
      layer: "framework",
      category: "worry-GAD",
      "intent-triggers": ["worry all the time", "generalised anxiety", "what if chains"],
      "emotion-triggers": ["anxiety", "unease"],
      "skill-dependencies": ["worry_time", "grounding_and_breathing"],
      source: "12-worry (adapted)",
      summary: "Worry is repetitive what-if thinking; scheduled worry-time and grounding reduce all-day rumination.",
    },
    `# What is worry / GAD (summary)

## Core Content
Worry tries to prevent bad outcomes by mental rehearsal. It rarely finishes. Coaching: contain worry to a short daily window, ground when body is activated, then problem-solve only actionable items.
`,
  ],
];

for (const [rel, meta, body] of frameworks) {
  add(rel, { ...meta, "last-reviewed": "2026-10", title: meta.summary.slice(0, 60) }, body);
}

// ---------------------------------------------------------------------------
// SKILL DOCS (SKILL + techniques + examples for key skills)
// ---------------------------------------------------------------------------
function skillBundle(folder, id, name, skillId, triggers, emotions, source, skillBody, techBody, exBody) {
  add(
    `skills/${folder}/SKILL.md`,
    {
      id: `skill-${id}`,
      layer: "skill",
      category: name,
      docType: "skill",
      "intent-triggers": triggers,
      "emotion-triggers": emotions,
      "skill-dependencies": [],
      skillIds: [skillId],
      source,
      summary: skillBody.split("\n").find((l) => l.trim() && !l.startsWith("#")) || name,
      title: name,
      "last-reviewed": "2026-10",
    },
    skillBody,
  );
  add(
    `skills/${folder}/techniques.md`,
    {
      id: `skill-${id}-techniques`,
      layer: "skill",
      category: name,
      docType: "skill",
      "intent-triggers": triggers,
      "emotion-triggers": emotions,
      skillIds: [skillId],
      source,
      summary: `Techniques for ${name}`,
      title: `${name} techniques`,
      "last-reviewed": "2026-10",
    },
    techBody,
  );
  add(
    `skills/${folder}/examples.md`,
    {
      id: `skill-${id}-examples`,
      layer: "skill",
      category: name,
      docType: "skill",
      "intent-triggers": triggers,
      "emotion-triggers": emotions,
      skillIds: [skillId],
      source,
      summary: `Example language for ${name}`,
      title: `${name} examples`,
      "last-reviewed": "2026-10",
    },
    exBody,
  );
}

skillBundle(
  "grounding-and-breathing",
  "grounding",
  "Grounding & breathing",
  "grounding_and_breathing",
  ["can't breathe", "panicky", "5-4-3-2-1", "ground me", "overwhelmed right now", "racing heart"],
  ["panic", "overwhelm", "anxiety"],
  "Anxiety Info 08-09; stress-burnout scripts (5-4-3-2-1, Dropping Anchor, SOBER, PMR, diaphragmatic); trauma toolkit stabilisation (adapted)",
  `# Grounding & breathing

## What This Is
In-the-moment regulation: sensory grounding, breath retraining, Dropping Anchor, S.O.B.E.R., PMR, brief imagery.

## When to Apply
User is flooded, panicky, dissociated, or cannot think — before problem-solving skills.

## Audio slots (TODO — URLs not available)
Reference by title only; leave \`audioUrl\` null until hosted:
Diaphragmatic breathing; Dropping Anchor; Eye of the Hurricane; Mountain Meditation; Progressive Muscle Relaxation; S.O.B.E.R.; The Private Garden; 5-4-3-2-1; Visualization for Stress Reduction.
`,
  `# Grounding techniques

1. **5-4-3-2-1** — name 5 things you see, 4 touch, 3 hear, 2 smell, 1 taste/one slow breath.
2. **Box / diaphragmatic breathing** — belly soft; inhale ~4, hold ~4, exhale ~4.
3. **Dropping Anchor** — notice feet/chair; name 5 things in the room; return to values.
4. **S.O.B.E.R.** — Stop, Observe, Breath, Expand, Respond.
5. **PMR** — tense/release muscle groups briefly.
One technique per turn; ask if they want to try it now.
`,
  `# Examples

User: "I feel overwhelmed and panicky."
Coach: "Sounds like your body is on high alert. Want to try a 30-second 5-4-3-2-1 with me — starting with five things you can see from where you are?"
`,
);

skillBundle(
  "hcpr-thought-challenge",
  "hcpr",
  "HCPR thought challenge",
  "hcpr_thought_challenge",
  ["negative thought", "catastrophising", "i'm useless", "stuck on one thought"],
  ["anxiety", "shame", "anger"],
  "06-mind-cognitive-process/HCPR Tool Kit (source of truth, adapted)",
  `# HCPR thought challenge

## What This Is
Check a hot thought against **H**elpful, **C**onstructive, **P**ositive, **R**eal criteria.

## When to Apply
A specific thought is blocking progress and the user can name it.
`,
  `# HCPR techniques

1. Capture the thought in the user's words.
2. Ask one HCPR lens per turn (Is it helpful? Constructive? Positive? Real/evidence-based?).
3. Invite a balanced alternative in their language.
4. If still stuck after several turns, offer DTR evidence weigh-up.
`,
  `# Examples

User: "If I speak up in the meeting I'll look stupid."
Coach: "That's a clear hot thought. On a helpfulness check — does holding that thought make it easier or harder to say what you need in the meeting?"
`,
);

skillBundle(
  "behavioral-activation",
  "ba",
  "Behavioural activation",
  "behavioral_activation",
  ["scrolling", "procrastinating", "no motivation", "avoiding the task", "3:30pm"],
  ["low mood", "boredom", "guilt"],
  "Depression BA sheets; Pleasure Vs Mastery; For Josh / Tim / Jordan cases (adapted)",
  `# Behavioural activation

## What This Is
Plan small approach behaviours that restore pleasure and mastery; treat scrolling/avoidance as the target behaviour when relevant.
`,
  `# Techniques

1. Name the avoidance loop (trigger → escape → short relief → longer cost).
2. Pleasure vs mastery: pick one of each for the next window.
3. Schedule a tiny first step with a time box.
4. Confidence scale 1–10; shrink step until ≥7 willingness if needed.
`,
  `# Examples

User: "I can't stop scrolling at 3:30pm instead of finishing reports."
Coach: "Sounds like the phone is a quick exit when the report gets heavy. What's one 10-minute mastery step on the report you could start before any scroll?"
`,
);

skillBundle(
  "stress-regulation",
  "stress-reg",
  "Stress regulation / window of tolerance",
  "stress_regulation",
  ["burnout", "too stressed", "window of tolerance", "can't cope with load"],
  ["stress", "irritability", "exhaustion"],
  "Window of Tolerance; Stress Diary; Burnout toolkit; Anxiety Info 10-11 (adapted)",
  `# Stress regulation

## What This Is
Widen usable range under load: notice hyper/hypo arousal, reduce controllables strain, build recovery habits. Links to sustainability_path and circles_of_control.
`,
  `# Techniques

1. Map stressors vs recovery.
2. Name where they are relative to their window (wired / shut down / OK).
3. One regulation act + one load reduction in their control.
`,
  `# Examples

User: "I'm constantly wired then crash."
Coach: "That sounds outside your usable window a lot of the day. What usually pulls you back toward steady — even for ten minutes?"
`,
);

skillBundle(
  "worry-time",
  "worry-time",
  "Worry time",
  "worry_time",
  ["can't stop worrying", "what if all day", "worry spiral"],
  ["anxiety"],
  "12-worry; Anxiety Info 01/15 (adapted)",
  `# Worry time

## What This Is
Contain free-floating worry to a short daily slot; park daytime what-ifs for that slot; problem-solve only actionable items.
`,
  `# Techniques

1. Agree a 10–15 minute daily worry window.
2. When worry shows up early, jot a one-line note and defer.
3. In the window: sort actionable vs hypothetical; one action step max.
`,
  `# Examples

User: "What-ifs run all day."
Coach: "Want to try parking them for a 15-minute worry window this evening — and for now, write just the headline of the loudest what-if?"
`,
);

skillBundle(
  "values-clarification",
  "values",
  "Values clarification",
  "values_clarification",
  ["what matters", "lost purpose", "values", "ikigai"],
  ["emptiness", "confusion"],
  "meaning-valued-living pack; Ikigai infographic; My Well-Being Toolkit (adapted)",
  `# Values clarification

## What This Is
Identify directions that matter (people, principles, contribution) and align micro-actions.
`,
  `# Techniques

Bulls-eye style check across life domains; towards/away moves; values-based goal setting. Keep workplace-relevant.
`,
  `# Examples

User: "I don't know why I'm grinding anymore."
Coach: "If work felt more like you, which value would show up more — learning, fairness, craft, or people?"
`,
);

skillBundle(
  "strengths-spotting",
  "strengths",
  "Strengths spotting",
  "strengths_spotting",
  ["my strengths", "what I'm good at", "signature strengths"],
  ["pride", "curiosity", "shame"],
  "strength-finding pack; character strengths wheel (adapted)",
  `# Strengths spotting

## What This Is
Notice character strengths in self and others; use them under stress instead of only fixing deficits.
`,
  `# Techniques

Name 2–3 strengths from a recent win; ask who else sees them; apply one strength to the current workplace stuck point.
`,
  `# Examples

User: "I'm only good at putting out fires."
Coach: "That may be a strength in disguise — steadiness under pressure. Where else could that steadiness help this week on purpose?"
`,
);

skillBundle(
  "grief-and-loss",
  "grief",
  "Grief & loss",
  "grief_and_loss",
  ["bereaved", "lost my", "grieving", "anniversary of"],
  ["grief", "sadness", "longing"],
  "grief-bereavement pack; Depression Info 15; NHS Bereavement (adapted; audio Reconnecting With the Deceased — URL TODO)",
  `# Grief & loss

## What This Is
Supportive coaching around loss and transition — not bereavement therapy. Signpost NHS/specialist support.

## Audio slot
Reconnecting With the Deceased Through Imagery — \`audioUrl\` TODO.
`,
  `# Techniques

Normalise varied grief; invite support map; gentle continuing-bond rituals if wanted; self-care basics. Never force stages.
`,
  `# Examples

User: "I can't focus at work since the funeral."
Coach: "Grief often hijacks concentration. What would a kinder workday look like this week — and who already knows you might need cover?"
`,
);

skillBundle(
  "self-compassion",
  "self-compassion",
  "Self-compassion",
  "self_compassion",
  ["I'm so hard on myself", "self-criticism", "I don't deserve"],
  ["shame", "guilt"],
  "bonus worksheets; Self-Forgiveness Letter (adapted)",
  `# Self-compassion

## What This Is
Replace harsh self-attack with the tone you'd use with a colleague you respect.
`,
  `# Techniques

Common humanity; kinder self-talk; imperfect-OK framing. One rephrase per turn.
`,
  `# Examples

User: "I mess everything up."
Coach: "If a teammate said that after one tough week, what would you say to them?"
`,
);

skillBundle(
  "growth-mindset",
  "growth",
  "Growth mindset",
  "growth_mindset",
  ["feedback hurts", "I'm just not good at", "fixed about"],
  ["shame", "defensiveness"],
  "Adopting a Growth Mindset; Entering your growth zone (adapted)",
  `# Growth mindset

## What This Is
Treat ability as improvable with practice; use criticism as data for critical thinking.
`,
  `# Techniques

Separate identity from performance; extract one learning from feedback; stretch goals in the growth zone (not panic zone).
`,
  `# Examples

User: "My review said I interrupt — so I'm a bad leader."
Coach: "That's a behaviour to practise, not a final identity. What's one meeting where you could try a two-second pause before speaking?"
`,
);

skillBundle(
  "resilience-reframing",
  "resilience",
  "Resilience reframing",
  "resilience_reframing",
  ["can't bounce back", "always goes wrong", "silver lining"],
  ["discouragement", "frustration"],
  "positive-cbt + resilience-coping packs (adapted)",
  `# Resilience reframing

## What This Is
Positive-CBT style: find workable alternative thoughts and past coping evidence without toxic positivity.
`,
  `# Techniques

Benefit-finding carefully; silver linings only if authentic; letter from a better day; replace unhelpful with helpful alternatives — link HCPR.
`,
  `# Examples

User: "This project failure proves I'm done."
Coach: "What's one skill you used even while it went wrong — and how might that skill show up on the next brief?"
`,
);

skillBundle(
  "gratitude-and-savouring",
  "gratitude",
  "Gratitude & savouring",
  "gratitude_and_savouring",
  ["grateful", "savour", "nothing good happens", "flow"],
  ["numbness", "flat"],
  "positive-psychology-exercises; Reflecting on happiness; flow state (adapted)",
  `# Gratitude & savouring

## What This Is
Deliberately notice and linger on positive moments, kindness, awe, and flow — small doses.
`,
  `# Techniques

Three good things; savouring ritual; flow activity audit. Avoid forcing positivity during crisis.
`,
  `# Examples

User: "Work is grey."
Coach: "Without pretending it's fine — was there a two-minute moment today worth noticing on purpose?"
`,
);

skillBundle(
  "abcd-model",
  "abcd",
  "ABCD model",
  "abcd_model",
  ["activating event", "beliefs consequences", "ABC"],
  ["anxiety", "anger"],
  "Bluez 04; ABCD Model.pdf (adapted)",
  `# ABCD model

## What This Is
Activating event → Beliefs → Consequences → Disputation. Complements HCPR when users need a fuller map.
`,
  `# Techniques

Fill A, B, C in their words; dispute B with evidence; note new consequence.
`,
  `# Examples

User: "Boss frowned and I spiralled."
Coach: "Let's map it: what was A (the frown moment), what's the B belief you told yourself, and what did you feel/do as C?"
`,
);

skillBundle(
  "behavioural-experiment",
  "behav-exp",
  "Behavioural experiment",
  "behavioural_experiment",
  ["test my prediction", "what if I'm wrong", "experiment"],
  ["anxiety", "avoidance"],
  "Anxiety Info 05-07; Behavioral-experiment.pdf (adapted)",
  `# Behavioural experiment

## What This Is
Design a small real-world test of a negative prediction; compare expected vs actual outcome.
`,
  `# Techniques

Write prediction + % belief; design safe workplace test; observe result; update belief %. No clinical exposure hierarchies for phobias.
`,
  `# Examples

User: "If I ask one clarifying question they'll think I'm incompetent."
Coach: "Want to test that at 40% belief — one question in tomorrow's stand-up — and note what actually happens?"
`,
);

skillBundle(
  "structured-problem-solving",
  "sps",
  "Structured problem solving",
  "structured_problem_solving",
  ["don't know what to do", "problem solve", "options"],
  ["overwhelm", "confusion"],
  "Depression Info 13; Structured Problem-Solving.pdf (adapted)",
  `# Structured problem solving

## What This Is
Define problem → brainstorm options → weigh → pick → plan → review.
`,
  `# Techniques

One step per turn; keep options concrete and workplace-sized.
`,
  `# Examples

User: "I'm drowning in conflicting priorities."
Coach: "If we shrink it to one sentence, what's the problem to solve this week — not all of them?"
`,
);

skillBundle(
  "boundary-communication",
  "boundaries",
  "Boundary communication",
  "boundary_communication",
  ["can't say no", "always available", "set a boundary"],
  ["resentment", "fear"],
  "7 Types of boundaries; Learning to Say No; assertiveness worksheets (adapted)",
  `# Boundary communication

## What This Is
Clear workplace/personal limits: what to say, when, which need it protects.
`,
  `# Techniques

Name the boundary type (time, emotional, workload…); draft a short I-statement; plan the ask.
`,
  `# Examples

User: "They message me at 10pm and I always reply."
Coach: "What rule would protect your evenings — and what's one sentence you could send next time after hours?"
`,
);

skillBundle(
  "problem-list-conceptualisation",
  "problem-list",
  "Problem list & conceptualisation",
  "problem_list_conceptualisation",
  ["where do I start", "so many problems", "opening phase"],
  ["overwhelm"],
  "Opening Phase - Problem identification and Conceptualisation.docx (adapted)",
  `# Problem list & conceptualisation

## What This Is
Opening-phase skill: build a plain problem list and map thoughts/feelings/behaviours for the priority item — fuels Phase 1.
`,
  `# Techniques

List 3–5 challenges; pick one; break into situation, trigger, belief, response. One element per turn.
`,
  `# Examples

User: "Everything is a mess — work, home, sleep."
Coach: "Let's list the top three on paper. Which one, if it eased 10%, would help the others most?"
`,
);

skillBundle(
  "active-listening",
  "active-listening",
  "Active listening",
  "feedback_conversation",
  ["they're not hearing me", "need to listen better"],
  ["frustration"],
  "communication-skills pack; wb_active_listening (adapted)",
  `# Active listening (coach skill enrichment)

## What This Is
Reflect, validate, explore before advising — foundation for empathy workbooks and feedback conversations.
`,
  `# Techniques

Paraphrase content + feeling; ask one open question; avoid stacking advice.
`,
  `# Examples

User: "My report just vents at me."
Coach: "Before fixing it — what do you hear is the feeling under their vent?"
`,
);

// ---------------------------------------------------------------------------
// WORKBOOKS (KB practice docs)
// ---------------------------------------------------------------------------
const kbWorkbooks = [
  ["workbooks/problem-solving.md", "wb-kb-problem-solving", "Structured problem-solving practice", ["stuck", "options"], "structured_problem_solving"],
  ["workbooks/empathy-practise.md", "wb-kb-empathy", "Empathy practice prompts", ["empathy", "perspective"], "wb_perspective_taking"],
  ["workbooks/effective-communication.md", "wb-kb-communication", "Effective communication practice", ["communication", "i-statement"], "wb_active_listening"],
  ["workbooks/critical-thinking.md", "wb-kb-critical-thinking", "Critical thinking about thoughts", ["challenge thought"], "hcpr_thought_challenge"],
  ["workbooks/conflict-resolution.md", "wb-kb-conflict", "Conflict navigation practice", ["conflict", "hard conversation"], "wb_conflict_navigation"],
  ["workbooks/wellbeing-self-reflection.md", "wb-kb-wellbeing", "Personal wellbeing vocabulary", ["wellbeing", "self-care"], "values_clarification"],
  ["workbooks/pleasure-mastery-schedule.md", "wb-kb-pleasure-mastery", "Pleasure vs mastery activity plan", ["schedule", "activation"], "behavioral_activation"],
  ["workbooks/sustainability-coping-plan.md", "wb-kb-sustainability", "Sustainability coping plan", ["relapse", "maintain"], "sustainability_path"],
];

for (const [rel, id, title, triggers, skill] of kbWorkbooks) {
  add(
    rel,
    {
      id,
      layer: "workbook",
      category: "practice",
      docType: "workbook",
      "intent-triggers": triggers,
      "emotion-triggers": [],
      skillIds: [skill],
      source: "ShiftedAI Resources adapted workbooks",
      summary: title,
      title,
      "last-reviewed": "2026-10",
    },
    `# ${title}

## Steps
1. Name the situation in one sentence.
2. Complete the short reflection prompts for this practice.
3. Choose one micro-action in the next 24–48 hours.
4. Rate confidence 1–10; shrink the action until willingness is high enough to try.

## Reflection
- What did I notice?
- What will I try differently?
- Who or what supports this change?

ShiftED is training practice, not therapy.
`,
  );
}

// ---------------------------------------------------------------------------
// RESOURCES
// ---------------------------------------------------------------------------
add(
  "resources/crisis-lines-UK.md",
  {
    id: "res-crisis-uk",
    layer: "resource",
    category: "resources",
    docType: "resource",
    "intent-triggers": ["helpline", "crisis line", "need number"],
    "emotion-triggers": ["despair"],
    source: "ResourcesPage; PAPYRUS HOPEBOX",
    summary: "UK crisis and support numbers for signposting.",
    title: "Crisis lines UK",
    "last-reviewed": "2026-10",
  },
  `# Crisis lines (UK)

- Samaritans: 116 123
- NHS 111 (England & Wales) / NHS 24 111 (Scotland)
- Mind: 0300 123 3393
- SHOUT: text 85258
- PAPYRUS HOPELINE247 (under 35 / concerned about a young person): 0800 068 4141
`,
);

add(
  "resources/nhs-cntw-self-help.md",
  {
    id: "res-nhs-cntw",
    layer: "resource",
    category: "resources",
    docType: "resource",
    "intent-triggers": ["self-help guide", "nhs booklet", "reading"],
    "emotion-triggers": [],
    source: "09-nhs-resources (9 CNTW booklets) — signpost public NHS page, do not host PDFs",
    summary: "NHS CNTW self-help guides — titles and public link for ResourcesPage.",
    title: "NHS CNTW self-help guides",
    "last-reviewed": "2026-10",
  },
  `# NHS CNTW self-help guides

Public collection (signpost; do not reproduce booklet text):
https://www.cntw.nhs.uk/resource-library/

Guides in Simon's pack (titles only):
1. Bereavement
2. Depression and Low Mood
3. Food for Thought
4. Health Anxiety
5. Managing Anger
6. Self Harm
7. Sleeping Problems
8. Social Anxiety
9. Stress
`,
);

add(
  "resources/clinical-out-of-scope.md",
  {
    id: "res-clinical-oos",
    layer: "resource",
    category: "resources",
    docType: "resource",
    "intent-triggers": ["needle phobia", "trauma writing", "exposure therapy"],
    "emotion-triggers": [],
    source: "Anxiety Info 13-14; Healing From Trauma Through Writing — resource library only",
    summary: "Clinical-only topics kept as signposting, not coaching skills.",
    title: "Clinical topics (signpost only)",
    "last-reviewed": "2026-10",
  },
  `# Clinical topics — signpost only

Not coaching skills in ShiftED:
- Needle phobia psychoeducation / exposure plans
- Trauma-focused expressive writing protocols
- Clinical Safety Planning Intervention (Stanley-Brown) as clinician procedure

Direct users to appropriate NHS / specialist care.
`,
);

add(
  "resources/guided-audio-todo.md",
  {
    id: "res-audio-todo",
    layer: "resource",
    category: "resources",
    docType: "resource",
    "intent-triggers": ["guided audio", "meditation track"],
    "emotion-triggers": [],
    source: "07-mindfulness-guided-audio (MP3s not committed)",
    summary: "Audio titles with null audioUrl slots pending hosting.",
    title: "Guided audio TODO",
    "last-reviewed": "2026-10",
  },
  `# Guided audio (config slots)

| Title | audioUrl |
|-------|----------|
| Diaphragmatic breathing | null |
| Dropping Anchor | null |
| Eye of the Hurricane | null |
| Mountain Meditation | null |
| Progressive Muscle Relaxation | null |
| Reconnecting With the Deceased Through Imagery | null |
| S.O.B.E.R. | null |
| The Private Garden | null (no script in text bundles) |
| 5-4-3-2-1 Stress Reduction | null |
| Visualization for Stress Reduction | null |
`,
);

// ---------------------------------------------------------------------------
// PERSONAS / CULTURAL / EXAMPLES
// ---------------------------------------------------------------------------
add(
  "personas/default-persona.md",
  {
    id: "persona-default",
    layer: "persona",
    category: "personas",
    "intent-triggers": [],
    "emotion-triggers": [],
    source: "Skills and Knowledge Base.docx Layer 1",
    summary: "Warm, non-directive, plain-language coaching persona for managers.",
    title: "Default persona",
    "last-reviewed": "2026-10",
  },
  `# Default persona

Warm, curious, non-directive. Mirror user language. One question per turn. Never claim to be a therapist.
`,
);

add(
  "personas/workplace-wellbeing.md",
  {
    id: "persona-workplace",
    layer: "persona",
    category: "personas",
    "intent-triggers": ["at work", "manager", "colleague", "team"],
    "emotion-triggers": [],
    source: "Product framing; Trainer case studies",
    summary: "Workplace wellbeing framing for managers practising EI.",
    title: "Workplace wellbeing persona notes",
    "last-reviewed": "2026-10",
  },
  `# Workplace wellbeing

Focus on leadership empathy, difficult conversations, boundaries, activation at work. Avoid clinical framing.
`,
);

add(
  "cultural-context/stigma-and-help-seeking.md",
  {
    id: "culture-stigma",
    layer: "cultural-context",
    category: "cultural",
    "intent-triggers": ["can't talk about feelings", "stigma"],
    "emotion-triggers": ["shame"],
    source: "Skills and Knowledge Base.docx Layer 5",
    summary: "Help-seeking and emotional expression vary; stay curious, avoid assumptions.",
    title: "Stigma and help-seeking",
    "last-reviewed": "2026-10",
  },
  `# Stigma and help-seeking

Emotional expression and help-seeking norms vary by culture and workplace. Ask; don't assume. Offer resources without pressure.
`,
);

add(
  "examples/tim-scrolling-afternoon.md",
  {
    id: "ex-tim-scrolling",
    layer: "example",
    category: "examples",
    "intent-triggers": ["scrolling", "3:30", "reports", "phone break"],
    "emotion-triggers": ["shame", "fatigue"],
    skillIds: ["behavioral_activation", "micro_goals", "thinking_error_tracking"],
    source: "00-root/For Josh.docx; Trainer Case Study Tim",
    summary: "Tim: afternoon cognitive fatigue → phone scrolling → comparison spiral → unfinished reports.",
    title: "Example: Tim scrolling loop",
    "last-reviewed": "2026-10",
  },
  `# Example dialogue — Tim (scrolling / BA + micro-goals)

User: I can't stop scrolling at about 3:30 when I should finish the routing reports.
Coach: Sounds like the phone shows up right when the report gets heavy. What usually hits first — boredom, brain fog, or a critical thought about yourself?
User: Brain fog, then I check Instagram and feel worse.
Coach: So the five-minute break becomes a comparison trap. What's one 10-minute mastery step on the report you could start before any scroll — and how confident are you 1–10?
`,
);

add(
  "examples/jordan-internship-avoidance.md",
  {
    id: "ex-jordan",
    layer: "example",
    category: "examples",
    "intent-triggers": ["internship", "menial", "instagram", "comparison"],
    "emotion-triggers": ["envy", "inadequacy"],
    skillIds: ["behavioral_activation", "thinking_error_tracking", "hcpr_thought_challenge"],
    source: "Trainer Case Study - Jordan",
    summary: "Jordan: social media avoidance of 'menial' internship task; discounting the present.",
    title: "Example: Jordan internship avoidance",
    "last-reviewed": "2026-10",
  },
  `# Example — Jordan (BA + thinking errors)

Target bot behaviour: name scrolling as avoidance, challenge "menial = worthless", one real-world professional micro-action (e.g. ask a senior one question about the data).
`,
);

add(
  "examples/panic-grounding.md",
  {
    id: "ex-panic-grounding",
    layer: "example",
    category: "examples",
    "intent-triggers": ["panicky", "overwhelmed", "can't think"],
    "emotion-triggers": ["panic", "overwhelm"],
    skillIds: ["grounding_and_breathing", "distancing"],
    source: "Synthetic eval fixture aligned with inventory grounding materials",
    summary: "Flooded user → grounding before problem-solving.",
    title: "Example: panic → grounding",
    "last-reviewed": "2026-10",
  },
  `# Example — overwhelm → grounding

User: I feel overwhelmed and panicky.
Coach: Your system's on high alert. Want to try naming five things you can see right now before we touch the work problem?
`,
);

// README
fs.writeFileSync(
  path.join(KB, "README.md"),
  `# ShiftED knowledge base

Atomic markdown docs with YAML front-matter for rule-based retrieval (Simon's Skills and Knowledge Base spec).

- **framework** — theory summaries (adapted; not verbatim worksheets)
- **skill** — procedural coaching moves
- **protocol** — hard rules (crisis first)
- **workbook / resource / persona / example** — supporting material

Runtime loader: \`skills/knowledgeBase.cjs\` (reads \`knowledge-base/index.json\`).
Rebuild index: \`node scripts/generate-knowledge-base.cjs\` then the index writer below regenerates JSON.
`,
  "utf8",
);

// Write index
const indexPath = path.join(KB, "index.json");
fs.writeFileSync(
  indexPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: index.length,
      docs: index.map((d) => ({
        id: d.id,
        path: d.path,
        layer: d.layer,
        category: d.category,
        docType: d.docType,
        title: d.title,
        summary: String(d.summary).slice(0, 280),
        intentTriggers: d.intentTriggers,
        emotionTriggers: d.emotionTriggers,
        skillDependencies: d.skillDependencies,
        skillIds: d.skillIds || [],
        source: d.source,
      })),
    },
    null,
    2,
  ),
  "utf8",
);

fs.copyFileSync(indexPath, path.join(ROOT, 'skills', 'knowledge-base-index.json'));
console.log(`Wrote ${index.length} docs + index.json (+ skills/knowledge-base-index.json)`);
