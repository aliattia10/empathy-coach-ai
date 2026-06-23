export type ChatApiPayload = {
  userMessage?: string;
  chatHistory?: { role: string; content: string }[];
  possibleCrisisLanguage?: boolean;
  journeyContext?: unknown;
  mode?: string;
  regenerationContext?: unknown;
  conversationSnippet?: string;
};

const WARMING_START =
  "Alex is starting up — you only pay while the coach runs, not 24/7. First reply may take 1–3 minutes.";

function warmingMessage(elapsedMs: number): string {
  if (elapsedMs < 30_000) return WARMING_START;
  if (elapsedMs < 90_000) return "Still loading the model after idle — please keep this tab open…";
  if (elapsedMs < 180_000) return "Almost there — RunPod is waking the coach…";
  return "Taking longer than usual — GPU may be scarce. Still trying…";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollRunPodJob(
  jobId: string,
  opts?: { onStatus?: (message: string) => void },
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const started = Date.now();
  const maxWaitMs = 300_000;
  const pollIntervalMs = 4_000;

  while (Date.now() - started < maxWaitMs) {
    const elapsed = Date.now() - started;
    opts?.onStatus?.(warmingMessage(elapsed));
    await sleep(pollIntervalMs);

    try {
      const pollRes = await fetch(`/api/chat?jobId=${encodeURIComponent(jobId)}`);
      const pollData: {
        status?: string;
        reply?: string;
        error?: string;
        retryable?: boolean;
        warming?: boolean;
      } = await pollRes.json();

      if (pollRes.ok && pollData.status === "COMPLETED") {
        return { ok: true, reply: pollData.reply ?? "" };
      }

      if (pollData.status === "FAILED" || pollData.status === "CANCELLED") {
        return {
          ok: false,
          error:
            typeof pollData.error === "string"
              ? pollData.error
              : "The coach could not start. Check RunPod endpoint logs.",
        };
      }

      if (!pollRes.ok && !pollData.retryable) {
        return {
          ok: false,
          error:
            typeof pollData.error === "string"
              ? pollData.error
              : "Avatar is currently unavailable. Please try again.",
        };
      }
    } catch {
      // Transient poll failure — keep waiting while RunPod may still be booting.
    }
  }

  return {
    ok: false,
    error:
      "The coach is still starting. Wait one more minute, then send your message again (you won't be charged while idle).",
  };
}

/**
 * Calls /api/chat. RunPod chat uses async submit + poll so Netlify never times out on cold start.
 */
export async function fetchChatReply(
  payload: ChatApiPayload,
  opts?: { onStatus?: (message: string) => void },
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data: {
      reply?: string;
      error?: string;
      retryable?: boolean;
      warming?: boolean;
      jobId?: string;
      message?: string;
    };
    try {
      data = await response.json();
    } catch {
      return {
        ok: false,
        error:
          "Connection lost — the coach may still be starting. Please send your message again in a minute.",
      };
    }

    if (response.status === 202 && data.jobId) {
      opts?.onStatus?.(data.message || WARMING_START);
      return pollRunPodJob(data.jobId, opts);
    }

    if (!response.ok) {
      return {
        ok: false,
        error:
          typeof data.error === "string"
            ? data.error
            : "Avatar is currently unavailable. Please try again.",
      };
    }

    return { ok: true, reply: data.reply ?? "" };
  } catch {
    return {
      ok: false,
      error:
        "Connection lost — the coach may still be starting. Please send your message again in a minute.",
    };
  }
}
