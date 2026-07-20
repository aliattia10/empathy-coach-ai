import type { JourneyState, PhaseChecklistItem, PhaseMilestoneKey, PlatformPhase } from "@/types/journey";
import { normalizePhaseChecklist } from "@/types/journey";
import { parseBeliefStrengthBefore } from "@/lib/beliefRatings";

function newId(): string {
  return `ms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function snippet(text: string | null | undefined, max = 48): string {
  if (!text?.trim()) return "";
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** Session-specific milestone titles derived from journey state (fallback when AI has not emitted yet). */
export function buildSessionPhaseChecklist(state: JourneyState): PhaseChecklistItem[] {
  const phase = state.platform_phase;
  const challenge = snippet(state.presenting_challenge) || "your situation";
  const items: PhaseChecklistItem[] = [];

  if (phase === 1) {
    items.push(
      {
        id: newId(),
        key: "situation",
        title: `Name the core challenge: ${challenge}`,
        completed: !!state.presenting_challenge,
        phase: 1,
      },
      {
        id: newId(),
        key: "triggers_rules",
        title: state.conceptualisation_summary
          ? `Map triggers, rules, and beliefs for ${challenge}`
          : `Explore what triggers the reaction in ${challenge}`,
        completed: state.phase_one_step >= 2 || !!state.conceptualisation_summary,
        phase: 1,
      },
      {
        id: newId(),
        key: "belief_strength",
        title: (() => {
          const before = parseBeliefStrengthBefore(state.conceptualisation_summary);
          const now = state.belief_strength_pct;
          if (now == null) return "Rate how strongly you believe the hot thought (0–100%)";
          if (before != null && before !== now) {
            return `Belief strength: ${before}% → ${now}%`;
          }
          return `Belief strength recorded (${now}%)`;
        })(),
        completed: state.belief_strength_pct != null,
        phase: 1,
      },
      {
        id: newId(),
        key: "handshake",
        title: "Confirm the summary matches how you operate right now",
        completed: state.phase_one_confirmed,
        phase: 1,
      },
    );
  } else if (phase === 2) {
    items.push(
      {
        id: newId(),
        key: "target_outcome",
        title: state.target_outcome
          ? `Target outcome: ${snippet(state.target_outcome, 72)}`
          : "Define what success looks like for this situation",
        completed: !!state.target_outcome,
        phase: 2,
      },
      {
        id: newId(),
        key: "micro_goal",
        title: state.active_micro_goal
          ? `Micro-step: ${snippet(state.active_micro_goal, 72)}`
          : "Agree one small step for the next day or sitting",
        completed: !!state.active_micro_goal,
        phase: 2,
      },
      {
        id: newId(),
        key: "confidence",
        title:
          state.micro_goal_confidence != null
            ? `Confidence check: ${state.micro_goal_confidence}/10`
            : "Rate confidence you can do the step (7/10 minimum)",
        completed: (state.micro_goal_confidence ?? 0) >= 7,
        phase: 2,
      },
    );
  } else {
    items.push(
      {
        id: newId(),
        key: "check_in",
        title: state.active_micro_goal
          ? `Check in on: ${snippet(state.active_micro_goal, 64)}`
          : "Check in on your last action step",
        completed: !!state.last_check_in_at,
        phase: 3,
      },
      {
        id: newId(),
        key: "regulate",
        title: "Regulate if stress spiked (core distancing skills)",
        completed: !state.sustainability_pivot_active,
        phase: 3,
      },
      {
        id: newId(),
        key: "update_assumptions",
        title: "Update assumptions if the step failed or fears shifted",
        completed: !state.architectural_backtrack_active,
        phase: 3,
      },
      {
        id: newId(),
        key: "reactivate",
        title: state.active_micro_goal
          ? `Re-activate with a smaller step: ${snippet(state.active_micro_goal, 56)}`
          : "Re-activate with a smaller next step",
        completed: !!state.active_micro_goal && (state.micro_goal_confidence ?? 0) >= 7 && !state.sustainability_pivot_active,
        phase: 3,
      },
    );
  }

  return items;
}

const VALID_KEYS = new Set<PhaseMilestoneKey>([
  "situation",
  "triggers_rules",
  "belief_strength",
  "handshake",
  "target_outcome",
  "micro_goal",
  "confidence",
  "check_in",
  "regulate",
  "update_assumptions",
  "reactivate",
]);

export function mergePhaseChecklistFromAi(
  existing: PhaseChecklistItem[],
  incoming: Array<{ key?: string; title?: string; phase?: number }>,
  state: JourneyState,
): PhaseChecklistItem[] {
  const byKey = new Map(existing.map((m) => [m.key, m]));
  const auto = applyAutoCompletionToChecklist(state, buildSessionPhaseChecklist(state));
  const autoByKey = new Map(auto.map((m) => [m.key, m]));

  if (!incoming.length) return auto;

  return incoming
    .map((item) => {
      const key = (item.key ?? "") as PhaseMilestoneKey;
      if (!VALID_KEYS.has(key)) return null;
      const title = (item.title ?? "").trim().slice(0, 140);
      if (!title) return null;
      const prev = byKey.get(key);
      const autoItem = autoByKey.get(key);
      const phase = (item.phase === 2 || item.phase === 3 ? item.phase : state.platform_phase) as PlatformPhase;
      return {
        id: prev?.id ?? newId(),
        key,
        title,
        completed: autoItem?.completed ?? prev?.completed ?? false,
        phase,
      };
    })
    .filter((m): m is PhaseChecklistItem => m !== null);
}

/** Recompute completed flags from journey state — milestones are never user-toggled. */
export function applyAutoCompletionToChecklist(
  state: JourneyState,
  items: PhaseChecklistItem[],
): PhaseChecklistItem[] {
  const fresh = buildSessionPhaseChecklist(state);
  const freshByKey = new Map(fresh.map((m) => [m.key, m.completed]));

  return items.map((item) => ({
    ...item,
    completed: freshByKey.get(item.key) ?? item.completed,
    phase: state.platform_phase,
  }));
}

export function syncPhaseChecklist(state: JourneyState): PhaseChecklistItem[] {
  const existing = normalizePhaseChecklist(state.phase_checklist);
  if (existing.length === 0) {
    return buildSessionPhaseChecklist(state);
  }
  return applyAutoCompletionToChecklist(state, existing);
}

export function phaseChecklistCompletionRatio(items: PhaseChecklistItem[]): { done: number; total: number } {
  const total = items.length;
  const done = items.filter((m) => m.completed).length;
  return { done, total };
}
