import type { UserGoal, JourneyState, PhaseChecklistItem } from "@/types/journey";
import { normalizeUserGoals } from "@/types/journey";
import { mergePhaseChecklistFromAi } from "@/lib/phaseChecklist";

const PROGRESS_BLOCK_RE = /\[\[PROGRESS\]\]([\s\S]*?)\[\[\/PROGRESS\]\]/i;

export type ProgressPayload = {
  summary?: string;
  goals?: Array<{ title?: string; id?: string }>;
  milestones?: Array<{ key?: string; title?: string; phase?: number }>;
};

export function stripProgressBlock(text: string): string {
  return text.replace(PROGRESS_BLOCK_RE, "").trimEnd();
}

export function parseProgressBlock(text: string): ProgressPayload | null {
  const match = text.match(PROGRESS_BLOCK_RE);
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as ProgressPayload;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function newGoalId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Merge AI suggestions — always keep user-created tasks. */
export function mergeProgressGoals(
  existing: UserGoal[],
  payload: ProgressPayload,
): { goals: UserGoal[]; summary: string | null } {
  const now = new Date().toISOString();
  const byTitle = new Map(existing.map((g) => [g.title.toLowerCase(), g]));
  const incoming = payload.goals ?? [];
  const result = new Map<string, UserGoal>();

  for (const g of existing) {
    if (g.source === "user") {
      result.set(g.title.toLowerCase(), g);
    }
  }

  for (const item of incoming) {
    const title = (item.title ?? "").trim();
    if (!title) continue;
    const key = title.toLowerCase();
    const prev = result.get(key) ?? byTitle.get(key);
    if (prev) {
      result.set(key, { ...prev, title });
    } else {
      result.set(key, {
        id: item.id?.trim() || newGoalId(),
        title,
        completed: false,
        completed_at: null,
        source: "ai",
        created_at: now,
      });
    }
  }

  for (const g of existing) {
    const key = g.title.toLowerCase();
    if (!result.has(key)) {
      result.set(key, g);
    }
  }

  const goals = Array.from(result.values());
  const summary =
    typeof payload.summary === "string" && payload.summary.trim()
      ? payload.summary.trim().slice(0, 400)
      : null;

  return { goals, summary };
}

export function extractProgressUpdates(
  assistantText: string,
  current: JourneyState,
): {
  displayContent: string;
  goals: UserGoal[] | null;
  progressSummary: string | null;
  phaseChecklist: PhaseChecklistItem[] | null;
} {
  const payload = parseProgressBlock(assistantText);
  const displayContent = stripProgressBlock(assistantText);
  if (!payload) {
    return { displayContent, goals: null, progressSummary: null, phaseChecklist: null };
  }
  const merged = mergeProgressGoals(normalizeUserGoals(current.user_goals), payload);
  const phaseChecklist =
    payload.milestones && payload.milestones.length > 0
      ? mergePhaseChecklistFromAi(current.phase_checklist, payload.milestones, current)
      : null;
  return {
    displayContent,
    goals: merged.goals.length > 0 ? merged.goals : null,
    progressSummary: merged.summary,
    phaseChecklist,
  };
}
