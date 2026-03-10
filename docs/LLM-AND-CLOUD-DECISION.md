# LLM and Cloud Decision Document — Voice Chat & Avatar

**Purpose:** Choose how to power **voice chat and avatar** for the first production version: which LLM (hosted vs open-source), performance and price, and what’s needed to run a model in the cloud (e.g. AWS).  
**Use:** Lock the LLM choice and cloud approach with stakeholders; support budget and roadmap.

---

## 1. LLM options

### 1.1 Hosted APIs — performance and price

No GPU or server to manage. You get an API key and URL; the app calls the provider. Best for **getting voice chat and avatar live quickly** and scaling with pay-per-use.

| Provider | Free tier | Typical cost (per 1M tokens) | Latency / quality | Best for |
|----------|-----------|-----------------------------|-------------------|----------|
| **Groq** | Yes (rate limits) | Free tier, then pay-as-you-go | Very fast inference | Demos, low cost start |
| **OpenRouter** | ~50 free req/day (free models) | Pass-through, varies by model | Depends on model chosen | One API, try many models (Gemini, Claude, Llama) |
| **Together** | Trial / credits | ~$0.10–0.85/M (e.g. Llama 3.1 8B) | Good; open models | Open models + optional fine-tuning |
| **Google Gemini** | Generous free tier | ~$0.15–0.60/M (Flash) to ~$1.25–10/M (Pro) | Fast (Flash), strong (Pro) | Scaling, multimodal later |
| **OpenAI** | Trial only | ~$0.15–0.60/M (mini) to ~$1.25–10/M+ | Strong reasoning | Premium quality, higher cost |
| **Anthropic (Claude)** | Trial | ~$1–5/M (Haiku) to ~$5–25/M (Opus) | Strong safety, nuance | Wellbeing-adjacent wording |

- **Performance for voice/avatar:** Lower latency = better for real-time feel. Groq and Gemini Flash are among the fastest; Claude/OpenAI offer stronger nuance and safety.
- **Price at demo scale:** Groq or OpenRouter free tier ≈ $0 to start. At growth, budget ~$0.10–0.60 per 1M tokens (open/small models) up to ~$1–10/M for premium models.

### 1.2 Open-source models (Llama, Mistral, etc.) — run yourself

You run an **open-source model** (e.g. Llama, Mistral, Qwen) on **your own or rented GPU** and serve it with **vLLM** (OpenAI-compatible API). Your app keeps calling one URL; you control the model and can fine-tune.

| Aspect | Summary |
|--------|--------|
| **Performance** | Depends on model size and GPU. 7B–8B models on a single GPU: good for chat; 70B or fine-tuned need bigger GPUs. |
| **Price** | No per-token API fee. You pay **compute only**: ~$0.20–0.80/hour (RunPod) or ~$0.50–1.50/hour (AWS EC2 GPU). Only while the instance is on. |
| **What you need** | Cloud GPU (RunPod or AWS EC2), vLLM, optional fine-tuning (LoRA) on your data. See section 2. |
| **Fit** | Full control, custom avatars, demographic tuning, training on your data; more setup and ops. |

**Comparison:** Hosted API = no infra, pay per token, no custom training. Open-source in cloud = you manage (or rent) infra, pay for GPU time, can fine-tune and own the model.

---

## 2. What we need to run a model in the cloud

If we **self-host** an open-source LLM (e.g. on AWS), here’s what’s involved.

### 2.1 Cloud storage (e.g. AWS)

- **What for:** Store **model artifacts** (downloaded base model, fine-tuned weights or LoRA adapters), **logs**, and optionally **training data** (e.g. exported chat/survey data).
- **Where:** AWS **S3** (or equivalent in another cloud). Bucket per environment (e.g. `empathy-coach-models-prod`). Version and secure access (IAM, encryption).
- **Rough cost:** S3 storage is cheap (e.g. a few dollars per month for model weights and logs at demo scale). Data transfer out can add cost if you serve large downloads.

### 2.2 Compute (GPU instances)

- **What for:** Run **vLLM** to serve the model (inference). Optionally a **separate** instance or job for **fine-tuning** (LoRA), then copy weights to the inference instance or S3.
- **Options:**
  - **AWS EC2:** GPU instance types (e.g. `g4dn.xlarge`, `g5.xlarge`). You install vLLM (or use a Docker image), open port 8000, point the app at `http://<instance-ip>:8000/v1/chat/completions`.
  - **RunPod:** GPU pods, often with vLLM templates. Simpler than EC2 for “run a model in the cloud”; you get a public URL for the API.
- **Rough cost:** ~$0.20–0.80/hour (RunPod) to ~$0.50–1.50/hour (EC2 GPU). Only while the instance is **on**; stop when not in use to avoid charges. No free tier for GPU on AWS; RunPod sometimes has new-user credits.

### 2.3 APIs and security

- **How the app calls the model:** The backend (or Netlify function) already sends `POST` to an OpenAI-compatible URL with `userMessage` and `chatHistory`. For self-hosted vLLM, that URL is `http(s)://<your-gpu-host>:8000/v1/chat/completions`. No API key needed for your own vLLM unless you add one.
- **Security:** (1) Restrict who can reach the GPU (firewall / security group: only your backend or a proxy). (2) Prefer HTTPS in production (put vLLM behind a reverse proxy with TLS, or use RunPod’s HTTPS proxy). (3) Do not expose the GPU instance to the whole internet without rate limiting and auth if needed.
- **Cost impact:** No per-request fee for your own vLLM; cost is the GPU instance uptime plus any S3/storage.

---

## 3. Recommendation for first production voice chat and avatar

### Short version

- **First production:** Use a **hosted API** to power voice chat and avatar: **OpenRouter** (to compare models with one integration) or **Groq** (very low cost / free tier, fast). No AWS GPU or storage required for this step.
- **When to add cloud (e.g. AWS):** When you need **custom avatars**, **fine-tuning on your data**, or **strict data sovereignty** — then add a **cloud GPU** (RunPod or AWS EC2) + **vLLM** and optionally **S3** for model artifacts and logs.

### By priority

| Priority | Suggested path | Effort | Cost (demo → growth) |
|----------|----------------|--------|----------------------|
| **Lowest cost, fastest to ship** | **Groq** or **OpenRouter** (free model) for chat; keep current TTS/STT in browser | Low | ~$0 to start; then pay-per-token |
| **Best quality for voice/avatar (hosted)** | **OpenRouter** (Claude or Gemini) or **Gemini** / **Claude** directly | Low | Free tier then ~$0.15–5/M tokens |
| **Full control, custom avatars, fine-tuning** | **Open-source on cloud GPU** (RunPod or AWS EC2 + vLLM, optional S3); later add LoRA fine-tuning | Higher | GPU ~$0.20–1.50/hour when on; S3 cheap |

### Suggested next steps

1. **Now:** Keep using **OpenRouter** (or Groq) for the demo and first production voice chat. Set `LLM_API_KEY` and optional `VLLM_MODEL` in Netlify env; no AWS needed yet.
2. **Evaluate:** Use OpenRouter to try 2–3 models (e.g. Llama, Gemini, Claude) with your avatar prompts and pick one for quality vs cost.
3. **When you need custom avatars or training:** Add **RunPod or AWS EC2** + **vLLM** (see [LINK-CLOUD-LLM.md](./LINK-CLOUD-LLM.md), [OPEN-SOURCE-LLM-FULL-CONTROL.md](./OPEN-SOURCE-LLM-FULL-CONTROL.md)); use **S3** (or equivalent) for model storage and logs.
4. **Compliance:** Keep disclaimers, consent, and signposting (NHS 24, Mind, Samaritans) regardless of LLM or cloud choice.

---

## 4. Reference

- **Hosted vs open-source comparison and pricing:** [LLM-OPTIONS-COMPARISON.md](./LLM-OPTIONS-COMPARISON.md)
- **Step-by-step: link hosted API or run vLLM on AWS/RunPod:** [LINK-CLOUD-LLM.md](./LINK-CLOUD-LLM.md)
- **Open-source in cloud, vLLM, fine-tuning (LoRA):** [OPEN-SOURCE-LLM-FULL-CONTROL.md](./OPEN-SOURCE-LLM-FULL-CONTROL.md)
- **Voice (TTS/STT) for avatar:** [VOICE-OPTIONS-COMPARISON.md](./VOICE-OPTIONS-COMPARISON.md)

*Document version: March 2026. Pricing and offers may have changed; verify on provider sites before commitment.*
