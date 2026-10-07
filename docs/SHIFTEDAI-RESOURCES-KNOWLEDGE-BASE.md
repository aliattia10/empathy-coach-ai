# ShiftED AI Resources — Knowledge Base

Implements Simon Agnew’s **Skills and Knowledge Base** architecture (5 layers) as atomic retrieval docs plus a rule-based skill router. Content is adapted from the ShiftedAI Resources Drive folder (264 files); PositivePsychology.com material is paraphrased with attribution — not pasted verbatim.

## Layout

```
knowledge-base/
  frameworks/     # theory summaries (CBT, stress, PP, ACT, grief, worry)
  skills/         # SKILL.md + techniques.md + examples.md per skill area
  protocols/      # crisis-response first, then scope / safeguarding / escalation
  workbooks/      # practice outlines the coach can retrieve
  resources/      # UK crisis lines, NHS CNTW titles, audio TODO, clinical OOS
  personas/       # default + workplace framing
  cultural-context/
  examples/       # Tim / Jordan / panic fixtures
  index.json      # front-matter index for runtime matching
```

Every markdown doc has YAML front-matter: `id`, `layer`, `category`, `intent-triggers`, `emotion-triggers`, `skill-dependencies`, `last-reviewed`, plus `source` attribution.

Three doc types stay separate: **framework**, **skill**, **protocol**.

## Runtime loader / router

- Module: `skills/knowledgeBase.cjs` (also mirrored index at `skills/knowledge-base-index.json` for Netlify bundling).
- `routeSkills(text)` → up to 2 skill ids, or `protocol-crisis-response` on suicidal/self-harm language.
- `retrieveKnowledge(text)` → top-N docs by trigger match.
- `formatKnowledgeForPrompt(text, { condensed })` injects a **compact** hint into the system prompt (never full worksheets).
- Wired via `buildProductionSystemPrompt({ latestUserMessage })` from `netlify/functions/chat.js` and `server/server.js`.

**RunPod ~4k budget:** condensed mode stays short; workbook catalogue collapses to id list; KB injects at most one compact line.

## How to add a doc

1. Add `knowledge-base/.../your-doc.md` with front-matter.
2. Run `node scripts/generate-knowledge-base.cjs` if regenerating bulk scaffolds, or manually append to `knowledge-base/index.json`.
3. Copy `knowledge-base/index.json` → `skills/knowledge-base-index.json`.
4. Add router cues in `INTENT_TO_SKILLS` / triggers if needed.
5. Keep adapted summaries only; note `source:` to the inventory path.
6. Run `node scripts/check-context-budget.cjs`, `npm test`, `npm run lint`, `npm run build`.

## Crisis first

`protocols/crisis-response.md` is non-negotiable. The bot **signposts** (Samaritans, NHS 111/24, Mind, SHOUT, PAPYRUS HOPELINE247) and may mention a HOPEBOX idea — it **never** runs Stanley-Brown clinical safety planning.

## Related

- Skills catalogue: `skills/skillsLibrary.cjs` + `src/types/skills.ts`
- Workbooks: `skills/workbooksLibrary.cjs` + `src/lib/workbooks.ts`
- Migration (file only): `supabase/migrations/20261006200000_shiftedai_resources_skills_workbooks.sql`
- Infographics: `public/infographics/*.webp`
