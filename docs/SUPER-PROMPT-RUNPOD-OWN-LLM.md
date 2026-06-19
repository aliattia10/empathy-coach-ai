# Super Prompt — Your own LLM on RunPod (Supabase data, no Groq)

**Purpose:** End-to-end guide to train and serve **your own empathy-coach model** on RunPod, fine-tuned from **Supabase chat data**, so **chat inference is paid only to RunPod** — not Groq, not OpenRouter.

**Target base weights:** same family as `llama-3.1-8b-instant` → **`meta-llama/Meta-Llama-3.1-8B-Instruct`** (Hugging Face).

**Last updated:** 2026-06-18  
**Supabase project:** `wxxwxvauseqftyorhkkp` (ShiftED / Empathy Coach production)

---

## 0. Your Supabase project (use these exact links)

| What | URL / value |
|------|-------------|
| **Dashboard** | [https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp](https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp) |
| **API URL** (for scripts + Netlify) | `https://wxxwxvauseqftyorhkkp.supabase.co` |
| **SQL Editor** | [https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/sql/new](https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/sql/new) |
| **API keys page** | [https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/settings/api](https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/settings/api) |
| **Auth users (Simon)** | [https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/auth/users](https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/auth/users) |

### Get the service role key (required for export)

1. Open [Settings → API](https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/settings/api).
2. Under **Project API keys**, copy **`service_role`** (secret — never put in frontend or GitHub).
3. Use it only on your laptop for `export-training-simon-feedback.js` or in Netlify for the chat function (`SUPABASE_SERVICE_ROLE_KEY`).

### Align Netlify with this project

In **Netlify → Environment variables**, confirm:

```env
VITE_SUPABASE_URL=https://wxxwxvauseqftyorhkkp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key from API settings page>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — server/chat only>
```

> **Check:** If your local `.env` uses a different project ref (e.g. another `*.supabase.co` URL), exports and live data will not match. Always use **`wxxwxvauseqftyorhkkp`** for this guide.

---

## 1. Your decisions (locked in)

| # | Question | Your answer | Plan |
|---|----------|-------------|------|
| 1 | Data volume in Supabase? | Unsure, but likely some | Run **`--count-only`** first (Phase A) before training |
| 2 | What to train on? | **Simon feedback + final LLM replies** | Script: `scripts/export-training-simon-feedback.js` — active branch + `chat_feedback` from `simon@admin.com` + starred turns |
| 3 | Hugging Face? | Don't have yet, can get it | Phase B0 — 10 min signup + Llama license (required once) |
| 4 | RunPod billing? | **All users, pay only when platform is used** | **RunPod Serverless** for inference (scale to zero). Train on a Pod, then deploy Serverless endpoint — not a 24/7 Pod |
| 5 | Voice / mic? | **Remove for now** | Unset `GROQ_API_KEY`; text-only chat (Phase F) |
| 6 | GDPR / consent? | **Yes** | OK to export stored chats for training; keep `train.jsonl` out of Git |

**Training data definition (what “final LLM response” means in the DB):**

- Each user turn can have multiple regenerated assistant variants.
- The **final** reply is the **active branch** variant (`chat_sessions.active_message_id`), same logic as the avatar UI.
- **Simon feedback** = rows in `chat_feedback` where `admin_user_id` matches `simon@admin.com`.
- **Quality stars** = `chat_messages.admin_quality_star = true` (included when present).

---

## 0. Goal check — you are mostly right, with three corrections

### What you got right

| Your idea | ✓ |
|-----------|---|
| Host the LLM on RunPod cloud | Yes — train + serve on GPU there |
| Use Supabase conversations as training data | Yes — export with `scripts/export-supabase-to-jsonl.js` |
| Stop paying Groq for chat | Yes — point the app at **your vLLM URL**, not Groq |
| Fine-tune so the model matches your coaching style | Yes — LoRA/QLoRA on your JSONL |

### Corrections (important)

| Common assumption | Reality |
|-------------------|---------|
| “Download `llama-3.1-8b-instant` on RunPod” | **`llama-3.1-8b-instant` is Groq’s product name**, not a file you download. On RunPod you pull **`meta-llama/Meta-Llama-3.1-8B-Instruct`** from Hugging Face (same base model family). |
| “Use `LLM_PROVIDER=groq` but point URL at RunPod” | **Wrong for your goal.** That reuses the Groq code path and is confusing. Use the **self-hosted path** (`VLLM_*` vars). Groq provider = Groq API billing. |
| “After training it’s still llama-3.1-8b-instant” | After fine-tune you have **your model**, e.g. `empathy-coach-8b`. Same base weights, different behaviour. |
| “We pay only RunPod” | **Chat LLM:** RunPod only (once migrated). **App hosting:** Netlify (existing). **Database:** Supabase (existing, not an LLM bill). **Voice:** removed for now (Phase F) — no Groq. |

### Architecture (who you pay for what)

```text
User browser
    → Netlify (app + /api/chat function)     ← Netlify bill (unchanged)
    → Supabase (auth, sessions, messages)  ← Supabase bill (unchanged, not LLM)
    → RunPod vLLM (your fine-tuned model)  ← ONLY this for chat AI compute
```

**No Groq / OpenRouter in the chat path** once env vars point at RunPod.

---

## 1b. Questions — answered ✓

See table in §1 above. No blockers except possibly dataset size — check with `--count-only`.

---

## 2. RunPod signup + $10 credit (referral links)

RunPod has **no guaranteed $10 on signup**. There is **no public promo code** that gives flat $10 for free without spending. The best option is the **referral program**.

### Best referral link we found

| Link | Type | What you get |
|------|------|--------------|
| [https://fandf.co/4ulbWhA](https://fandf.co/4ulbWhA) | PartnerStack referral (YouTube creator) | Redirects to RunPod with referral tracking ✓ |
| [https://www.runpod.io/](https://www.runpod.io/) | Direct signup | No referral bonus |
| [RunPod referral docs](https://docs.runpod.io/accounts-billing/referrals) | Official rules | Source of truth |

**Verified:** `fandf.co/4ulbWhA` → `runpod.io/?pscd=get.runpod.io&ps_partner_key=...` (valid referral).

### How the bonus actually works (2026 official rules)

| Step | Action |
|------|--------|
| 1 | **New RunPod account only** — referral does not work on existing accounts |
| 2 | Sign up via [https://fandf.co/4ulbWhA](https://fandf.co/4ulbWhA) |
| 3 | Add payment method + load prepaid credits (e.g. **$15–20**) |
| 4 | **Spend $10** on real GPU usage (training Pod or Serverless) — deposit alone does **not** count |
| 5 | Bonus appears automatically: **$5–$500 random** (EU users: fixed **$5**) |
| 6 | ~96% of non-EU users get **$10 or less** — often **$5**, not exactly $10 |

**Realistic expectation:** Load **$15**, spend **$10** on first training run, receive **~$5–10 bonus** back as RunPod credits (not cash).

### After you have a RunPod account

Your own referral link (to share with the team): [RunPod Referrals Console](https://www.console.runpod.io/user/referrals)

### Signup checklist

- [ ] New email / Google / GitHub account (never used on RunPod before)
- [ ] Sign up through [https://fandf.co/4ulbWhA](https://fandf.co/4ulbWhA)
- [ ] Billing → add **$15–20** credits
- [ ] Complete Phase B training (~$1–3 spend) toward the $10 threshold
- [ ] Check **Billing** for referral bonus after spend

---

## 3. Prerequisites checklist

- [ ] RunPod account + **$15–25** prepaid credits
- [ ] **Hugging Face** (Phase B0 below) — token + Llama 3.1 license
- [ ] Supabase **service role key** (Dashboard → Settings → API)
- [ ] Node.js on your laptop
- [ ] Netlify access (env vars + redeploy)
- [ ] Simon has left feedback and/or starred replies in production (otherwise export will be empty)

---

## Phase A — Export Simon feedback + final LLM replies (laptop)

### Step A0 — Count data first (do this today)

From project root in **PowerShell**:

```powershell
cd "c:\Users\attia\OneDrive\Bureau\Paginas web\New folder\empathy-coach-ai"

$env:VITE_SUPABASE_URL="https://wxxwxvauseqftyorhkkp.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="paste_service_role_key_from_dashboard"

node scripts/export-training-simon-feedback.js --count-only
```

Get `service_role` from: [API settings](https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/settings/api)

You will see:

```text
Sessions total
Simon feedback rows
Starred assistant messages
Training conversations   ← need ≥50 for a solid first train
```

If **Simon feedback rows = 0**, Simon needs to review sessions in the avatar admin UI and save feedback (or star excellent replies) before training.

Optional SQL — run in [SQL Editor](https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/sql/new):

```sql
select count(*) as simon_feedback
from chat_feedback f
join auth.users u on u.id = f.admin_user_id
where lower(u.email) = 'simon@admin.com';

select count(*) as starred_replies
from chat_messages
where admin_quality_star = true and role = 'assistant';
```

### Step A1 — Export training file

```powershell
node scripts/export-training-simon-feedback.js
```

**Output:** `train_simon_feedback.jsonl`

Each line = one conversation with:

- **system:** empathy coach base + Simon’s feedback bullets for that session
- **user / assistant:** turns using **final active-branch** assistant text only (not discarded regenerations)

### Step A2 — Validate

- Minimum **~50 conversations** recommended; script warns if fewer.
- Do **not** commit `train_simon_feedback.jsonl` to GitHub (user content / PII).

### Step A3 — Final file for RunPod

```powershell
Copy-Item train_simon_feedback.jsonl train.jsonl
```

Upload `train.jsonl` to RunPod (Phase B5).

---

## Phase B0 — Hugging Face (one-time, ~10 minutes)

You said you can get this — required before RunPod can download weights.

1. Sign up: [huggingface.co/join](https://huggingface.co/join)
2. Create token: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → **Read** access
3. Open [meta-llama/Meta-Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct) → request access → accept Meta license
4. Save token as `hf_...` — use on RunPod as `HUGGING_FACE_HUB_TOKEN`

---

## Phase B — RunPod: train your model (GPU Pod)

### Step B1 — Create RunPod account (with referral)

1. Open **[https://fandf.co/4ulbWhA](https://fandf.co/4ulbWhA)** (referral — best chance at bonus credits).
2. Sign up with a **new** account (email, Google, or GitHub).
3. **Billing → Add credits** — load **$15–20** (covers training + referral spend threshold).
4. Console: [https://www.console.runpod.io](https://www.console.runpod.io)

### Step B2 — Deploy a training Pod

1. **Pods → Deploy**
2. **GPU:** RTX 4090 24GB (good for 8B LoRA)
3. **Template:** RunPod **PyTorch** or **Unsloth** if available
4. **Container disk:** 100 GB
5. **Volume disk:** 50–100 GB (keeps HF cache + checkpoints across restarts)
6. Expose port **8000** only after training (for serving in Phase C)
7. Deploy → **Connect → Web Terminal**

### Step B3 — Install training stack

```bash
python -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install transformers datasets peft accelerate bitsandbytes trl vllm
```

### Step B4 — Download base model (NOT from Groq)

```bash
export HUGGING_FACE_HUB_TOKEN=hf_your_token

# Hugging Face CLI pull (or let Unsloth download on first train)
huggingface-cli login --token $HUGGING_FACE_HUB_TOKEN
```

**Base model ID:** `meta-llama/Meta-Llama-3.1-8B-Instruct`  
This is the open-weights equivalent of what Groq serves as `llama-3.1-8b-instant`.

### Step B5 — Upload `train.jsonl`

- RunPod **File browser** / `scp` / `wget` from a private bucket
- Place at e.g. `/workspace/train.jsonl`

### Step B6 — Run LoRA fine-tuning (Unsloth)

Use Unsloth’s SFT notebook or script pointed at:

| Setting | Value |
|---------|--------|
| Base model | `meta-llama/Meta-Llama-3.1-8B-Instruct` |
| Dataset | `/workspace/train.jsonl` (`messages` format) |
| Method | LoRA / QLoRA (4-bit saves VRAM) |
| Output | `/workspace/models/empathy-coach-8b-merged` (merged weights recommended) |

**Time:** ~2–4 hours on RTX 4090 depending on dataset size.

**Tip:** Save checkpoints to the **volume disk** so a pod restart does not lose work.

### Step B7 — Verify merged model exists

```bash
ls /workspace/models/empathy-coach-8b-merged
# Expect config.json, tokenizer files, model safetensors
```

---

## Phase C — Serve for production: RunPod Serverless (pay when users chat)

Your requirement: **all users can use the platform, but RunPod charges only when someone sends a message** — not 24/7 idle GPU.

### Recommended path

| Stage | Where | Billing |
|-------|--------|---------|
| **Training** | GPU **Pod** (Phase B) | ~$1–2 one-time, then **stop/terminate** pod |
| **Inference (prod)** | **RunPod Serverless** | Per request / GPU-second; **$0 when idle** |

### Step C1 — Deploy Serverless vLLM endpoint

1. RunPod → **Serverless** → **New Endpoint**
2. Template: search RunPod Hub for **vLLM** worker (or custom handler with your merged model)
3. Upload merged model to RunPod **network volume** or bake into worker image
4. Env: `MODEL_NAME=/runpod-volume/empathy-coach-8b-merged` (path depends on template)
5. GPU: RTX 4090 or L40; enable **FlashBoot** if available (faster cold start)
6. **Min workers: 0**, **Max workers:** scale for your traffic
7. Copy **endpoint ID** + **RunPod API key**

Serverless exposes an OpenAI-compatible URL via RunPod’s proxy, e.g.:

```text
https://api.runpod.ai/v2/<endpoint-id>/openai/v1/chat/completions
```

(Check your endpoint’s **OpenAI compatibility** tab in the RunPod console for the exact URL.)

### Step C2 — Dev / staging alternative (cheap Pod)

For testing before Serverless, use a **Pod** with vLLM on port 8000 (same as before), but **stop the pod** when not testing:

```bash
python -m vllm.entrypoints.openai.api_server \
  --model /workspace/models/empathy-coach-8b-merged \
  --served-model-name empathy-coach-8b \
  --host 0.0.0.0 --port 8000 --max-model-len 8192
```

Proxy: `https://<pod-id>-8000.proxy.runpod.net/v1/chat/completions`

**Do not leave this running in prod** — use Serverless for pay-per-use.

### Step C3 — Test

```bash
curl https://<your-runpod-url>/v1/models
curl https://<your-runpod-url>/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <runpod-api-key-or-local>" \
  -d '{"model":"empathy-coach-8b","messages":[{"role":"user","content":"Hello"}]}'
```

---

## Phase D — Connect Empathy Coach (no Groq, no OpenRouter)

The app’s **self-hosted path** uses `VLLM_*` variables (code label `LLM_PROVIDER=openrouter` is historical — **you are not using OpenRouter** when URL points at RunPod).

### Step D1 — Local dev (`server/.env`)

```env
LLM_PROVIDER=openrouter
VLLM_API_URL=https://<runpod-serverless-or-pod-url>/v1/chat/completions
VLLM_MODEL=empathy-coach-8b
LLM_API_KEY=<runpod-api-key-or-runpod-local>
VLLM_TEMPERATURE=0.55
VLLM_MAX_TOKENS=500
VLLM_TIMEOUT_MS=90000
```

**Remove:** `GROQ_API_KEY`, `GROQ_MODEL`, OpenRouter chat keys.

### Step D2 — Netlify production

| Variable | Value |
|----------|--------|
| `LLM_PROVIDER` | `openrouter` |
| `VLLM_API_URL` | Your RunPod Serverless (or pod) chat completions URL |
| `VLLM_MODEL` | `empathy-coach-8b` |
| `LLM_API_KEY` | RunPod API key or placeholder for self-hosted vLLM pod |

**Delete from Netlify:** `GROQ_API_KEY` (voice removed — see Phase F).

**Redeploy** Netlify after saving.

### Step D3 — Smoke test

```bash
npm run server
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"userMessage\": \"Hello\", \"chatHistory\": []}"
```

Then test avatar chat on the live site.

---

## Phase E — Iterate (re-train as you collect more data)

```text
1. Users chat → Supabase stores messages
2. Simon reviews → feedback + stars (quality data)
3. Re-run: node scripts/export-training-simon-feedback.js
4. Re-train on RunPod Pod → new merged model
5. Update Serverless endpoint model volume → redeploy if needed
```

Version folders e.g. `empathy-coach-8b-v2` help rollback.

---

## 4. Cost summary (RunPod-only for chat LLM)

| Activity | Billing |
|----------|---------|
| First LoRA train (Pod ~3 h) | ~**$1** one-time |
| **Prod inference (Serverless)** | **Pay per chat request**; **$0 when nobody uses the app** |
| Dev Pod left on 24/7 | ~**$245/month** — **avoid** |

**Your setup:** Train on Pod → **terminate Pod** → serve on **Serverless** for all users.

---

## 5. Security before production

- [ ] Restrict who can hit port 8000 (RunPod network rules / API gateway)
- [ ] Do not commit `train.jsonl` (may contain user PII) to GitHub
- [ ] Rate-limit `/api/chat` on Netlify
- [ ] Set RunPod billing alerts

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Export writes 0 conversations | No Simon feedback or stars yet — Simon must review sessions first |
| HF 401 gated model | Accept Llama license; set `HUGGING_FACE_HUB_TOKEN` |
| CUDA OOM during train | Use QLoRA 4-bit; or larger GPU |
| `503 API key not configured` | Set `LLM_API_KEY` in Netlify (non-empty) |
| `404 model not found` | `VLLM_MODEL` must match `--served-model-name` exactly |
| Replies still feel like generic Llama | More/better training data; re-export with correct system prompt |
| Still seeing Groq charges | Chat env still has `LLM_PROVIDER=groq` or Groq URL — switch to `VLLM_*` |

---

## 7. Code map (this repo)

| Piece | Location |
|-------|----------|
| Chat API (self-hosted = `VLLM_*`) | `netlify/functions/chat.js`, `server/server.js` |
| **Simon feedback + final replies export** | `scripts/export-training-simon-feedback.js` |
| **Training = same prompt as production** | `docs/SUPER-PROMPT-TRAINING-FULL-STACK.md`, `skills/buildProductionSystemPrompt.cjs` |
| Legacy full export | `scripts/export-supabase-to-jsonl.js` |
| Env reference | `docs/ENV-VARIABLES-AND-NETLIFY.md` |
| Training overview | `docs/HOW-TO-START-TRAINING-THE-MODEL.md` |
| GPU install details | `docs/CLOUD-GPU-INSTALL-AWS-RUNPOD.md` |

---

## Phase F — Remove voice for now (no Groq)

You chose **text-only** until RunPod chat is stable.

**Netlify:** delete `GROQ_API_KEY` and `OPENAI_API_KEY` (if only used for transcribe).

**App behaviour:** `/api/transcribe` returns unavailable; users type in the chat box. Mic button can stay hidden in UI later if needed.

**Result:** **Zero Groq spend** — only RunPod (when users chat) + Netlify + Supabase.

---

## 9. Master checklist

- [ ] `node scripts/export-training-simon-feedback.js --count-only` → ≥50 training conversations (or Simon adds more feedback)
- [ ] Exported `train_simon_feedback.jsonl` → `train.jsonl`
- [ ] Hugging Face token + Llama 3.1 license (Phase B0)
- [ ] RunPod account + credits
- [ ] Trained merged model on Pod; **terminated** training Pod
- [ ] **Serverless** endpoint live; cold-start tested
- [ ] Netlify: `VLLM_API_URL` + `VLLM_MODEL=empathy-coach-8b`; **no** `GROQ_API_KEY`
- [ ] Redeployed; avatar **text** chat tested
- [ ] RunPod billing alert set

---

## Related links

- Meta Llama 3.1 8B Instruct: https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct
- RunPod: https://www.runpod.io/
- Unsloth: https://github.com/unslothai/unsloth
- vLLM: https://docs.vllm.ai/
