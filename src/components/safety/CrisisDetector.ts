const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life", "self-harm",
  "self harm", "cutting myself", "want to die", "hurting myself",
  "no reason to live", "better off dead"
];

export const CRISIS_RESPONSE = `I can see you're going through something really difficult right now. I'm an AI training tool and I'm not equipped to help with this.

**Please reach out to someone who can help:**

🇬🇧 **Samaritans**: 116 123 (free, 24/7)
🇬🇧 **NHS**: 111 (option 2 for mental health)
🇬🇧 **Mind**: 0300 123 3393
🇬🇧 **Crisis Text Line**: Text "SHOUT" to 85258

You matter, and support is available right now. 💙`;

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}
