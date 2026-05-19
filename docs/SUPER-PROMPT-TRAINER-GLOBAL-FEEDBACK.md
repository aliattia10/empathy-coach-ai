# Super Prompt — Trainer global feedback (Simon / all admins)

## Goal

When an admin trainer (e.g. Simon) saves feedback on an AI reply, that guidance must shape **every user's next messages** — not only the trainer's session or a one-off **Regenerate** variant.

## Live behaviour

1. **All admin feedback is global by default** (`apply_to_global_instructions` defaults to `true`; UI checkbox defaults on).
2. **`fetchTrainerGlobalInstructions()`** loads the latest trainer notes from `chat_feedback` (pinned rows) into every `/api/chat` request.
3. **`SYSTEM_PROMPT`** includes a **Trainer global standards** section: trainer rules override generic habits when safe.
4. **Starred exemplar replies** still apply for tone (all users).

## Cross-learner consistency

The system prompt includes **Cross-learner consistency**: similar user messages should get similar coaching moves for Simon, Nikki, and all trainees. Default LLM temperature is **0.55** (override with `VLLM_TEMPERATURE`) for steadier replies.

## Operations

- **Git:** trainer-global work is on `main` (commit `fce5cc0` and later). **Production only updates after Netlify redeploy** — pushing to GitHub does not change the live site until deploy runs.
- Netlify / server must set **`SUPABASE_SERVICE_ROLE_KEY`** and **`SUPABASE_URL`** (or `VITE_SUPABASE_URL`) so the chat function can read `chat_feedback`. Without this, Simon only sees good replies after **Regenerate**; Nikki and others keep the old generic prompt.
- Run migration `20260515140000_trainer_feedback_global_default.sql` to backfill existing feedback and set column default.
- Code: `netlify/functions/chat.js`, `server/server.js`, `src/pages/AvatarSessionPage.tsx`, `src/components/avatar/ChatTranscript.tsx`.

## Verify production

1. Netlify → **Functions** → `chat` → logs: after a message, you should **not** see `Trainer global standards skipped`.
2. Supabase SQL: `select count(*) from chat_feedback where apply_to_global_instructions is not false;` — should be > 0.
3. Test: Simon and Nikki send the **same test sentence** in a **new** turn; replies should be similar in style and protocol step (wording may differ slightly).

## What trainers should do

1. Save feedback on a reply (applies to all users automatically).
2. Use **Regenerate** only to preview; the real effect is the next message for **any** logged-in user.
3. Star excellent assistant replies to reinforce tone globally.
