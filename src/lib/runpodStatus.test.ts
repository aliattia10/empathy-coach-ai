import { describe, expect, it } from "vitest";

/** Mirror of skills/runpodAsync.cjs isRunPodTerminalFailure for client/docs tests. */
function isRunPodTerminalFailure(status: string | undefined): boolean {
  const s = String(status || "").toUpperCase();
  return s === "FAILED" || s === "CANCELLED" || s === "CANCELED" || s === "TIMED_OUT" || s === "TIMEOUT";
}

function shouldRequestFallback(opts: {
  status?: string;
  waitedMs: number;
  fallbackAfterMs: number;
  fallbackConfigured: boolean;
}): boolean {
  if (!opts.fallbackConfigured) return false;
  if (isRunPodTerminalFailure(opts.status)) return true;
  if (opts.waitedMs >= opts.fallbackAfterMs) return true;
  return false;
}

describe("RunPod status mapping", () => {
  it("treats TIMED_OUT as terminal failure", () => {
    expect(isRunPodTerminalFailure("TIMED_OUT")).toBe(true);
    expect(isRunPodTerminalFailure("IN_QUEUE")).toBe(false);
    expect(isRunPodTerminalFailure("IN_PROGRESS")).toBe(false);
  });

  it("requests fallback after threshold while still queued", () => {
    expect(
      shouldRequestFallback({
        status: "IN_QUEUE",
        waitedMs: 80_000,
        fallbackAfterMs: 75_000,
        fallbackConfigured: true,
      }),
    ).toBe(true);
    expect(
      shouldRequestFallback({
        status: "IN_QUEUE",
        waitedMs: 10_000,
        fallbackAfterMs: 75_000,
        fallbackConfigured: true,
      }),
    ).toBe(false);
  });
});
