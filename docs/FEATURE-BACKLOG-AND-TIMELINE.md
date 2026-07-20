# ShiftED AI — Feature Backlog and Timeline (plain language)

**Meetings:** ShiftED AI weekly, 8 July 2026 · updated 15 July 2026  
**Prepared by:** Ali Attia  
**For:** Whole team — what is done, what is left, and in what order  
**Method:** Cross-checked Miro dashboard, live product, and meeting decisions. Ordered so backend work unlocks frontend work.  
**Excluded:** External UI contractor scheduling (per team instruction).  
**15 Jul super prompt:** `docs/SUPER-PROMPT-JUL15-MEETING.md`

**Legend:** Done · In progress · Not started

---

## How to read this document

Each item explains **what the user or trainer will experience** when it is finished — not internal code names. Dates are targets for planning; shift if review or testing takes longer.

---

## Priority 1 — Coach brain and protocol (this week)

These items control **what the AI says** and **in what order**. Everything else depends on this being right.

| ID | What it means for users | Owner | Status | Target |
|----|-------------------------|-------|--------|--------|
| **P1.1** | Coach must agree a **clear goal and key steps** before homework, skills, or "try this tomorrow" — fixes Simon's "no direction" issue | Ali | In progress | 8–9 Jul |
| **P1.2** | Coach sounds **human and plain** — mirrors how the user writes; no "psychological safety" language | Ali | In progress | 8–9 Jul |
| **P1.3** | **Full knowledge base protocol** (separate PDF) sent for team review and comments | Ali → Group | In progress | Review by 10 Jul |
| **P1.4** | **Friday walkthrough** — Kara leads: step through LLM protocols and system steps live | Kara | Not started | 11 Jul |
| **P1.5** | Simon sends **screenshots + specific feedback** on live coach replies by email | Simon | Not started | Ongoing |
| **P1.6** | **Sequential stage lock** — AI stays on current tick-box step only; no re-loop (15 Jul) | Ali | In progress | 15–21 Jul |
| **P1.7** | **Guidance widget + sustainability path UI** — visible ladder + recovery path when stuck (15 Jul) | Ali | Done | 20 Jul |
| **P1.8** | **Transcript download** obvious for all users (PDF/TXT) — training backup (15 Jul) | Ali | Done | 20 Jul |
| **P1.9** | **Italian + German** language options (15 Jul Friday test mention) | Ali | Deferred | — |
| **P1.10** | **4 calendars** → Spinella / reservation (blocked on Joshua/Trello) | Ali | Deferred | — |

**Why this order:** Stages first, then tone, then skills — meeting decision. Changing all three at once causes rework.

**15 Jul:** Core engine before “revolving door” stage tabs. Tuesday weekly testing with Simon/Louise.

**After deploy:** Netlify must redeploy for live site to change. Pushing to GitHub alone is not enough.

---

## Priority 2 — Journeys, tasks, and progress (mostly built; UI gaps remain)

| ID | What it means for users | Owner | Status | Target |
|----|-------------------------|-------|--------|--------|
| **P2.1** | **Multiple journeys** — user picks or starts a topic thread from a dashboard (like separate chats) | Ali | Done | Shipped |
| **P2.2** | **Tasks page per journey** — coach-suggested actions + user-added tasks; tick off when done | Ali | Done | Shipped |
| **P2.3** | **Session milestones panel** — auto-tracked protocol steps (e.g. "situation mapped", "goal agreed") visible in session | Ali | In progress | Mid Jul |
| **P2.4** | **Survey and analytics pages wired** — onboarding wellbeing check and dashboard reachable from app menu (built but not linked) | Ali | In progress | Mid Jul |
| **P2.5** | **Progress across all journeys** — one page showing overall completion, not only per journey | Ali | Not started | Late Jul |

**Meeting note (8 Jul):** Dashboard and manual tasks work. The "third step" still pending = **milestone checklist UI** in the session so users see protocol progress, not only action tasks.

**User flow today:**

1. Login → Journeys list  
2. Open journey → Tasks workspace  
3. Open chat → Coach conversation  
4. Return → Tasks show tickable steps coach agreed  

---

## Priority 3 — Trainer quality loop (Simon shapes everyone)

| ID | What it means for users | Owner | Status | Target |
|----|-------------------------|-------|--------|--------|
| **P3.1** | When Simon saves feedback on a reply, **all users** get that behaviour on the next message | Ali | Done | Shipped |
| **P3.2** | Simon can **star** excellent replies; AI copies tone for everyone | Ali | Done | Shipped |
| **P3.3** | After protocol is signed off, **retrain AI model** on Simon-reviewed conversations so style is baked in | Ali | In progress | After P1 review |
| **P3.4** | **Side-by-side test** — fine-tuned model vs fast cloud model; Simon picks quality winner | Simon + Ali | Not started | Aug |

**Trainer tip:** Regenerate is preview only. Save feedback to affect Nikki and all trainees.

**Before retrain:** Export training data — expect **100+ conversation examples**, not a handful.

---

## Priority 4 — Voice and avatar (after protocol stable)

| ID | What it means for users | Owner | Status | Target |
|----|-------------------------|-------|--------|--------|
| **P4.1** | Reliable **cloud AI** in production (RunPod or Groq) with same coach rules | Ali | In progress | Ongoing |
| **P4.2** | **Speak instead of type** — microphone transcribed to text for the coach | Ali | In progress | Shipped (basic) |
| **P4.3** | **Natural voice out** — professional TTS instead of browser robot voice | Ali | Not started | Aug |
| **P4.4** | **Visible avatar** with lip-sync when coach speaks | Ali | Not started | Sep+ |
| **P4.5** | **Roleplay mode** — e.g. "Alex" character reacts to manager; separate from empathy coach | Ali | Not started | Sep+ |

**Miro vision:** Conversation avatar shows emotional reactions; reflection on alternative responses; understand emotional impact. Today chat works without a face on screen.

---

## Priority 5 — Platform features from Miro roadmap

| ID | What it means for users | Owner | Status | Target |
|----|-------------------------|-------|--------|--------|
| **P5.1** | **Quick wellbeing check** on login — managing people? comfort with feedback? struggle areas? → recommends scenarios | Ali | In progress | Mid Jul |
| **P5.2** | **Recommended training paths** from survey answers into suggested journeys | Ali | Not started | Aug |
| **P5.3** | **Analytics dashboard** — Emotional Skills, Development, Understanding tracked over time | Ali | Not started | Aug+ |
| **P5.4** | **Automatic feedback scores** — empathy detected, validation 0–5, curiosity, defensiveness (Miro behaviour design) | Ali | Not started | Aug+ |
| **P5.5** | **Reflection tool** — review alternative responses to a situation | Ali | Not started | TBD |
| **P5.6** | **Admin screen to edit skills** in database without code changes | Ali | Not started | Aug (after KB approved) |

**Miro survey flow (target):**

1. Are you currently managing people? Yes / No  
2. How comfortable giving feedback? Very / Somewhat / Not much  
3. What situations do you struggle with? (negative feedback, conflict, boundaries, distress, remote difficult conversations)  
4. → Recommended training scenarios  

---

## Priority 6 — Operations (other owners)

| ID | What | Owner | Status |
|----|------|-------|--------|
| **P6.1** | Marketing website improvements | Louise | In progress |
| **P6.2** | Supabase technical issues (paused work briefly) | Louise | In progress |
| **P6.3** | £10,000 transfer documentation formalised | Kara + Louise | Done (8 Jul) |

---

## Suggested calendar (Ali — coach and platform)

| Week | Focus |
|------|--------|
| **8–11 Jul** | Detailed protocol PDFs; team review; deploy prompt changes; Friday walkthrough with Kara |
| **14–18 Jul** | Milestone checklist UI; wire survey/dashboard routes; Simon testing round |
| **21–25 Jul** | Retrain model if prompts stable; wellbeing survey on login path |
| **August** | Production voice; scenario recommendations; analytics foundation |
| **September+** | Avatar, roleplay scenarios (Alex), JSON scoring |

---

## Miro board → what exists today

| Miro idea | Backlog | Reality today |
|-----------|---------|---------------|
| Sign in and accounts | — | Working |
| Multiple journeys / threads | P2.1 | Working |
| Checklist and to-do | P2.2, P2.3 | Tasks work; milestone UI partial |
| Phase 1–2–3 coach engine | P1.1 | Working; goal gate strengthened Jul 2026 |
| Skills library | P1 + P5.6 | In AI instructions; admin edit not built |
| Three scenario avatars | P4.5, P5.2 | Not built — cards exist in old UI only |
| Conversation avatar face | P4.4 | Placeholder only |
| Reflection and feedback tools | P5.4, P5.5 | Not built |
| Platform analytics (3 emotional areas) | P5.3 | Old dashboard page not linked in app |
| Wellbeing check on login | P5.1 | Survey built; not on main path |
| AI empathy via prompt + fine-tune | P3.3, P4.1 | Prompt live; fine-tune pipeline ready |

---

## EI Learning Loop (product north star)

How the full product should feel over time:

1. **Trigger** — user logs a real situation  
2. **Socratic exploration** — coach understands (Phase 1–2)  
3. **Insight** — user confirms summary + goal  
4. **Practice** — small actions; later roleplay  
5. **Feedback** — trainer + automated scores  
6. **Reinforcement** — check-ins, habits, analytics  

We are strongest on steps 1–3 in chat today. Steps 4–6 need tasks UI completion, voice/avatar, and analytics.

---

## Weekly review habits

- **Weekly meeting:** Triage this backlog + Simon's latest screenshots  
- **After any coach rule change:** Redeploy hosting → test one message as Simon and one as Nikki  
- **Before model retrain:** Confirm training export has 100+ examples  

---

## Team comments (write here)

**Add / reprioritise:** _______________________________________________

**Remove / defer:** _______________________________________________

**Owner changes:** _______________________________________________

---

*ShiftED AI · Feature backlog and timeline · July 2026*
