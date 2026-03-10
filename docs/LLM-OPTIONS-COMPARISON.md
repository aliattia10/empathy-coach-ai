# LLM Options Comparison for Empathy Coach

**Prepared for:** Shifted AI / Empathy Coach stakeholders  
**Context:** Choosing how to power the “active” empathy LLM (Socratic questioning, diverse demographics, ethical data, scalability).  
**Use:** Share with the client to support the decision on which LLM path to take.

---

## 1. What the product needs (from requirements)

- **Active, Socratic questioning** — the AI should ask thoughtful follow-up questions, not only respond.
- **Diverse language and demographics** — adapt to different audiences (e.g. men/women, age, LGBTQ+), with appropriate terminology and tone.
- **Ethics and compliance** — GDPR, informed consent, clear disclaimers (AI is not therapy); safety rails and signposting (e.g. NHS 24, Mind, Samaritans).
- **Scalability** — support many users and future growth (small companies, first-time managers, then identity-driven scenarios and humanitarian aid).
- **Optional fine-tuning** — ability to train on your own data (case studies, real scenarios) for avatars and “blind spot” use cases.

This document compares **hosted APIs** (quick to integrate, pay per use) and **open-source / self-hosted** (full control, fine-tuning, your infrastructure).

---

## 2. Hosted API options — quick comparison

| Provider | Free tier | Typical cost (per 1M tokens) | Best for |
|----------|-----------|-----------------------------|----------|
| **Groq** | Yes (rate limits, no card) | Free tier then pay-as-you-go | Fast inference, low cost to start |
| **Google Gemini** | Yes (generous limits) | From ~$0.15–0.60/M (Flash) to ~$1.25–10/M (Pro) | Google ecosystem, multimodal |
| **OpenAI (ChatGPT API)** | No (trial credits only) | ~$0.15–0.60/M (mini) to ~$1.25–10/M (GPT-5) and higher for o1 | Strong reasoning, brand recognition |
| **OpenRouter** | Yes (~50 free req/day on free models) | Pass-through (no markup); varies by model | One API for 300+ models, easy to switch |
| **Together** | Credits / trial | ~$0.10–0.85/M (e.g. Llama 3.1 8B) | Open models, fine-tuning available |
| **Anthropic (Claude)** | Trial credits | ~$1–5/M (Haiku) to ~$5–25/M (Opus) | Safety-focused, long context |

*Prices are approximate and per million tokens (input + output). Check each provider’s pricing page for current rates.*

---

## 3. Hosted APIs — detailed overview

### 3.1 Groq

- **Pricing:** Free tier (no credit card); Developer tier pay-as-you-go if you exceed limits.
- **Models:** Llama, Mixtral, etc. Very fast inference.
- **Pros:** Free to start, simple setup, low latency.  
- **Cons:** No fine-tuning; you don’t control the model or training data.  
- **Fit:** Good for **early product demos and testing** with minimal cost. Not for training on your own data.

---

### 3.2 Google Gemini API

- **Pricing:** Free tier with generous limits; pay-as-you-go. Examples (per 1M tokens): Flash ~$0.15 input / $0.60 output; Pro higher (e.g. ~$1.25 input / $10 output). Newer models (e.g. 3.1 Flash-Lite) can be cheaper.
- **Models:** Gemini Flash (fast, cheaper), Gemini Pro (stronger).
- **Pros:** Free tier, good for scaling, multimodal (text, image, future use cases).  
- **Cons:** No custom fine-tuning on your data in the same way as open-source; model control stays with Google.  
- **Fit:** Good for **production chat** if you’re happy with prompt engineering and don’t need to train on proprietary empathy/case-study data.

---

### 3.3 OpenAI (ChatGPT API)

- **Pricing:** No ongoing free tier; pay per token. Examples: GPT-4o-mini ~$0.15 / $0.60 per 1M; GPT-5 ~$1.25 / $10; o1-pro much higher. Batch API ~50% discount for non-urgent jobs.
- **Models:** GPT-4o, GPT-4o-mini, GPT-5, o1, etc.
- **Pros:** Strong models, good tooling, prompt caching to reduce cost.  
- **Cons:** Cost can add up at scale; no training on your data in-house.  
- **Fit:** **Premium option** when you want top-tier reasoning and can budget for it; less ideal if cost or data control is a priority.

---

### 3.4 OpenRouter

- **Pricing:** Pay per token (pass-through from underlying providers, no markup). Free tier: ~50 requests/day on selected free models. BYOK (bring your own key) can reduce cost.
- **Models:** 300+ models (OpenAI, Anthropic, Google, Meta, Mistral, etc.) through one API.
- **Pros:** Single integration; easy to **compare models and switch** without changing your app.  
- **Cons:** You still depend on third-party models; no custom fine-tuning through OpenRouter.  
- **Fit:** **Evaluation and flexibility** — try different models (including Gemini, Claude, Llama) and switch as needed.

---

### 3.5 Together

- **Pricing:** Pay per token. Examples: Llama 3.1 8B ~$0.10/M input and output; larger models more. Batch and fine-tuning pricing available.
- **Models:** Many open models (Llama, Mistral, DeepSeek, etc.).
- **Pros:** Open models, **fine-tuning offered** (you can train on your data on their infra).  
- **Cons:** Cost scales with usage; fine-tuning has its own cost.  
- **Fit:** **Middle ground** — hosted API plus option to fine-tune for empathy/avatar behaviour without running your own GPU.

---

### 3.6 Anthropic (Claude)

- **Pricing:** Per million tokens. Examples: Haiku ~$1 input / $5 output; Sonnet ~$3 / $15; Opus ~$5 / $25. Caching and batch options available.
- **Models:** Claude Haiku (fast, cheaper), Sonnet, Opus.
- **Pros:** Strong safety and instruction-following; long context; good for sensitive/wellbeing use cases.  
- **Cons:** No custom training on your data; higher cost at scale.  
- **Fit:** **Premium option** where safety and nuance matter (e.g. mental-health-adjacent wording); budget required.

---

## 4. Open-source / self-hosted (full control)

- **What it is:** You run an **open-source model** (e.g. Llama, Mistral, Qwen) on **your own or rented GPU** (e.g. RunPod, AWS EC2). You serve it with **vLLM** (or similar) and connect your existing backend to it.
- **Pricing:** No per-token API fee. You pay for **compute** (e.g. ~$0.20–1.50/hour for a GPU instance). You only pay while the instance is on.
- **Pros:**  
  - **Full control** over model, prompts, and data.  
  - **Fine-tune and train** on your own data (e.g. Socratic dialogues, case studies, demographic-specific language).  
  - **GDPR/data sovereignty** — data can stay in your pipeline and your chosen region.  
  - No ongoing per-request cost; predictable infra cost.
- **Cons:**  
  - You (or a partner) manage deployment, security, and scaling.  
  - Upfront setup and ops effort.
- **Fit:** When you need **custom behaviour, demographic tuning, and training on proprietary or consented data** (e.g. from surveys, HR, or partnerships like Stonewall). Aligns with “active” empathy LLM and ethical data use discussed in the meeting.

*Detailed steps (RunPod, EC2, vLLM, fine-tuning) are in [OPEN-SOURCE-LLM-FULL-CONTROL.md](./OPEN-SOURCE-LLM-FULL-CONTROL.md).*

---

## 5. Side-by-side summary

| Criteria | Groq | Gemini | OpenAI | OpenRouter | Together | Claude | Open-source (self-hosted) |
|----------|------|--------|--------|------------|----------|--------|----------------------------|
| **Free / low-cost start** | ✅ Free tier | ✅ Free tier | ❌ | ✅ Free tier (limited) | Trial/credits | Trial | ❌ (pay for GPU time) |
| **Pay-per-use at scale** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (pay for uptime) |
| **Custom fine-tuning / training** | ❌ | Limited | Limited | ❌ | ✅ | ❌ | ✅ Full control |
| **Full control over model & data** | ❌ | ❌ | ❌ | ❌ | Partial | ❌ | ✅ |
| **One API, many models** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | N/A |
| **Strong safety / nuance** | — | Good | Good | Depends on model | Depends on model | ✅ | Depends on model & tuning |
| **Setup complexity** | Low | Low | Low | Low | Low | Low | Higher (infra + ops) |

---

## 6. Suggested decision framework for the client

1. **Get something live quickly (demos, early users)**  
   → **Groq** (free) or **Gemini** (free tier + good scaling). No fine-tuning, but fast to integrate.

2. **Compare models and keep options open**  
   → **OpenRouter** (one integration, 300+ models). Useful for testing which model best fits Socratic style and tone before committing.

3. **Production chat with strong safety and nuance**  
   → **Claude** or **OpenAI** (budget permitting). Good for wellbeing-adjacent wording and disclaimers; no custom training.

4. **Hosted API + ability to train on your data**  
   → **Together** (open models + fine-tuning). Balances ease of use with some customisation for avatars and demographics.

5. **Full control, custom training, GDPR/data sovereignty**  
   → **Open-source on cloud GPU** (see OPEN-SOURCE-LLM-FULL-CONTROL.md). Best fit for long-term “active” empathy LLM, demographic-specific language, and ethical data use as discussed in the meeting.

---

## 7. Where to get current pricing

- **Groq:** [console.groq.com](https://console.groq.com) → Billing / Docs  
- **Google Gemini:** [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing)  
- **OpenAI:** [platform.openai.com/docs/pricing](https://platform.openai.com/docs/pricing)  
- **OpenRouter:** [openrouter.ai](https://openrouter.ai) → Models / Pricing  
- **Together:** [together.ai/pricing](https://www.together.ai/pricing)  
- **Anthropic Claude:** [docs.anthropic.com](https://docs.anthropic.com/en/docs/about-claude/pricing) or [anthropic.com/pricing](https://www.anthropic.com/pricing)

---

## 8. Next steps

- **Short term:** Use **Groq** or **Gemini** free tier to keep development and demos moving.  
- **Evaluation:** Use **OpenRouter** to test Gemini, Claude, Llama, etc., with your Socratic prompts and disclaimer flows.  
- **Strategy:** Decide whether the product will rely on **hosted APIs only** (simpler, pay per use) or invest in **open-source + fine-tuning** (control, custom avatars, demographic language, ethical data).  
- **Legal / compliance:** Ensure disclaimers, signposting, and consent flows are implemented regardless of LLM choice (as agreed with Kara and Simon).

*Document version: March 2026. Pricing and offers may have changed; verify on provider sites before commitment.*
