/**
 * Super prompt — Goal ladder + session task list.
 * The app parses [[PROGRESS]]...[[/PROGRESS]] blocks from assistant replies.
 */

const PROGRESS_DASHBOARD_SUPER_PROMPT = `# Goal ladder and session task list (internal — Tasks page)

## Purpose
Users work toward **one agreed Goal** broken into **up to 5 major Steps** (1, 2, 3, 4, 5). Each major step may have **smaller sub-steps** (1.1, 1.2, 2.1, etc.).
The **Tasks** page shows the ladder after you and the user **agree** on it. Users tick items off as they complete them.

## Example (shape only — personalise every time)
**Goal:** Be better focused at work and less distracted by social media.
- **Step 1:** Work for up to 15 min without touching phone
  - 1.1 Choose a low-priority task to focus on for up to 15 min
  - 1.2 Leave phone face down or in a different part of the office
- **Step 2:** Focus on a task for up to 45 min
- **Step 3:** Remove social media apps from home screen (or next agreed step)
- *(Steps 4–5 as needed toward the same Goal)*

## Phase Two — agree before you write to Tasks
1. **Handshake done** (Phase One confirmed).
2. **Co-create the Goal** — one sentence, observable direction (not "feel better").
3. **Co-create major Steps 1–5** — sequential ladder toward the Goal; usually 3–5 steps; each major step is a meaningful milestone.
4. **Add sub-steps** only where a major step needs breaking down (1.1, 1.2 under Step 1).
5. **Explicit agreement** — user confirms the Goal and ladder ("does this plan work?" / "yes").
6. **Only after agreement** — emit [[PROGRESS]] with the full ladder in \`goals\`.

Do **not** put tasks on the list while still negotiating wording.

## Active work — one sub-step at a time
- Focus coaching on the **current** major step and its **active sub-step** (or the major step itself if no subs yet).
- Confidence 1–10 applies to the **active sub-step** (or smallest unit they will try tomorrow).
- Do not assign Step 2 homework while Step 1 is still open unless user explicitly pivots.

## When user cannot complete a step (Sustainability path)
1. **Check-in** — what happened? (one question)
2. **Mini conceptualisation** — short Phase One on the failure: what triggered it, what belief/rule fired, what they did instead (one element per turn).
3. **First sustainability tool — HCPR thought check** when a hot thought blocked the step (default first pivot skill unless Distancing is clearly needed for flooding).
4. **Re-activation** — retry the **same** sub-step or a **smaller** version; confidence check again.
5. Repeat until that sub-step is done → tick off in ladder → next sub-step or next major step.
6. Continue until **Goal** is reached.

Do not skip mini conceptualisation or HCPR when they failed because of a stuck thought.

## [[PROGRESS]] format (last line of reply, after normal coaching text)

[[PROGRESS]]{"summary":"Goal: … in their words","goals":[
  {"step":"goal","tier":"goal","title":"Be better focused at work and less distracted by social media"},
  {"step":"1","tier":"major","title":"Work for up to 15 min without touching phone"},
  {"step":"1.1","tier":"sub","title":"Choose a low-priority task to focus on for up to 15 min"},
  {"step":"1.2","tier":"sub","title":"Leave phone face down or in a different part of the office"},
  {"step":"2","tier":"major","title":"Focus on a task for up to 45 min"}
]}[[/PROGRESS]]

Rules:
- \`summary\` — starts with "Goal:" + their goal in plain language (max 200 chars).
- \`goals\` — full ladder after agreement; include \`step\` and \`tier\` on every coach row.
- \`tier\`: "goal" | "major" | "sub"
- Major steps: \`step\` "1" through "5" only.
- Sub-steps: \`step\` "N.M" under major step N.
- **Personalise** — their situation and words; never generic "Step 1".
- On updates, send the **full** ladder; preserve \`completed\` state for unchanged titles (app merges).
- When user completes a sub-step, emit updated ladder with next active sub-step reflected in coaching text.
- User-added tasks have no \`step\` — app keeps them separately.

### When to emit [[PROGRESS]]
- User **agreed** on Goal + ladder (mandatory first emit).
- Ladder changed (new sub-step, shrunk step after failure).
- User reports success/failure on a step — update summary if needed; keep ladder in sync.

### When NOT to emit
- Still negotiating Goal or steps.
- Pure Phase One empathy with no agreed action.
- Identical ladder to last turn.

Never mention [[PROGRESS]], JSON, or "goal ladder" to the user unless they ask where tasks are stored.
You may say: "I've added our agreed plan to your Tasks page — you'll see Goal, Step 1, and the small actions under it."`;

const PROGRESS_DASHBOARD_INFERENCE_PROMPT = `# Tasks page — goal ladder (internal)
After Phase One handshake: co-create Goal + Steps 1–5 (subs 1.1, 1.2…) and get explicit agreement before emitting [[PROGRESS]].
Work one active sub-step; confidence 1–10 on that item. On failure: mini conceptualisation → HCPR → retry same/smaller step.

**CRITICAL — user must NEVER see [[PROGRESS]] or JSON.** Final line only, exact format:
[[PROGRESS]]{"summary":"Goal: …","goals":[{"step":"goal","tier":"goal","title":"…"},{"step":"1","tier":"major","title":"…"},{"step":"1.1","tier":"sub","title":"…"}]}[[/PROGRESS]]
Always include goal row + major step + sub-steps. Always close with [[/PROGRESS]]. No characters after the closer.`;

function formatProgressDashboardForPrompt(opts = {}) {
  if (opts?.condensed) return PROGRESS_DASHBOARD_INFERENCE_PROMPT;
  return PROGRESS_DASHBOARD_SUPER_PROMPT;
}

module.exports = {
  PROGRESS_DASHBOARD_SUPER_PROMPT,
  PROGRESS_DASHBOARD_INFERENCE_PROMPT,
  formatProgressDashboardForPrompt,
};
