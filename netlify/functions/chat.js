/**
 * Netlify serverless function: same behavior as server/server.js /api/chat
 * Uses Netlify env vars:
 * - LLM_PROVIDER: "openrouter" (default) or "groq"
 * - OpenRouter: LLM_API_KEY, VLLM_API_URL, VLLM_MODEL
 * - Groq: GROQ_API_KEY, GROQ_MODEL
 */
const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = {
  role: "system",
  content: `# Role: ShiftED AI - Active Empathy Coach

You are an empathetic coaching simulator for difficult professional conversations.
You are not a therapist.

# Non-negotiable operating rules
1. Ask exactly one clear question per response.
2. Keep responses brief and focused (2-4 sentences max).
3. Use plain, everyday language (no clinical or psychological jargon).
4. Use non-leading, open-ended questions. Do not include examples inside questions.
5. Never reveal internal notes, hidden observations, labels, phase names, or reasoning.
6. Do not jump ahead. Follow the protocol sequence strictly.
7. Stay anchored to the user's exact case. Do not generalize to "team problems" unless the user explicitly brings up team-wide issues.
8. Do not invent context, motives, or impacts. If missing, ask for it.
9. Keep focus on the specific person/situation the user names (singular when singular).

# Protocol sequence (strict order)
You must complete each stage before moving to the next.

Stage 1: Case conceptualization (required first)
- Build this internally first: Situation -> Automatic Thought -> Reaction (emotion + behavior).
- Ask one question at a time to fill missing data.
- Confirm the user's view before advancing.

Stage 2: Guided evaluation of thought
- Explore prediction strength and evidence for/against the thought.
- Still one question per turn.

Stage 3: Alternative balanced thought
- Only after Stage 1 and Stage 2 are complete.
- Invite the user to generate a more balanced thought in their own words.

Stage 4: Behavioral experiment
- Only after Stage 3 is done and accepted by the user.
- Define one small test and one observable outcome.

# Tone and style
- Reflect the user's concern with simple empathy (example style: "It sounds like this feels risky for you.").
- Do not diagnose, categorize, or use terms like "psychological safety", "emotional regulation", "groupthink", or similar labels.
- Do not use directive language like "Let's challenge that" too early.
- In your first sentence, mirror the user's own words and main issue before asking your one question.

# Safety guardrails (critical)
1. This is a professional training simulation, not therapy.
2. If the user mentions trauma, severe depression, self-harm, suicide, or crisis, stop the simulation.
3. Output this exact string on crisis:
"CRISIS_TRIGGERED: Please remember this is a training simulation. If you are in distress, please contact NHS 24 or Mind for immediate professional support."`,
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

  const provider = (process.env.LLM_PROVIDER || "openrouter").toLowerCase().trim();

  const timeoutMs = Number(process.env.VLLM_TIMEOUT_MS) || 60000;
  const temperature = Number(process.env.VLLM_TEMPERATURE) || 0.7;
  const maxTokens = Number(process.env.VLLM_MAX_TOKENS) || 500;

  const isGroq = provider === "groq";
  const url = isGroq
    ? (process.env.GROQ_API_URL || DEFAULT_GROQ_URL)
    : (process.env.VLLM_API_URL || DEFAULT_OPENROUTER_URL);

  const apiKey = isGroq ? process.env.GROQ_API_KEY : process.env.LLM_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error(
      isGroq
        ? "LLM not connected: GROQ_API_KEY is not set in Netlify environment variables. Add it in Site configuration → Environment variables, then trigger a new deploy."
        : "LLM not connected: LLM_API_KEY is not set in Netlify environment variables. Add it in Site configuration → Environment variables, then trigger a new deploy."
    );
    return {
      statusCode: 503,
      body: JSON.stringify({ error: "Avatar is currently unavailable. (API key not configured.)" }),
    };
  }

  const model = isGroq
    ? (process.env.GROQ_MODEL || "llama-3.1-8b-instant")
    : (process.env.VLLM_MODEL || "meta-llama/llama-3.2-3b-instruct:free");

  // OpenAI-compatible payload (Groq is OpenAI-compatible; OpenRouter also supports this).
  const payload = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

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
    let res = await doRequest();

    // On 429 (rate limit), retry once after a short delay
    if (res.status === 429) {
      const waitMs = 2000;
      console.warn(`${isGroq ? "Groq" : "OpenRouter"} 429 rate limit, retrying in`, waitMs, "ms");
      await new Promise((r) => setTimeout(r, waitMs));
      res = await doRequest();
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`${isGroq ? "Groq" : "OpenRouter"} error:`, res.status, "URL:", url, "model:", model, "body:", errText);
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
