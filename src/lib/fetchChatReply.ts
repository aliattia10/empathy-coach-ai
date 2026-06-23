export type ChatApiPayload = {
  userMessage?: string;
  chatHistory?: { role: string; content: string }[];
  possibleCrisisLanguage?: boolean;
  journeyContext?: unknown;
  mode?: string;
  regenerationContext?: unknown;
  conversationSnippet?: string;
};

const WARMING_MESSAGE =
  "Coach is warming up — first reply after idle can take up to a minute. Retrying…";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls /api/chat with retries for RunPod cold start and Netlify gateway timeouts.
 */
export async function fetchChatReply(
  payload: ChatApiPayload,
  opts?: { onStatus?: (message: string) => void },
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const maxAttempts = 3;
  let lastError = "Avatar is currently unavailable. Please try again.";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (attempt > 1) {
      opts?.onStatus?.(WARMING_MESSAGE);
      await sleep(3000 * attempt);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { reply?: string; error?: string; retryable?: boolean };
      try {
        data = await response.json();
      } catch {
        lastError =
          "Connection lost — the coach may still be starting. Please send your message again.";
        if (attempt < maxAttempts) continue;
        return { ok: false, error: lastError };
      }

      if (!response.ok) {
        lastError =
          typeof data.error === "string"
            ? data.error
            : "Avatar is currently unavailable. Please try again.";
        const shouldRetry =
          attempt < maxAttempts &&
          (data.retryable === true || response.status === 502 || response.status === 504);
        if (shouldRetry) continue;
        return { ok: false, error: lastError };
      }

      return { ok: true, reply: data.reply ?? "" };
    } catch {
      lastError =
        "Connection lost — the coach may still be starting. Please send your message again.";
      if (attempt < maxAttempts) continue;
      return { ok: false, error: lastError };
    }
  }

  return { ok: false, error: lastError };
}
