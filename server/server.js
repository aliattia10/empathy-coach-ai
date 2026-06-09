const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// LLM endpoint: default to OpenRouter (free tier with API key)
const VLLM_API_URL =
  process.env.VLLM_API_URL || "https://openrouter.ai/api/v1/chat/completions";

const { formatSkillsForPrompt } = require("../skills/skillsLibrary.cjs");
const { formatLlmEnginePhasesForPrompt } = require("../skills/llmEnginePhases.cjs");

// Rule-guided system prompt for the "Constructive Feedback" scenario (Alex avatar)
const SYSTEM_PROMPT = {
  role: "system",
  content: `# Role: ShiftED AI - Active Empathy Coach

You are an empathetic coaching partner for professional and personal growth challenges.
You are not a therapist.

# Non-negotiable operating rules
1. Ask exactly one clear question per response.
2. Keep responses brief and focused (2-4 sentences max).
3. Use plain, everyday language (no clinical or psychological jargon).
4. Use non-leading, open-ended questions. Do not include examples inside questions.
5. Never reveal internal notes, hidden observations, labels, phase names, workflow steps, or reasoning.
6. Do not jump ahead. Follow the Platform Phase architecture appended below strictly.
7. Stay anchored to the user's exact case. Do not generalize to "team problems" unless the user explicitly brings up team-wide issues.
8. Do not invent context, motives, or impacts. If missing, ask for it.
9. Keep focus on the specific person/situation the user names (singular when singular).
10. Never treat progression as one-way: use the Adaptive Escalation Loop when action steps fail or anxiety spikes.

# Platform workflow (strict order — full detail appended below)
- **Phase One:** Diagnostic intake and conceptualisation. Reflective Handshake gate: no Phase Two until the user explicitly confirms your summary.
- **Phase Two:** Micro-goals and behavioural activation. Confidence safety-check: if tomorrow confidence is below 7/10, shrink the step.
- **Phase Three:** Every login — check progress first; on failure/stress run Sustainability Pivot (Core Skills), then Architectural Backtrack to Phase One, then Re-activation in Phase Two.
- **Single journey:** One continuous thread per conversation; resume with check-in when history exists — do not restart as a new scenario simulation.

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

# Trainer global standards (highest priority after safety)
You serve many learners; admin trainers tune you via saved feedback. When a block titled "Trainer global standards" is appended below, it applies to **every user** in **every session** — not only the trainer who wrote it.
- Treat trainer bullets as mandatory style and behaviour rules when they are safe and fit the user's message.
- They override generic empathy habits, canned crisis walls, and default openers when they conflict.
- Do not mention trainers, admins, feedback, prompts, or internal tuning to the user.
- If trainer guidance and safety rules conflict, safety wins.

# Cross-learner consistency (all accounts — Simon, Nikki, trainees, etc.)
Every user gets the same system rules and the same trainer standards. The logged-in person does not change how you coach.
- For a **similar** user message (same scenario, same protocol stage, similar worry or wording), give a **similar** coaching move: comparable empathy, same stage of the protocol, one question aimed the same way.
- Do not give one learner a crisis helpline wall and another a gentle clarifying question for the same kind of message unless risk is clearly different in what they wrote.
- Regenerated or starred trainer-approved replies are the quality bar — match that bar for everyone, not only when you detect an admin account.

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
6. When "Trainer global standards" or "Admin-starred exemplar replies" appear in system context, follow them for all users.
7. Output only the improved response text.`,
};

const TRAINER_FEEDBACK_LIMIT = 25;

async function fetchTrainerGlobalInstructions() {
  const baseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) {
    console.warn(
      "Trainer global standards skipped: set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL on the chat host.",
    );
    return "";
  }
  try {
    const url = `${baseUrl}/rest/v1/chat_feedback?select=feedback_text,created_at,apply_to_global_instructions&order=created_at.desc&limit=${TRAINER_FEEDBACK_LIMIT}`;
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
    return lines.length ? lines.join("\n") : "";
  } catch (err) {
    console.warn("fetchTrainerGlobalInstructions:", err.message);
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
  content += `\n\n${formatLlmEnginePhasesForPrompt()}\n`;
  content += `\n\n${formatSkillsForPrompt()}\n`;
  const [trainerRules, exemplars] = await Promise.all([fetchTrainerGlobalInstructions(), fetchStarredAssistantExemplars()]);
  if (trainerRules) {
    content += `\n\n# Trainer global standards (admin feedback — applies to ALL users)\nFollow every bullet below for this reply and all learners. These override generic habits when safe:\n${trainerRules}\n`;
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

app.post("/api/chat", async (req, res) => {
  const { userMessage, chatHistory, mode, regenerationContext, possibleCrisisLanguage } = req.body;

  let messages = [];
  const isRegenerationMode = mode === "regenerate";
  if (isRegenerationMode) {
    if (!regenerationContext?.originalUserMessage || !regenerationContext?.previousAssistantReply) {
      return res.status(400).json({
        error: "regenerationContext.originalUserMessage and previousAssistantReply are required.",
      });
    }
    const trainerRules = await fetchTrainerGlobalInstructions();
    const exemplars = await fetchStarredAssistantExemplars();
    let regenContent = REGEN_SYSTEM_PROMPT.content;
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
      return res.status(400).json({ error: "userMessage is required and must be a string." });
    }
    const history = Array.isArray(chatHistory)
      ? chatHistory.map((m) => ({ role: m.role, content: m.content || "" }))
      : [];
    const systemContent = await buildChatSystemContent(!!possibleCrisisLanguage);
    messages = [{ role: "system", content: systemContent }, ...history, { role: "user", content: userMessage }];
  }

  const apiKey = process.env.LLM_API_KEY;
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const response = await axios.post(
      VLLM_API_URL,
      {
        model: process.env.VLLM_MODEL || "meta-llama/llama-3.2-3b-instruct:free",
        messages,
        temperature: isRegenerationMode
          ? Math.min(Number(process.env.VLLM_TEMPERATURE) || 0.55, 0.35)
          : Number(process.env.VLLM_TEMPERATURE) || 0.55,
        max_tokens: Number(process.env.VLLM_MAX_TOKENS) || 500,
      },
      {
        headers,
        timeout: Number(process.env.VLLM_TIMEOUT_MS) || 60000,
      }
    );

    const aiReply = response.data.choices?.[0]?.message?.content ?? "";
    res.json({ reply: aiReply });
  } catch (error) {
    console.error("Error connecting to vLLM:", error.message);
    if (error.response) {
      console.error("vLLM response status:", error.response.status);
      console.error("vLLM response data:", error.response.data);
    }
    res.status(500).json({
      error: "Avatar is currently unavailable.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.post("/api/transcribe", async (req, res) => {
  const { audioBase64, mimeType } = req.body || {};
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({ error: "audioBase64 is required." });
  }

  const preferOpenAI = (process.env.TRANSCRIBE_PROVIDER || "").toLowerCase() === "openai";
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const useOpenAI = preferOpenAI ? !!openaiKey : !groqKey && !!openaiKey;
  const url = useOpenAI
    ? "https://api.openai.com/v1/audio/transcriptions"
    : "https://api.groq.com/openai/v1/audio/transcriptions";
  const apiKey = useOpenAI ? openaiKey : groqKey;
  const model = useOpenAI
    ? (process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1")
    : (process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3-turbo");

  if (!apiKey) {
    return res.status(503).json({
      error: "Transcription is unavailable. Configure GROQ_API_KEY or OPENAI_API_KEY.",
    });
  }

  try {
    const bytes = Buffer.from(audioBase64, "base64");
    const blob = new Blob([bytes], { type: mimeType || "audio/webm" });
    const form = new FormData();
    form.append("file", blob, "voice-message.webm");
    form.append("model", model);
    form.append("language", "en");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Transcribe provider error:", response.status, errText);
      return res.status(502).json({ error: "Transcription provider error." });
    }

    const data = await response.json();
    return res.json({ text: (data.text || "").trim() });
  } catch (error) {
    console.error("Transcription failed:", error);
    return res.status(500).json({ error: "Transcription failed." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
