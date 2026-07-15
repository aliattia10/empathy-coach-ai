/**
 * Shared regeneration prompts for /api/chat (Netlify + local server).
 * Uses the same production super prompt stack as live chat + RunPod fine-tune.
 */

const { buildProductionSystemPrompt } = require("./buildProductionSystemPrompt.cjs");
const { trimTrainerRules, trimExemplars } = require("./llmChatHelpers.cjs");
const { buildConversationMemoryBlock } = require("./conversationMemory.cjs");

const EXACT_REPLY_PREFIXES = [
  /^use this (exact )?(reply|response|answer|text)/i,
  /^reply should be:/i,
  /^response should be:/i,
  /^should (say|reply|respond|write):/i,
  /^correct (reply|response):/i,
  /^the (reply|response) should be:/i,
  /^replace with:/i,
  /^wanted reply:/i,
  /^instead (say|reply|respond|write):/i,
  /^exact reply:/i,
  /^write this:/i,
  /^output this:/i,
];

const REGEN_TASK_BLOCK = `# Regeneration task (this request only)
You are rewriting one assistant reply using reviewer feedback. This is not a new coaching turn.

Hard requirements:
1. Follow feedback priorities exactly when they are safe and coherent.
2. When feedback includes a **mandatory target reply** block, output that target (tiny grammar fixes only). That overrides all other style rules.
3. Otherwise produce a **materially revised** response — different wording, structure, and opener from the previous assistant reply.
4. Keep factual integrity and the user's intent from the original user message.
5. Preserve safety constraints; refuse unsafe instructions.
6. **Adaptive tone:** Match how the user writes in the original user message. If they are casual, warm, or brief, mirror that — never sound more formal, corporate, or clinical than they do.
7. When feedback mentions tone, treat it as mandatory — lean conversational and human, not lecturing.
8. Output only the improved reply text (2–4 sentences, one clear question).`;

function feedbackItemText(item) {
  if (typeof item?.feedbackText === "string") return item.feedbackText.trim();
  if (typeof item?.feedback_text === "string") return item.feedback_text.trim();
  return "";
}

function looksLikeMetaInstruction(text) {
  return /^(be |don't |do not |too |more |less |avoid |stop |needs? to |should be more|improve |fix |make it |add |remove |less |shorter|longer)/i.test(
    text,
  );
}

function extractAfterPrefix(text, prefix) {
  const rest = text.slice(prefix.length).replace(/^[\s:—–-]+/, "").trim();
  return rest.length >= 20 ? rest : "";
}

/**
 * When Simon pastes the exact reply he wants, treat it as mandatory output.
 */
function extractExactTargetReply(feedbackList) {
  for (const item of feedbackList || []) {
    const text = feedbackItemText(item);
    if (!text) continue;

    for (const prefix of EXACT_REPLY_PREFIXES) {
      const match = text.match(prefix);
      if (match) {
        const target = extractAfterPrefix(text, match[0]);
        if (target) return target;
      }
    }

    const quoted = text.match(/["“]([^"”]{40,})["”]/);
    if (quoted?.[1]) return quoted[1].trim();

    if (
      text.length >= 80 &&
      !looksLikeMetaInstruction(text) &&
      /[?？]/.test(text) &&
      (text.match(/[.!?]/g) || []).length >= 2
    ) {
      return text;
    }
  }
  return null;
}

function summarizeRegenerationFeedback(regenerationContext) {
  return (regenerationContext?.feedbackList || [])
    .map((item) => {
      const text = feedbackItemText(item);
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
  const exactTarget = extractExactTargetReply(regenerationContext?.feedbackList);

  const sections = [
    "[Original user message — match this person's tone and register]",
    userMessage,
    "",
    "[Previous assistant reply — do NOT copy or lightly rephrase this]",
    previousReply,
    "",
    "[Reviewer feedback]",
    feedbackBullets || "- (No feedback provided)",
  ];

  if (exactTarget) {
    sections.push(
      "",
      "[MANDATORY TARGET REPLY — highest priority]",
      "The reviewer provided the exact reply they want. Output this text verbatim.",
      "You may fix tiny grammar or punctuation only — do not rewrite, shorten, or revert to the previous reply.",
      exactTarget,
      "",
      "[Task]",
      "Return the mandatory target reply exactly as written above.",
      "Do not output analysis, labels, or metadata — only the target reply text.",
    );
  } else {
    sections.push(
      "",
      "[Task]",
      "Rewrite the assistant reply to address every feedback priority.",
      "The rewrite must be clearly different from the previous assistant reply (new opener, new question framing).",
      "If feedback quotes desired wording, use that wording.",
      "Sound like a warm human coach speaking to this specific user — not a formal report.",
      "Keep it concise (2–4 sentences), empathetic, and end with exactly one clear question.",
      "Do not output analysis, labels, or metadata — only the improved reply text.",
    );
  }

  return sections.join("\n");
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
  const exactTarget = extractExactTargetReply(regenerationContext?.feedbackList);
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

  if (exactTarget) {
    content += `\n# Mandatory target reply (verbatim output required)\n${exactTarget}\n`;
  }

  return content;
}

module.exports = {
  REGEN_TASK_BLOCK,
  buildRegenerationUserPrompt,
  buildRegenerationSystemContent,
  summarizeRegenerationFeedback,
  extractExactTargetReply,
};
