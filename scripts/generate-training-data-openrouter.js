/**
 * Generate synthetic training data (train_synthetic.jsonl) using OpenRouter.
 * Run when you don't have real conversation data yet.
 *
 * Usage:
 *   Set OPENROUTER_API_KEY or LLM_API_KEY in env, then:
 *   node scripts/generate-training-data-openrouter.js [count]
 *
 * Default count=50. Output: train_synthetic.jsonl in project root or current dir.
 */

const fs = require("fs");
const path = require("path");

const OPENROUTER_URL = process.env.VLLM_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY;
const MODEL = process.env.VLLM_MODEL || "meta-llama/llama-3.2-3b-instruct:free";

const SYSTEM_PROMPT = `You are a data generator for a training set. Output exactly one training example as valid JSON, no other text.

Rules for the example:
- "system": "You are Alex, a direct report. Your manager is practicing delivering difficult feedback. Be slightly defensive but receptive when they use empathetic language and I-statements."
- "user": one short line a manager might say (e.g. about a missed deadline, performance, conflict, or saying no).
- "assistant": one short reply Alex would say (defensive but willing to engage).

Output only this JSON (single line, no markdown): {"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}`;

const USER_PROMPTS = [
  "Generate one example about a missed deadline.",
  "Generate one example about giving negative performance feedback.",
  "Generate one example about conflict between two team members.",
  "Generate one example about saying no or setting boundaries.",
  "Generate one example about supporting someone in distress.",
  "Generate one example about a difficult conversation remotely.",
  "Generate one example where the manager uses I-statements.",
  "Generate one example where the manager is too aggressive.",
  "Generate one example about repeated lateness.",
  "Generate one example about quality of work.",
];

async function callOpenRouter(userPrompt) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  return text;
}

function extractJsonLine(text) {
  const match = text.match(/\{[\s\S]*"messages"[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]);
    if (Array.isArray(obj.messages) && obj.messages.length >= 3) return obj;
  } catch (_) {}
  return null;
}

async function main() {
  const count = Math.max(1, parseInt(process.argv[2], 10) || 50);
  if (!API_KEY) {
    console.error("Set OPENROUTER_API_KEY or LLM_API_KEY in the environment.");
    process.exit(1);
  }

  const outPath = path.join(__dirname, "..", "train_synthetic.jsonl");
  const seen = new Set();
  let written = 0;

  console.log(`Generating up to ${count} examples with OpenRouter (${MODEL}) -> ${outPath}`);
  fs.writeFileSync(outPath, "", "utf8");

  for (let i = 0; i < count; i++) {
    const userPrompt = USER_PROMPTS[i % USER_PROMPTS.length] + ` (variation ${i + 1})`;
    try {
      const raw = await callOpenRouter(userPrompt);
      const obj = extractJsonLine(raw);
      if (obj) {
        const line = JSON.stringify(obj);
        const key = line.slice(0, 120);
        if (!seen.has(key)) {
          seen.add(key);
          fs.appendFileSync(outPath, line + "\n", "utf8");
          written++;
          process.stdout.write(".");
        }
      }
    } catch (e) {
      console.error(`\nRequest failed: ${e.message}`);
    }
  }

  console.log(`\nDone. Wrote ${written} unique examples to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
