/**
 * Export chat_sessions + chat_messages from Supabase to training JSONL format.
 * Run when you have real conversation data in Supabase.
 *
 * Usage:
 *   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in .env or env, then:
 *   node scripts/export-supabase-to-jsonl.js
 *
 * Output: train_from_supabase.jsonl in project root.
 * Use with: cat train_synthetic.jsonl train_from_supabase.jsonl > train.jsonl
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SYSTEM_CONTENT =
  "You are Alex, a direct report. Your manager is practicing delivering difficult feedback. Be slightly defensive but receptive when they use empathetic language and I-statements.";

async function fetchAll(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in the environment.");
    process.exit(1);
  }

  const base = SUPABASE_URL.replace(/\/$/, "");
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const outPath = path.join(__dirname, "..", "train_from_supabase.jsonl");
  let written = 0;

  console.log("Fetching chat_sessions...");
  const sessions = await fetchAll(`${base}/rest/v1/chat_sessions?select=id`, { headers });
  if (!Array.isArray(sessions) || sessions.length === 0) {
    console.log("No sessions found. Output file will be empty.");
    fs.writeFileSync(outPath, "", "utf8");
    return;
  }

  const sessionIds = sessions.map((s) => s.id);
  console.log(`Found ${sessionIds.length} sessions. Fetching messages...`);

  const messages = await fetchAll(
    `${base}/rest/v1/chat_messages?session_id=in.(${sessionIds.map((id) => `"${id}"`).join(",")})&order=created_at.asc`,
    { headers }
  );

  if (!Array.isArray(messages)) {
    console.log("No messages returned.");
    fs.writeFileSync(outPath, "", "utf8");
    return;
  }

  const bySession = {};
  for (const m of messages) {
    if (!bySession[m.session_id]) bySession[m.session_id] = [];
    bySession[m.session_id].push({ role: m.role, content: m.content || "" });
  }

  fs.writeFileSync(outPath, "", "utf8");
  for (const sessionId of sessionIds) {
    const turns = bySession[sessionId] || [];
    if (turns.length < 2) continue;
    const messagesArr = [
      { role: "system", content: SYSTEM_CONTENT },
      ...turns.filter((t) => t.role === "user" || t.role === "assistant"),
    ];
    if (messagesArr.length < 3) continue;
    const line = JSON.stringify({ messages: messagesArr }) + "\n";
    fs.appendFileSync(outPath, line, "utf8");
    written++;
  }

  console.log(`Wrote ${written} conversations to ${outPath}`);
  console.log("Merge with synthetic: cat train_synthetic.jsonl train_from_supabase.jsonl > train.jsonl");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
