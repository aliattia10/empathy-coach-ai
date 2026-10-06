# Phase 3 — Development Skills (Integration & Action)

Implements Louise Davies’ **ShiftED AI Spec V1** practice layer on top of the existing coach (Phases 1–2 unchanged).

## Data model choice

**`public.workbooks`** catalogue with optional `skill_id` → `public.skills`, rather than overloading CBT-style skills rows.

- Spec EI categories (Active Listening, Empathy, …) differ from Core/Development Activation skills (Distancing, HCPR, BA…).
- Workbooks carry `duration_min`, `level`, and future `body` without polluting the engine skills table.
- Coach recommendations must use catalogue ids only (`[[WORKBOOK]]{"id":"wb_…"}[[/WORKBOOK]]`).

## Migration order

1. Apply existing migrations through `20260720190000_sustainability_path_jsonb.sql` if not already.
2. Apply `20261006120000_phase3_development_skills.sql`.

## Feedback Loop (product TBD)

Minimum wire: completed workbooks + recent reflections are injected into `practiceState` on the journey context so Phase Three check-ins can reference outcomes. Full “Feedback Loop” product definition remains an open question with Louise/Simon.

## Load sanity (1,000 users)

Method: catalogue is 8 static rows; user tables are RLS-scoped per `user_id` with indexes on `(user_id)` / `(user_id, status)`. No N+1 list of all users. Expected bottleneck remains RunPod cold start (30s–3 min), not Postgres for 1k registered users. Concurrent chat still gated by Netlify function + LLM capacity — confirm latency target with product.
