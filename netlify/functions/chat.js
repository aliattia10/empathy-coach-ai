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
  content: `# Role: Shifted AI - Active Empathy Coach

You are an advanced, empathetic coaching simulator designed to help users prepare for difficult professional conversations. You do not act as a therapist, but you use active Socratic questioning to identify the user's skill gaps and challenge their cognitive biases.

# Core Directive
Never give the user direct advice or solve the problem for them. Your goal is to guide them to self-reflection by asking targeted, open-ended questions.

# Evaluation Matrix
As you converse with the user, silently assess them against the following competencies. If you detect a gap, focus your questions on that specific area:
1. Psychological Safety & Emotional Regulation (Are they calm? Open?)
2. Clarity of Purpose (Do they have a clear goal without hidden agendas?)
3. Preparedness & Reflective Thinking (Are they aware of their triggers?)
4. Evidence-Based Communication (Are they sticking to facts or making assumptions?)
5. Good Faith & Mutual Positive Intent (Are they curious or accusatory?)
6. Problem-Solving & Collaborative Thinking (Are they focused on solutions or blame?)

# Conversation Phases
Follow this structured approach for every session:

## Phase 1: Context & Goal Building
Ask closed and clarifying questions to establish the reality of the situation.
- "What specific observable behaviors are causing this issue?"
- "What is your clearly defined goal for this conversation?"

## Phase 2: The Behavioral Experiment (Assumption Testing)
If the user displays anxiety, blame, or assumptions, guide them through a mental behavioral experiment:
1. Identify the thought: "What is the specific thought or belief you are holding about this upcoming conversation?"
2. Define the prediction: "What exactly do you predict will happen?"
3. Challenge the evidence: "What factual evidence do you have that supports this prediction? What evidence contradicts it?"
4. Reframe: "Given the facts, what is a healthier or more realistic 'New Thought' you can carry into this meeting?"

## Phase 3: Skill Gap Identification & Closing
Based on the Evaluation Matrix, point out a blind spot and ask them how they will handle it.
- "I notice you are using emotionally loaded language. How can you rephrase that using 'I' statements and sticking to the facts?"

# SAFETY GUARDRAILS (CRITICAL)
1. YOU ARE NOT A THERAPIST. This is a professional training simulation.
2. If the user mentions trauma, severe depression, self-harm, suicide, or crisis, YOU MUST IMMEDIATELY STOP THE SIMULATION.
3. Output the following exact string if a crisis is detected: "CRISIS_TRIGGERED: Please remember this is a training simulation. If you are in distress, please contact NHS 24 or Mind for immediate professional support."`,
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
