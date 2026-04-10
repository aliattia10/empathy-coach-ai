# ShiftED AI — Platform Overview (for Marketing Planning)

**Purpose:** Single-page snapshot of what ShiftED AI is, who it serves, how it works, and how to talk about it—so you can build campaigns, pitch decks, and partner briefs without re-reading the codebase.

**Last updated:** March 2026

---

## 1. Elevator pitch

**ShiftED AI** is a **practice-based empathy training platform** for **first-time managers** and leaders who must deliver **difficult feedback**, **navigate conflict**, and **communicate with clarity and care**. Users rehearse realistic conversations with an **AI coach** that uses **Socratic questioning** (not prescriptive advice) to surface blind spots and build skill—**not therapy**.

---

## 2. Problem we address

| Pain | Why it matters |
|------|----------------|
| **Feedback anxiety** | Managers delay or avoid hard conversations; relationships and performance suffer. |
| **Skill gap** | “Soft skills” are rarely taught with safe, repeatable practice. |
| **Generic training** | Workshops don’t stick without rehearsal in realistic scenarios. |
| **Risk of harm** | Poorly delivered feedback damages trust and psychological safety. |

**Positioning line:** *Build empathetic leaders, one conversation at a time.*

---

## 3. Who it’s for (ICP)

**Primary**

- **New managers** (first 12–24 months in role)
- **HR / L&D** piloting manager development or empathy/communication programs
- **Founders and team leads** in high-growth startups where informal feedback is constant

**Secondary**

- Coaches and facilitators who want a **digital practice layer** between sessions
- Universities and bootcamps teaching leadership or organizational behavior

**Not the primary audience (but adjacent)**

- Clinical mental health (explicitly **out of scope**—see Safety)

---

## 4. What the product does (user-facing)

1. **Landing experience** (`/`) — Brand story, value proposition, entry to the product.
2. **Authenticated experience** (`/testing/...`) — Core training flow behind login (data collection and saved sessions).
3. **Guided conversation session** — User describes a real workplace situation; the AI responds as a **professional coaching simulator** using structured phases: context → assumption testing → skill-gap reflection.
4. **Voice + text** — Users can speak (where supported) and type; live transcription supports accessibility and “did the mic work?” checks.
5. **Session memory** — Users can **continue the last session** or **start a new one** so conversations persist for practice continuity and **future model training**.
6. **Safety** — Crisis language triggers a fixed escalation message and stops the simulation; product copy reinforces **training, not therapy**.

---

## 5. Core value proposition (messaging pillars)

Use these as campaign themes and headline tests:

| Pillar | Message idea |
|--------|----------------|
| **Practice, not theory** | Rehearse the conversation before it happens for real. |
| **Empathy + clarity** | Balance care with directness—aligned with modern leadership expectations. |
| **Self-insight** | Socratic coaching reveals assumptions, triggers, and language habits. |
| **Psychological safety** | Train in a low-stakes space; reduce harm in high-stakes meetings. |
| **Data-informed improvement** | (Roadmap) Conversations can inform better coaching and, over time, **custom models** trained on consented data. |

---

## 6. Differentiators (honest, defensible)

- **Socratic coach persona** — Avoids “giving the answer”; drives reflection (aligned with adult learning).
- **Scenario-grounded** — Tied to *observable behavior*, goals, and professional context—not generic chat.
- **Explicit non-therapy positioning** — Clear guardrails and crisis handling.
- **Open architecture for growth** — Supabase for accounts and chat data; cloud LLM today; path to **own GPU training** (RunPod/AWS) and **fine-tuned open models** later.

---

## 7. User journey (simplified funnel)

```text
Awareness → Landing (/) → Sign in / Sign up → Avatar session (/testing/avatar/session)
    → Continue or new session → Multi-turn dialogue → Saved transcript (Supabase)
```

**Marketing touchpoints to align**

- Landing CTA copy and creative
- Email / LMS invite (“why practice conversations matter”)
- Post-signup onboarding (first session in under 5 minutes)
- Retention: “continue last session” = habit loop

---

## 8. Technical footprint (for credibility, not detail)

| Layer | Role |
|-------|------|
| **Frontend** | React (Vite), responsive UI, voice and chat UI |
| **Hosting** | Netlify (static app + serverless `/api/chat`) |
| **Auth & data** | Supabase (users, chat sessions, messages) |
| **AI** | Groq / OpenRouter (today); optional **self-hosted vLLM** on **AWS or RunPod** for custom models later |

*See also:* `docs/CLOUD-INSTALLATION-AND-PRICING.md`, `docs/CLOUD-GPU-INSTALL-AWS-RUNPOD.md`

---

## 9. Safety, ethics, and compliance (talk track)

- **Not therapy, not clinical care.** Position as **professional skills training**.
- **Crisis handling:** If user content indicates self-harm, suicide, or severe crisis, the product returns a **fixed support message** and stops the simulation.
- **Data use for training:** Any use of real chats for model training should follow **clear consent**, retention policy, and anonymization—document separately for legal review.

---

## 10. Product state vs roadmap (for honest marketing)

**Today (typical)**

- Live web app, login, avatar session, voice/text, Supabase persistence, LLM via API.

**Near-term (story for “why now”)**

- Stronger analytics for L&D (completion, themes, skill tags)
- Richer scenario library and reporting

**Longer-term (vision)**

- **Fine-tuned open-source models** on organization-specific or consented data
- Deeper integrations (LMS, HRIS, SSO)

---

## 11. Competitive landscape (categories, not names)

Place ShiftED AI in **manager development + conversation practice**, alongside:

- **Generic AI chat** — ShiftED is **structured coaching simulation**, not open-ended Q&A.
- **Content libraries** — ShiftED emphasizes **behavior rehearsal**, not only videos.
- **Role-play workshops** — ShiftED scales **practice** asynchronously and repeatedly.

---

## 12. Marketing KPIs to plan around

| Funnel stage | Example metrics |
|--------------|-----------------|
| Awareness | Site visits, CTA clicks, content engagement |
| Activation | Sign-ups, first session started within 24h |
| Engagement | Sessions per user per week, “continue session” rate |
| Quality | Session length, return rate, NPS or in-app thumbs |
| Business | Pilot conversion, seats sold, expansion |

---

## 13. Sample messaging blocks (copy-ready)

**Headline options**

- *Practice the conversation you’ve been avoiding.*
- *Feedback without the fallout—rehearse first.*
- *Empathy is a skill. Train it like one.*

**Subcopy**

- *ShiftED AI helps managers prepare for difficult professional conversations with guided, reflective practice—not therapy.*

**CTA**

- *Start a practice session* / *Sign in to train*

---

## 14. Related internal docs

| Doc | Use |
|-----|-----|
| `README.md` | Repo structure and run instructions |
| `docs/ENV-VARIABLES-AND-NETLIFY.md` | Deploy and env configuration |
| `docs/CLOUD-INSTALLATION-AND-PRICING.md` | Cloud costs for planning |
| `docs/CLOUD-GPU-INSTALL-AWS-RUNPOD.md` | Own-GPU training path |
| `docs/HOW-TO-START-TRAINING-THE-MODEL.md` | Data + fine-tuning narrative |

---

## 15. One-line summary for decks

**ShiftED AI** helps managers **rehearse difficult workplace conversations** with an **AI coaching simulator** that builds **empathy, clarity, and psychological safety**—with **saved sessions**, **voice and text**, and a path to **custom training data and models**.

---

*This document is for planning and messaging alignment; it is not legal or medical advice.*
