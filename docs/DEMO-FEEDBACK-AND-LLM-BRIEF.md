# First Demo — Front-End Complete & Next Steps (LLM & Cloud)

**Prepared for:** Stakeholder / advisor feedback and LLM decision support  
**Project:** ShiftED AI — Empathy Coach (practice-based training, not therapy)

---

## 1. Where we are: first demo ready

I’ve finished the **front-end and design** for the first demo. You can try:

- **Landing:** gradient theme, “Build empathetic leaders, one conversation at a time”, Short survey + Start with Avatar
- **Avatar session:** abstract avatar, voice controls (mic, mute, speaker, pause), live transcription to verify mic and session
- **Short survey (onboarding):** responses saved to Supabase when signed in
- **Auth:** sign in / sign up (Supabase); session and survey data tied to the user
- **Deployment:** app runs on Netlify with a serverless chat API (LLM replies when `LLM_API_KEY` is set)

**I will send you a link** so you can use the demo and share your feedback (UX, clarity, tone, anything that feels off).

---

## 2. What I’m preparing next: LLM choice & cloud

I’ve prepared a **decision document** ([LLM-AND-CLOUD-DECISION.md](./LLM-AND-CLOUD-DECISION.md)) so we can choose how to power the **voice chat and avatar** in the next phase. I may need your help to decide based on:

- **Open-source vs hosted:** balance of control, cost, and performance
- **Performance:** latency and quality for real-time voice and avatar adaptations
- **Price:** total cost at demo scale and at growth (more users, more practice sessions)
- **Cloud and infra:** e.g. **AWS** (or similar) if we run our own model — storage, compute, and what’s needed to run an open-source LLM in the cloud

The document covers:

1. **LLM options** — Hosted APIs (OpenRouter, Groq, Together, Gemini, etc.) with performance and price; open-source models (Llama, Mistral) and what we’d need to run them ourselves.
2. **What we need to run a model in the cloud** — Cloud storage (e.g. AWS S3), GPU compute (EC2/RunPod), vLLM, and APIs/security.
3. **Recommendation** — A suggested path for the first production voice chat and avatar (hosted vs self-hosted, rough cost and effort).

---

## 3. What I need from you

- **Feedback on the demo** once you have the link (flow, design, clarity, anything to improve).
- **Input on priorities** for the LLM decision. Please pick one or more from this list (or add your own):
  - **Lowest cost first** — e.g. Groq or OpenRouter free tier; minimise spend at demo and early growth.
  - **Best quality for voice/avatar** — e.g. Claude, Gemini, or OpenAI; prioritise latency and nuance over cost.
  - **Full control, OK with more setup** — e.g. AWS or RunPod, open-source model, fine-tuning later; we manage infra.
  - **Open-source only** — no proprietary APIs; we run our own model in the cloud.
  - **Compare many models before committing** — e.g. OpenRouter to try Gemini, Claude, Llama, then choose.
  - **Fine-tuning on our data later** — e.g. Together (hosted fine-tuning) or self-hosted (LoRA on our conversations/surveys).
  - **Must use a specific cloud** — e.g. AWS only, or another provider (say which).
  - **Strict data sovereignty / GDPR** — data and model in our chosen region; may favour self-hosted.
- **Any other constraints** (e.g. budget cap, timeline, or compliance requirements).

---

## 4. Reference docs in this repo

These support the LLM and cloud discussion; I can share or summarise them as needed:

| Doc | Purpose |
|-----|--------|
| **`LLM-AND-CLOUD-DECISION.md`** | **Decision doc: LLM options, cloud (AWS) needs, recommendation for voice/avatar** |
| `LLM-OPTIONS-COMPARISON.md` | Hosted vs open-source LLM comparison, pricing, decision framework |
| `LINK-CLOUD-LLM.md` | Step-by-step: hosted API (Groq, Together, OpenRouter) and self-hosted (AWS/RunPod, vLLM) |
| `OPEN-SOURCE-LLM-FULL-CONTROL.md` | Running open-source LLM in the cloud (RunPod/EC2, vLLM, fine-tuning, cost notes) |
| `VOICE-OPTIONS-COMPARISON.md` | TTS/STT and voice options for avatar and voice chat |
| `TEST-LLM-AND-VOICE.md` | How to test LLM and voice locally and on Netlify |

Once you’ve tried the demo and shared your priorities, we can lock the LLM choice and cloud approach (including AWS storage and compute) in the decision document.
