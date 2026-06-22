/**
 * Builds the full live system prompt (coach + phases + skills + journey + trainer + stars).
 * Used by /api/chat and training export — keep assembly order in sync.
 */

const { COACH_SYSTEM_PROMPT_TEXT } = require("./coachSystemPrompt.cjs");
const { formatSkillsForPrompt } = require("./skillsLibrary.cjs");
const { formatLlmEnginePhasesForPrompt } = require("./llmEnginePhases.cjs");
const { formatJourneyContextForPrompt } = require("./journeyContext.cjs");

function sessionRowToJourneyContext(sessionRow, messageCount = 0) {
  if (!sessionRow) return null;
  return {
    platformPhase: sessionRow.platform_phase ?? 1,
    phaseOneStep: sessionRow.phase_one_step ?? 1,
    phaseOneConfirmed: !!sessionRow.phase_one_confirmed,
    presentingChallenge: sessionRow.presenting_challenge ?? null,
    beliefStrengthPct: sessionRow.belief_strength_pct ?? null,
    conceptualisationSummary: sessionRow.conceptualisation_summary ?? null,
    targetOutcome: sessionRow.target_outcome ?? null,
    activeMicroGoal: sessionRow.active_micro_goal ?? null,
    microGoalConfidence: sessionRow.micro_goal_confidence ?? null,
    sustainabilityPivotActive: !!sessionRow.sustainability_pivot_active,
    architecturalBacktrackActive: !!sessionRow.architectural_backtrack_active,
    isResuming: messageCount > 2,
    messageCount,
  };
}

const INFERENCE_DIRECTIVES = `# Live inference directives (this turn — highest priority after safety)
1. Read the full chat history: **never repeat** your previous question, opener, or stock empathy phrase.
2. Do **not** use generic lines like "That's helpful context" or a body/emotion question if the user already described the situation and you already asked once.
3. When a presenting challenge is on file and Phase One step is 1.2, ask **one** breakdown element (trigger, rule, belief, strength %, or coping) — do not re-ask for the main scenario.
4. Mirror the user's own words (promotion, salary, budget, conflict, etc.) in your first sentence before your one question.
5. Advance the protocol: each turn must move one step forward, not loop on the same intake question.`;

/**
 * @param {object} [opts]
 * @param {string} [opts.trainerRules] - global trainer bullets (from chat_feedback)
 * @param {string} [opts.sessionTrainerNotes] - session-specific Simon notes
 * @param {string} [opts.exemplars] - admin-starred reply patterns
 * @param {object|null} [opts.journeyContext] - journey payload for formatJourneyContextForPrompt
 * @param {string} [opts.turnFeedback] - single-turn Simon feedback (training export)
 * @param {boolean} [opts.forInference] - slimmer stack for 4k-context RunPod inference
 */
function buildProductionSystemPrompt(opts = {}) {
  const condensed = !!opts.forInference;
  let content = COACH_SYSTEM_PROMPT_TEXT;
  content += `\n\n${formatLlmEnginePhasesForPrompt({ condensed })}\n`;

  const journeyBlock = formatJourneyContextForPrompt(opts.journeyContext);
  if (journeyBlock) content += `\n\n${journeyBlock}\n`;

  content += `\n\n${formatSkillsForPrompt({ condensed })}\n`;

  if (condensed) {
    content += `\n\n${INFERENCE_DIRECTIVES}\n`;
  }

  const trainerParts = [];
  if (opts.trainerRules?.trim()) trainerParts.push(opts.trainerRules.trim());
  if (opts.sessionTrainerNotes?.trim()) trainerParts.push(opts.sessionTrainerNotes.trim());
  if (trainerParts.length) {
    content += `\n\n# Trainer global standards (admin feedback — applies to ALL users)\nFollow every bullet below for this reply and all learners. These override generic habits when safe:\n${trainerParts.join("\n")}\n`;
  }

  if (opts.exemplars?.trim()) {
    content += `\n\n# Admin-starred exemplar replies (pattern to emulate)\n${opts.exemplars.trim()}\n`;
  }

  if (opts.turnFeedback?.trim()) {
    content += `\n\n# Simon feedback for this training turn\n- ${opts.turnFeedback.trim()}\n`;
  }

  return content;
}

module.exports = {
  buildProductionSystemPrompt,
  sessionRowToJourneyContext,
  COACH_SYSTEM_PROMPT_TEXT,
};
