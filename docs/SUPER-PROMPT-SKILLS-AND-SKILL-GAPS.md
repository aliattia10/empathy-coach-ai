# Super Prompt — Skills library and skill-gap detection

Aligned with *Training the LLM to detect skill gaps* (Simon) and **ShiftED AI weekly meeting — 27 May 2026**.

## Decisions reflected

| Decision | Implementation |
|----------|----------------|
| **Core vs Development/Activation** | `core` vs `development_activation` in `skills/skillsLibrary.cjs` |
| **Phase 1 ↔ Phase 3 loop** | System prompt: if skill blocked, return to conceptualisation then practice |
| **Person-centred conceptualisation each session** | Existing Stage 1 / Platform Phase 1 |
| **Challenge avoidance; weak modalities** | Prompt: do not reinforce learning-style excuses |
| **Learning styles shelved** | Explicitly disabled in skill super prompt |
| **Structured data, not info-dump** | JSON module + optional Supabase `skills` table seed |
| **Acronym key** | Injected with library; see `docs/ACRONYM-KEY.md` |

## Live wiring

- **Library:** `skills/skillsLibrary.cjs` → `formatSkillsForPrompt()`
- **Chat API:** `buildChatSystemContent()` in `netlify/functions/chat.js` and `server/server.js` appends **Skills library and gap detection** for **every user**
- **DB (optional):** `supabase/migrations/20260520120000_skills_library.sql` for admin CRUD later

## Trainer workflow

1. Complete Phase 1 conceptualisation with the user.
2. Set goals (Phase 2) when appropriate.
3. When language shows a **gap**, recommend **one** skill from the library by plain name + one question.
4. If they resist, loop to Phase 1 — do not only repeat the skill name.

## Simon / team testing

Skill recommendations must behave the same for Simon, Nikki, and trainees (see `SUPER-PROMPT-TRAINER-GLOBAL-FEEDBACK.md`). Save trainer feedback with **Apply to all users** checked.
