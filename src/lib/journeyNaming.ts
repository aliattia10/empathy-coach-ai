import { DEFAULT_JOURNEY_NAME } from "@/hooks/useChatSession";

const AUTO_NAME_PATTERNS = [
  /^new journey$/i,
  /^your coaching journey$/i,
  /^session\s+\d+$/i,
];

export function isAutoNamedJourney(name: string | null | undefined): boolean {
  const trimmed = name?.trim();
  if (!trimmed) return true;
  return AUTO_NAME_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function sanitizeJourneyTitle(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\.$/, "")
    .slice(0, 80);
  return cleaned || DEFAULT_JOURNEY_NAME;
}

export async function suggestJourneyTitle(userMessages: string[]): Promise<string | null> {
  const snippet = userMessages
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("\n");
  if (snippet.length < 12) return null;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "name_journey", conversationSnippet: snippet }),
    });
    const data = await response.json();
    if (!response.ok || typeof data.reply !== "string") return null;
    const title = sanitizeJourneyTitle(data.reply);
    return isAutoNamedJourney(title) ? null : title;
  } catch {
    return null;
  }
}
