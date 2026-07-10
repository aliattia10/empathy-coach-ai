# Groq vs RunPod — LLM Strategy Decision Document

**Project:** ShiftED AI / Empathy Coach  
**Date:** June 2026  
**Audience:** Product, leadership, and engineering  
**Purpose:** Compare switching chat inference to **Groq** (hosted API) vs staying on **RunPod Serverless** with our **fine-tuned empathy-coach model**.

---

## 2-minute executive summary

| | **Groq (hosted API)** | **RunPod (fine-tuned model)** |
|--|----------------------|------------------------------|
| **What it is** | Pay-per-token API (Llama, Qwen, etc.) — no GPU to manage | Our own **Qwen2.5-7B** model, LoRA-trained on Simon feedback + starred replies |
| **Ease of use** | **Much easier** — API key + env vars, instant replies, no cold start | **Harder** — Serverless endpoint, volume, GPU availability, cold starts |
| **Idle cost** | **$0** when nobody chats | **$0** with min workers = 0; optional warm-up costs ~$7–11/day |
| **Typical demo cost** | **~$1–7/month** (moderate testing on 70B) | **~$0–15/month** if scale-to-zero; **~$150–240/month** if kept warm 10h/day |
| **Coaching quality** | Good with super prompt; **not** our custom fine-tune | **Best alignment** with Simon’s reviewed coaching style |
| **Best for** | Demos, pilots, fast iteration, low ops burden | Long-term product differentiation, owned model, data sovereignty |

**Practical recommendation**

- **Short term (next demos / tomorrow’s meeting):** Groq is the **lowest-friction** path — especially `llama-3.3-70b-versatile` with our existing super prompt stack.
- **Medium term (product moat):** Keep investing in **RunPod + fine-tuned model** once endpoint/GPU config is stable.
- **Hybrid:** Groq for reliability now; RunPod for quality experiments — switch via Netlify env vars only.

---

## 1. What we have today

### RunPod path (current production target)

| Item | Detail |
|------|--------|
| **Base model** | Qwen2.5-7B-Instruct |
| **Fine-tune data** | ~221 turns from Simon feedback + active-branch assistant replies |
| **Merged model** | `/runpod-volume/models/empathy-coach-qwen-merged-v1` (~14 GB) |
| **Served name** | `empathy-coach-qwen` |
| **Inference** | RunPod Serverless vLLM (scale to zero) |
| **App integration** | `VLLM_API_URL`, `LLM_API_KEY`, `VLLM_MODEL` + async job polling |
| **Prompt stack** | Full super prompt: coach rules, phases, skills, journey state, trainer rules, conversation memory |

### Groq path (previous / alternative)

| Item | Detail |
|------|--------|
| **Model** | Hosted only (e.g. `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `qwen3-32b`) |
| **Fine-tune** | **Not available** — we cannot deploy `empathy-coach-qwen` on Groq |
| **App integration** | Same OpenAI-compatible `/api/chat` — change URL + API key |
| **Prompt stack** | Same super prompt (phases, journey, trainer rules, memory) |

---

## 2. Side-by-side comparison

### 2.1 Operations & reliability

| Factor | Groq | RunPod (fine-tuned) |
|--------|------|---------------------|
| Setup time | **Minutes** | **Days** (train, volume, endpoint, env) |
| Cold start | **None** | **1–3+ minutes** after idle (mitigated with async UI) |
| GPU availability | N/A (managed) | **Can block** (e.g. 80 GB unavailable) |
| Worker crashes | Rare | Seen in logs (`WorkerProc shutting down`) |
| Monitoring | Groq console + rate limits | RunPod endpoint logs, worker status |
| Scaling | Automatic | Serverless auto-scale (min/max workers) |
| Custom model | ❌ | ✅ |

### 2.2 Coaching & product fit

| Factor | Groq | RunPod (fine-tuned) |
|--------|------|---------------------|
| Simon-trained tone | Via prompt only | **Weights + prompt** |
| Phase 1–3 protocol | Super prompt + journey state | Same + model learned from exemplars |
| Trainer global standards | Injected from Supabase | Same |
| Repetition / memory issues | Less infra-related; model-dependent | Was infra-related (history dropped) — **fixed in app** |
| Differentiation | Commodity API | **Owned IP** (model + data pipeline) |
| Future fine-tuning | Not on Groq | Re-train on new Simon feedback |

### 2.3 Security & data

| Factor | Groq | RunPod |
|--------|------|--------|
| Data leaves our stack | Yes — prompts sent to Groq | Yes — prompts sent to RunPod |
| EU hosting | Check Groq region policy | Volume in **EU-RO-1** possible |
| API key in Netlify | `LLM_API_KEY` | `LLM_API_KEY` (RunPod key) |
| No vendor lock-in | Low (OpenAI-compatible) | Medium (self-hosted weights on volume) |

---

## 3. Pros and cons

### 3.1 Groq

**Pros**

- **Instant inference** — no cold start, no “connection lost” during warm-up
- **Pay only for tokens used** — $0 when idle (no 24/7 GPU bill)
- **Very low cost** at demo and pilot scale
- **Simple ops** — no vLLM, volumes, GPU types, or rollout debugging
- **Fast** — LPUs deliver high tokens/sec (good UX)
- **Same app code** — OpenAI-compatible; swap env vars
- **Free tier** for initial prototyping (rate limits apply)

**Cons**

- **Cannot run `empathy-coach-qwen`** — lose fine-tune investment unless we keep RunPod for training only
- **Quality ceiling** — base model + prompt only; may not match Simon-reviewed replies as closely
- **Rate limits** on free tier; paid tier needs card on file
- **Vendor dependency** — pricing and models can change
- **Data** — user coaching content processed on Groq’s infrastructure
- **No re-training loop** on Groq for our Supabase feedback export

### 3.2 RunPod (fine-tuned LLM)

**Pros**

- **Our model** — trained on Simon feedback + production prompt parity
- **Product moat** — coaching behaviour is harder to copy
- **Re-trainable** — export JSONL → LoRA → merge → redeploy
- **Scale to zero** — no cost when nobody uses the app (min workers = 0)
- **Full control** — model path, temperature, context length, volume in EU
- **Same super prompt** — already wired in `buildProductionSystemPrompt.cjs`

**Cons**

- **Operational complexity** — endpoint, volume mount, `MODEL_NAME`, GPU selection
- **Cold starts** — first message after idle can take 1–3+ minutes
- **GPU scarcity** — wrong GPU tier (e.g. 80 GB) can show “Unavailable”
- **Worker failures** — vLLM version / OOM / bad paths require log debugging
- **Larger context** — 4k–8k limits need careful prompt budgeting (addressed in code)
- **Warm-up for demos** — optional cron costs ~$7–11/day (4090) if you want instant first reply

---

## 4. Cost comparison

> **Important:** Groq bills **per token**. RunPod Serverless bills **per GPU-second** while a worker runs.  
> “10 hours a day” only maps directly to RunPod warm-up — not to Groq.

### 4.1 Groq pricing reference (June 2026)

| Model | Input / 1M tokens | Output / 1M tokens | Notes |
|-------|-------------------|-------------------|--------|
| Llama 3.1 8B Instant | $0.05 | $0.08 | Cheapest; lighter coaching |
| Llama 3.3 70B Versatile | $0.59 | $0.79 | **Recommended for Groq demos** |
| Qwen3 32B | $0.29 | $0.59 | Mid-tier |
| GPT-OSS 120B | $0.15 | $0.60 | Large open model |

Source: [Groq pricing](https://console.groq.com/docs/pricing) — verify before budgeting.

**Typical Empathy Coach turn (approx.)**

- Input: ~4,500–6,000 tokens (system prompt + memory + history + user)
- Output: ~150–400 tokens (coach reply)

### 4.2 Groq — estimated monthly cost (weekdays, “business hours” usage)

Assumes chat happens during a 10-hour window; **cost depends on message count, not hours online**.

| Scenario | Chats / day | 8B Instant | 70B Versatile |
|----------|-------------|------------|---------------|
| Light demo | ~20 | **~$0.20/mo** | **~$1.30/mo** |
| Team testing | ~100 | **~$0.70/mo** | **~$7/mo** |
| Active pilots | ~500 | **~$3/mo** | **~$35/mo** |
| Heavy (50 users × 10 msgs) | ~500 | **~$3/mo** | **~$35/mo** |

**Per weekday (same scenarios)**

| Scenario | 8B Instant | 70B Versatile |
|----------|------------|---------------|
| Light demo | ~$0.01/day | ~$0.06/day |
| Team testing | ~$0.03/day | ~$0.32/day |
| Active pilots | ~$0.15/day | ~$1.60/day |

### 4.3 RunPod Serverless — estimated monthly cost

Source: [RunPod Serverless pricing](https://docs.runpod.io/serverless/pricing) — per second while worker runs.

| GPU tier (7B model) | ~Per hour | Scale-to-zero (light use) | Warm 10h/day (cron) | Min workers = 1 (24/7) |
|---------------------|-----------|---------------------------|---------------------|-------------------------|
| L4 / 24 GB | ~$0.68/hr | **~$5–20/mo** | **~$150/mo** | **~$490/mo** |
| RTX 4090 | ~$1.10/hr | **~$10–40/mo** | **~$240/mo** | **~$790/mo** |

**One-time / occasional**

| Item | Cost |
|------|------|
| Training pod (RTX 4090, ~3–4 h) | **~$1–2** per run |
| Network volume storage | Low monthly (GB-scale) |
| Merged model upload | Time + volume resize (already done) |

### 4.4 Cost winner by scenario

| Scenario | Cheaper / easier | Why |
|----------|------------------|-----|
| Tomorrow’s demo, must work | **Groq** | No cold start, ~$0–1 for the day |
| 10h/day “always ready” without ops pain | **Groq** | RunPod warm-up ≈ $150–240/mo vs Groq ≈ $7–35/mo for real chat volume |
| Lowest $ at scale-to-zero + few users | **Tie** — both can be **&lt;$20/mo** |
| Best coaching fidelity long-term | **RunPod fine-tune** | Worth the ops cost when stable |
| 24/7 instant production | **Neither is cheap** — Groq per-token vs RunPod ~$790/mo |

---

## 5. Technical switch checklist

### 5.1 Switch to Groq (Netlify)

```env
VLLM_API_URL=https://api.groq.com/openai/v1/chat/completions
LLM_API_KEY=<Groq API key>
VLLM_MODEL=llama-3.3-70b-versatile
RUNPOD_ASYNC=false
VLLM_TIMEOUT_MS=60000
```

- Add payment method at [console.groq.com](https://console.groq.com)
- Keep `SUPABASE_*` for trainer rules and journey state
- Remove dependency on RunPod endpoint ID

### 5.2 Stay on RunPod (fine-tuned)

```env
VLLM_API_URL=https://api.runpod.ai/v2/<ENDPOINT_ID>/openai/v1/chat/completions
LLM_API_KEY=<RunPod API key>
VLLM_MODEL=empathy-coach-qwen
VLLM_TIMEOUT_MS=180000
VLLM_MAX_CONTEXT_TOKENS=6144
RUNPOD_ASYNC=true
```

**RunPod endpoint must have**

- Network volume: `salty_sapphire_parakeet_volume`
- `MODEL_NAME=/runpod-volume/models/empathy-coach-qwen-merged-v1`
- `OPENAI_SERVED_MODEL_NAME_OVERRIDE=empathy-coach-qwen`
- GPUs: **RTX 4090 / L4** (not unavailable 80 GB tiers)
- `MAX_MODEL_LEN=8192` (recommended)

---

## 6. Risks & mitigations

| Risk | Groq | RunPod |
|------|------|--------|
| Demo fails live | Low | Medium (cold start / GPU) → use Groq for demo day |
| Cost overrun | Rate limits + billing alerts | RunPod billing alerts; min workers = 0 |
| Quality regression | Pick 70B; keep super prompt | Re-train; fix journey/memory (done) |
| Lock-in | Low (OpenAI API) | Own weights on volume |

---

## 7. Decision matrix (for tomorrow’s meeting)

| If your priority is… | Choose |
|----------------------|--------|
| **Reliability for demos this week** | **Groq** |
| **Lowest operational burden** | **Groq** |
| **Lowest cost at low traffic** | **Groq** (or RunPod scale-to-zero) |
| **Simon-aligned coaching from weights** | **RunPod fine-tune** |
| **Own the model IP / re-train on feedback** | **RunPod fine-tune** |
| **EU volume + self-hosted weights** | **RunPod fine-tune** |

### Suggested hybrid roadmap

1. **Now:** Groq `llama-3.3-70b-versatile` for demos and stakeholder testing  
2. **Parallel:** Fix RunPod endpoint (4090/L4, volume, logs) — no 24/7 worker  
3. **Next month:** A/B Simon review — fine-tuned RunPod vs Groq 70B + super prompt  
4. **Decide:** If fine-tune wins clearly → production RunPod; if tie → Groq until next train cycle  

---

## 8. Summary table (print this page)

| | **Groq** | **RunPod (empathy-coach-qwen)** |
|--|----------|----------------------------------|
| **Setup** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐ Hard |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (when configured) |
| **Demo cost (10h window)** | **$0.01–$2/day** | **$0–$11/day** (usage vs warm-up) |
| **Monthly (moderate testing)** | **~$7–35** | **~$15–40** (zero scale) or **~$150–240** (warm) |
| **Fine-tuned coach** | ❌ | ✅ |
| **Cold start** | None | 1–3 min |
| **Ops time** | Minimal | Ongoing |

---

## 9. References

| Resource | URL |
|----------|-----|
| Groq Console | https://console.groq.com |
| Groq Pricing | https://console.groq.com/docs/pricing |
| RunPod Serverless pricing | https://docs.runpod.io/serverless/pricing |
| RunPod vLLM guide | https://docs.runpod.io/serverless/vllm/get-started |
| In-repo RunPod guide | `docs/SUPER-PROMPT-RUNPOD-OWN-LLM.md` |
| Training guide | `docs/TRAIN-ON-SIMON-FEEDBACK.md` |
| Env vars | `docs/ENV-VARIABLES-AND-NETLIFY.md` |

---

*Document version: 1.0 — June 2026. Re-verify provider pricing before final budget sign-off.*
