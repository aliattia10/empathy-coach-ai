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
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const res = await fetch(VLLM_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: process.env.VLLM_MODEL || "meta-llama/llama-3.2-3b-instruct:free",
        messages,
        temperature: Number(process.env.VLLM_TEMPERATURE) || 0.7,
        max_tokens: Number(process.env.VLLM_MAX_TOKENS) || 500,
      }),
      signal: AbortSignal.timeout(Number(process.env.VLLM_TIMEOUT_MS) || 60000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("LLM error:", res.status, errText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Avatar is currently unavailable." }),
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
    console.error("Error connecting to LLM:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Avatar is currently unavailable." }),
    };
  }
};
