const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

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

# Safety guardrails (critical)
1. This is a professional training simulation, not therapy.
2. If the user mentions trauma, severe depression, self-harm, suicide, or crisis, stop the simulation.
3. Output this exact string on crisis:
"CRISIS_TRIGGERED: Please remember this is a training simulation. If you are in distress, please contact NHS 24 or Mind for immediate professional support."`,
};

app.post("/api/chat", async (req, res) => {
  const { userMessage, chatHistory } = req.body;

  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ error: "userMessage is required and must be a string." });
  }

  // Format payload for OpenAI-compatible vLLM API
  const history = Array.isArray(chatHistory)
    ? chatHistory.map((m) => ({ role: m.role, content: m.content || "" }))
    : [];
  const messages = [
    SYSTEM_PROMPT,
    ...history,
    { role: "user", content: userMessage },
  ];

  const apiKey = process.env.LLM_API_KEY;
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const response = await axios.post(
      VLLM_API_URL,
      {
        model: process.env.VLLM_MODEL || "meta-llama/llama-3.2-3b-instruct:free",
        messages,
        temperature: Number(process.env.VLLM_TEMPERATURE) || 0.7,
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
