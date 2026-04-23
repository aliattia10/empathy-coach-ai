import type { ChatFeedback } from "@/hooks/useChatSession";

export function composeRegenerationPrompt(input: {
  originalUserInput: string;
  previousAssistantOutput: string;
  feedbackList: ChatFeedback[];
  systemGuardrails?: string;
}) {
  const ratingSummary = summarizeRatings(input.feedbackList);
  const tagSummary = summarizeTags(input.feedbackList);
  const feedbackBullets = input.feedbackList
    .map((item) => `- ${item.feedback_text.trim()}`)
    .filter(Boolean)
    .join("\n");

  const guardrails =
    input.systemGuardrails?.trim() ||
    "Follow platform safety policy. Do not provide unsafe instructions.";

  return [
    "You are improving a previous assistant reply using admin feedback from a testing workflow.",
    "",
    "[Original user message]",
    input.originalUserInput,
    "",
    "[Previous assistant reply]",
    input.previousAssistantOutput,
    "",
    "[Admin feedback summary]",
    `- Rating signals: ${ratingSummary}`,
    `- Tag priorities: ${tagSummary}`,
    "- Text feedback:",
    feedbackBullets || "- (No text feedback provided)",
    "",
    "[What to improve]",
    "Address feedback priorities with stronger empathy, clarity, and relevance.",
    "",
    "[What must remain correct]",
    "Preserve factual correctness and the user's original intent. Do not invent details.",
    "",
    "[Safety constraints]",
    guardrails,
    "",
    "Output:",
    "Return only the improved assistant reply text.",
  ].join("\n");
}

function summarizeRatings(feedbackList: ChatFeedback[]) {
  const ratings = feedbackList.map((f) => f.rating).filter((r): r is number => typeof r === "number");
  if (ratings.length === 0) return "No ratings";
  const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  return `Average ${avg.toFixed(1)}/5 from ${ratings.length} rating(s)`;
}

function summarizeTags(feedbackList: ChatFeedback[]) {
  const counts = new Map<string, number>();
  for (const item of feedbackList) {
    for (const tag of item.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  if (counts.size === 0) return "No tags";
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => `${tag} (${count})`)
    .join(", ");
}
