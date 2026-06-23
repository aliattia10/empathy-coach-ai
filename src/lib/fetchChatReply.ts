export type ChatApiPayload = {
  userMessage?: string;
  chatHistory?: { role: string; content: string }[];
  possibleCrisisLanguage?: boolean;
  journeyContext?: unknown;
  mode?: string;
  regenerationContext?: unknown;
  conversationSnippet?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollRunPodJob(
  jobId: string,
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const started = Date.now();
  const maxWaitMs = 300_000;
  const pollIntervalMs = 4_000;

  while (Date.now() - started < maxWaitMs) {
    await sleep(pollIntervalMs);

    try {
      const pollRes = await fetch(`/api/chat?jobId=${encodeURIComponent(jobId)}`);
      const pollData: {
        status?: string;
        reply?: string;
        error?: string;
        retryable?: boolean;
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
    error: "The coach is still starting. Wait a moment, then send your message again.",
  };
}

/**
 * Calls /api/chat. RunPod chat uses async submit + poll so Netlify never times out on cold start.
 */
export async function fetchChatReply(
  payload: ChatApiPayload,
  opts?: { onWarmingChange?: (warming: boolean) => void },
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
      jobId?: string;
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
      opts?.onWarmingChange?.(true);
      try {
        return await pollRunPodJob(data.jobId);
      } finally {
        opts?.onWarmingChange?.(false);
      }
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
