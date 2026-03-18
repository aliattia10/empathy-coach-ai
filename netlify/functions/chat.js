/**
 * Netlify serverless function: same behavior as server/server.js /api/chat
 * Uses Netlify env vars: LLM_API_KEY, VLLM_API_URL, VLLM_MODEL, etc.
 */
const VLLM_API_URL =
  process.env.VLLM_API_URL || "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = {
  role: "system",
  content: `You are Alex, a direct report. Your manager is practicing delivering difficult feedback to you. You must act slightly defensive but ultimately receptive if the manager uses empathetic language.
Rules:
1. Never break character.
2. If the manager is aggressive, become withdrawn.
3. If the manager is empathetic and uses "I" statements and describes impact, show gradual openness.`,
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { userMessage, chatHistory } = body;
  if (!userMessage || typeof userMessage !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "userMessage is required and must be a string." }) };
  }

  const history = Array.isArray(chatHistory)
    ? chatHistory.map((m) => ({ role: m.role, content: m.content || "" }))
    : [];
  const messages = [SYSTEM_PROMPT, ...history, { role: "user", content: userMessage }];

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error("LLM not connected: LLM_API_KEY is not set in Netlify environment variables. Add it in Site configuration → Environment variables, then trigger a new deploy.");
    return {
      statusCode: 503,
      body: JSON.stringify({ error: "Avatar is currently unavailable. (API key not configured.)" }),
    };
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey.trim()}`,
  };

  const model = process.env.VLLM_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
  const payload = {
    model,
    messages,
    temperature: Number(process.env.VLLM_TEMPERATURE) || 0.7,
    max_tokens: Number(process.env.VLLM_MAX_TOKENS) || 500,
  };
  const timeoutMs = Number(process.env.VLLM_TIMEOUT_MS) || 60000;

  const doRequest = () =>
    fetch(VLLM_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

  try {
    let res = await doRequest();

    // On 429 (rate limit), retry once after a short delay
    if (res.status === 429) {
      const waitMs = 2000;
      console.warn("OpenRouter 429 rate limit, retrying in", waitMs, "ms");
      await new Promise((r) => setTimeout(r, waitMs));
      res = await doRequest();
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenRouter error:", res.status, "URL:", VLLM_API_URL, "model:", model, "body:", errText);
      const isRateLimit = res.status === 429;
      return {
        statusCode: isRateLimit ? 429 : 502,
        body: JSON.stringify({
          error: isRateLimit
            ? "The AI is in high demand. Please try again in a moment."
            : "Avatar is currently unavailable. (LLM provider error.)",
        }),
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Error connecting to LLM:", err.message, "stack:", err.stack);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Avatar is currently unavailable. (Network or server error.)" }),
    };
  }
};
