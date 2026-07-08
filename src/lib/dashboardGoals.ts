import type { JourneyState, UserGoal } from "@/types/journey";



function newGoalId(): string {

  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

}



function snippet(text: string, max = 100): string {

  const t = text.trim();

  return t.length > max ? `${t.slice(0, max)}…` : t;

}



/** Fallback action steps when journey advances but the model did not emit a progress block. */

export function synthesizeDashboardGoals(state: JourneyState): {

  goals: UserGoal[];

  summary: string | null;

} | null {

  const now = new Date().toISOString();

  const goals: UserGoal[] = [];



  if (state.active_micro_goal) {

    goals.push({

      id: newGoalId(),

      title: snippet(state.active_micro_goal, 120),

      completed: false,

      completed_at: null,

      source: "system",

      created_at: now,

    });

  } else if (state.target_outcome) {

    goals.push({

      id: newGoalId(),

      title: `Take one small step toward: ${snippet(state.target_outcome, 80)}`,

      completed: false,

      completed_at: null,

      source: "system",

      created_at: now,

    });

  } else if (state.presenting_challenge && state.phase_one_step >= 2) {

    goals.push({

      id: newGoalId(),

      title: `Reflect on one trigger in: ${snippet(state.presenting_challenge, 72)}`,

      completed: false,

      completed_at: null,

      source: "system",

      created_at: now,

    });

  }



  if (goals.length === 0) return null;



  const summary =

    state.progress_summary ??

    (state.presenting_challenge

      ? state.presenting_challenge.slice(0, 200)

      : state.conceptualisation_summary?.slice(0, 200) ?? null);



  return { goals, summary };

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


