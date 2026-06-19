# Train the model on Simon feedback + final LLM replies

**Goal:** Bake Simon’s reviewed style into **model weights** (LoRA fine-tune), not only runtime prompts.

**You already have:** RunPod Serverless endpoint `dwmwweatrhzys4` with `Qwen/Qwen2.5-7B-Instruct` — good for **inference today**.

**Training needs:** A **Pod** (GPU) for ~2–4 hours, then update Serverless to serve the merged model.

---

## How it works today vs after training

| | Today (Serverless only) | After LoRA training |
|---|------------------------|---------------------|
| Simon feedback | Loaded from Supabase **every request** | Also **learned in weights** |
| Final LLM replies | Shown to users; not in weights | **Training targets** (assistant text in JSONL) |
| Instruction docs | `skills/` + `buildProductionSystemPrompt.cjs` (same as `chat.js`) | Keep prompt **and** weights aligned |
| Cost | Pay per chat (Serverless) | One-time Pod train (~$1–2) + Serverless |

**Keep both:** Even after training, keep Supabase feedback injection — new Simon notes apply before the next re-train.

---

## Phase 1 — Export data (laptop)

Project: **wxxwxvauseqftyorhkkp**

```powershell
cd "c:\Users\attia\OneDrive\Bureau\Paginas web\New folder\empathy-coach-ai"

$env:VITE_SUPABASE_URL="https://wxxwxvauseqftyorhkkp.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role>"

node scripts/export-training-simon-feedback.js --count-only
node scripts/export-training-simon-feedback.js
Copy-Item train_simon_feedback.jsonl train.jsonl -Force
```

**Default export mode is `turns`** — one JSONL line per assistant reply (~200 lines), not one line per full session. JSONL always looks "compact" in editors (one long JSON object per line); check `train_simon_feedback.summary.json` for real counts.

Optional: `--mode=sessions` (16 full chats) or `--mode=all` (both).

Each line = one conversation or single-turn example:

- **system:** same stack as live `/api/chat` — coach prompt, LLM phases, skills, journey state, global trainer bullets, starred exemplars (see `docs/SUPER-PROMPT-TRAINING-FULL-STACK.md`)
- **user / assistant:** turns with **final active-branch** assistant text (or Simon-reviewed / starred single turns)

**Minimum:** ~50 conversations. If fewer, have Simon review more sessions first.

Service role key: [Supabase API settings](https://supabase.com/dashboard/project/wxxwxvauseqftyorhkkp/settings/api)

---

## Phase 2 — Train on RunPod Pod

Serverless **cannot** train. Use a **Pod** once, then stop it.

### 2.1 Deploy Pod

1. RunPod → **Pods → Deploy**
2. GPU: **RTX 4090 24GB**
3. Template: **RunPod PyTorch**
4. Disk: **100 GB**; optional **Network Volume 50 GB** at `/runpod-volume`
5. Deploy → **Web Terminal**

### 2.2 Install + upload data

```bash
python -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" datasets trl
```

Upload to the Pod:

- `train.jsonl` → `/workspace/train.jsonl`
- `scripts/runpod-train-simon-lora.py` → `/workspace/runpod-train-simon-lora.py`

### 2.3 Run training

```bash
source .venv/bin/activate
cd /workspace

python runpod-train-simon-lora.py \
  --train /workspace/train.jsonl \
  --output /workspace/models/empathy-coach-qwen-merged \
  --epochs 2
```

**Output:** `/workspace/models/empathy-coach-qwen-merged` (merged Qwen 7B + LoRA).

**Stop/terminate the Pod** when finished.

---

## Phase 3 — Serve trained model on Serverless

Option **A** — Network volume (recommended):

1. Save merged model to a **Network Volume**
2. Edit endpoint `dwmwweatrhzys4` (or new endpoint):
   - `MODEL_NAME=/runpod-volume/empathy-coach-qwen-merged`
   - `OPENAI_SERVED_MODEL_NAME_OVERRIDE=empathy-coach-qwen`
3. Redeploy / new release

Option **B** — Keep public base name:

- `MODEL_NAME=/runpod-volume/empathy-coach-qwen-merged`
- `OPENAI_SERVED_MODEL_NAME_OVERRIDE=Qwen/Qwen2.5-7B-Instruct` (same as Netlify today)

### Netlify after training

If you used override `empathy-coach-qwen`:

```env
VLLM_MODEL=empathy-coach-qwen
```

If you kept `Qwen/Qwen2.5-7B-Instruct`, no change.

`VLLM_API_URL` stays:

```env
VLLM_API_URL=https://api.runpod.ai/v2/dwmwweatrhzys4/openai/v1/chat/completions
```

Redeploy Netlify.

---

## Phase 4 — Re-train when Simon adds feedback

```text
1. Simon reviews → new chat_feedback / stars in Supabase
2. Re-run export-training-simon-feedback.js
3. Pod → train again → empathy-coach-qwen-merged-v2
4. Update Serverless volume → redeploy
```

---

## Checklist

- [ ] Export `train.jsonl` (≥50 conversations)
- [ ] Pod train with `runpod-train-simon-lora.py`
- [ ] Merged model on network volume
- [ ] Serverless endpoint updated
- [ ] Netlify `VLLM_MODEL` matches override
- [ ] Compare replies: before vs after on same test sentence
- [ ] Pod terminated (stop billing)

---

## Related files

| File | Purpose |
|------|---------|
| `scripts/export-training-simon-feedback.js` | Supabase → JSONL (full production system prompt) |
| `docs/SUPER-PROMPT-TRAINING-FULL-STACK.md` | Training ↔ production prompt parity |
| `scripts/runpod-train-simon-lora.py` | LoRA train on Pod |
| `docs/SUPER-PROMPT-RUNPOD-OWN-LLM.md` | Full RunPod + Netlify guide |
