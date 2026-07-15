import type { UserGoal, JourneyState, PhaseChecklistItem } from "@/types/journey";
import {
  normalizeUserGoals,
  pruneOrphanCoachGoals,
  sortGoalsByStep,
} from "@/types/journey";
import { mergePhaseChecklistFromAi } from "@/lib/phaseChecklist";

const PROGRESS_CLOSED_RE = /\[\[PROGRESS\]\]([\s\S]*?)\[\[\/PROGRESS\]\]/gi;
const PROGRESS_OPEN_RE = /\[\[PROGRESS\]\]/i;

export type ProgressPayload = {
  summary?: string;
  goals?: Array<{ title?: string; id?: string; step?: string; tier?: "goal" | "major" | "sub" }>;
  milestones?: Array<{ key?: string; title?: string; phase?: number }>;
};

/** Extract first balanced `{...}` JSON object from text. */
function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

function findProgressPayloadJson(text: string): string | null {
  const closed = text.match(/\[\[PROGRESS\]\]([\s\S]*?)\[\[\/PROGRESS\]\]/i);
  if (closed?.[1]) {
    const json = extractJsonObject(closed[1]);
    if (json) return json;
  }

  const marker = text.search(PROGRESS_OPEN_RE);
  if (marker < 0) return null;
  const afterMarker = text.slice(marker).replace(/^\[\[PROGRESS\]\]/i, "");
  return extractJsonObject(afterMarker);
}

function parseProgressPayload(text: string): ProgressPayload | null {
  const json = findProgressPayloadJson(text);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as ProgressPayload;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Remove [[PROGRESS]] blocks — including unclosed tags and trailing model junk. */
export function stripProgressBlock(text: string): string {
  let out = String(text || "");

  out = out.replace(PROGRESS_CLOSED_RE, "");
  out = out.replace(/\[\[\/PROGRESS\]\]/gi, "");

  const openIdx = out.search(PROGRESS_OPEN_RE);
  if (openIdx >= 0) {
    out = out.slice(0, openIdx).trimEnd();
  }

  return out
    .replace(/\[\[PROGRESS\]\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

export function sanitizeAssistantDisplayContent(text: string): string {
  return stripProgressBlock(text)
    .replace(/^\s*Task:\s*/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseProgressBlock(text: string): ProgressPayload | null {
  return parseProgressPayload(text);
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

function normalizeIncomingGoals(payload: ProgressPayload): ProgressPayload["goals"] {
  const incoming = [...(payload.goals ?? [])];
  const hasGoalRow = incoming.some((g) => g.tier === "goal" || g.step === "goal");
  const summary = typeof payload.summary === "string" ? payload.summary.trim() : "";

  if (!hasGoalRow && summary) {
    const title = summary.replace(/^Goal:\s*/i, "").trim() || summary;
    incoming.unshift({ step: "goal", tier: "goal", title });
  }

  const hasMajor = incoming.some((g) => g.tier === "major" || (g.step && !g.step.includes(".") && g.step !== "goal"));
  const hasSub = incoming.some((g) => g.tier === "sub" || g.step?.includes("."));
  if (!hasMajor && hasSub) {
    const firstSub = incoming.find((g) => g.step?.includes("."));
    const majorNum = firstSub?.step?.split(".")[0] ?? "1";
    if (!incoming.some((g) => g.step === majorNum)) {
      const subTitle = firstSub?.title ?? "Work on agreed step";
      const goalIdx = incoming.findIndex((g) => g.step === "goal" || g.tier === "goal");
      incoming.splice(goalIdx >= 0 ? goalIdx + 1 : 0, 0, {
        step: majorNum,
        tier: "major",
        title: subTitle,
      });
    }
  }

  return incoming;
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
  const normalizedPayload = { ...payload, goals: normalizeIncomingGoals(payload) };
  const incoming = normalizedPayload.goals ?? [];

  if (isLadderPayload(normalizedPayload)) {
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
  const displayContent = sanitizeAssistantDisplayContent(assistantText);
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

/** Recover Tasks from the latest assistant [[PROGRESS]] in chat history (e.g. after a failed parse). */
export function extractLatestProgressFromHistory(
  assistantMessages: string[],
  current: JourneyState,
): {
  goals: UserGoal[] | null;
  progressSummary: string | null;
} {
  for (let i = assistantMessages.length - 1; i >= 0; i -= 1) {
    const payload = parseProgressBlock(assistantMessages[i]);
    if (!payload) continue;
    const merged = mergeProgressGoals(normalizeUserGoals(current.user_goals), payload);
    if (merged.goals.length > 0 || merged.summary) {
      return {
        goals: merged.goals.length > 0 ? merged.goals : null,
        progressSummary: merged.summary,
      };
    }
  }
  return { goals: null, progressSummary: null };
}
