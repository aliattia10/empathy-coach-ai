# Next Steps & Budget — Cloud, Voice, Avatar

**Purpose:** Plan and budget the next phases: **(1) connect to cloud server**, **(2) add voice**, **(3) connect an avatar.**  
**Use:** Roadmap and budget for stakeholder alignment; adjust figures as you lock provider choices.

---

## Order of work

| Step | What | Depends on |
|------|------|------------|
| **1. Cloud server (LLM)** | Connect the app to a cloud LLM (hosted API or your own GPU). | None — do first. |
| **2. Voice** | Add production-quality TTS (AI speaks) and STT (user speaks); replace or augment browser-only voice. | Step 1 (LLM must be live). |
| **3. Avatar** | Connect a visible avatar (character + lip-sync / expression) to the voice and LLM. | Steps 1 and 2. |

You already have: front-end, Netlify deploy, serverless chat function, browser TTS/STT and live transcription. Steps below build on that.

---

## Phase 1: Connect to cloud server (LLM)

**Goal:** App talks to an **open-source LLM** in the cloud (hosted API that serves open models, or self-hosted). Netlify function or backend calls the API; no change to front-end flow. **We use only open-source LLMs.**

### Options and budget (monthly, approximate)

| Option | What you do | Setup cost | Monthly cost (demo → growth) | Notes |
|--------|-------------|------------|------------------------------|--------|
| **A. Hosted API — open-source models (recommended first)** | Add API key to Netlify env. Use **OpenRouter**, **Groq**, or **Together** with open-source models (Llama, Mistral, Mixtral). No server. | $0 | **$0** (free tier) → **$20–100** (1–5M tokens/mo) | Fastest; pay per use; open models only. |
| **B. Self-hosted (RunPod)** | Rent GPU pod, run **vLLM** with Llama/Mistral/Qwen, point Netlify/backend at it. | ~2–4 h dev | **$50–150** (e.g. 100–300 h × ~$0.50/h) if always on; **$0–50** if you stop when not in use | Full control; fine-tuning later. |
| **C. Self-hosted (AWS EC2 + S3)** | EC2 GPU instance + optional S3 for models/logs; run vLLM with your chosen open-source model. | ~4–8 h dev | **$100–250** (instance 24/7) or **$20–80** (on when needed); S3 **$5–20** | Full control; more ops. |

**Suggested for you:** Start with **Option A** (OpenRouter or Groq with Llama/Mistral/Mixtral). Budget **$0/month** for demo; **$30–80/month** when you have regular traffic. Move to B or C when you need custom fine-tuning or full control.

### Open-source LLMs that fit this kind of project

We use **only open-source LLMs**. For an **empathy coach** (constructive feedback, Socratic questioning, practice conversations, wellbeing-adjacent but not therapy), these fit well:

| LLM | Why it fits | Where to use it |
|-----|-------------|------------------|
| **Llama 3.x (Meta)** | Open weights; fine-tunable for “Alex” and scenario-specific tone; good instruction-following; cost-effective. | Groq, Together, OpenRouter (free/paid open models), or self-hosted (vLLM). |
| **Mistral 7B / 8x7B** | Open; strong for conversation and reasoning; multiple sizes. | Together, OpenRouter, or self-hosted (vLLM). |
| **Mixtral (8x7B)** | Open; good balance of quality and cost; suitable for practice dialogues. | Groq, OpenRouter, or self-hosted. |
| **Qwen 2 / 2.5** | Open; strong multilingual and dialogue; Apache 2.0. | Together, OpenRouter, or self-hosted (vLLM). |
| **Zephyr (Hugging Face)** | Open; instruction-tuned; smaller footprint. | Self-hosted or via providers that offer it. |
| **Phi (Microsoft)** | Open; small and fast; good for low-latency voice. | OpenRouter, or self-hosted. |

**Practical pick:** Use **OpenRouter** or **Groq** to try Llama, Mistral, and Mixtral with the same prompts (all open-source); pick one for latency, cost, and tone. For **full control and fine-tuning**, run **Llama or Mistral** on RunPod/EC2 with vLLM.

### Phase 1 budget summary

| Scenario | Choice | Monthly budget (planning) |
|----------|--------|---------------------------|
| **Low** | Hosted API free tier — open-source models (Groq/OpenRouter) | **$0** |
| **Mid** | Hosted API pay-as-you-go — open-source (Llama, Mistral, etc.) | **$30–100** |
| **High** | Self-hosted GPU (RunPod or EC2) + vLLM | **$80–250** |

---

## Phase 2: Add voice (TTS + STT)

**Goal:** Production-quality voice in and out: user speaks → STT → LLM → TTS → user hears reply. Improves on current browser TTS and Web Speech API STT (latency, quality, avatar-ready).

### Options and budget (monthly, approximate)

| Option | TTS | STT | Setup cost | Monthly cost (demo → growth) | Notes |
|--------|-----|-----|------------|------------------------------|--------|
| **A. Free / low-cost** | Google Cloud TTS or Polly free tier; or ElevenLabs free tier | Deepgram $200 credit (one-off) or browser Whisper | $0 | **$0** (within free limits) | Good for demos; limits apply. |
| **B. Paid hosted (recommended for production)** | ElevenLabs or Play.ht | Deepgram or Azure Speech | ~1–2 days integration | **$20–60** (TTS) + **$10–40** (STT) at moderate use | Low latency; good for avatar. |
| **C. All-in-one (avatar-focused)** | Inworld AI or OpenAI Realtime (TTS+STT+LLM) | Same | ~2–3 days integration | **$50–150** (per-minute pricing) | Fastest path to talking avatar. |
| **D. Open-source (self-hosted)** | Coqui XTTS or Qwen3-TTS on your GPU | Whisper on same/server | ~3–5 days (deploy + tune) | **$0** (included in Phase 1 GPU) or **+$30–80** if separate small instance | Full control; no per-use fee. |

**Suggested for you:** Start with **A** for demos; move to **B** for first production voice. Budget **$0** for demo (free tiers); **$40–100/month** for production voice.

### Voice actors and platforms — listen to voices

Links below let you **hear** voices before choosing. Useful for picking an “Alex” or other avatar voice.

| Platform | What you get | Link to hear voices |
|----------|--------------|---------------------|
| **ElevenLabs** | 1000+ voices; emotion control; voice cloning. Strong for character (e.g. “Alex”). | [Voice Library — browse and play samples](https://elevenlabs.io/voice-library) · [Showcase (e.g. “Patient Instructor”, “Enthusiastic Expert”)](https://showcase.elevenlabs.io/showcase/voices) |
| **Play.ht** | Pre-built voices (age, accent, style); low latency; voice cloning. | [Play.ht](https://play.ht) — sign up for free and use Voice Library / demo in dashboard; [API list of voices with sample URIs](https://docs.play.ht/reference/list-of-prebuilt-voices). |
| **Resemble AI** | 40+ voices in marketplace; clone in ~10 s (Rapid) or 10–25 min (Pro). | [Voice Marketplace — 40+ voices](https://www.resemble.ai/resemble-voice-marketplace/) · [Playground — try TTS](https://app.resemble.ai/playground) · [Made With Resemble — examples](https://www.resemble.ai/made-with-resemble/) |
| **Google Cloud TTS** | Natural voices; many languages. | [Google Cloud TTS — listen to voices](https://cloud.google.com/text-to-speech#section-2) (demo on product page). |
| **Amazon Polly** | Neural and standard voices; free tier. | [Polly — listen to voices](https://aws.amazon.com/polly/) (sample player on page). |
| **Deepgram** | STT + Aura TTS; low latency. | [Deepgram Aura TTS](https://deepgram.com/product/aura) — demos on site. |

**For “Alex” (direct report, slightly defensive, receptive):** Try **ElevenLabs** “Patient Instructor” or a calm professional in the Voice Library; or **Play.ht** / **Resemble** for a consistent, cloneable voice.

### Phase 2 budget summary

| Scenario | Choice | Monthly budget (planning) |
|----------|--------|---------------------------|
| **Low** | Free tiers (Polly/Deepgram/Whisper or browser) | **$0** |
| **Mid** | Paid TTS (ElevenLabs/Play.ht) + STT (Deepgram) | **$40–100** |
| **High** | Inworld or Realtime API, or open-source on GPU | **$50–150** (or GPU time as in Phase 1) |

---

## Phase 3: Connect an avatar

**Goal:** A visible avatar (face/character) that speaks (lip-sync) and optionally reacts. Uses the same LLM (Phase 1) and voice (Phase 2).

### Options and budget (monthly, approximate)

| Option | What you do | Setup cost | Monthly cost | Notes |
|--------|-------------|------------|--------------|--------|
| **A. Front-end only (current)** | Keep abstract avatar (eyes, mouth, waveform); improve with better TTS/STT from Phase 2. | $0 | **$0** | Already in place; no extra infra. |
| **B. Animated avatar (library)** | Use a library (e.g. Ready Player Me, D-ID, or custom rig) + your TTS for lip-sync. | ~3–7 days dev | **$0–50** (if using free/low-cost avatar API) or **$30–100** (D-ID / similar) | Clear character; you own the flow. |
| **C. Avatar platform (Inworld, etc.)** | Use a platform that does voice + conversation + avatar. | ~2–4 days integration | **$50–150** (per-minute or subscription) | Fastest; less control over LLM/prompts. |
| **D. Custom 3D/2D + lip-sync** | Build or commission avatar asset; drive mouth/expression from TTS (e.g. visemes). | ~1–3 weeks dev or outsourced | **$0** (your dev) or **$500–2000** one-off (asset + integration); then hosting if any **$0–30** | Full control; most effort. |

**Suggested for you:** Keep **A** for the first production release; add **B** when you want a more recognisable character. Budget **$0** if you stay abstract; **$30–100/month** if you add a paid avatar service.

### Avatar ideas we can create

Concrete directions for the avatar(s) in the empathy coach:

| Idea | Description | Effort | Best for |
|------|-------------|--------|----------|
| **Abstract minimalist (current)** | Eyes, mouth, waveform, voice rings; no literal face. Calm, inclusive, “practice partner” feel. | Done | MVP; avoids bias; works with any voice. |
| **Single character: “Alex”** | One consistent persona (direct report) — 2D illustrated or simple 3D; lip-sync to chosen TTS voice. Same character across scenarios. | Medium | Clear brand; users know who they’re talking to. |
| **Scenario-specific avatars** | Different look per scenario (e.g. “Alex” for feedback, another for conflict, another for distress). Same or different voices. | Medium–High | Rehearsing different relationships. |
| **Custom 2D illustrated** | Commission or design a 2D character (e.g. professional, neutral dress); animate mouth/eyebrows from TTS. Calm, approachable style. | Medium | Distinct look without 3D cost. |
| **3D realistic or stylised** | Ready Player Me, D-ID, or custom 3D model; lip-sync and optional expressions. More “human” presence. | High | High-fidelity demos or premium tier. |
| **Diverse personas (later)** | Multiple avatars (demographics, accent, tone) so managers practice with different “reports”. Aligns with inclusive communication goals. | High | Scale and inclusion; needs more design and voice choices. |
| **Minimal face + body language** | Stick to a simple face (or abstract) but add subtle cues: nodding, thinking pose, openness/closedness. Drives empathy without full character. | Low–Medium | Upgrade of current abstract avatar. |

**Recommendation:** Ship with the **abstract minimalist** avatar and one strong TTS voice (e.g. from ElevenLabs). Add a **single “Alex” character** (2D or simple 3D) when you want a recognisable practice partner; expand to **scenario-specific or diverse personas** once the core flow is proven.

### Phase 3 budget summary

| Scenario | Choice | Monthly budget (planning) |
|----------|--------|---------------------------|
| **Low** | Abstract avatar only (current) | **$0** |
| **Mid** | Animated avatar (library or D-ID-style API) | **$30–100** |
| **High** | Custom avatar + platform or heavy custom dev | **$50–150** or one-off **$500–2000** |

---

## Combined budget (planning)

Rough monthly totals so you can plan. All figures are **approximate**; confirm with providers.

| Phase | Low (demo / MVP) | Mid (first production) | High (full control / premium) |
|-------|------------------|------------------------|-------------------------------|
| **1. Cloud server (LLM)** | $0 | $30–100 | $80–250 |
| **2. Voice (TTS + STT)** | $0 | $40–100 | $50–150 |
| **3. Avatar** | $0 | $30–100 | $50–150 |
| **Total per month** | **$0** | **$100–300** | **$180–550** |

**One-off / occasional:**  
- Self-hosted setup (Phase 1 C/D): **~$0** (your time) or **$500–1500** if outsourced.  
- Custom avatar asset (Phase 3 D): **$500–2000** one-off if commissioned.  
- Deepgram $200 credit: one-off, no card.

---

## Suggested timeline and budget for you

| When | Step | Action | Budget (planning) |
|------|------|--------|-------------------|
| **Now** | 1. Cloud | Keep or set OpenRouter/Groq in Netlify with an **open-source model** (e.g. Llama, Mistral, Mixtral). | **$0** (free tier) |
| **Next 2–4 weeks** | 2. Voice | Add production TTS (e.g. ElevenLabs or Polly) and STT (e.g. Deepgram); keep or refine live transcription. | **$0** (free tiers) → **$40–80/mo** when you go paid |
| **After voice is stable** | 3. Avatar | Keep abstract avatar; or add animated character (library or API) and lip-sync. | **$0** (current) → **$30–100/mo** if you add a service |

**First 3 months (example):**  
- Month 1: Cloud on free tier + voice on free tier → **~$0**.  
- Month 2: Move to paid voice if usage grows → **~$40–80**.  
- Month 3: Add paid avatar option if needed → **~$70–180 total/month**.

---

## Reference docs

- **How to start training the model (data, LoRA, serve):** [HOW-TO-START-TRAINING-THE-MODEL.md](./HOW-TO-START-TRAINING-THE-MODEL.md)  
- **LLM and cloud (which server, AWS, cost):** [LLM-AND-CLOUD-DECISION.md](./LLM-AND-CLOUD-DECISION.md)  
- **Link backend to cloud LLM (step-by-step):** [LINK-CLOUD-LLM.md](./LINK-CLOUD-LLM.md)  
- **Voice options (TTS/STT, avatar-ready):** [VOICE-OPTIONS-COMPARISON.md](./VOICE-OPTIONS-COMPARISON.md)  
- **Self-hosted LLM (RunPod/EC2, vLLM, fine-tuning):** [OPEN-SOURCE-LLM-FULL-CONTROL.md](./OPEN-SOURCE-LLM-FULL-CONTROL.md)

*Document version: March 2026. Pricing and offers may have changed; verify on provider sites before commitment.*
