export type PlatformPhase = 1 | 2 | 3;

export type PhaseOneStep = 1 | 2 | 3;

export type GoalStepTier = "goal" | "major" | "sub";

export type UserGoal = {
  id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  source: "ai" | "system" | "user";
  created_at: string;
  /** Ladder label: "goal", "1", "1.1", "2", etc. */
  step?: string;
  tier?: GoalStepTier;
};

export type PhaseMilestoneKey =
  | "situation"
  | "triggers_rules"
  | "belief_strength"
  | "handshake"
  | "target_outcome"
  | "micro_goal"
  | "confidence"
  | "check_in"
  | "regulate"
  | "update_assumptions"
  | "reactivate";

export type PhaseChecklistItem = {
  id: string;
  key: PhaseMilestoneKey;
  title: string;
  completed: boolean;
  phase: PlatformPhase;
};

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
  progress_summary: string | null;
  user_goals: UserGoal[];
  phase_checklist: PhaseChecklistItem[];
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
  phaseOneNextElement?: string | null;
  askedPhaseOneElements?: string | null;
  progressSummary?: string | null;
  userGoals?: UserGoal[];
  phaseChecklist?: PhaseChecklistItem[];
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
  progress_summary: null,
  user_goals: [],
  phase_checklist: [],
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
    progress_summary: session?.progress_summary ?? null,
    user_goals: pruneOrphanCoachGoals(normalizeUserGoals(session?.user_goals)),
    phase_checklist: normalizePhaseChecklist(session?.phase_checklist),
  };
}

export function normalizeUserGoals(raw: unknown): UserGoal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => {
      const step = typeof item.step === "string" ? item.step.trim() : undefined;
      const tierRaw = item.tier;
      const tier: GoalStepTier | undefined =
        tierRaw === "goal" || tierRaw === "major" || tierRaw === "sub"
          ? tierRaw
          : step === "goal"
            ? "goal"
            : step?.includes(".")
              ? "sub"
              : step
                ? "major"
                : undefined;
      return {
        id: typeof item.id === "string" ? item.id : `goal-${index}`,
        title: typeof item.title === "string" ? item.title.trim() : "",
        completed: !!item.completed,
        completed_at: typeof item.completed_at === "string" ? item.completed_at : null,
        source: item.source === "user" ? "user" : item.source === "system" ? "system" : "ai",
        created_at: typeof item.created_at === "string" ? item.created_at : new Date().toISOString(),
        step,
        tier,
      };
    })
    .filter((g) => g.title.length > 0);
}

export function isStructuredGoal(goal: UserGoal): boolean {
  return !!(goal.step || goal.tier);
}

/** True when the session has an agreed Goal + at least one step/sub-step. */
export function hasAgreedGoalLadder(goals: UserGoal[]): boolean {
  if (!goals.length) return false;
  const hasGoalRow = goals.some((g) => g.tier === "goal" || g.step === "goal");
  const hasSteps = goals.some(
    (g) =>
      g.tier === "major" ||
      g.tier === "sub" ||
      (g.step && g.step !== "goal"),
  );
  return hasGoalRow && hasSteps;
}

/** Keep user tasks + structured ladder rows; drop legacy auto-generated coach tasks. */
export function pruneOrphanCoachGoals(goals: UserGoal[]): UserGoal[] {
  const structured = goals.filter(isStructuredGoal);
  const userGoals = goals.filter((g) => g.source === "user" && !isStructuredGoal(g));

  if (structured.length > 0) {
    const structuredTitles = new Set(structured.map((g) => g.title.toLowerCase()));
    const userExtras = userGoals.filter((g) => !structuredTitles.has(g.title.toLowerCase()));
    return sortGoalsByStep([...structured, ...userExtras]);
  }

  return userGoals;
}

/** Sort goal ladder: goal → 1 → 1.1 → 1.2 → 2 … */
export function sortGoalsByStep(goals: UserGoal[]): UserGoal[] {
  const rank = (step?: string) => {
    if (!step || step === "goal") return [-1];
    return step.split(".").map((p) => parseInt(p, 10) || 0);
  };
  return [...goals].sort((a, b) => {
    const ra = rank(a.step);
    const rb = rank(b.step);
    const len = Math.max(ra.length, rb.length);
    for (let i = 0; i < len; i++) {
      const diff = (ra[i] ?? 0) - (rb[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return a.title.localeCompare(b.title);
  });
}

export function normalizePhaseChecklist(raw: unknown): PhaseChecklistItem[] {
  const validKeys = new Set([
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
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => {
      const key = typeof item.key === "string" && validKeys.has(item.key) ? (item.key as PhaseMilestoneKey) : "situation";
      const phase = item.phase === 2 || item.phase === 3 ? (item.phase as PlatformPhase) : 1;
      return {
        id: typeof item.id === "string" ? item.id : `ms-${index}`,
        key,
        title: typeof item.title === "string" ? item.title.trim().slice(0, 140) : "",
        completed: !!item.completed,
        phase,
      };
    })
    .filter((m) => m.title.length > 0);
}

export function toJourneyContextPayload(
  state: JourneyState,
  messageCount: number,
  opts?: { phaseOneNextElement?: string | null; askedPhaseOneElements?: string | null },
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
    phaseOneNextElement: opts?.phaseOneNextElement ?? null,
    askedPhaseOneElements: opts?.askedPhaseOneElements ?? null,
    progressSummary: state.progress_summary,
    userGoals: state.user_goals,
    phaseChecklist: state.phase_checklist,
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
