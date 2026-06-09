export type PlatformPhase = 1 | 2 | 3;

export type PhaseOneStep = 1 | 2 | 3;

export type JourneyState = {
  platform_phase: PlatformPhase;
  phase_one_step: PhaseOneStep;
  phase_one_confirmed: boolean;
  presenting_challenge: string | null;
  belief_strength_pct: number | null;
  conceptualisation_summary: string | null;
  target_outcome: string | null;
  active_micro_goal: string | null;
  micro_goal_confidence: number | null;
  sustainability_pivot_active: boolean;
  architectural_backtrack_active: boolean;
  last_check_in_at: string | null;
};

export type JourneyContextPayload = {
  platformPhase: PlatformPhase;
  phaseOneStep: PhaseOneStep;
  phaseOneConfirmed: boolean;
  presentingChallenge: string | null;
  beliefStrengthPct: number | null;
  conceptualisationSummary: string | null;
  targetOutcome: string | null;
  activeMicroGoal: string | null;
  microGoalConfidence: number | null;
  sustainabilityPivotActive: boolean;
  architecturalBacktrackActive: boolean;
  isResuming: boolean;
  messageCount: number;
};

export const DEFAULT_JOURNEY_STATE: JourneyState = {
  platform_phase: 1,
  phase_one_step: 1,
  phase_one_confirmed: false,
  presenting_challenge: null,
  belief_strength_pct: null,
  conceptualisation_summary: null,
  target_outcome: null,
  active_micro_goal: null,
  micro_goal_confidence: null,
  sustainability_pivot_active: false,
  architectural_backtrack_active: false,
  last_check_in_at: null,
};

export function journeyStateFromSession(session: Partial<JourneyState> | null | undefined): JourneyState {
  const step = session?.phase_one_step;
  const normalizedStep: PhaseOneStep = step === 2 || step === 3 ? step : 1;
  return {
    platform_phase: (session?.platform_phase as PlatformPhase) ?? 1,
    phase_one_step: normalizedStep,
    phase_one_confirmed: session?.phase_one_confirmed ?? false,
    presenting_challenge: session?.presenting_challenge ?? null,
    belief_strength_pct: session?.belief_strength_pct ?? null,
    conceptualisation_summary: session?.conceptualisation_summary ?? null,
    target_outcome: session?.target_outcome ?? null,
    active_micro_goal: session?.active_micro_goal ?? null,
    micro_goal_confidence: session?.micro_goal_confidence ?? null,
    sustainability_pivot_active: session?.sustainability_pivot_active ?? false,
    architectural_backtrack_active: session?.architectural_backtrack_active ?? false,
    last_check_in_at: session?.last_check_in_at ?? null,
  };
}

export function toJourneyContextPayload(
  state: JourneyState,
  messageCount: number,
): JourneyContextPayload {
  return {
    platformPhase: state.platform_phase,
    phaseOneStep: state.phase_one_step,
    phaseOneConfirmed: state.phase_one_confirmed,
    presentingChallenge: state.presenting_challenge,
    beliefStrengthPct: state.belief_strength_pct,
    conceptualisationSummary: state.conceptualisation_summary,
    targetOutcome: state.target_outcome,
    activeMicroGoal: state.active_micro_goal,
    microGoalConfidence: state.micro_goal_confidence,
    sustainabilityPivotActive: state.sustainability_pivot_active,
    architecturalBacktrackActive: state.architectural_backtrack_active,
    isResuming: messageCount > 2,
    messageCount,
  };
}

export const PHASE_LABELS: Record<PlatformPhase, string> = {
  1: "Understanding",
  2: "Action planning",
  3: "Sustainability",
};

export const PHASE_ONE_STEP_LABELS: Record<PhaseOneStep, string> = {
  1: "Describe your situation",
  2: "Map beliefs & coping",
  3: "Confirm summary",
};

export const PHASE_CHECKLIST: Record<PlatformPhase, string[]> = {
  1: ["Name the situation", "Map triggers and rules", "Rate belief strength", "Confirm the summary"],
  2: ["Define target outcome", "Set a micro-goal", "Confidence 7/10 or higher"],
  3: ["Check in on progress", "Pivot if stressed", "Update assumptions if blocked", "Re-activate with smaller step"],
};

export function checklistProgress(state: JourneyState): boolean[] {
  if (state.platform_phase === 1) {
    return [
      !!state.presenting_challenge,
      state.phase_one_step >= 2 || !!state.belief_strength_pct,
      state.belief_strength_pct != null,
      state.phase_one_confirmed,
    ];
  }
  if (state.platform_phase === 2) {
    return [
      !!state.target_outcome,
      !!state.active_micro_goal,
      (state.micro_goal_confidence ?? 0) >= 7,
    ];
  }
  return [
    !!state.last_check_in_at,
    !state.sustainability_pivot_active,
    !state.architectural_backtrack_active || !!state.conceptualisation_summary,
    (state.micro_goal_confidence ?? 0) >= 7 && !!state.active_micro_goal,
  ];
}
