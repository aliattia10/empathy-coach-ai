/**
 * Keyword hint for the chat API: the model runs the crisis triage protocol
 * (clarify figure of speech vs intent before helplines). No fixed client reply.
 */
const CRISIS_KEYWORDS = [
  "suicide",
  "suicidal",
  "kill myself",
  "end my life",
  "self-harm",
  "self harm",
  "cutting myself",
  "want to die",
  "hurting myself",
  "no reason to live",
  "better off dead",
];

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}
