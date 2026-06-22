/**
 * Netlify serverless function: same behavior as server/server.js /api/chat
 * Production: RunPod Serverless vLLM via VLLM_* env vars (see docs/SUPER-PROMPT-RUNPOD-OWN-LLM.md)
 * - LLM_API_KEY = RunPod API key
 * - VLLM_API_URL = https://api.runpod.ai/v2/<endpoint-id>/openai/v1/chat/completions
 * - VLLM_MODEL = OPENAI_SERVED_MODEL_NAME_OVERRIDE (e.g. empathy-coach-qwen)
 */
const DEFAULT_LLM_URL = "https://openrouter.ai/api/v1/chat/completions";

const { formatJourneyContextForPrompt } = require("../../skills/journeyContext.cjs");
const { COACH_SYSTEM_PROMPT_TEXT } = require("../../skills/coachSystemPrompt.cjs");
const { buildProductionSystemPrompt } = require("../../skills/buildProductionSystemPrompt.cjs");
const {
  trimTrainerRules,
  trimExemplars,
  trimMessagesForContext,
  buildSamplingParams,
  fetchLlmWithRetries,
  userFacingLlmError,
  estimateMessagesTokens,
} = require("../../skills/llmChatHelpers.cjs");

const SYSTEM_PROMPT = {
  role: "system",
  content: COACH_SYSTEM_PROMPT_TEXT,
};

const REGEN_SYSTEM_PROMPT = {
  role: "system",
  content: `You are a response rewriter used for quality tuning.
Your task is to improve a previous assistant response using reviewer feedback.

Hard requirements:
1. Follow feedback priorities exactly when they are safe and coherent.
2. Produce a materially revised response (not a near-duplicate).
3. Keep factual integrity and user intent.
4. Preserve safety constraints and refuse unsafe instructions.
5. When feedback concerns crisis, self-harm, or suicide wording, apply gentle triage: clarify figure of speech versus literal intent before dumping helplines; if intent is real, ask about plan or past attempts across concise turns; use the short UK helpline set only when appropriate. Do not repeat the same canned crisis block if feedback asks for a different shape.
6. When "Trainer global standards" or "Admin-starred exemplar replies" appear in system context, follow them for all users.
7. Output only the improved response text.`,
};

const NAME_JOURNEY_SYSTEM_PROMPT = {
  role: "system",
  content: `You generate short titles for coaching conversations (like ChatGPT chat titles).
Given excerpts from a user's messages, output ONLY a concise title: 3 to 7 words, sentence case, no quotes, no trailing punctuation, no explanation.
Capture the main topic or situation (work conflict, feedback anxiety, burnout, etc.).`,
};

const TRAINER_FEEDBACK_LIMIT = 25;
const INFERENCE_TRAINER_LIMIT = 12;
const INFERENCE_EXEMPLAR_LIMIT = 4;

async function fetchTrainerGlobalInstructions(limit = TRAINER_FEEDBACK_LIMIT) {
  const baseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) {
    console.warn(
      "Trainer global standards skipped: set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL on the chat host (Netlify). Without them, only Simon's Regenerate preview differs from other users.",
    );
    return "";
  }
  try {
    const url = `${baseUrl}/rest/v1/chat_feedback?select=feedback_text,created_at,apply_to_global_instructions&order=created_at.desc&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key.trim()}`,
      },
    });
    if (!res.ok) {
      console.warn("Supabase chat_feedback fetch failed:", res.status);
      return "";
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return "";
    const seen = new Set();
    const lines = [];
    for (const r of rows) {
      if (r.apply_to_global_instructions === false) continue;
      const text = typeof r.feedback_text === "string" ? r.feedback_text.trim() : "";
      if (!text || seen.has(text)) continue;
      seen.add(text);
      lines.push(`- ${text}`);
    }
    if (lines.length === 0) {
      console.warn("No trainer feedback rows to inject (empty or all marked trainer-only).");
    }
    return lines.length ? lines.join("\n") : "";
  } catch (err) {
    console.warn("fetchTrainerGlobalInstructions:", err.message);
    return "";
  }
}

async function fetchStarredAssistantExemplars(limit = 8, truncateMax = 480) {
  const baseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) return "";
  try {
    const url = `${baseUrl}/rest/v1/chat_messages?admin_quality_star=eq.true&role=eq.assistant&select=content,admin_starred_at&order=admin_starred_at.desc&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key.trim()}`,
      },
    });
    if (!res.ok) {
      console.warn("Supabase starred messages fetch failed:", res.status);
      return "";
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return "";
    const truncate = (s, max = truncateMax) => {
      const t = String(s || "")
        .trim()
        .replace(/\s+/g, " ");
      if (t.length <= max) return t;
      return `${t.slice(0, max)}…`;
    };
    return rows
      .map((r, i) => (typeof r.content === "string" && r.content.trim() ? `${i + 1}. ${truncate(r.content)}` : ""))
      .filter(Boolean)
      .join("\n");
  } catch (err) {
    console.warn("fetchStarredAssistantExemplars:", err.message);
    return "";
  }
}

async function buildChatSystemContent(possibleCrisisLanguage, journeyContext, forInference = true) {
  const [rawTrainerRules, rawExemplars] = await Promise.all([
    fetchTrainerGlobalInstructions(forInference ? INFERENCE_TRAINER_LIMIT : TRAINER_FEEDBACK_LIMIT),
    fetchStarredAssistantExemplars(forInference ? INFERENCE_EXEMPLAR_LIMIT : 8, forInference ? 280 : 480),
  ]);
  const trainerRules = forInference ? trimTrainerRules(rawTrainerRules, 10, 180) : rawTrainerRules;
  const exemplars = forInference ? trimExemplars(rawExemplars, 3, 220) : rawExemplars;
  let content = buildProductionSystemPrompt({
    trainerRules,
    exemplars,
    journeyContext,
    forInference,
  });
  if (possibleCrisisLanguage) {
    content += `\n# Context for this turn\nThe user's latest message may mention suicide, dying, or self-harm (sometimes as a figure of speech). Follow the crisis language protocol above with extra care.\n`;
  }
  return content;
}

function buildRegenerationUserPrompt(regenerationContext) {
  const feedbackBullets = (regenerationContext?.feedbackList || [])
    .map((item) => {
      const rating = typeof item?.rating === "number" ? ` (rating: ${item.rating}/5)` : "";
      const tags = Array.isArray(item?.tags) && item.tags.length ? ` [tags: ${item.tags.join(", ")}]` : "";
      return `- ${item?.feedbackText || ""}${rating}${tags}`;
    })
    .join("\n");

  return [
    "[Original user message]",
    regenerationContext?.originalUserMessage || "",
    "",
    "[Previous assistant reply]",
    regenerationContext?.previousAssistantReply || "",
    "",
    "[Reviewer feedback]",
    feedbackBullets || "- (No feedback provided)",
    "",
    "[Task]",
    "Rewrite the assistant reply to address the feedback priorities.",
    "The rewrite must be clearly different from the previous assistant reply.",
    "Keep it concise, empathetic, and actionable.",
    "Do not output analysis or metadata, only the improved reply text.",
  ].join("\n");
}

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

  const mode =
    body?.mode === "regenerate" ? "regenerate" : body?.mode === "name_journey" ? "name_journey" : "chat";
  const { userMessage, chatHistory, regenerationContext, conversationSnippet } = body;

  let messages = [];
  if (mode === "name_journey") {
    const snippet = typeof conversationSnippet === "string" ? conversationSnippet.trim() : "";
    if (!snippet) {
      return { statusCode: 400, body: JSON.stringify({ error: "conversationSnippet is required for name_journey mode." }) };
    }
    messages = [
      NAME_JOURNEY_SYSTEM_PROMPT,
      { role: "user", content: snippet },
    ];
  } else if (mode === "regenerate") {
    if (!regenerationContext?.originalUserMessage || !regenerationContext?.previousAssistantReply) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "regenerationContext.originalUserMessage and previousAssistantReply are required." }),
      };
    }
    const trainerRules = await fetchTrainerGlobalInstructions();
    const exemplars = await fetchStarredAssistantExemplars();
    let regenContent = REGEN_SYSTEM_PROMPT.content;
    const journeyBlock = formatJourneyContextForPrompt(body?.journeyContext);
    if (journeyBlock) regenContent += `\n\n${journeyBlock}\n`;
    if (trainerRules && trainerRules.length) {
      regenContent += `\n\n# Trainer global standards\n${trainerRules}\n`;
    }
    if (exemplars && exemplars.length) {
      regenContent += `\n\n# Admin-starred exemplar replies\n${exemplars}\n`;
    }
    messages = [
      { role: "system", content: regenContent },
      { role: "user", content: buildRegenerationUserPrompt(regenerationContext) },
    ];
  } else {
    if (!userMessage || typeof userMessage !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "userMessage is required and must be a string." }) };
    }
    const history = Array.isArray(chatHistory)
      ? chatHistory.map((m) => ({ role: m.role, content: m.content || "" }))
      : [];
    const systemContent = await buildChatSystemContent(!!body?.possibleCrisisLanguage, body?.journeyContext, true);
    messages = [{ role: "system", content: systemContent }, ...history, { role: "user", content: userMessage }];
    messages = trimMessagesForContext(messages);
  }

  const url = process.env.VLLM_API_URL || DEFAULT_LLM_URL;
  const isRunPod = url.includes("runpod.ai");
  const timeoutMs = Number(process.env.VLLM_TIMEOUT_MS) || (isRunPod ? 180000 : 60000);

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error(
      "LLM not connected: LLM_API_KEY is not set in Netlify environment variables (use your RunPod API key). Redeploy after saving.",
    );
    return {
      statusCode: 503,
      body: JSON.stringify({ error: "Avatar is currently unavailable. (API key not configured.)" }),
    };
  }

  const model = process.env.VLLM_MODEL || (isRunPod ? "empathy-coach-qwen" : "meta-llama/llama-3.2-3b-instruct:free");

  const payload = {
    model,
    messages,
    ...buildSamplingParams(mode),
  };

  if (mode === "chat") {
    console.log(
      "LLM chat request:",
      "model=",
      model,
      "estTokens=",
      estimateMessagesTokens(messages),
      "historyTurns=",
      Math.max(0, messages.length - 2),
    );
  }

  const doRequest = () =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

  try {
    const { res, attempts } = await fetchLlmWithRetries(doRequest, { isRunPod });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        "LLM error:",
        res.status,
        "attempts:",
        attempts,
        "URL:",
        url,
        "model:",
        model,
        "estTokens:",
        estimateMessagesTokens(messages),
        "body:",
        errText.slice(0, 1200),
      );
      return {
        statusCode: res.status === 429 ? 429 : 502,
        body: JSON.stringify({
          error: userFacingLlmError(res.status),
          retryable: res.status === 503 || res.status === 504 || res.status === 524,
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
