import type { UserGoal } from "@/types/journey";
import { syncSessionTasks } from "@/lib/coachTaskSync";
import type { JourneyState } from "@/types/journey";

/** @deprecated Use syncSessionTasks — kept for call sites during chat. */
export function synthesizeDashboardGoals(state: JourneyState) {
  return syncSessionTasks(state);
}

export function autoCompleteMatchingGoal(
  goals: UserGoal[],
  userMessage: string,
): UserGoal[] | null {
  const success =
    /\b(did it|completed|managed to|went well|success|i did|got it done|followed through|made progress|done that|finished|ticked off|checked off)\b/i;
  if (!success.test(userMessage)) return null;

  const open = goals.find((g) => !g.completed);
  if (!open) return null;

  const now = new Date().toISOString();
  return goals.map((g) =>
    g.id === open.id ? { ...g, completed: true, completed_at: now } : g,
  );
}
