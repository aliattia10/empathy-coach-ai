# Super Prompt — ShiftED AI weekly meeting (15 July 2026)

**Source:** Gemini notes — *Shifted AI weekly meeting – 2026_07_15 13:30 CEST*  
**Prepared by:** Ali Attia (implementation brief)  
**Audience:** Developers + trainers (Simon, Louise, Kara, Joshua)

Use this document as the **single source of truth** for what the 15 Jul meeting decided. Code and UI work should map to the IDs below.

---

## Decisions (aligned)

### D1 — Sequential tick-box AI structure (core engine)

**Problem:** AI becomes repetitive / confused when it revisits earlier stages.

**Rule:** The coach works **one current stage / one active ladder step** at a time.

- Do **not** re-open completed Phase One conceptualisation once the handshake is confirmed (unless Sustainability Pivot / Architectural Backtrack requires it).
- Do **not** re-ask Goal or already-agreed major Steps.
- Work the **active sub-step only**; after the user ticks it on Tasks, move to the next sequential item.
- On failure: mini-conceptualisation → HCPR (unless flooded) → retry the **same** step — do not invent a new topic.

**Code map:** `skills/coachSystemPrompt.cjs`, `skills/llmEnginePhases.cjs`, `skills/progressDashboard.cjs`, `skills/skillsLibrary.cjs` (Sustainability Pivot).

### D2 — UI: guidance widget + sustainability path

**Layout decision:** The product UI must show:

1. **Guidance widget (steps)** — visible checklist / tick-box of the Goal ladder (major steps + sub-steps) so users see where they are and can compare before/after (e.g. belief ratings when introduced).
2. **Sustainability path component** — when a step fails or the user is stuck, surface that the coach is in the recovery path (mini-conceptualisation → HCPR / core skills), not a random new topic.

**Priority from meeting:** Perfect the **core engine** before a “revolving door” / tab-cycling stage navigator (Joshua’s idea — deferred).

### D3 — Weekly Tuesday testing

Recurring **Tuesday** internal testing to manage re-training cycles after platform updates.  
Owners: Simon + Louise schedule; whole group tests after Ali deploys.

### D4 — Downloadable transcript (frontend)

Trainers/learners need a **download transcript** control on the frontend so feedback and training data are not lost when engines change.

**Status note:** PDF/TXT export already exists for trainers (`TrainerSessionTools`), journeys dashboard, and `/adminchat`. Confirm whether learners also need a one-click download in the live session chrome.

---

## Next steps from notes (owners)

| Owner | Action | Product impact |
|-------|--------|----------------|
| Ali | Connect 4 external calendars (Spinella / reservation rebrand) | Blocked until Joshua adds calendar links on Trello |
| Joshua | Add calendar links/details to Trello | Unblocks Ali |
| Ali | Share calendar access with Joshua | Ops |
| Ali | Implement platform steps + docs by Mon (Fri stretch) | D1 + D2 + docs |
| Ali | Add downloadable transcript on frontend | D4 |
| Simon | Copy training feedback into a document | Training backup |
| Simon | Confirm Tuesday meeting time | D3 |
| Group | Test after Ali ships | QA |

**Also discussed (not a formal Decision bullet):** Friday test to verify automation + add **Italian** and **German** language options. Admin panel work continues in parallel.

**Out of scope for Ali this cycle:** Karen Cody outreach (Joshua).

---

## Super prompts to implement (checklist)

### SP-A — Sequential stage lock (prompt)

Inject into live coach prompt:

```
# Sequential stage lock (15 Jul 2026)
- Focus ONLY on the current protocol stage and the single active ladder sub-step.
- Never revisit completed steps or re-ask confirmed Goal / major Steps.
- Never restart Phase One after handshake unless Sustainability Pivot / backtrack is active.
- One question per turn; acknowledge the user's last answer, then advance — do not rephrase the same question.
```

### SP-B — Sustainability path (prompt + UI)

Prompt already covers mini-conceptualisation → HCPR.

**Miro layout (source of truth for placement):**
- Chat in the **center**
- **The Sustainability Path** as a **right-hand vertical map** with numbered circular nodes
- Nodes unlock as the user progresses; click opens a skill pop-up
- When the user hits a setback, the AI plugs these path skills so they can continue

**Code:** `src/components/journey/SustainabilityPathPanel.tsx` on `AvatarSessionPage` (lg right rail; stacked on mobile).

**Editable path (20 Jul):** each step can be **dragged / moved ↑↓** and **marked complete**. Same controls on Tasks. Persisted via `chat_sessions.sustainability_path` (+ localStorage fallback). Migration: `supabase/migrations/20260720190000_sustainability_path_jsonb.sql`.

**Full-bleed session:** chat + path use the full main width (no `max-w-6xl` gutters on `/testing/avatar/session/*`).

Default path nodes (Miro):
1. Self-Reflection and journaling
2. Mindfulness Exercise
3. Gratitude and Meditation
4. Social Interaction Logs

### SP-C — Guidance widget (UI)

- **Chat:** compact strip under `PhaseStepper` (`GuidanceLadderWidget` variant=`compact`).
- **Tasks:** full widget above the tickable task list (`variant=`full`).
- Belief **before → now** comparison when a rating exists (locked on first record).
- Session milestones from `phase_checklist`.
- No revolving-door stage tabs (deferred).

### SP-D — Transcript download (UI)

Ensure download is obvious on the surfaces trainers use for feedback (session + journeys + admin). Extend to learner session only if product asks.

### SP-E — Languages IT / DE (product)

Add Italian and German as coach / UI language options after EN/FR path is stable. Coordinate with admin translate targets (`adminTranslate.cjs`).

### SP-F — Calendars (integration)

Four external calendars → reservation / Spinella system. **Do not start** until Trello links exist.

---

## Acceptance criteria (Ali ship)

1. Coach prompt enforces sequential stage lock (no re-loop on completed steps).
2. Goal ladder remains tickable; failure path uses mini-conceptualisation → HCPR.
3. Docs updated: this file + backlog timeline reflecting 15 Jul.
4. Transcript download reachable without hunting (trainer/admin minimum).
5. Admin panel usable by all `@admin.com` trainers; translation default **English**.
6. Calendar work explicitly blocked pending Joshua.

---

## Team comments

**Priority order for this week:** _______________________________________________

**Defer:** _______________________________________________
