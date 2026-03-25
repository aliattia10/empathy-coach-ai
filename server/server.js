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
