# Cloud GPU Install + Training Guide (AWS / RunPod)

This guide shows how to:
- install your training environment in the cloud,
- fine-tune your own model on your own GPU,
- serve it with vLLM,
- connect it to this app,
- estimate monthly costs.

Last pricing check in this doc: **2026-03-25** (always re-check before purchase).

---

## 1) Choose your path

## Option A: RunPod (fastest to start)
- Best for quick setup and lower upfront complexity.
- Good if you want to iterate quickly.

## Option B: AWS (more enterprise control)
- Best for IAM/VPC/security/governance.
- Good if you already run infra on AWS.

---

## 2) Data + model prep (same for both)

1. Prepare training data in JSONL (chat messages format).
2. Keep a fixed system prompt style for consistency.
3. Start with an open-source instruct model:
   - `meta-llama/Meta-Llama-3.1-8B-Instruct` or
   - `mistralai/Mistral-7B-Instruct-v0.3`

Related docs:
- `docs/HOW-TO-START-TRAINING-THE-MODEL.md`
- `docs/SUPABASE-CHAT-SCHEMA.sql`

---

## 3) RunPod path (step-by-step)

1. Create account: [RunPod](https://www.runpod.io/)
2. Open GPU pricing page: [RunPod GPU Pricing](https://www.runpod.io/gpu-pricing)
3. Launch a pod with:
   - GPU: start with RTX 4090 (24GB) for LoRA on 7B/8B
   - Disk: 100-200 GB
   - Template: PyTorch/CUDA
4. Connect to pod terminal.
5. Install dependencies:

```bash
python -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install unsloth transformers datasets peft accelerate bitsandbytes trl vllm
```

6. Upload training file(s), e.g. `train.jsonl`.
7. Run LoRA/QLoRA training (Unsloth or TRL).
8. Export merged model directory (recommended for simpler serving).
9. Start vLLM:

```bash
python -m vllm.entrypoints.openai.api_server \
  --model /workspace/models/empathy-coach-merged \
  --served-model-name empathy-coach \
  --port 8000
```

10. Lock down access (IP allowlist or API gateway) before production use.

---

## 4) AWS path (step-by-step)

1. Create AWS account + IAM user (no root keys for daily use).
2. Choose region (usually closest to users).
3. Launch EC2 GPU instance:
   - Starter training: `g5.xlarge` (A10G 24GB)
   - Higher throughput: larger `g5`/`g6`, or multi-GPU instances
4. Add storage:
   - EBS gp3, typically 200-500 GB for datasets/checkpoints
5. Security group:
   - SSH from your IP only
   - vLLM port (8000) private or restricted
6. SSH in and install dependencies:

```bash
sudo apt update
sudo apt install -y python3-pip git
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install unsloth transformers datasets peft accelerate bitsandbytes trl vllm
```

7. Train LoRA/QLoRA.
8. Save merged model.
9. Serve with vLLM:

```bash
python -m vllm.entrypoints.openai.api_server \
  --model /home/ubuntu/models/empathy-coach-merged \
  --served-model-name empathy-coach \
  --port 8000
```

10. Optional production hardening:
   - Put behind ALB/API Gateway
   - Add WAF and auth
   - Keep instance in private subnet and proxy via backend

---

## 5) Connect trained model to this app

Set backend/Netlify env vars to your vLLM endpoint:

```env
LLM_PROVIDER=openrouter
VLLM_API_URL=http://<gpu-host>:8000/v1/chat/completions
VLLM_MODEL=empathy-coach
```

If you keep Netlify function public, do not expose raw vLLM publicly without auth/rate limits.

---

## 6) Pricing (internet references + planning numbers)

## RunPod references
- Main pricing: [RunPod Pricing](https://www.runpod.io/pricing-page)
- GPU pricing: [RunPod GPU Pricing](https://www.runpod.io/gpu-pricing)

Observed examples from current listings/search snapshots (verify live page before buying):
- RTX 4090: around **$0.34/hr**
- A100 80GB: around **$1.19-$1.39/hr**
- H100 80GB: around **$1.99-$2.69/hr**

## AWS references
- EC2 on-demand: [AWS EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/)
- EBS pricing: [AWS EBS Pricing](https://aws.amazon.com/ebs/pricing/)
- G6 instances: [AWS G6](https://aws.amazon.com/ec2/instance-types/g6/)

Observed example values from current public calculators/search snapshots (region-dependent):
- `g5.xlarge` (A10G): about **$1.006/hr** in us-east-1
- `p4d.24xlarge` (8x A100): about **$21.96/hr** in us-east-1
- `g6.xlarge` (L4): around **$0.98-$1.00/hr** (region-dependent)
- EBS gp3: about **$0.08/GB-month**
- Data transfer out: first **100 GB/month free** (then charged by tier/region)

## Quick monthly examples

Assuming 160 GPU hours/month (roughly 4h/day x 5d/week x 8 weeks):

- RunPod 4090 at $0.34/hr: **~$54/month**
- AWS g5.xlarge at $1.006/hr: **~$161/month**
- AWS p4d at $21.96/hr: **~$3,514/month**

Add storage and network costs on top.

---

## 7) Recommended starting plan

1. Start on **RunPod RTX 4090** for first fine-tune iterations.
2. Move to **AWS g5/g6** when you need governance/compliance or deeper infra control.
3. Keep model size small at first (7B/8B) to control cost and training time.
4. Track:
   - GPU hours
   - tokens generated during eval
   - model quality metrics

---

## 8) Deployment checklist

- [ ] Training data validated (`train.jsonl`)
- [ ] GPU instance running
- [ ] LoRA/QLoRA training completed
- [ ] Model exported and versioned
- [ ] vLLM serving endpoint healthy
- [ ] Backend points to vLLM URL/model
- [ ] Auth/rate limits enabled
- [ ] Cost alerts enabled

---

## 9) Useful links

- RunPod: https://www.runpod.io/
- RunPod GPU pricing: https://www.runpod.io/gpu-pricing
- AWS EC2 pricing: https://aws.amazon.com/ec2/pricing/on-demand/
- AWS EBS pricing: https://aws.amazon.com/ebs/pricing/
- AWS G6: https://aws.amazon.com/ec2/instance-types/g6/
- vLLM docs: https://docs.vllm.ai/
- Unsloth: https://github.com/unslothai/unsloth
- TRL SFTTrainer: https://huggingface.co/docs/trl/sft_trainer
