/**
 * Admin translation API — English, French, and other supported languages.
 */
const DEFAULT_LLM_URL = "https://openrouter.ai/api/v1/chat/completions";

const {
  normalizeLang,
  buildTranslationMessages,
  extractTranslationFromLlm,
  SUPPORTED_TARGET_LANGS,
  SUPPORTED_SOURCE_LANGS,
} = require("../../skills/adminTranslate.cjs");

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

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return { statusCode: 400, body: JSON.stringify({ error: "text is required" }) };
  }

  const targetLang = normalizeLang(body.targetLang, SUPPORTED_TARGET_LANGS, "en");
  const sourceLang = normalizeLang(body.sourceLang, SUPPORTED_SOURCE_LANGS, "auto");

  const apiKey = process.env.LLM_API_KEY;
  const url = process.env.VLLM_API_URL || DEFAULT_LLM_URL;
  if (!apiKey?.trim()) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: "Translation unavailable (LLM_API_KEY not configured)." }),
    };
  }

  const isRunPod = url.includes("runpod.ai");
  const model = process.env.VLLM_MODEL || (isRunPod ? "empathy-coach-qwen" : "meta-llama/llama-3.2-3b-instruct:free");
  const messages = buildTranslationMessages(text, sourceLang, targetLang);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(Number(process.env.VLLM_TIMEOUT_MS) || 60000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Translate LLM error:", res.status, errText.slice(0, 400));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Translation failed. Please try again." }),
      };
    }

    const data = await res.json();
    const translation = extractTranslationFromLlm(data);
    if (!translation) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Translation returned empty." }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translation, targetLang, sourceLang }),
    };
  } catch (err) {
    console.error("Translate error:", err.message);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Translation service unavailable." }),
    };
  }
};
