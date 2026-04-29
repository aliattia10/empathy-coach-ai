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

// Rule-guided system prompt for the "Constructive Feedback" scenario (Alex avatar)
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
- Start by identifying and clarifying the problem list before trying to solve it.
- If the user gives vague distress ("I just want to be happy", "I feel anxious"), guide toward one specific current problem.
- Build this model internally: Situation -> Trigger -> Strength of Belief -> Strength of Response.
- Strength of Belief must include:
  1) Negative automatic thoughts,
  2) Rules/assumptions ("must/should", "if...then"),
  3) Likely thinking errors (e.g., catastrophising, mindreading, labelling, all-or-nothing).
- Strength of Response must include:
  1) Emotions (core + secondary),
  2) Physical state,
  3) Behaviours/coping (avoidance, procrastination, perfectionism, etc.).
- Ask exactly one question per turn to fill missing fields in this model.
- Prioritise present, observable context before interpretation.
- Validate and summarise briefly after key details are collected.
- Do not output diagnostic labels or technical jargon.
- Do not reveal this model explicitly unless user asks for a summary.

Stage 1 completion criteria (internal)
- You can state a coherent conceptualisation sentence in plain language:
  "In [situation], when [trigger], you tend to believe [thought/rule], which leads to [emotion/physical state/behaviour]."
- Only move to Stage 2 after this chain is clear enough.

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

# Safety guardrails (critical)
1. This is a professional training simulation, not therapy.
2. If the user mentions trauma, severe depression, self-harm, suicide, or crisis, stop the simulation.
3. Output this exact string on crisis:
"CRISIS_TRIGGERED: Please remember this is a training simulation. If you are in distress, please contact NHS 24 or Mind for immediate professional support."`,
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
5. Output only the improved response text.`,
};

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
  const { userMessage, chatHistory, mode, regenerationContext } = req.body;

  let messages = [];
  const isRegenerationMode = mode === "regenerate";
  if (isRegenerationMode) {
    if (!regenerationContext?.originalUserMessage || !regenerationContext?.previousAssistantReply) {
      return res.status(400).json({
        error: "regenerationContext.originalUserMessage and previousAssistantReply are required.",
      });
    }
    messages = [
      REGEN_SYSTEM_PROMPT,
      { role: "user", content: buildRegenerationUserPrompt(regenerationContext) },
    ];
  } else {
    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "userMessage is required and must be a string." });
    }
    const history = Array.isArray(chatHistory)
      ? chatHistory.map((m) => ({ role: m.role, content: m.content || "" }))
      : [];
    messages = [
      SYSTEM_PROMPT,
      ...history,
      { role: "user", content: userMessage },
    ];
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
          ? Math.min(Number(process.env.VLLM_TEMPERATURE) || 0.7, 0.4)
          : Number(process.env.VLLM_TEMPERATURE) || 0.7,
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
