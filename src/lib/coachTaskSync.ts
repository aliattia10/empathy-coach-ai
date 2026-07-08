import type { JourneyState, UserGoal } from "@/types/journey";
import { normalizeUserGoals } from "@/types/journey";

function newGoalId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function snippet(text: string, max = 100): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** Pull actionable steps from coach reply text when [[PROGRESS]] block is missing. */
export function extractCoachTaskCandidates(assistantText: string): string[] {
  const text = assistantText.trim();
  if (!text) return [];

  const patterns = [
    /your (?:next )?(?:small )?step(?: is)?:?\s*([^.?\n]{8,120})/i,
    /try (?:to )?([^.?\n]{8,100})(?:\s+tomorrow)?/i,
    /micro[- ]?goal:?\s*([^.?\n]{8,120})/i,
    /(?:could you|can you|how about if you|what if you)\s+([^.?\n]{8,100})\??/i,
    /(?:before (?:we|our) next|this week|tomorrow),?\s+([^.?\n]{8,100})/i,
    /(?:action step|homework|practice):?\s*([^.?\n]{8,120})/i,
  ];

  const found: string[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 8) {
      found.push(candidate.slice(0, 120));
    }
  }
  return [...new Set(found.map((t) => t.toLowerCase()))].map((key) =>
    found.find((t) => t.toLowerCase() === key)!,
  );
}

export function appendCoachSuggestions(
  existing: UserGoal[],
  titles: string[],
  source: "ai" | "system" = "ai",
): UserGoal[] {
  const result = [...existing];
  const seen = new Set(existing.map((g) => g.title.toLowerCase()));
  const now = new Date().toISOString();

  for (const raw of titles) {
    const title = raw.trim().slice(0, 120);
    if (title.length < 8) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: newGoalId(),
      title,
      completed: false,
      completed_at: null,
      source,
      created_at: now,
    });
  }
  return result;
}

function buildTasksFromJourneyState(state: JourneyState): { titles: string[]; summary: string | null } {
  const titles: string[] = [];

  if (state.active_micro_goal) {
    titles.push(snippet(state.active_micro_goal, 120));
  }
  if (state.target_outcome && !state.active_micro_goal) {
    titles.push(`Take one small step toward: ${snippet(state.target_outcome, 80)}`);
  }
  if (state.phase_one_confirmed && state.conceptualisation_summary && !state.active_micro_goal) {
    titles.push("Review your agreed summary and name one tiny next experiment");
  }
  if (state.presenting_challenge && state.phase_one_step >= 2 && titles.length === 0) {
    titles.push(`Notice one trigger in: ${snippet(state.presenting_challenge, 72)}`);
  }
  if (state.presenting_challenge && titles.length === 0) {
    titles.push(`Write down the core moment from: ${snippet(state.presenting_challenge, 60)}`);
  }

  const summary =
    state.progress_summary ??
    (state.presenting_challenge
      ? state.presenting_challenge.slice(0, 200)
      : state.conceptualisation_summary?.slice(0, 200) ?? null);

  return { titles, summary };
}

export type SyncSessionTasksOptions = {
  assistantMessage?: string;
  assistantHistory?: string[];
  userMessageCount?: number;
};

/**
 * Merge coach-suggested tasks (from [[PROGRESS]], reply heuristics, journey state).
 * User-created tasks are never removed.
 */
export function syncSessionTasks(
  state: JourneyState,
  opts: SyncSessionTasksOptions = {},
): { user_goals: UserGoal[]; progress_summary: string | null } | null {
  let goals = normalizeUserGoals(state.user_goals);
  let summary = state.progress_summary;

  if (opts.assistantHistory?.length) {
    for (const msg of opts.assistantHistory.slice(-8)) {
      goals = appendCoachSuggestions(goals, extractCoachTaskCandidates(msg), "ai");
    }
  } else if (opts.assistantMessage) {
    goals = appendCoachSuggestions(goals, extractCoachTaskCandidates(opts.assistantMessage), "ai");
  }

  const fromState = buildTasksFromJourneyState(state);
  goals = appendCoachSuggestions(goals, fromState.titles, "system");
  if (!summary && fromState.summary) {
    summary = fromState.summary;
  }

  const userTurns = opts.userMessageCount ?? 0;
  if (goals.length === 0 && userTurns >= 2) {
    goals = appendCoachSuggestions(
      goals,
      ["Continue the conversation and note one concrete next step your coach suggests"],
      "system",
    );
  }

  const goalsChanged = JSON.stringify(goals) !== JSON.stringify(normalizeUserGoals(state.user_goals));
  const summaryChanged = summary !== state.progress_summary;
  if (!goalsChanged && !summaryChanged) return null;

  return { user_goals: goals, progress_summary: summary };
}
