# Super Prompt — Skills library and skill-gap detection

Aligned with *Training the LLM to detect skill gaps* (Simon) and **ShiftED AI weekly meeting — 27 May 2026**, plus ShiftedAI Resources knowledge-base router (2026-10).

## Decisions reflected

| Decision | Implementation |
|----------|----------------|
| **Core vs Development/Activation** | `core` vs `development_activation` in `skills/skillsLibrary.cjs` |
| **Phase 1 ↔ Phase 3 loop** | System prompt: if skill blocked, return to conceptualisation then practice |
| **Person-centred conceptualisation each session** | Existing Stage 1 / Platform Phase 1 + `problem_list_conceptualisation` |
| **Challenge avoidance; weak modalities** | Prompt: do not reinforce learning-style excuses |
| **Learning styles shelved** | Explicitly disabled in skill super prompt |
| **Structured data, not info-dump** | JSON module + Supabase `skills` seed + `knowledge-base/` retrieval |
| **Acronym key** | Injected with library; see `docs/ACRONYM-KEY.md` |
| **Rule-based skill router** | `skills/knowledgeBase.cjs` — intent + emotion → 1–2 skill ids; crisis protocol first |
| **No prompt bloat** | Condensed inference mode; KB injects compact summary only |

## Live wiring

- **Library:** `skills/skillsLibrary.cjs` → `formatSkillsForPrompt()`
- **KB router:** `formatKnowledgeForPrompt(latestUserMessage)` inside `buildProductionSystemPrompt`
- **Chat API:** `buildChatSystemContent()` in `netlify/functions/chat.js` and `server/server.js` for **every user**
- **DB (optional):** migrations under `supabase/migrations/` for admin CRUD later

## Trainer workflow

1. Complete Phase 1 conceptualisation with the user.
2. Set goals (Phase 2) when appropriate.
3. When language shows a **gap**, recommend **one** skill from the library by plain name + one question.
4. If they resist, loop to Phase 1 — do not only repeat the skill name.
5. If crisis language appears, follow crisis protocol before any skill.

## Simon / team testing

Skill recommendations must behave the same for Simon, Nikki, and trainees (see `SUPER-PROMPT-TRAINER-GLOBAL-FEEDBACK.md`). Save trainer feedback with **Apply to all users** checked.

Eval fixtures: `knowledge-base/examples/` and `src/lib/knowledgeBaseRouter.test.ts`.
