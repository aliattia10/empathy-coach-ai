/**
 * Shared LLM request helpers for netlify/functions/chat.js and server/server.js.
 * Keeps RunPod/vLLM context inside model limits and retries cold starts.
 */

function estimateTokens(text) {
  return Math.ceil(String(text || "").length / 3.5);
}

function estimateMessagesTokens(messages) {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}

function trimTrainerRules(rules, maxLines = 10, maxLineChars = 180) {
  if (!rules?.trim()) return "";
  const lines = rules
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines)
    .map((line) => {
      const body = line.replace(/^-\s*/, "");
      if (body.length <= maxLineChars) return `- ${body}`;
      return `- ${body.slice(0, maxLineChars)}…`;
    });
  return lines.join("\n");
}

function trimExemplars(exemplars, maxItems = 3, maxItemChars = 220) {
  if (!exemplars?.trim()) return "";
  return exemplars
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((line) => {
      const body = line.replace(/^\d+\.\s*/, "");
      if (body.length <= maxItemChars) return body;
      return `${body.slice(0, maxItemChars)}…`;
    })
    .map((line, i) => `${i + 1}. ${line}`)
    .join("\n");
}

/**
 * Drop oldest history until messages fit token budget (always keeps system + latest user).
 * Guarantees a minimum number of recent turns so the model retains conversation context.
 */
function trimMessagesForContext(messages, opts = {}) {
  if (!Array.isArray(messages) || messages.length < 2) return messages;

  const maxContextTokens =
    Number(opts.maxContextTokens) || Number(process.env.VLLM_MAX_CONTEXT_TOKENS) || 6144;
  const reserveOutputTokens =
    Number(opts.reserveOutputTokens) || Number(process.env.VLLM_MAX_TOKENS) || 500;
  const minHistoryMessages = Number(opts.minHistoryMessages) || 12;

  const budget = Math.max(1024, maxContextTokens - reserveOutputTokens);
  const system = messages[0];
  const last = messages[messages.length - 1];
  const history = messages.slice(1, -1);

  let kept =
    history.length > minHistoryMessages ? history.slice(-minHistoryMessages) : [...history];

  const totalTokens = () =>
    estimateTokens(system.content) + estimateTokens(last.content) + estimateMessagesTokens(kept);

  while (kept.length > 2 && totalTokens() > budget) {
    kept.shift();
  }

  while (totalTokens() > budget && kept.length > 0) {
    const head = kept[0];
    const shorter = String(head.content || "").slice(Math.floor(String(head.content || "").length * 0.25));
    if (shorter.length < 40) break;
    kept[0] = { ...head, content: `…${shorter}` };
    if (estimateTokens(kept[0].content) >= estimateTokens(head.content)) break;
  }

  return [system, ...kept, last];
}

function buildSamplingParams(mode) {
  const temperature = Number(process.env.VLLM_TEMPERATURE) || 0.55;
  const base = {
    temperature:
      mode === "regenerate" ? Math.min(temperature, 0.35) : mode === "name_journey" ? 0.3 : temperature,
    max_tokens: mode === "name_journey" ? 32 : Number(process.env.VLLM_MAX_TOKENS) || 500,
    repetition_penalty: Number(process.env.VLLM_REPETITION_PENALTY) || 1.12,
    presence_penalty: Number(process.env.VLLM_PRESENCE_PENALTY) || 0.25,
    frequency_penalty: Number(process.env.VLLM_FREQUENCY_PENALTY) || 0.15,
  };
  return base;
}

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504, 524]);

async function fetchLlmWithRetries(doRequest, opts = {}) {
  const maxAttempts = Number(opts.maxAttempts) || (opts.isRunPod ? 3 : 2);
  const baseDelayMs = Number(opts.baseDelayMs) || (opts.isRunPod ? 4000 : 2000);
  let lastRes = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    lastRes = await doRequest();
    if (lastRes.ok || !RETRYABLE_STATUSES.has(lastRes.status)) {
      return { res: lastRes, attempts: attempt };
    }
    if (attempt < maxAttempts) {
      const waitMs = baseDelayMs * attempt;
      console.warn(`LLM ${lastRes.status}, retry ${attempt}/${maxAttempts - 1} in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  return { res: lastRes, attempts: maxAttempts };
}

function userFacingLlmError(status) {
  if (status === 429) return "The AI is in high demand. Please try again in a moment.";
  if (status === 503 || status === 504 || status === 524) {
    return "The coach is warming up — please send your message again in a few seconds.";
  }
  return "Avatar is currently unavailable. (LLM provider error.)";
}

module.exports = {
  estimateTokens,
  estimateMessagesTokens,
  trimTrainerRules,
  trimExemplars,
  trimMessagesForContext,
  buildSamplingParams,
  fetchLlmWithRetries,
  userFacingLlmError,
  RETRYABLE_STATUSES,
};
