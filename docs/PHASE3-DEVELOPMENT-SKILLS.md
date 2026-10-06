# Phase 3 — Development Skills (Integration & Action)

Implements Louise Davies’ **ShiftED AI Spec V1** practice layer on top of the existing coach (Phases 1–2 unchanged), expanded with **ShiftedAI Resources** wellbeing / values / stress / grief workbooks (see `docs/SHIFTEDAI-RESOURCES-KNOWLEDGE-BASE.md`).

## Data model choice

**`public.workbooks`** catalogue with optional `skill_id` → `public.skills`, rather than overloading CBT-style skills rows.

- Spec EI categories (Active Listening, Empathy, …) plus new categories: Wellbeing & Resilience, Values & Strengths, Stress & Regulation, Grief & Loss.
- Workbooks carry `duration_min`, `level`, and `body` (steps/prompts) without polluting the engine skills table.
- Coach recommendations must use catalogue ids only (`[[WORKBOOK]]{"id":"wb_…"}[[/WORKBOOK]]`).
- Optional `image` paths under `/infographics/*.webp` render on `WorkbookDetailPage`.

## Migration order

1. Apply existing migrations through `20261006141000_user_consents.sql` if not already.
2. Apply `20261006120000_phase3_development_skills.sql`.
3. Apply `20261006200000_shiftedai_resources_skills_workbooks.sql` (idempotent upserts of expanded skills + workbooks).

Do not run migrations from CI agents against production without an explicit ops request.

## Feedback Loop (product TBD)

Minimum wire: completed workbooks + recent reflections are injected into `practiceState` on the journey context so Phase Three check-ins can reference outcomes. Full “Feedback Loop” product definition remains an open question with Louise/Simon.

## Load sanity (1,000 users)

Method: catalogue is static rows; user tables are RLS-scoped per `user_id` with indexes on `(user_id)` / `(user_id, status)`. No N+1 list of all users. Expected bottleneck remains RunPod cold start (30s–3 min), not Postgres for 1k registered users. Concurrent chat still gated by Netlify function + LLM capacity — confirm latency target with product.
