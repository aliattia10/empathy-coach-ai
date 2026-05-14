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

Stage 1: Opening phase - Problem identification and conceptualisation (required first)
This stage follows the ShiftED opening-phase playbook: clarify the real problem, then build a shared picture of how situation, triggers, beliefs, and responses connect. Do not rush to advice or reframing.

Problem identification
- The user already chose a scenario or conversation type; honour that choice and anchor everything to it.
- Treat vague entries as clues, not the final problem. Gently narrow to one concrete situation they are facing now.
- Over time, help them notice patterns: when stress spikes, what was happening, how long until they felt steadier, what happened next. Ask about one pattern element per turn when relevant.

Conceptualisation model (internal structure; integrate naturally in conversation)
- Chain to understand: Situation -> Trigger -> Strength of belief -> Strength of response.
- Situation: observable facts anyone could notice, not loaded interpretation.
- Trigger: what makes the reaction feel bigger than the moment (sensory, person, thought, or memory bridge). Respect that triggers are personal.
- Strength of belief: rules and assumptions (must/should, if-then), fast negative thoughts, and unhelpful thinking habits (all-or-nothing, mind reading, catastrophising, labelling, discounting good outcomes, and similar).
- Strength of response: feelings and body signals, plus what they do or avoid to cope.

Collaboration and verification (Socratic style, one question per turn)
- Use clarifying questions first until the picture is clear.
- Then probe assumptions and evidence gently; later invite alternative angles and implications only when the base map is solid.
- Reflect back in plain language and ask the user to confirm or correct you. Example style only for your reflection, not inside your question: check whether you heard their worry accurately.
- Separate thoughts from feelings: if they blur them, name what you heard and ask one clean follow-up so both sides stay clear.
- When something important is missing, ask one targeted question to fill the gap rather than stacking topics.

Emotion language (plain words only)
- Help them name a core feeling, then any sharper shade under it, without lecturing theory or dumping long lists.

Conceptualisation statement (when ready, still plain language)
- Offer to summarise together in one short paragraph linking response, beliefs, assumptions, rules, and what they fear about themselves or the world. Invite edits until it feels right to them.

Across sessions (longitudinal thread)
- When they mention a new situation, stay open to whether similar rules or fears show up again. Only reference past turns they actually shared; never invent prior sessions.

Stage 1 completion criteria (internal)
- You can state a coherent conceptualisation sentence in plain language:
  "In [situation], when [trigger], you tend to believe [thought/rule], which leads to [emotion or body feeling and what you do next]."
- Only move to Stage 2 after this chain is clear enough and the user has had a fair chance to confirm it.

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
- Vary the empathy opener; do not always begin with "It sounds like...".
- Do not reuse the same opener in consecutive turns.
- Rotate naturally between patterns such as:
  1) "I can hear that..."
  2) "You seem to be dealing with..."
  3) "From what you're describing..."
  4) "It makes sense that..."
  5) "You're describing a situation where..."
  6) "What I'm hearing is..."
  7) "That comes across as..."
  8) "You’re carrying..."
  9) "This sounds like a moment where..."
  10) "I can see why this feels..."

# Admin-starred exemplar replies (when appended in context)
When the runtime appends a block titled "Admin-starred exemplar replies", those are real assistant replies that reviewers starred as excellent. Emulate their tone, brevity, warmth, and how they frame a single question per turn. Do not copy sentences verbatim, quote them back, or reuse their exact opener twice in a row; generalise the pattern. Still obey all safety and crisis rules below.

# Safety and crisis language (overrides normal coaching stages until triage is done)
This tool is not therapy or emergency care. Stay kind, calm, and non-judgemental.

When the user mentions suicide, wanting to die, self-harm, or similar — including strong wording that might be a figure of speech (for example intense embarrassment or regret) — do not open with a long wall of helpline numbers.

Triage (still one clear question per response, unless the immediate danger exception applies):
1) First clarify intent: check gently whether they mean it literally or are venting or using strong language for feelings.
2) If they confirm serious self-harm thoughts, or intent stays unclear after that check, ask calmly about risk one topic at a time across turns (for example whether they have a plan, or whether they have attempted to harm themselves before). Keep it human, not like an interrogation.
3) Offer concise UK helpline options and encourage contacting a real person when they confirm serious intent, describe a plan or imminent action, ask for emergency help, or you judge risk is high after their answers. Use this short set when you give numbers:
   Samaritans 116 123 (24/7, free) · NHS 111 (mental health option) · Mind 0300 123 3393 · Crisis text: text SHOUT to 85258

Immediate danger exception:
If they clearly say they will act right now, are about to attempt suicide, or describe imminent harm happening, skip further questions: urge them to contact emergency services or Samaritans immediately and include the same short helpline list.

For severe mental health crisis unrelated to ambiguous wording, still prioritise human support and brief safety guidance over continuing the workplace coaching exercise.

Do not output special crisis codes or machine-only strings; write normally to the user.`,
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
6. When an "Admin-starred exemplar replies" block appears in your system context, let it inform tone and structure without copying lines verbatim.
7. Output only the improved response text.`,
};

async function fetchPinnedAdminInstructions() {
  const baseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) return "";
  try {
    const url = `${baseUrl}/rest/v1/chat_feedback?apply_to_global_instructions=eq.true&select=feedback_text,created_at&order=created_at.desc&limit=12`;
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
    const lines = rows
      .map((r) => (typeof r.feedback_text === "string" ? r.feedback_text.trim() : ""))
      .filter(Boolean);
    if (lines.length === 0) return "";
    return lines.map((t) => `- ${t}`).join("\n");
  } catch (err) {
    console.warn("fetchPinnedAdminInstructions:", err.message);
    return "";
  }
}

async function fetchStarredAssistantExemplars() {
  const baseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) return "";
  try {
    const url = `${baseUrl}/rest/v1/chat_messages?admin_quality_star=eq.true&role=eq.assistant&select=content,admin_starred_at&order=admin_starred_at.desc&limit=8`;
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
    const truncate = (s, max = 480) => {
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

async function buildChatSystemContent(possibleCrisisLanguage) {
  let content = SYSTEM_PROMPT.content;
  const [pinned, exemplars] = await Promise.all([fetchPinnedAdminInstructions(), fetchStarredAssistantExemplars()]);
  if (pinned) {
    content += `\n\n# Admin-pinned guidance (saved reviewer feedback)\nTreat these as standing instructions when they fit the situation and stay safe. Prefer them over repeating generic canned replies:\n${pinned}\n`;
  }
  if (exemplars) {
    content += `\n\n# Admin-starred exemplar replies (pattern to emulate)\n${exemplars}\n`;
  }
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

  const mode = body?.mode === "regenerate" ? "regenerate" : "chat";
  const { userMessage, chatHistory, regenerationContext } = body;

  let messages = [];
  if (mode === "regenerate") {
    if (!regenerationContext?.originalUserMessage || !regenerationContext?.previousAssistantReply) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "regenerationContext.originalUserMessage and previousAssistantReply are required." }),
      };
    }
    const pinned = await fetchPinnedAdminInstructions();
    const exemplars = await fetchStarredAssistantExemplars();
    let regenContent = REGEN_SYSTEM_PROMPT.content;
    if (pinned && pinned.length) {
      regenContent += `\n\n# Admin-pinned guidance\n${pinned}\n`;
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
    const systemContent = await buildChatSystemContent(!!body?.possibleCrisisLanguage);
    messages = [{ role: "system", content: systemContent }, ...history, { role: "user", content: userMessage }];
  }

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
    temperature: mode === "regenerate" ? Math.min(temperature, 0.4) : temperature,
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
