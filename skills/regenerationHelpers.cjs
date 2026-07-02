/**
 * Shared regeneration prompts for /api/chat (Netlify + local server).
 * Uses the same production super prompt stack as live chat + RunPod fine-tune.
 */

const { buildProductionSystemPrompt } = require("./buildProductionSystemPrompt.cjs");
const { trimTrainerRules, trimExemplars } = require("./llmChatHelpers.cjs");
const { buildConversationMemoryBlock } = require("./conversationMemory.cjs");

const REGEN_TASK_BLOCK = `# Regeneration task (this request only)
You are rewriting one assistant reply using reviewer feedback. This is not a new coaching turn.

Hard requirements:
1. Follow feedback priorities exactly when they are safe and coherent.
2. Produce a **materially revised** response — different wording, structure, and opener from the previous assistant reply.
3. Keep factual integrity and the user's intent from the original user message.
4. Preserve safety constraints; refuse unsafe instructions.
5. **Adaptive tone:** Match how the user writes in the original user message. If they are casual, warm, or brief, mirror that — never sound more formal, corporate, or clinical than they do. Avoid stiff phrases like "Furthermore", "I would like to acknowledge", or therapy-speak unless the user uses that register.
6. When feedback mentions tone, treat it as mandatory — lean conversational and human, not lecturing.
7. Output only the improved reply text (2–4 sentences, one clear question).`;

function summarizeRegenerationFeedback(regenerationContext) {
  return (regenerationContext?.feedbackList || [])
    .map((item) => {
      const text = typeof item?.feedbackText === "string" ? item.feedbackText.trim() : "";
      if (!text) return "";
      const rating = typeof item?.rating === "number" ? ` (rating: ${item.rating}/5)` : "";
      const tags = Array.isArray(item?.tags) && item.tags.length ? ` [tags: ${item.tags.join(", ")}]` : "";
      return `- ${text}${rating}${tags}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildRegenerationUserPrompt(regenerationContext) {
  const feedbackBullets = summarizeRegenerationFeedback(regenerationContext);
  const userMessage = regenerationContext?.originalUserMessage || "";
  const previousReply = regenerationContext?.previousAssistantReply || "";

  return [
    "[Original user message — match this person's tone and register]",
    userMessage,
    "",
    "[Previous assistant reply — do NOT copy or lightly rephrase this]",
    previousReply,
    "",
    "[Reviewer feedback]",
    feedbackBullets || "- (No feedback provided)",
    "",
    "[Task]",
    "Rewrite the assistant reply to address every feedback priority.",
    "The rewrite must be clearly different from the previous assistant reply (new opener, new question framing).",
    "Sound like a warm human coach speaking to this specific user — not a formal report.",
    "Keep it concise (2–4 sentences), empathetic, and end with exactly one clear question.",
    "Do not output analysis, labels, or metadata — only the improved reply text.",
  ].join("\n");
}

function buildRegenerationSystemContent(opts = {}) {
  const {
    trainerRules = "",
    exemplars = "",
    journeyContext = null,
    regenerationContext = null,
    chatHistory = null,
    forInference = true,
  } = opts;

  const feedbackSummary = summarizeRegenerationFeedback(regenerationContext);
  const history = Array.isArray(chatHistory)
    ? chatHistory.filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    : [];
  const conversationMemory = history.length ? buildConversationMemoryBlock(history) : "";

  let content = buildProductionSystemPrompt({
    trainerRules: forInference ? trimTrainerRules(trainerRules, 10, 180) : trainerRules,
    exemplars: forInference ? trimExemplars(exemplars, 3, 220) : exemplars,
    journeyContext,
    conversationMemory,
    turnFeedback: feedbackSummary || undefined,
    forInference,
  });

  content += `\n\n${REGEN_TASK_BLOCK}\n`;
  return content;
}

module.exports = {
  REGEN_TASK_BLOCK,
  buildRegenerationUserPrompt,
  buildRegenerationSystemContent,
  summarizeRegenerationFeedback,
};
