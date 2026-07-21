# Super Prompt — Fix context limit (4k window)

**Symptom:** Toast — “The coach hit a context limit — please try again…”

**Cause:** RunPod coach model has a **4096-token** context. Long chat history + full system prompt + large uploaded documents could exceed it. Older trim kept min 8 history turns and **never truncated the latest user message**, so PDF uploads could still blow the budget.

## Fix (21 Jul 2026)

1. **Safer token estimate** (`chars / 3`) — slightly over-counts so we trim early.
2. **`trimMessagesForContext`** now:
   - Caps the **latest user** turn when large (uploads)
   - Adapts how much history to keep based on last-message size
   - Hard-guarantees final pack fits under budget
3. **Retry once** on API context errors with aggressive trim.
4. **Upload extract cap** lowered to **3,500 chars** (~1k tokens).
5. Async RunPod submit re-trims if estimate is still high.

## Code

| Piece | Path |
|-------|------|
| Trim + estimate | `skills/llmChatHelpers.cjs` |
| Chat API | `netlify/functions/chat.js`, `server/server.js` |
| Upload size | `src/lib/readUploadedConversationFile.ts` |
| Tests | `src/lib/llmChatHelpers.test.ts` |

## Acceptance

- Long journeys no longer hard-fail with the context toast after a normal turn.
- Uploading a PDF still works; excess text is truncated for the model.
- `node scripts/check-context-budget.cjs` and vitest helpers pass.
