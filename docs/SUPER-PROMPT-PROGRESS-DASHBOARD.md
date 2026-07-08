# Super Prompt — Progress dashboard (goals & checklist)

Each coaching journey has a **Progress** panel in chat with two lists:

| List | Who ticks | Content |
|------|-----------|---------|
| **Session milestones** | Auto only | Personalised protocol steps for this user |
| **Action steps** | User | Concrete tasks from their session |

## Code

| Piece | Path |
|-------|------|
| Super prompt | `skills/progressDashboard.cjs` |
| Milestone sync | `src/lib/phaseChecklist.ts` |
| Action steps | `src/lib/goalExtraction.ts` |
| UI | `src/components/journey/ProgressGoalsPanel.tsx` |
| DB | `user_goals`, `progress_summary`, `phase_checklist` on `chat_sessions` |

## PROGRESS block format

`[[PROGRESS]]{"summary":"...","milestones":[{"key":"situation","title":"Personalised title","phase":1}],"goals":[{"title":"Action they tick off"}]}[[/PROGRESS]]`

Milestone `key` values: situation, triggers_rules, belief_strength, handshake, target_outcome, micro_goal, confidence, check_in, regulate, update_assumptions, reactivate.

Titles must use the user's situation — never generic phase labels.
