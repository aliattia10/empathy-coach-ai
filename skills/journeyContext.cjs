/**
 * Formats persisted journey state for LLM system context (Phase 1, 2 & 3).
 */

/** @typedef {1 | 2 | 3} PlatformPhase */

const PHASE_ONE_STEP_LABELS = {
  1: "1.1 scenario extraction",
  2: "1.2 component breakdown",
  3: "1.3 reflective handshake pending",
};

/**
 * @param {object} ctx
 * @param {PlatformPhase} [ctx.platformPhase]
 * @param {number} [ctx.phaseOneStep]
 * @param {boolean} [ctx.phaseOneConfirmed]
 * @param {string|null} [ctx.presentingChallenge]
 * @param {number|null} [ctx.beliefStrengthPct]
 * @param {string|null} [ctx.conceptualisationSummary]
 * @param {string|null} [ctx.targetOutcome]
 * @param {string|null} [ctx.activeMicroGoal]
 * @param {number|null} [ctx.microGoalConfidence]
 * @param {boolean} [ctx.sustainabilityPivotActive]
 * @param {boolean} [ctx.architecturalBacktrackActive]
 * @param {boolean} [ctx.isResuming]
 * @param {number} [ctx.messageCount]
 */
function formatJourneyContextForPrompt(ctx) {
  if (!ctx || typeof ctx !== "object") return "";

  const phase = ctx.platformPhase ?? 1;
  const step = ctx.phaseOneStep ?? 1;
  const lines = [
    "# Journey state for this conversation thread (internal — do not recite labels to user)",
    `Current platform phase (internal): ${phase}`,
    `Phase One step (internal): ${PHASE_ONE_STEP_LABELS[step] || step}`,
    `Phase One Reflective Handshake confirmed: ${ctx.phaseOneConfirmed ? "yes" : "no"}`,
    `Sustainability Pivot active: ${ctx.sustainabilityPivotActive ? "yes — Core distancing skills only, halt BA" : "no"}`,
    `Architectural Backtrack active: ${ctx.architecturalBacktrackActive ? "yes — update Phase One assumptions before re-activation" : "no"}`,
    `Resuming existing thread: ${ctx.isResuming ? "yes" : "no"}`,
  ];

  if (ctx.presentingChallenge) {
    lines.push(`Presenting challenge on file: ${ctx.presentingChallenge}`);
  }
  if (typeof ctx.beliefStrengthPct === "number") {
    lines.push(`Belief strength recorded (0–100%): ${ctx.beliefStrengthPct}`);
  }
  if (ctx.conceptualisationSummary) {
    lines.push(`Conceptualisation on file: ${ctx.conceptualisationSummary}`);
  }
  if (ctx.targetOutcome) {
    lines.push(`Target outcome (Phase Two): ${ctx.targetOutcome}`);
  }
  if (ctx.activeMicroGoal) {
    lines.push(`Active micro-goal (Phase Two/Three): ${ctx.activeMicroGoal}`);
  }
  if (typeof ctx.microGoalConfidence === "number") {
    lines.push(`Last confidence rating for micro-goal (1–10): ${ctx.microGoalConfidence}`);
    if (ctx.microGoalConfidence < 7) {
      lines.push("Action required: confidence below 7 — downscale the step before advancing.");
    }
  }

  lines.push("");
  lines.push("## Phase routing from this state (strict priority)");

  if (ctx.sustainabilityPivotActive) {
    lines.push("1) Sustainability Pivot Loop — one Core Skill, regulate first.");
    if (ctx.architecturalBacktrackActive) {
      lines.push("2) Architectural Backtrack — ask if assumptions/rules changed during the attempt.");
      lines.push("3) Re-activation — smaller Phase Two step + 1–10 confidence when stable.");
    } else {
      lines.push("2) When steadier → Architectural Backtrack, then Re-activation.");
    }
  } else if (!ctx.phaseOneConfirmed) {
    if (ctx.isResuming && ctx.activeMicroGoal) {
      lines.push("- Thread has history AND an open micro-goal: Phase Three check-in first, then route as needed.");
    } else if (step === 1) {
      lines.push("- Phase One Step 1.1: scenario extraction — one concrete situation.");
    } else if (step === 2) {
      lines.push("- Phase One Step 1.2: map situation → trigger → rules → beliefs → strength % → coping.");
    } else {
      lines.push("- Phase One Step 1.3: present summary; await explicit confirmation before Phase Two.");
    }
  } else if (phase === 2 || !ctx.activeMicroGoal || (ctx.microGoalConfidence ?? 0) < 7) {
    lines.push("- Phase Two: target outcome → micro-goal → 1–10 confidence (≥7 to lock).");
  } else if (ctx.isResuming) {
    lines.push("- Phase Three: check-in on micro-goal progress first.");
  } else {
    lines.push("- Phase Three: coach execution; pivot on failure/stress.");
  }

  return lines.join("\n");
}

module.exports = { formatJourneyContextForPrompt, PHASE_ONE_STEP_LABELS };
