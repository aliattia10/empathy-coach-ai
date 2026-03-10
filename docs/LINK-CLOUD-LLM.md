# Step-by-Step Guide: Link a Cloud LLM to the Empathy Coach Platform

Your laptop can’t run the model locally, so you’ll use a **cloud LLM** and point the existing backend at it. The backend already speaks the **OpenAI-compatible** API, so any provider that supports that format will work.

You have two main paths:

| Option | Effort | Cost | Best for |
|--------|--------|------|----------|
| **A. Hosted API (Groq / Together / OpenRouter)** | Low | Pay-per-use, often free tier | Fastest way to go live, no servers |
| **B. Your own GPU in the cloud (AWS / RunPod)** | Higher | VM/GPU hourly | Full control, custom models, fine-tuning later |

Start with **Option A** to get the chat working in minutes, then move to **Option B** when you want your own vLLM/fine-tuned model.

---

## Option A: Hosted API (No GPU, No Server) — Recommended First

Use a hosted OpenAI-compatible API. You only need an API key and the provider’s URL. No GPU or server to manage.

### A1. Groq (very fast, free tier)

1. **Sign up and get an API key**
   - Go to [https://console.groq.com](https://console.groq.com).
   - Sign up or log in.
   - Open **API Keys** and create a key. Copy it.

2. **Configure your backend**
   - In the project, open `server/.env` (create it from `server/.env.example` if needed).
   - Set:

   ```env
   VLLM_API_URL=https://api.groq.com/openai/v1/chat/completions
   LLM_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
   VLLM_MODEL=llama-3.1-8b-instant
   ```

   Replace `gsk_...` with your Groq API key.

3. **Restart the backend**
   - From project root: `npm run server` (or `node server/server.js`).
   - Start the frontend: `npm run dev`. Open the app and use the chat.

**Groq model names** (check [Groq docs](https://console.groq.com/docs) for the latest):  
`llama-3.1-8b-instant`, `llama-3.1-70b-versatile`, `mixtral-8x7b-32768`, etc.

---

### A2. Together (open models, OpenAI-compatible)

1. **Get an API key**
   - Go to [https://api.together.xyz](https://api.together.xyz) and sign up.
   - Create an API key in the dashboard.

2. **Configure `server/.env`**

   ```env
   VLLM_API_URL=https://api.together.xyz/v1/chat/completions
   LLM_API_KEY=your-together-api-key
   VLLM_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
   ```

3. **Restart backend** and run the frontend as in A1.

---

### A3. OpenRouter (one API for many models)

1. **Get an API key**
   - Go to [https://openrouter.ai](https://openrouter.ai), sign up, and create an API key.

2. **Configure `server/.env`**
   - Use the model ID from OpenRouter’s model list (e.g. `meta-llama/llama-3-8b-instruct`).

   ```env
   VLLM_API_URL=https://openrouter.ai/api/v1/chat/completions
   LLM_API_KEY=your-openrouter-api-key
   VLLM_MODEL=meta-llama/llama-3-8b-instruct
   ```

3. **Restart backend** and run the frontend.

---

## Option B: Your Own LLM in the Cloud (e.g. AWS or RunPod)

Use this when you want to run **vLLM** (or another OpenAI-compatible server) on a cloud GPU so you can later **fine-tune on your data** and keep full control.

### B1. AWS — Run vLLM on EC2 (GPU instance)

High-level flow: create a GPU EC2 instance, install vLLM, expose the API, then point your backend at it.

#### Step 1: AWS account and region

- Have an AWS account and choose a region (e.g. `us-east-1`).
- Ensure you can launch **GPU** instances (account limits may apply).

#### Step 2: Launch a GPU EC2 instance

1. In AWS Console go to **EC2 → Launch instance**.
2. **Name:** e.g. `empathy-coach-vllm`.
3. **AMI:** Ubuntu 22.04 LTS.
4. **Instance type:** e.g. `g4dn.xlarge` (1 GPU) or `g5.xlarge`. Check [AWS GPU instances](https://aws.amazon.com/ec2/instance-types/) and pricing.
5. **Key pair:** Create or select one so you can SSH in.
6. **Security group:** Create one that allows:
   - **SSH (22)** from your IP (for setup).
   - **Custom TCP 8000** from your IP or `0.0.0.0/0` (for the LLM API; restrict later if needed).
7. **Storage:** 50–100 GB.
8. Launch the instance and note its **public IP** (e.g. `3.xx.xx.xx`).

#### Step 3: Connect and install vLLM

1. SSH in (replace key and IP):

   ```bash
   ssh -i "your-key.pem" ubuntu@3.xx.xx.xx
   ```

2. Install Docker (if not present):

   ```bash
   sudo apt update && sudo apt install -y docker.io
   sudo usermod -aG docker ubuntu
   # Log out and back in, or run next commands with sudo
   ```

3. Run vLLM with a small model (e.g. Llama 3 8B):

   ```bash
   sudo docker run -d --gpus all -p 8000:8000 \
     vllm/vllm-openai:latest \
     --model meta-llama/Meta-Llama-3-8B-Instruct \
     --served-model-name meta-llama/Meta-Llama-3-8B-Instruct
   ```

   For first run you may need to pass a Hugging Face token if the model is gated:

   ```bash
   sudo docker run -d --gpus all -p 8000:8000 -e HUGGING_FACE_HUB_TOKEN=hf_xxx \
     vllm/vllm-openai:latest \
     --model meta-llama/Meta-Llama-3-8B-Instruct \
     --served-model-name meta-llama/Meta-Llama-3-8B-Instruct
   ```

4. Wait until the model is loaded (logs: `Application startup complete`). Then from your laptop test:

   ```bash
   curl http://3.xx.xx.xx:8000/v1/models
   ```

   You should see the model list.

#### Step 4: Point the Empathy Coach backend at the instance

1. On your **laptop**, in `server/.env`:

   ```env
   VLLM_API_URL=http://3.xx.xx.xx:8000/v1/chat/completions
   VLLM_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
   ```

   Leave `LLM_API_KEY` empty for your own vLLM.

2. Restart your backend: `npm run server`.  
3. Run the frontend: `npm run dev`. Use the chat; it will call the EC2 vLLM.

**Cost:** You pay for the EC2 instance while it’s running. Stop or terminate it when not in use to avoid charges.

---

### B2. RunPod (GPU cloud, often simpler than AWS)

RunPod offers GPU pods with one-click vLLM templates.

1. **Sign up:** [https://runpod.io](https://runpod.io).
2. **Create a Pod:**  
   - Choose a **GPU** (e.g. RTX 4090, A100).  
   - Select a **vLLM template** if available, or use a PyTorch template and install vLLM.
3. **Expose port 8000** in the pod’s network settings (HTTP port 8000).
4. **Start vLLM** inside the pod (SSH or web terminal), e.g.:

   ```bash
   python -m vllm.entrypoints.openai.api_server \
     --model meta-llama/Meta-Llama-3-8B-Instruct \
     --served-model-name meta-llama/Meta-Llama-3-8B-Instruct
   ```

5. RunPod gives you a **public URL** (e.g. `https://xxx-8000.proxy.runpod.net`).  
   In `server/.env`:

   ```env
   VLLM_API_URL=https://xxx-8000.proxy.runpod.net/v1/chat/completions
   VLLM_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
   ```

6. Restart backend and run the frontend.

---

### B3. AWS SageMaker (managed deployment)

SageMaker lets you deploy a Hugging Face model as an endpoint without managing the VM yourself. Setup is heavier (IAM, endpoint config, deployment).

1. In **SageMaker → Inference → Endpoints**, create an endpoint using a **Hugging Face** container and your chosen model.
2. Use **SageMaker’s “invoke endpoint”** API. It is **not** OpenAI-shaped by default, so you have two options:
   - Use a **SageMaker variant** that exposes an OpenAI-compatible API (if your template/partner offers it), or  
   - Add a **small adapter** in your Node backend that maps your current request to “invoke endpoint” and the response back to the shape your frontend expects.

For a first “link an LLM” goal, EC2 + vLLM (B1) or RunPod (B2) is usually simpler than SageMaker.

---

## Checklist: Link Any Cloud LLM

1. **Get an endpoint URL**
   - Hosted API: use the provider’s chat URL (e.g. Groq, Together, OpenRouter).
   - Your own vLLM: use `http://<EC2-or-RunPod-IP-or-host>:8000/v1/chat/completions`.

2. **Get an API key** (only for hosted APIs; leave empty for your own vLLM).

3. **Set `server/.env`:**
   - `VLLM_API_URL=...`
   - `LLM_API_KEY=...` (if needed)
   - `VLLM_MODEL=...` (exact model name the endpoint serves).

4. **Restart backend:** `npm run server`.

5. **Run frontend:** `npm run dev` and test the chat.

---

## Optional: Test the connection from the command line

From your laptop (PowerShell or CMD), with the backend’s `.env` already set:

```bash
curl -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d "{\"userMessage\": \"Hello\", \"chatHistory\": []}"
```

You should get JSON with `reply` containing the model’s answer. If you get “Avatar is currently unavailable”, check backend logs and `VLLM_API_URL` / `LLM_API_KEY`.

---

## Summary

- **Fastest path (no GPU):** Use **Groq** or **Together** (Option A). Create account → get API key → set `server/.env` → restart backend → run frontend.
- **Your own GPU in the cloud:** Use **EC2 + vLLM** (B1) or **RunPod** (B2), then set `VLLM_API_URL` (and optionally `VLLM_MODEL`) in `server/.env` and restart the backend.

Your backend already supports both key-based hosted APIs and a raw vLLM URL; you only need the right URL and key in `server/.env`.
