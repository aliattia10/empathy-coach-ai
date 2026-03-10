# Empathy Coach Backend (vLLM proxy)

Express server that proxies chat requests from the React frontend to your LLM endpoint (OpenAI-compatible API).

**Easiest & free (no control):** Use **Groq** (no GPU, no server). See [Quick start: Groq (free)](#quick-start-groq-free) below.

**Open-source + full control (fine-tune, train on your data):** See **[OPEN-SOURCE-LLM-FULL-CONTROL.md](../docs/OPEN-SOURCE-LLM-FULL-CONTROL.md)** — run your own model on a cloud GPU (RunPod or AWS EC2), then fine-tune with LoRA and serve with vLLM.

**Compare all options (for client):** See **[LLM-OPTIONS-COMPARISON.md](../docs/LLM-OPTIONS-COMPARISON.md)** — hosted APIs (Gemini, OpenRouter, Groq, ChatGPT, Together, Claude) vs open-source, with pricing and decision framework.

**Voice (TTS/STT) for avatar:** See **[VOICE-OPTIONS-COMPARISON.md](../docs/VOICE-OPTIONS-COMPARISON.md)** — free, open-source, and paid voice options (ElevenLabs, Play.ht, Inworld, Whisper, Coqui XTTS, etc.) with avatar use in mind.

**Other cloud options:** See **[LINK-CLOUD-LLM.md](../docs/LINK-CLOUD-LLM.md)** (Together, OpenRouter, AWS, RunPod).

---

### Quick start: OpenRouter (free LLM + voice)

1. Sign up at **[openrouter.ai](https://openrouter.ai)** and create an **API Key** (no card; free tier ~20 req/min, 200/day).
2. In the `server` folder, copy `.env.example` to `.env` and set `LLM_API_KEY=your-openrouter-key`. The example already points to OpenRouter and a free model.
3. From project root run `npm run server`, then `npm run dev`. Chat uses the free LLM; assistant replies can be **played aloud** (browser voice) via the speaker icon or the "Voice on" toggle in the chat header.

### Quick start: Groq (free)

1. Sign up at **[console.groq.com](https://console.groq.com)** and create an **API Key**.
2. In the `server` folder, copy `.env.example` to `.env` and set:
   ```env
   VLLM_API_URL=https://api.groq.com/openai/v1/chat/completions
   LLM_API_KEY=gsk_your_key_here
   VLLM_MODEL=llama-3.1-8b-instant
   ```
3. From project root run `npm run server`, then `npm run dev`. Chat will use Groq’s free tier.

## Setup

1. Install dependencies:
   ```bash
   cd server && npm install
   ```

2. Copy env example and set your vLLM URL:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `VLLM_API_URL` to your deployed vLLM endpoint (e.g. `http://your-gpu-server:8000/v1/chat/completions`).

3. Start the backend:
   ```bash
   npm start
   ```
   Server runs on port 3001 by default (`PORT` in `.env` to override).

## Run full stack

1. Start vLLM (your cloud/Docker instance).
2. Start this backend: `cd server && npm start`
3. Start the frontend: from project root, `npm run dev`
4. Open the app (e.g. http://localhost:8080) and use the chat; requests go Frontend → Vite proxy → Express → vLLM.

If the backend or vLLM is unavailable, the chat falls back to a simulated response so you can still develop the UI.
