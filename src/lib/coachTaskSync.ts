import type { JourneyState, UserGoal } from "@/types/journey";
import { normalizeUserGoals, pruneOrphanCoachGoals } from "@/types/journey";

/**
 * Tasks appear only after coach + user agree on a Goal ladder ([[PROGRESS]]).
 * This helper only prunes legacy heuristic tasks from older builds — it never adds new ones.
 */
export function syncSessionTasks(
  state: JourneyState,
): { user_goals: UserGoal[]; progress_summary: string | null } | null {
  const goals = normalizeUserGoals(state.user_goals);
  const pruned = pruneOrphanCoachGoals(goals);

  if (JSON.stringify(pruned) === JSON.stringify(goals)) {
    return null;
  }

  return { user_goals: pruned, progress_summary: state.progress_summary };
}
