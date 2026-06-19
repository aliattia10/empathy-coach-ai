# Super Prompt — LLM Engine Phases (Adaptive Escalation Loop)

Aligned with *Changes needed for the LLM Engine* PDF. Live wiring:

| Piece | Location |
|-------|----------|
| Phase 1–3 workflow | `skills/llmEnginePhases.cjs` → `formatLlmEnginePhasesForPrompt()` |
| Journey state (Phase 2/3) | `skills/journeyContext.cjs` + `chat_sessions` columns via `20260601120000_chat_session_journey_state.sql` |
| Skills deployment | `skills/skillsLibrary.cjs` → `formatSkillsForPrompt()` |
| Chat injection | `buildChatSystemContent()` + `journeyContext` from `AvatarSessionPage` |
| State inference | `src/lib/journeyInference.ts` updates session after each turn |

## First LLM change — Phase architecture

### Core philosophy
**Adaptive Escalation Loop:** progression is never one-way. Failure or high stress in Phase Three → halt → Sustainability Pivot (Core Skills) → Architectural Backtrack (Phase One) → Re-activation (Phase Two).

### Phase One — Diagnostic intake
1. **Step 1.1 Scenario extraction** — one concrete situation; stored as `presenting_challenge`.
2. **Step 1.2 Component breakdown** — situation → trigger → rules → beliefs → strength 0–100% → coping; tracked via `phase_one_step` and `belief_strength_pct`.
3. **Step 1.3 Reflective Handshake (gate)** — summary; `phase_one_confirmed` must be true before Phase Two.

### Phase Two — Micro-goals
1. **Target outcome**
2. **Socratic micro-stepping** — BA, time blocks, boundary communication
3. **Safety-check** — confidence 1–10 for tomorrow; if &lt; 7, shrink the step

### Phase Three — Every login
1. **Check-in** — progress on Phase Two plan
2. **Success** → next micro-goal | **Failure/stress** → Sustainability Pivot Loop
3. **Sustainability Pivot** — Core distancing tools (`sustainability_pivot_active`)
4. **Architectural Backtrack** — update assumptions (`architectural_backtrack_active`)
5. **Re-activation** — adjusted Phase Two step after stabilisation

## Second LLM change — Multiple journeys

- Users choose from a **journeys dashboard** on login (`JourneysDashboardPage.tsx`) — continue an existing thread or start a new one.
- Each journey is a separate coaching thread with its own phase state (stored on `chat_sessions`).
- **Auto-naming:** default title "New journey"; AI renames from the topic after the user shares enough context (`suggestJourneyTitle` + `/api/chat` mode `name_journey`). Users can rename manually on the dashboard.
- LLM system prompt: no in-chat session picker; resume the opened journey with check-in when history exists.

## Deploy checklist

1. Run Supabase migrations (in order):
   - `20260601120000_chat_session_journey_state.sql`
   - `20260602120000_skills_phase_alignment.sql`
2. Push `main` and redeploy Netlify.
3. Test new user: Phase One intake → Reflective Handshake before goals.
4. Test returning user with micro-goal: welcome asks for progress check-in.
5. Test failure path: user reports step failed → pivot flag in Progress panel.

## UI (latest)

- **Journeys dashboard** at `/testing/journeys` — list, create, rename, delete
- **Phase stepper** in session header (Understanding → Action planning → Sustainability)
- **Journey list** shows current phase per thread
- **Welcome message** adapts to journey state when opening an empty thread
- **Regenerate** includes `journeyContext` for phase-aware rewrites
