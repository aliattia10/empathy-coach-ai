import type { JourneyState } from "@/types/journey";

export const NEW_JOURNEY_WELCOME = `Welcome — I'm **Alex**, your AI coaching partner.

This is **one continuous journey** you can return to anytime. We'll start by understanding what's going on for you before any action planning.

**What's the main challenge, stressor, or situation you're facing right now?** Describe it in your own words.`;

export function buildWelcomeMessage(state: Partial<JourneyState>): string {
  if (state.platform_phase === 3 && state.active_micro_goal) {
    const goal = state.active_micro_goal;
    if (state.sustainability_pivot_active) {
      return `Welcome back — I'm **Alex**.

We were working on: **${goal}**, and things felt difficult last time.

**What's happening for you right now — still stressed, or a bit steadier?**`;
    }
    return `Welcome back — I'm **Alex**.

Last time we agreed on this step: **${goal}**.

**How did that go since we last spoke?**`;
  }

  if (state.platform_phase === 2 || (state.phase_one_confirmed && !state.active_micro_goal)) {
    return `Welcome back — I'm **Alex**.

We've built a clear picture of what's driving this for you.

**What would a successful outcome look like for this situation — something concrete you could notice?**`;
  }

  if (state.phase_one_step === 3 && state.conceptualisation_summary && !state.phase_one_confirmed) {
    return `Welcome back — I'm **Alex**.

We were confirming your summary. **Does this still fit how things feel for you right now, or has something shifted?**`;
  }

  if (state.presenting_challenge && state.phase_one_step === 2) {
    return `Welcome back — I'm **Alex**.

**What rule, fear, or "if… then…" thought shows up most when this situation hits?**`;
  }

  return NEW_JOURNEY_WELCOME;
}

export function buildFallbackResponse(phase: number): string {
  if (phase === 1) {
    return "That's helpful context. **What do you notice in your body or emotions when this situation peaks?**";
  }
  if (phase === 2) {
    return "Let's keep this manageable. **What's the smallest version of that step you could try tomorrow?**";
  }
  return "Thanks for sharing that. **What felt hardest about following through on the step?**";
}
