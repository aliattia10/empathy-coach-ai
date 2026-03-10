# Open-Source LLM: Full Control, Fine-Tuning & Training

This guide is for when you want to **run an open-source model yourself** so you can **control it, fine-tune it, and train it on your data**—no locked-down APIs.

You’ll use:
- A **cloud GPU** (RunPod or AWS EC2) because your laptop can’t run the model.
- **vLLM** to **serve** the model (inference) with an OpenAI-compatible API your backend already calls.
- **Fine-tuning** (e.g. LoRA/QLoRA) on the same or another GPU instance, then serve the fine-tuned model with vLLM.

---

## Overview: Two Phases

| Phase | What you do | Where |
|--------|-------------|--------|
| **1. Serve base model** | Run open-source model with vLLM, connect your app | Cloud GPU (RunPod / EC2) |
| **2. Fine-tune & re-serve** | Train on your data (LoRA), merge, serve new model with vLLM | Same or another GPU instance |

Your **Node backend** never changes: it keeps calling `VLLM_API_URL`; you just point that URL at your own vLLM (base or fine-tuned).

---

## Cost: Is this setup free?

**No.** Running your own open-source model with full control uses **paid** cloud GPUs:

| Provider   | Typical cost (approx.) | Free tier / credits |
|-----------|------------------------|----------------------|
| **RunPod** | ~\$0.20–0.80/hour (RTX 4090) | New-user credits sometimes; otherwise pay per hour |
| **AWS EC2** | ~\$0.50–1.50/hour (g4dn/g5 GPU) | 12-month free tier does **not** include GPU instances |

You only pay while the instance is **on**. Stop the pod/instance when you’re not using it to avoid charges.

**If you need free inference (no fine-tuning):** Use **Groq** or **Together** with their free tier and point your backend at their API. You won’t be able to fine-tune or train; see [LINK-CLOUD-LLM.md](./LINK-CLOUD-LLM.md) and the [server README](../server/README.md) Quick start.

**Summary:** Full control + fine-tuning = paid cloud GPU. Free tier = hosted API (Groq, etc.) without control or training.

---

## Phase 1: Run an Open-Source Model in the Cloud

Pick one: **RunPod** (simplest) or **AWS EC2**. Both give you a URL like `http://<host>:8000/v1/chat/completions` to put in `server/.env`.

### Option 1: RunPod (recommended for speed)

1. **Sign up:** [runpod.io](https://runpod.io) → Create **GPU Pod**.
2. **GPU:** e.g. RTX 4090 (24GB) or A100. Pick a **PyTorch** or **vLLM** template if available.
3. **Connect:** SSH or RunPod’s web terminal.
4. **Install vLLM** (if not in template):
   ```bash
   pip install vllm
   ```
5. **Get a Hugging Face token** (for gated models like Llama): [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
6. **Start the server** (example: Llama 3 8B):
   ```bash
   python -m vllm.entrypoints.openai.api_server \
     --model meta-llama/Meta-Llama-3-8B-Instruct \
     --served-model-name meta-llama/Meta-Llama-3-8B-Instruct \
     --port 8000
   ```
   If the model is gated:
   ```bash
   export HUGGING_FACE_HUB_TOKEN=hf_xxxx
   python -m vllm.entrypoints.openai.api_server \
     --model meta-llama/Meta-Llama-3-8B-Instruct \
     --served-model-name meta-llama/Meta-Llama-3-8B-Instruct \
     --port 8000
   ```
7. **Expose port 8000** in RunPod (e.g. TCP 8000 → public URL). Note the **public URL** (e.g. `https://xxxx-8000.proxy.runpod.net`).
8. **Point your app at it:** in `server/.env`:
   ```env
   VLLM_API_URL=https://xxxx-8000.proxy.runpod.net/v1/chat/completions
   VLLM_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
   ```
   Leave `LLM_API_KEY` empty. Restart backend (`npm run server`), run frontend (`npm run dev`). You now have **full control** over the open-source model in the cloud.

### Option 2: AWS EC2 (GPU instance)

1. **Launch instance:** EC2 → Ubuntu 22.04, instance type e.g. `g4dn.xlarge` or `g5.xlarge`, attach key pair.
2. **Security group:** Allow SSH (22) and **Custom TCP 8000** (from your IP or 0.0.0.0/0).
3. **SSH in** and install Docker, then run vLLM:
   ```bash
   sudo apt update && sudo apt install -y docker.io
   sudo usermod -aG docker ubuntu
   # Re-login or use sudo for next command
   sudo docker run -d --gpus all -p 8000:8000 \
     -e HUGGING_FACE_HUB_TOKEN=hf_xxx \
     vllm/vllm-openai:latest \
     --model meta-llama/Meta-Llama-3-8B-Instruct \
     --served-model-name meta-llama/Meta-Llama-3-8B-Instruct
   ```
4. **Public IP:** e.g. `3.xx.xx.xx`. In `server/.env`:
   ```env
   VLLM_API_URL=http://3.xx.xx.xx:8000/v1/chat/completions
   VLLM_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
   ```

**Good open-source base models (Hugging Face):**
- `meta-llama/Meta-Llama-3-8B-Instruct` (gated)
- `mistralai/Mistral-7B-Instruct-v0.3`
- `HuggingFaceH4/zephyr-7b-beta`
- `Qwen/Qwen2-7B-Instruct`

Use the **exact** model ID as `--model` and as `VLLM_MODEL` in `.env`.

---

## Phase 2: Fine-Tune and Train on Your Data

To **train / fine-tune** the model on your data while keeping full control, use a **separate** (or same) GPU instance for **training**, then **serve** the resulting model with vLLM.

### Where to run fine-tuning

- **Same RunPod/EC2:** Stop vLLM, run training, then start vLLM again with the new model path.
- **Dedicated training instance:** Run training on one GPU pod/instance, copy the trained adapter/weights to the instance that runs vLLM.

### Recommended stack for fine-tuning

- **Framework:** Hugging Face **Transformers** + **PEFT** (LoRA/QLoRA) or **Unsloth** (faster, less VRAM).
- **Data format:** JSONL with `messages` (conversations) or instruction/response pairs. Example:
  ```json
  {"messages": [{"role": "system", "content": "You are Alex, a direct report..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
  ```
- **Output:** A **LoRA adapter** (or merged full model). Save to Hugging Face Hub or copy to the server that runs vLLM.

### Example: LoRA fine-tuning (on GPU instance)

1. **SSH into your GPU instance** (RunPod or EC2).

2. **Option A — Unsloth (fast, low VRAM):**
   ```bash
   pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
   ```
   Then use Unsloth’s [notebook or script](https://github.com/unslothai/unsloth) for SFT: point it at your base model and a JSONL with `messages` (see format below). Export the merged model and serve it with vLLM.

3. **Option B — Hugging Face TRL/PEFT:**
   ```bash
   pip install transformers datasets peft accelerate bitsandbytes trl
   ```
   Use [SFTTrainer](https://huggingface.co/docs/trl/sft_trainer) with a dataset built from your JSONL. Save the adapter; merge with the base model; load the merged model in vLLM.

4. **Prepare data:** Create `train.jsonl` with one JSON object per line:
   ```json
   {"messages": [{"role": "system", "content": "You are Alex, a direct report. Your manager is practicing delivering difficult feedback. Be slightly defensive but receptive to empathetic language."}, {"role": "user", "content": "I need to talk about the missed deadline."}, {"role": "assistant", "content": "Okay. I know I was late. What do you want to say?"}]}
   ```
   You can export real conversations from your Supabase `chat_sessions` and `chat_messages` tables and convert them to this format.

5. **Merge and use with vLLM (optional):** Merge LoRA into the base model and save, then point vLLM at the merged model path. Or use vLLM’s LoRA support if your version supports it.

6. **Serve the fine-tuned model with vLLM:**
   ```bash
   python -m vllm.entrypoints.openai.api_server \
     --model /path/to/merged_or_finetuned_model \
     --served-model-name empathy-coach-alex \
     --port 8000
   ```
   Then set in `server/.env`:
   ```env
   VLLM_API_URL=http://<your-host>:8000/v1/chat/completions
   VLLM_MODEL=empathy-coach-alex
   ```

### Data you can use for training

- **Chat logs:** Export from your app (e.g. Supabase `chat_messages` + `chat_sessions`) into the `messages` JSONL format.
- **Synthetic data:** Write example “manager ↔ Alex” dialogues that follow your rules (defensive but receptive, etc.) and add them to `train.jsonl`.
- **Surveys / feedback:** Turn survey answers and ideal responses into instruction/response pairs.

You keep **full control**: your data, your model, your cloud instance.

---

## Checklist: Open-Source + Full Control

1. **Choose cloud GPU:** RunPod or AWS EC2 (and optionally a second instance for training).
2. **Phase 1:** Install and run **vLLM** with an open-source base model; expose port 8000; set `VLLM_API_URL` and `VLLM_MODEL` in `server/.env`; restart backend and test the app.
3. **Phase 2:** Prepare **train.jsonl** (or similar) with your data; run **LoRA/QLoRA fine-tuning** on the GPU instance; merge/save the model; serve it with vLLM; point `VLLM_API_URL`/`VLLM_MODEL` at the new endpoint.
4. Your **Node backend** stays unchanged; only the URL and model name in `server/.env` change when you switch from base to fine-tuned.

For more options (e.g. SageMaker, other clouds), see [LINK-CLOUD-LLM.md](./LINK-CLOUD-LLM.md).
