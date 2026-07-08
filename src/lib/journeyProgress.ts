import type { JourneyState } from "@/types/journey";

import { phaseChecklistCompletionRatio } from "@/lib/phaseChecklist";



export function computeJourneyProgressPercent(

  journey: JourneyState,

  userTurns: number,

): number {

  const phaseBase = journey.platform_phase === 1 ? 0 : journey.platform_phase === 2 ? 34 : 67;



  let phasePercent: number;

  if (journey.platform_phase === 1) {

    phasePercent = journey.phase_one_confirmed ? 33 : Math.min(28, userTurns * 6);

  } else if (journey.platform_phase === 2) {

    if (journey.active_micro_goal && (journey.micro_goal_confidence ?? 0) >= 7) {

      phasePercent = 66;

    } else {

      phasePercent = phaseBase + Math.min(30, userTurns * 4);

    }

  } else if (journey.sustainability_pivot_active) {

    phasePercent = 72;

  } else if (journey.last_check_in_at) {

    phasePercent = Math.min(100, 80 + userTurns * 2);

  } else {

    phasePercent = phaseBase + Math.min(28, userTurns * 3);

  }



  const goals = journey.user_goals ?? [];

  const milestones = journey.phase_checklist ?? [];



  const goalsPercent =

    goals.length > 0

      ? (goals.filter((g) => g.completed).length / goals.length) * 100

      : null;



  const msRatio = phaseChecklistCompletionRatio(milestones);

  const milestonesPercent =

    msRatio.total > 0 ? (msRatio.done / msRatio.total) * 100 : null;



  if (goalsPercent == null && milestonesPercent == null) return phasePercent;



  const weights =

    goalsPercent != null && milestonesPercent != null

      ? { phase: 0.4, goals: 0.35, milestones: 0.25 }

      : goalsPercent != null

        ? { phase: 0.55, goals: 0.45, milestones: 0 }

        : { phase: 0.6, goals: 0, milestones: 0.4 };



  return Math.round(

    phasePercent * weights.phase +

      (goalsPercent ?? 0) * weights.goals +

      (milestonesPercent ?? 0) * weights.milestones,

  );

}



export function goalsCompletionRatio(goals: JourneyState["user_goals"]): {

  done: number;

  total: number;

} {

  const total = goals.length;

  const done = goals.filter((g) => g.completed).length;

  return { done, total };

}


