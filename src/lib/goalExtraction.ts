import type { UserGoal, JourneyState, PhaseChecklistItem } from "@/types/journey";
import {
  normalizeUserGoals,
  pruneOrphanCoachGoals,
  sortGoalsByStep,
} from "@/types/journey";
import { mergePhaseChecklistFromAi } from "@/lib/phaseChecklist";

const PROGRESS_BLOCK_RE = /\[\[PROGRESS\]\]([\s\S]*?)\[\[\/PROGRESS\]\]/i;

export type ProgressPayload = {
  summary?: string;
  goals?: Array<{ title?: string; id?: string; step?: string; tier?: "goal" | "major" | "sub" }>;
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

function isLadderPayload(payload: ProgressPayload): boolean {
  const incoming = payload.goals ?? [];
  const hasGoal = incoming.some((g) => g.tier === "goal" || g.step === "goal");
  const hasSteps = incoming.some(
    (g) => g.tier === "major" || g.tier === "sub" || (g.step && g.step !== "goal"),
  );
  return hasGoal && hasSteps;
}

function buildGoalFromPayload(
  item: NonNullable<ProgressPayload["goals"]>[number],
  prev: UserGoal | undefined,
  now: string,
): UserGoal | null {
  const title = (item.title ?? "").trim();
  if (!title) return null;
  const step = item.step?.trim();
  const tier = item.tier;
  return {
    id: prev?.id ?? (item.id?.trim() || newGoalId()),
    title,
    completed: prev?.completed ?? false,
    completed_at: prev?.completed_at ?? null,
    source: "ai",
    created_at: prev?.created_at ?? now,
    step,
    tier:
      tier ??
      (step === "goal" ? "goal" : step?.includes(".") ? "sub" : step ? "major" : undefined),
  };
}

/** Merge AI ladder — keep user-created tasks; replace legacy coach junk on full ladder sync. */
export function mergeProgressGoals(
  existing: UserGoal[],
  payload: ProgressPayload,
): { goals: UserGoal[]; summary: string | null } {
  const now = new Date().toISOString();
  const byTitle = new Map(existing.map((g) => [g.title.toLowerCase(), g]));
  const incoming = payload.goals ?? [];

  if (isLadderPayload(payload)) {
    const userGoals = existing.filter((g) => g.source === "user" && !g.step && !g.tier);
    const ladderGoals: UserGoal[] = [];
    for (const item of incoming) {
      const title = (item.title ?? "").trim();
      if (!title) continue;
      const prev = byTitle.get(title.toLowerCase());
      const built = buildGoalFromPayload(item, prev, now);
      if (built) ladderGoals.push(built);
    }
    const goals = pruneOrphanCoachGoals(sortGoalsByStep([...ladderGoals, ...userGoals]));
    const summary =
      typeof payload.summary === "string" && payload.summary.trim()
        ? payload.summary.trim().slice(0, 400)
        : null;
    return { goals, summary };
  }

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
    const built = buildGoalFromPayload(item, prev, now);
    if (built) result.set(key, built);
  }

  for (const g of existing) {
    if (g.source !== "user") continue;
    const key = g.title.toLowerCase();
    if (!result.has(key)) {
      result.set(key, g);
    }
  }

  const goals = pruneOrphanCoachGoals(sortGoalsByStep(Array.from(result.values())));
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
