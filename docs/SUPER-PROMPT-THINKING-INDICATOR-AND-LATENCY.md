# Super Prompt — Why replies feel fast or slow + Thinking… UI

**Folder:** `docs/`  
**Date:** 5 Aug 2026

## Why replies sometimes take long and sometimes little

Latency is not one number — it depends on **which path** the request hits on RunPod Serverless:

| Situation | What happens | Typical feel |
|-----------|----------------|--------------|
| **Warm GPU** | Worker already loaded (weights in VRAM). Netlify `/api/chat` returns the reply in one shot. | ~2–8 seconds |
| **Cold start (scale-to-zero)** | No idle worker → RunPod boots a GPU, loads Qwen2.5-7B + LoRA. API returns `202` + `jobId`; the app **polls every 4s** until `COMPLETED`. | ~30s–3+ minutes |
| **Long context / upload** | Bigger prompt = more tokens to pack + generate. Retries if the first pack overflows the 4k window. | Extra seconds |
| **Regenerate / large history** | Same model, more work server-side (feedback, history, packing). | Slower than a short turn |
| **Busy queue** | Job waits `IN_QUEUE` before a worker picks it up. | Unpredictable wait |

So: **short waits = warm worker + short message**. **Long waits = cold start or heavy prompt**. That is expected with Serverless scale-to-zero (saves cost when nobody is chatting).

Relevant code: `src/lib/fetchChatReply.ts` (submit + poll), `netlify/functions/chat.js`.

## What we shipped (UX)

Same pattern as ChatGPT / Cursor / Gemini:

1. **In the transcript** — a coach-side bubble: **Thinking** + animated three dots (`…`).
2. After ~8s → **Still thinking**; after ~25s → **Taking a bit longer** + a short hint.
3. During RunPod cold start → **Getting ready / Still starting up** + progress bar (same idea as the old warming banner).
4. **Top status badge** — **Thinking** / **Getting ready** with the same animated dots while waiting.

Files:
- `src/components/chat/ThinkingIndicator.tsx`
- `src/components/avatar/ChatTranscript.tsx` (`isThinking`, `isWarming`)
- `src/pages/AvatarSessionPage.tsx`
- `src/index.css` (`.thinking-dot` animation)

## Optional later (not in this change)

- Keep a **min worker** on RunPod during demo hours → fewer cold starts (costs more).
- Stream tokens when the endpoint supports it → first words appear sooner even if total time is similar.
- Warm-up ping when the user opens a journey (fire a tiny request so the GPU wakes before they type).
