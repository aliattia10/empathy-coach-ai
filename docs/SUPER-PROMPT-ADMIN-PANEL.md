# Super Prompt — Admin panel (monitor, feedback, translation)

**Route:** `/adminchat`  
**Audience:** ShiftED trainers with `admin` role (`@admin.com` accounts)

## Access

- Sign in with any trainer admin account (`kara`, `josh`, `simon`, `louise`, `nikki` @admin.com).
- User must have `admin` in `user_roles` (see `supabase/sql/ADMIN_CHAT_SETUP.sql`).
- Page password: `VITE_ADMIN_CHAT_PASSWORD` (second gate after login).

## Admin panel capabilities

1. **Browse users and sessions** — read-only monitor of all learner journeys.
2. **Star exemplar replies** — `admin_quality_star` feeds live coach prompt (see `SUPER-PROMPT-ADMIN-QUALITY-STAR.md`).
3. **Export transcripts** — PDF per session, ZIP per user, ZIP all users.
4. **Translate messages** — for reviewers who need **English** (default) or **French** and other languages.

## Translation super prompt (internal)

Used by `/api/translate` (`skills/adminTranslate.cjs`):

- **Default target:** English (`en`) — not French-only.
- **Source:** Auto-detect, or pick English, French, Spanish, German, Arabic, Icelandic.
- **Output:** Translation only — no commentary, labels, or JSON.
- **Tone:** Preserve coaching empathy and workplace meaning.

### When admins use translation

- User wrote in French → translate to **English** for team review.
- User wrote in English → translate to **French** for bilingual trainers.
- Mixed-language sessions → per-message translate with auto-detect source.

## Trainer feedback language

Feedback text can be written in **English or French** (or both). Global trainer standards are injected into the live coach prompt for all learners.

## Code map

| Piece | File |
|-------|------|
| Admin monitor UI | `src/pages/AdminChatPage.tsx` |
| Admin access helper | `src/lib/adminAccess.ts` |
| Translation client | `src/lib/fetchAdminTranslation.ts` |
| Translation API | `netlify/functions/translate.js` |
| Translation prompt | `skills/adminTranslate.cjs` |
| Quality star | `docs/SUPER-PROMPT-ADMIN-QUALITY-STAR.md` |
