/**
 * Phase 3 Development Skills workbooks (Spec V1 mock seed).
 * IDs must match public.workbooks — coach may only recommend these ids.
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
  },
  {
    id: "wb_naming_emotions",
    eiCategory: "Empathy",
    title: "Naming Emotions with Empathy",
    description:
      "Build the muscle of recognising and naming the emotion behind someone's words before responding to the content.",
    durationMin: 7,
    level: "Beginner",
  },
  {
    id: "wb_perspective_taking",
    eiCategory: "Perspective-Taking",
    title: "Walking in Their Shoes (Perspective-Taking)",
    description:
      "Step into the other person's lived experience to better understand the context behind their views.",
    durationMin: 10,
    level: "Intermediate",
  },
  {
    id: "wb_curious_questioning",
    eiCategory: "Curious Questioning",
    title: "Asking Open, Curious Questions (Curious Questioning)",
    description:
      "Replace assumptions and yes/no questions with open prompts that invite genuine sharing.",
    durationMin: 5,
    level: "Beginner",
  },
  {
    id: "wb_emotional_regulation",
    eiCategory: "Emotional Regulation",
    title: "Pause Before Reacting (Emotional Regulation)",
    description:
      "Build a brief space between feeling triggered and responding, so your reply matches your intention.",
    durationMin: 5,
    level: "Intermediate",
  },
  {
    id: "wb_cultural_humility",
    eiCategory: "Cultural Humility",
    title: "Cultural Humility Practice",
    description:
      "Approach unfamiliar identities and experiences as a learner rather than an expert.",
    durationMin: 8,
    level: "Intermediate",
  },
  {
    id: "wb_conflict_navigation",
    eiCategory: "Conflict Navigation",
    title: "Staying in Hard Conversations (Conflict Navigation)",
    description:
      "Practice staying engaged when a conversation feels tense, instead of withdrawing or escalating.",
    durationMin: 8,
    level: "Intermediate",
  },
  {
    id: "wb_self_reflection",
    eiCategory: "Self-Reflection",
    title: "Reflecting on Your Reactions (Self-Reflection)",
    description:
      "Turn attention inward to notice what your reactions reveal about your own beliefs and history.",
    durationMin: 7,
    level: "Beginner",
  },
];

const WORKBOOK_IDS = new Set(WORKBOOKS.map((w) => w.id));

function formatWorkbooksForPrompt(opts = {}) {
  const condensed = !!opts.condensed;
  const list = WORKBOOKS.map(
    (w) =>
      `- ${w.id} | ${w.eiCategory} | ${w.title} (${w.durationMin} min, ${w.level}): ${w.description}`,
  ).join("\n");

  const header = condensed
    ? `# Development Skills workbooks (Phase 3 tools — recommend by id only)
When a skill gap fits a workbook below, end your reply with a closed block (invisible to the user):
\`[[WORKBOOK]]{"id":"<exact_id>","reason":"short why"}[[/WORKBOOK]]\`
Only use ids from this list. Never invent titles. The UI shows Add / Skip / Start — the user always chooses.
User open/completed workbooks (if any) are in Journey state — do not re-recommend skipped ones this session.`
    : `# Development Skills workbooks (Phase 3 — Integration & Action)
These workbooks are the Tools to Develop Emotional Intelligence library.
When you identify a skill gap that a workbook addresses, briefly name the skill in natural language
(e.g. "Sounds like Active Listening would be a great skill to develop…") then emit ONE machine block
on its own line at the end (after [[PROGRESS]] if present, or alone):
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
