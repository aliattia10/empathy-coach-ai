export type PhaseOneElement = "trigger" | "rule" | "belief" | "strength" | "coping" | "summary";

const PHASE_ONE_ELEMENT_ORDER: PhaseOneElement[] = ["trigger", "rule", "belief", "strength", "coping"];

const ELEMENT_ASK_PATTERNS: Record<Exclude<PhaseOneElement, "summary">, RegExp> = {
  trigger: /trigger|sets? it off|right before|what happens when|spike|sets this off|in the moment/i,
  rule: /\bif\b.{0,40}\bthen\b|rule|assumption|inner voice|fear|worry|belief about/i,
  belief: /what.*believe|worst.*happen|expect.*happen|afraid.*would/i,
  strength: /how strongly|0\s*to\s*100|0-100|strength of belief|%\s*right now/i,
  coping: /body|emotion|feel in your body|what do you do|cope|avoid|response when/i,
};

export function detectAskedPhaseOneElements(assistantMessages: string[]): Set<PhaseOneElement> {
  const asked = new Set<PhaseOneElement>();
  for (const text of assistantMessages) {
    for (const [element, pattern] of Object.entries(ELEMENT_ASK_PATTERNS) as [
      Exclude<PhaseOneElement, "summary">,
      RegExp,
    ][]) {
      if (pattern.test(text)) asked.add(element);
    }
  }
  return asked;
}

export function nextPhaseOneElement(assistantMessages: string[]): PhaseOneElement {
  const asked = detectAskedPhaseOneElements(assistantMessages);
  for (const element of PHASE_ONE_ELEMENT_ORDER) {
    if (!asked.has(element)) return element;
  }
  return "summary";
}

export function detectPhaseOneFocusFromAssistant(assistantText: string): PhaseOneElement | null {
  if (!assistantText.trim()) return null;
  for (const [element, pattern] of Object.entries(ELEMENT_ASK_PATTERNS) as [
    Exclude<PhaseOneElement, "summary">,
    RegExp,
  ][]) {
    if (pattern.test(assistantText)) return element;
  }
  return null;
}
