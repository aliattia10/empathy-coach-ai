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

I’m preparing a **decision document** so we can choose how to power the **voice chat and avatar** in the next phase. I may need your help to decide based on:

- **Open-source vs hosted:** balance of control, cost, and performance
- **Performance:** latency and quality for real-time voice and avatar adaptations
- **Price:** total cost at demo scale and at growth (more users, more practice sessions)
- **Cloud and infra:** e.g. **AWS** (or similar) if we run our own model — storage, compute, and what’s needed to run an open-source LLM in the cloud

The document will cover:

1. **LLM options**
   - Hosted APIs (OpenRouter, Groq, Together, Gemini, etc.) — performance and price comparison
   - Open-source models (e.g. Llama, Mistral) — how they compare and what we’d need to run them ourselves

2. **What we need to run a model in the cloud**
   - **Cloud storage (e.g. AWS):** where and how we’d store model artifacts, logs, or data if we self-host
   - **Compute:** GPU instances (e.g. AWS EC2 with GPU, or RunPod) to run the model (e.g. vLLM)
   - **APIs and security:** how the app would call the model securely and at what cost

3. **Recommendation**
   - A suggested path for the **first production version** of voice chat and avatar (hosted vs self-hosted, and which model/provider), with rough cost and effort

---

## 3. What I need from you

- **Feedback on the demo** once you have the link (flow, design, clarity, anything to improve).
- **Input on priorities** for the LLM decision: e.g. “lowest cost first” vs “best quality for voice/avatar” vs “we want full control and are OK with more setup (e.g. AWS).”
- **Any constraints** you already have (e.g. must use a specific cloud, or must stay with open-source only).

---

## 4. Reference docs in this repo

These support the LLM and cloud discussion; I can share or summarise them as needed:

| Doc | Purpose |
|-----|--------|
| `LLM-OPTIONS-COMPARISON.md` | Hosted vs open-source LLM comparison, pricing, decision framework |
| `LINK-CLOUD-LLM.md` | Step-by-step: hosted API (Groq, Together, OpenRouter) and self-hosted (AWS/RunPod, vLLM) |
| `OPEN-SOURCE-LLM-FULL-CONTROL.md` | Running open-source LLM in the cloud (RunPod/EC2, vLLM, fine-tuning, cost notes) |
| `VOICE-OPTIONS-COMPARISON.md` | TTS/STT and voice options for avatar and voice chat |
| `TEST-LLM-AND-VOICE.md` | How to test LLM and voice locally and on Netlify |

Once you’ve tried the demo and shared your priorities, we can lock the LLM choice and cloud approach (including AWS storage and compute) in the decision document.
