/** Belief before/after helpers (15 Jul meeting — reflection comparison). */

const BEFORE_RE = /Belief strength \(before\):\s*(\d{1,3})\s*%/i;

export function parseBeliefStrengthBefore(summary: string | null | undefined): number | null {
  if (!summary?.trim()) return null;
  const m = summary.match(BEFORE_RE);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 0 && n <= 100 ? n : null;
}

export function withBeliefStrengthBeforeLocked(
  summary: string | null | undefined,
  pct: number,
): string {
  if (parseBeliefStrengthBefore(summary) != null) {
    return summary || "";
  }
  const line = `Belief strength (before): ${pct}%`;
  if (!summary?.trim()) return line;
  return `${summary.trim()}\n${line}`.slice(0, 600);
}
