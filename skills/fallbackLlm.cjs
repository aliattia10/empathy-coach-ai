/**
 * OpenAI-compatible fallback chat (e.g. Groq) when RunPod is queued/failed.
 * Env names only — keys live in Netlify.
 */

function fallbackConfigured() {
  const key = (process.env.FALLBACK_LLM_API_KEY || process.env.GROQ_API_KEY || "").trim();
  return Boolean(key);
}

function fallbackConfig() {
  const apiKey = (process.env.FALLBACK_LLM_API_KEY || process.env.GROQ_API_KEY || "").trim();
  const hasGroq = Boolean((process.env.GROQ_API_KEY || "").trim());
  const apiUrl = (
    process.env.FALLBACK_LLM_API_URL ||
    (hasGroq ? "https://api.groq.com/openai/v1/chat/completions" : "")
  ).trim();
  const model = (process.env.FALLBACK_LLM_MODEL || "llama-3.1-8b-instant").trim();
  const fallbackAfterMs = Number(process.env.RUNPOD_FALLBACK_AFTER_MS) || 75000;
  return { apiKey, apiUrl, model, fallbackAfterMs };
}

/**
 * Synchronous OpenAI-compatible chat completion.
 * @returns {Promise<string>} assistant text
 */
async function callFallbackChat(messages, sampling = {}, timeoutMs = 55000) {
  const { apiKey, apiUrl, model } = fallbackConfig();
  if (!apiKey || !apiUrl) {
    throw new Error("Fallback LLM is not configured.");
  }

  const payload = {
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content || "" })),
    temperature: sampling.temperature ?? 0.7,
    max_tokens: sampling.max_tokens ?? 800,
  };
  if (typeof sampling.presence_penalty === "number") {
    payload.presence_penalty = sampling.presence_penalty;
  }
  if (typeof sampling.frequency_penalty === "number") {
    payload.frequency_penalty = sampling.frequency_penalty;
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Fallback LLM invalid JSON (${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    const msg = data?.error?.message || data?.error || text.slice(0, 300);
    throw new Error(`Fallback LLM ${res.status}: ${msg}`);
  }

  const reply = data.choices?.[0]?.message?.content ?? "";
  return String(reply).trim();
}

module.exports = {
  fallbackConfigured,
  fallbackConfig,
  callFallbackChat,
};
