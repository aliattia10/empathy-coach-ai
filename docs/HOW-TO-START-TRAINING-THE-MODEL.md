# How to Start Training the Model

**Goal:** Fine-tune an **open-source LLM** (e.g. Llama, Mistral) on your data so it behaves like **“Alex”** (direct report, defensive but receptive, Socratic) for the empathy coach.  
**Use:** Follow this when you’re ready to move from a base model to a custom-trained one.

---

## Before you start

You need one of these:

1. **A cloud GPU** where you can run training (RunPod or AWS EC2). Same machine can later serve the model with vLLM, or you use one for training and another for serving.
2. **Training data** in the right format (see below).
3. **~2–4 hours** of GPU time for a first LoRA run (depends on data size and model).

If you don’t have a GPU yet, see [OPEN-SOURCE-LLM-FULL-CONTROL.md](./OPEN-SOURCE-LLM-FULL-CONTROL.md) for RunPod/EC2 setup and [LINK-CLOUD-LLM.md](./LINK-CLOUD-LLM.md) for linking the app to the model.

---

## If you don’t have data yet: OpenRouter + Supabase

You can **prepare data for training** in two ways that work together:

1. **Generate synthetic data with OpenRouter** — Use the OpenRouter API (with an open-source model like Llama) to *create* example “manager ↔ Alex” dialogues. Save the responses as `train.jsonl`. No real users needed.
2. **Link the app to Supabase** — Your app already saves conversations to Supabase (`chat_sessions`, `chat_messages`). Over time you collect real data. Then use **Supabase CLI** or a small script to **export** those conversations to JSONL and add them to your training set.

### 1. Generate synthetic training data with OpenRouter

- **What you need:** An [OpenRouter](https://openrouter.ai) API key and a model ID (e.g. `meta-llama/llama-3.2-3b-instruct:free`).
- **Idea:** Call the OpenRouter chat API many times with a prompt that asks the model to *output one training example* (a manager line + Alex’s reply) in a fixed format. Parse the response and append one line to `train.jsonl`.

**Example prompt you can send to OpenRouter:**

```text
You are a data generator for a training set. Output exactly one training example as valid JSON, no other text.

Rules for the example:
- "system": "You are Alex, a direct report. Your manager is practicing delivering difficult feedback. Be slightly defensive but receptive when they use empathetic language and I-statements."
- "user": one short line a manager might say (e.g. about a missed deadline, performance, or conflict).
- "assistant": one short reply Alex would say (defensive but willing to engage).

Output only this JSON (one line): {"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

- Call the API (e.g. 50–100 times with different seeds or a loop), parse each reply, validate the JSON, and write one line per example to `train.jsonl`. You can vary the prompt slightly each time (“focus on feedback”, “focus on conflict”, “focus on saying no”) to get variety.
- **Result:** You get an initial `train.jsonl` with no real user data. You can train on this, then add real data later.

**Script in this repo:** You can generate synthetic data with OpenRouter using the included script:

```bash
# From project root. Set your OpenRouter API key (or LLM_API_KEY).
export OPENROUTER_API_KEY=your_key
# Optional: VLLM_MODEL=meta-llama/llama-3.2-3b-instruct:free

node scripts/generate-training-data-openrouter.js 50
```

This writes **50** examples (default; pass another number as argument) to `train_synthetic.jsonl`. Use that file as your initial `train.jsonl` for Step 3, or merge it with Supabase export later.

### 2. Link to Supabase and export real data later

- **App ↔ Supabase:** Your app already uses Supabase: when a user has a chat session, messages are stored in `chat_sessions` and `chat_messages`. So you’re already “linked”; no extra link needed for *collecting* data.
- **Supabase CLI** (for export once you have data):
  - Install: `npm i -g supabase` or see [Supabase CLI](https://supabase.com/docs/guides/cli).
  - Log in and link the project: `supabase login`, `supabase link --project-ref <your-ref>`.
  - You can’t “export to JSONL” with a single CLI command; the CLI is for migrations and local dev. So use one of these:
    - **Option A (script in this repo):** Run the export script that queries Supabase and writes one line per conversation to `train_from_supabase.jsonl`:
  ```bash
  export VITE_SUPABASE_URL=https://your-project.supabase.co
  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  node scripts/export-supabase-to-jsonl.js
  ```
  Then merge with synthetic: `cat train_synthetic.jsonl train_from_supabase.jsonl > train.jsonl`. Use the **service role key** (Supabase Dashboard → Settings → API) so the script can read all sessions/messages; if you only have the anon key, the script will only see what RLS allows.
    - **Option B:** In Supabase Dashboard → SQL Editor, run a query that returns one row per conversation (e.g. session_id, array of messages). Export as CSV/JSON and then convert to JSONL with a small script.
- **Prepare for training:** Merge this exported file with your synthetic `train.jsonl` (e.g. `cat train_synthetic.jsonl train_from_supabase.jsonl > train.jsonl`). Then run training as in Step 3.

### End-to-end flow when you have no data yet

| Step | Action |
|------|--------|
| 1 | **Generate synthetic data:** Use OpenRouter (open-source model) with the prompt above in a loop; write each response as one line in `train_synthetic.jsonl`. Aim for 50–100+ examples. |
| 2 | **Train:** Use `train_synthetic.jsonl` as `train.jsonl` and run LoRA training (Step 3 below). You now have a first trained model. |
| 3 | **Keep app on Supabase:** Ensure every Avatar/chat session writes to `chat_sessions` and `chat_messages` (your app already does this when the user is signed in). |
| 4 | **Later, export real data:** Run your Supabase export script (or SQL + conversion) to get `train_from_supabase.jsonl`. Combine with `train_synthetic.jsonl` → `train.jsonl`, then re-train to improve the model. |

So: **no data yet** → use **OpenRouter to generate synthetic** → **train on that**; and **Supabase + export script (or CLI/SQL)** to **add real data later** and re-train.

---

## Step 1: Prepare your training data

The model expects **conversations** in a **JSONL** file: one JSON object per line, each with a `messages` array (system, user, assistant).

### Format (one line per conversation)

```json
{"messages": [{"role": "system", "content": "You are Alex, a direct report. Your manager is practicing delivering difficult feedback. Be slightly defensive but receptive when they use empathetic language and I-statements."}, {"role": "user", "content": "I need to talk about the missed deadline."}, {"role": "assistant", "content": "Okay. I know I was late. What do you want to say?"}]}
```

- **system:** Same for all rows (your “Alex” instructions).
- **user:** What the manager says.
- **assistant:** How Alex should reply.

### Where to get data

| Source | How |
|--------|-----|
| **Supabase (real chats)** | Export `chat_sessions` + `chat_messages`: for each session, build a `messages` array (system from your prompt, user/assistant from messages). Write one JSON object per line to `train.jsonl`. |
| **Synthetic (hand-written)** | Write 50–200 short “manager ↔ Alex” dialogues that follow your rules. Mix feedback, conflict, saying no, supporting someone in distress. Save as `train.jsonl`. |
| **Mix** | Start with 30–50 synthetic dialogues, then add exported real conversations (with consent) as you get them. |

**Minimum to start:** ~50–100 conversation turns (e.g. 25–50 full dialogues). More is better; 200+ diverse examples help.

### Example: export from Supabase to JSONL

Conceptually (run in your backend or a script):

1. Query `chat_messages` ordered by `session_id`, `created_at`.
2. Group by session; for each session build:
   - `system`: your fixed Alex system prompt.
   - `user` / `assistant`: from messages where `role` is `user` or `assistant`.
3. Append one line per conversation: `JSON.stringify({ messages: [...] })` to `train.jsonl`.

(Your app already has `chat_sessions` and `chat_messages`; you only need to map them into the `messages` format above.)

---

## Step 2: Choose a base model and tool

- **Base model:** Use the same one you’ll serve (e.g. **Llama 3.2 8B** or **Mistral 7B**). Good balance of quality and VRAM.
- **Tool:** **Unsloth** (faster, less VRAM) or **Hugging Face TRL + PEFT** (LoRA/QLoRA). Both output an adapter (or merged model) you can load in vLLM.

---

## Step 3: Run training on the GPU

**On your RunPod or EC2 instance** (with GPU and enough VRAM, e.g. 24GB for 8B LoRA):

### Option A — Unsloth (recommended for first run)

```bash
# Install
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

# Then run their SFT script or notebook, pointing at:
# - Base model: e.g. "unsloth/Meta-Llama-3.2-8B-Instruct"
# - Your train.jsonl (or a Hugging Face dataset built from it)
# - Output dir for the adapter / merged model
```

See [Unsloth repo](https://github.com/unslothai/unsloth) for their SFT example (notebook or script). They support the `messages` format. Export the **merged** model so vLLM can load a single folder.

### Option B — Hugging Face TRL + PEFT

```bash
pip install transformers datasets peft accelerate bitsandbytes trl
```

Use [SFTTrainer](https://huggingface.co/docs/trl/sft_trainer) with:

- `model`: your base model (e.g. `meta-llama/Meta-Llama-3-8B-Instruct`).
- `dataset`: built from your JSONL (e.g. `datasets.load_dataset("json", data_files="train.jsonl")` and map to the `messages` column).
- LoRA/QLoRA config (e.g. `LoraConfig` from PEFT).
- Save the adapter; then **merge** with the base model and save to a folder (e.g. `empathy-coach-alex-8b`).

---

## Step 4: Serve the trained model with vLLM

After training you have either:

- A **merged model** (full weights in one folder), or  
- A **base model + LoRA adapter** (vLLM can load both if your version supports LoRA).

**Example: serve merged model**

```bash
python -m vllm.entrypoints.openai.api_server \
  --model /path/to/merged_empathy_coach_alex \
  --served-model-name empathy-coach-alex \
  --port 8000
```

If you use **LoRA only**, check vLLM docs for `--enable-lora` and `--lora-modules` (or equivalent) and point to your adapter.

**Point the app at it:** In `server/.env` (or Netlify env if you proxy through your backend):

```env
VLLM_API_URL=http://<your-gpu-host>:8000/v1/chat/completions
VLLM_MODEL=empathy-coach-alex
```

Restart the backend (or redeploy); the app now uses your trained model.

---

## Step 5: Iterate

- **Evaluate:** Run practice conversations in the app; check tone, defensiveness, and receptiveness.
- **Add data:** Put more good examples into `train.jsonl` (synthetic or exported from Supabase).
- **Re-run training** and re-serve; compare before/after.

---

## Checklist

| Step | Action |
|------|--------|
| 1 | Prepare `train.jsonl` with `messages` (system, user, assistant). Use Supabase export and/or synthetic dialogues. |
| 2 | Get a cloud GPU (RunPod or EC2). |
| 3 | Install Unsloth or TRL+PEFT; run LoRA/QLoRA fine-tuning on your base model and `train.jsonl`. |
| 4 | Merge adapter with base (if needed) and serve with vLLM on port 8000. |
| 5 | Set `VLLM_API_URL` and `VLLM_MODEL` in your backend env; test in the app. |
| 6 | Iterate with more data and re-train as needed. |

---

## Reference

- **Full control + vLLM + RunPod/EC2:** [OPEN-SOURCE-LLM-FULL-CONTROL.md](./OPEN-SOURCE-LLM-FULL-CONTROL.md)  
- **Link app to cloud LLM:** [LINK-CLOUD-LLM.md](./LINK-CLOUD-LLM.md)  
- **Unsloth:** [github.com/unslothai/unsloth](https://github.com/unslothai/unsloth)  
- **TRL SFTTrainer:** [huggingface.co/docs/trl/sft_trainer](https://huggingface.co/docs/trl/sft_trainer)

*Document version: March 2026.*
