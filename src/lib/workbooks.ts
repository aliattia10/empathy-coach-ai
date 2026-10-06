/** Client mirror of skills/workbooksLibrary.cjs — keep ids in sync with public.workbooks. */

export type WorkbookLevel = "Beginner" | "Intermediate" | "Advanced";

export type WorkbookDefinition = {
  id: string;
  eiCategory: string;
  title: string;
  description: string;
  durationMin: number;
  level: WorkbookLevel;
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
] as const;

export type EiCategory = (typeof EI_CATEGORIES)[number];

export const WORKBOOK_CATALOGUE: WorkbookDefinition[] = [
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
    description: "Approach unfamiliar identities and experiences as a learner rather than an expert.",
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

export const WORKBOOK_BY_ID = Object.fromEntries(
  WORKBOOK_CATALOGUE.map((w) => [w.id, w]),
) as Record<string, WorkbookDefinition>;

export function isKnownWorkbookId(id: string): boolean {
  return id in WORKBOOK_BY_ID;
}

export type UserWorkbookStatus = "added" | "in_progress" | "completed" | "skipped";
