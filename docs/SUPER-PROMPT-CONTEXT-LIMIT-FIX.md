# Super Prompt — Fix context limit (model window)

**Symptom:** Toast — “The coach hit a context limit…” / oversized message errors.

**Cause:** RunPod coach model has a finite context (often **4096 tokens**). Long chat history + system prompt + large uploads can exceed it.

## Fix

1. **Safer token estimate** (`chars / 3`) — slightly over-counts so we trim early.
2. **`trimMessagesForContext`**:
   - Prefers the **latest user** turn (especially uploads) — up to ~85% of the window
   - Drops older history first
   - Head+tail truncate for huge documents
   - Hard-guarantees final pack fits under budget
3. **Retry once** on API context errors with aggressive trim.
4. **No early 3.5k upload cut** — full extract from the browser; packing is server-side (see `SUPER-PROMPT-NO-ARTIFICIAL-LIMITS.md`).

## Ops: larger window

```env
VLLM_MAX_CONTEXT_TOKENS=8192
```

Match the deployed model’s real max.

## Code

| Piece | Path |
|-------|------|
| Trim + estimate | `skills/llmChatHelpers.cjs` |
| Chat API | `netlify/functions/chat.js`, `server/server.js` |
| Upload extract | `src/lib/readUploadedConversationFile.ts` |
| Tests | `src/lib/llmChatHelpers.test.ts` |

## Acceptance

- Long journeys and large uploads do not hard-fail when packing succeeds.
- `node scripts/check-context-budget.cjs` and vitest helpers pass.
