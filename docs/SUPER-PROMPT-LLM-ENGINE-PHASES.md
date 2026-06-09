# Super Prompt — LLM Engine Phases (Adaptive Escalation Loop)

Aligned with *Changes needed for the LLM Engine* PDF. Live wiring:

| Piece | Location |
|-------|----------|
| Phase 1–3 workflow | `skills/llmEnginePhases.cjs` → `formatLlmEnginePhasesForPrompt()` |
| Skills deployment | `skills/skillsLibrary.cjs` → `formatSkillsForPrompt()` |
| Chat injection | `buildChatSystemContent()` in `netlify/functions/chat.js` and `server/server.js` |

## First LLM change — Phase architecture

### Core philosophy
**Adaptive Escalation Loop:** progression is never one-way. Failure or high stress in Phase Three → halt → Sustainability Pivot (Core Skills) → Architectural Backtrack (Phase One) → Re-activation (Phase Two).

### Phase One — Diagnostic intake
1. **Scenario extraction** — primary challenge in detail.
2. **Core component breakdown** — rules/assumptions, intermediate beliefs, strength of belief (0–100%), automatic coping response.
3. **Reflective Handshake (gate)** — jargon-free summary; user must explicitly confirm before Phase Two.

### Phase Two — Micro-goals
1. **Target outcome**
2. **Socratic micro-stepping** — BA, time blocks, boundary communication
3. **Safety-check** — confidence 1–10 for tomorrow; if &lt; 7, shrink the step

### Phase Three — Every login
1. **Check-in** — progress on Phase Two plan
2. **Success** → next micro-goal | **Failure/stress** → Sustainability Pivot Loop
3. **Sustainability Pivot** — Core distancing tools (not more BA)
4. **Architectural Backtrack** — update Phase One assumptions
5. **Re-activation** — adjusted Phase Two step after stabilisation

## Second LLM change — Single journey

- Removed standalone **Difficult Conversations** scenario card (`ScenarioSelector.tsx`).
- Each chat thread is one continuous journey (GPT-style return); initial message and system prompt enforce check-in on resume.
- Session list in the UI remains for multiple **topics** — not separate “difficult conversation” simulations per login.

## Deploy checklist

1. Push `main` and redeploy Netlify.
2. Test new user: Phase One intake → Reflective Handshake before goals.
3. Test returning user with history: Phase Three check-in first.
4. Test failure path: user reports step failed → distancing skill, not pushed BA.
