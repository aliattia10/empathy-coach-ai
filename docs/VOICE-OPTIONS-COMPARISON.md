# Voice Response Options for Empathy Coach (TTS & STT)

**Purpose:** Choose how to add **voice input** (speech-to-text) and **voice output** (text-to-speech) to the platform, with a path to an **avatar** later.  
**Use:** Share with stakeholders to compare free, open-source, and paid options.

---

## 1. What you need for voice + avatar

- **Text-to-Speech (TTS)** — Turn the AI’s written replies into spoken audio (for the avatar’s “voice”).
- **Speech-to-Text (STT)** — Turn the user’s spoken input into text for the LLM (optional but needed for full voice conversation).
- **Avatar-ready** — Low latency, natural tone, and (optionally) voice cloning so the avatar has a consistent character voice.

This doc covers **TTS** and **STT** separately, then **all-in-one / avatar-focused** options.

---

## 2. Text-to-Speech (TTS) — options overview

| Type | Examples | Cost | Best for avatar |
|------|-----------|------|------------------|
| **Free** | Google Cloud TTS free tier, Amazon Polly free tier, Gemini API free tier | $0 within limits | Demos, low volume |
| **Open source** | Coqui XTTS, Kokoro, Piper, Qwen3-TTS, MaryTTS, Pocket-TTS | $0 (you run it) | Full control, voice cloning, no per-use cost |
| **Paid** | ElevenLabs, Play.ht, Resemble AI, Google/Azure/AWS pay-as-you-go, Inworld | Per character/minute | Production, quality, low latency |

---

### 2.1 Free TTS (hosted)

| Provider | Free tier | Limits | Notes |
|----------|-----------|--------|--------|
| **Google Cloud Text-to-Speech** | Yes | 4M characters/month (Standard/WaveNet) | Natural voices; pay after (e.g. Neural2 ~$16/1M chars). |
| **Amazon Polly (AWS)** | Yes | 5M chars/month (Standard), 1M (Neural), 500K (Long-Form) first 12 months | Many languages; Neural/Long-Form/Generative after free tier. |
| **Google Gemini API** | Yes (with Gemini free tier) | Follows Gemini quota | TTS via Gemini 2.5 Flash; natural-language control of style, pace, tone. Good for experiments. |
| **ElevenLabs** | Yes | 10,000 characters/month | High quality; upgrade for more. |
| **Play.ht** | Yes | 12,500 characters | Voice cloning; upgrade for volume. |

*Check each provider’s pricing page for current limits.*

---

### 2.2 Open-source TTS (self-hosted or local)

| Project | License | Voice cloning | Latency / real-time | Avatar fit |
|---------|---------|---------------|---------------------|------------|
| **Coqui XTTS** | Coqui Public Model License | Yes (≈6 s sample) | Streaming, &lt;200 ms | Strong: clone “Alex” once, use everywhere. |
| **Kokoro** | MIT | No (fixed voices) | Fast (WebGPU in browser) | Good for fixed avatar voice. |
| **Piper** | MIT | No | Low resource, fast | Good for lightweight/edge avatar. |
| **Qwen3-TTS** | Apache 2.0 | Yes (≈3 s) | ~97 ms | Good for responsive avatar. |
| **MaryTTS** | LGPL | No | — | Multilingual, HTTP API. |
| **Pocket-TTS** | Open source | — | Offline/edge | Embedded or low-resource avatar. |
| **ZeroVOX** | Apache 2.0 | Yes (zero-shot) | Real-time | English/German; LLM backends. |

**Deployment:** Run on your own server or cloud GPU (e.g. same RunPod/EC2 as your LLM). No per-character fee; you pay only for compute.

---

### 2.3 Paid TTS (hosted, production)

| Provider | Typical pricing | Strengths | Avatar fit |
|----------|-----------------|------------|------------|
| **ElevenLabs** | Free 10k chars; then ~$5–99+/month by tier; ~$0.06–0.30/min extra | Quality, emotion control, 10k+ voices, cloning | Very strong for character voice. |
| **Play.ht** | Free 12.5k chars; Creator $39/mo (250k chars); Unlimited $99/mo | Low latency (~150 ms), cloning | Good for real-time avatar. |
| **Resemble AI** | From ~$29/mo (10k s); ~$0.006/s pay-as-you-go | Voice cloning, 149+ languages | Good for custom avatar voice. |
| **Google Cloud TTS** | After free: e.g. $4–16/1M chars (Standard/Neural2); Studio ~$160/1M | Many voices, reliable | Solid for standard avatar. |
| **Azure Speech (TTS)** | Free tier ~0.5M chars/month; then pay per character | STT + TTS in one service | Good if you standardise on Azure. |
| **Amazon Polly** | After free: $4/1M (Standard), $16 (Neural), $30 (Generative) | Caching free; many languages | Reliable for avatar. |
| **Inworld AI** | ~$0.005–0.01/min (competitive for real-time) | Built for conversational AI; &lt;200 ms; voice cloning | **Purpose-built for avatar/conversation.** |

---

## 3. Speech-to-Text (STT) — options overview

Needed when the user **speaks** to the avatar and you send text to the LLM.

| Type | Examples | Cost | Notes |
|------|-----------|------|--------|
| **Free** | Deepgram $200 credit (no card), OpenAI Whisper (self-host free) | $0 within limits | Deepgram: time-limited credit; Whisper: you run it. |
| **Open source** | OpenAI Whisper (MIT) | $0 | Run locally or on your server; 99 languages. |
| **Paid** | Deepgram, Google, Azure, AssemblyAI, OpenAI | Per minute or per hour | Production STT, low latency. |

---

### 3.1 Free STT

| Provider | Free tier | Notes |
|----------|-----------|--------|
| **Deepgram** | $200 free credit, no card | STT (and TTS); credit doesn’t expire. Good to test full voice pipeline. |
| **OpenAI Whisper** | N/A (self-hosted) | Open source (MIT); run on your machine or cloud; no per-minute fee. |
| **Browser Whisper** | Free (client-side) | e.g. Whisper Web; runs in browser; privacy-friendly. |

---

### 3.2 Open-source STT

| Project | License | Use case |
|---------|---------|----------|
| **OpenAI Whisper** | MIT | Self-hosted transcription; 99 languages; multiple sizes (tiny to large). |
| **Whisper-STT (FastAPI)** | — | API-compatible with OpenAI audio API; GPU; optional WebSocket real-time. |

---

### 3.3 Paid STT (hosted)

| Provider | Typical pricing | Notes |
|----------|-----------------|--------|
| **Deepgram** | After $200 credit: e.g. $0.0058–0.0165/min by model | Low latency; good for real-time avatar input. |
| **Google Cloud STT** | Free tier then per minute | Works well with Google TTS. |
| **Azure Speech (STT)** | Free tier then pay-as-you-go | Same account as Azure TTS; unified voice stack. |
| **OpenAI Realtime API** | Audio in $0.06/min, out $0.24/min (+ text tokens) | Full voice conversation (STT + LLM + TTS) in one API. |

---

## 4. All-in-one / avatar-focused options

These combine **voice in**, **LLM**, and **voice out** (and sometimes avatar logic) in one product.

| Option | What it is | Cost | Avatar fit |
|--------|------------|------|------------|
| **Inworld AI** | Voice AI for real-time apps; TTS + conversation; ranked highly for quality | ~$0.005–0.01/min | **Top choice for conversational avatar**: low latency, voice cloning, built for this. |
| **OpenAI Realtime API** | Voice-in + GPT + voice-out in one API; duplex streaming | Audio $0.06/min in, $0.24/min out; + text tokens | Full voice conversation; you add avatar UI on top. |
| **Google Gemini** | Multimodal; can do TTS (e.g. 2.5 Flash); STT via separate Cloud API | Gemini free tier + Cloud TTS/STT pricing | Combine Gemini (LLM + TTS) + Cloud STT for avatar. |
| **Azure Speech** | STT + TTS in one service | Free tier then pay per use | Single vendor for all voice; you plug in your LLM. |

---

## 5. Side-by-side summary (avatar use case)

| Criteria | Free hosted | Open source (TTS/STT) | Paid hosted | All-in-one (Inworld / Realtime) |
|----------|-------------|------------------------|-------------|----------------------------------|
| **Cost to start** | $0 | $0 (you run it) | Free tiers then pay | Free trial / pay per use |
| **Voice cloning** | Limited | Yes (XTTS, Qwen3, ZeroVOX) | Yes (ElevenLabs, Play.ht, Resemble) | Yes (Inworld) |
| **Low latency** | Varies | Possible (XTTS, Kokoro) | Yes (ElevenLabs, Play.ht, Inworld) | Yes (Inworld, Realtime) |
| **Full control / data** | No | Yes | No | No |
| **No per-use fee** | Within limits | Yes (after infra) | No | No |
| **Best for** | Demos, MVP | Custom avatar, GDPR, scale | Production quality | Fastest path to talking avatar |

---

## 6. Suggested path for Empathy Coach

1. **Short term (demos, early avatar)**  
   - **TTS:** Google Cloud TTS or Amazon Polly **free tier**, or **ElevenLabs** free tier.  
   - **STT:** **Deepgram** $200 credit (no card), or **Whisper** in browser/self-hosted.  
   - Gets you a working voice-in/voice-out flow with minimal cost.

2. **Production (scalable, good quality)**  
   - **TTS:** **ElevenLabs** or **Play.ht** (or **Inworld** if you want conversation + voice in one).  
   - **STT:** **Deepgram** or **Azure Speech** (if you use Azure for TTS too).  
   - Keeps latency low and supports a consistent “Alex” (or other avatar) voice.

3. **Full control + avatar voice cloning**  
   - **Open-source TTS:** **Coqui XTTS** or **Qwen3-TTS** on your own/cloud GPU (same as or alongside your LLM).  
   - **Open-source STT:** **Whisper** self-hosted or via a Whisper API.  
   - No per-minute/character fee; you control data and can clone the avatar voice once.

4. **Fastest path to a “talking avatar”**  
   - **Inworld AI** (voice + conversation optimised for avatars) or **OpenAI Realtime API** (you build the avatar UI, they handle voice + LLM).  
   - Evaluate with free tiers/trials, then choose based on cost and quality.

---

## 7. Where to get current pricing and docs

- **ElevenLabs:** [elevenlabs.io/pricing](https://elevenlabs.io/pricing)  
- **Play.ht:** [play.ht](https://play.ht) (pricing on site)  
- **Resemble AI:** [resemble.ai](https://www.resemble.ai)  
- **Inworld AI:** [inworld.ai](https://www.inworld.ai)  
- **Google Cloud TTS:** [cloud.google.com/text-to-speech/pricing](https://cloud.google.com/text-to-speech/pricing)  
- **Google Gemini:** [ai.google.dev/gemini-api/docs/speech-generation](https://ai.google.dev/gemini-api/docs/speech-generation)  
- **Azure Speech:** [azure.microsoft.com/pricing/details/cognitive-services/speech-services](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/)  
- **Amazon Polly:** [aws.amazon.com/polly/pricing](https://aws.amazon.com/polly/pricing/)  
- **Deepgram:** [deepgram.com/pricing](https://deepgram.com/pricing)  
- **OpenAI Realtime:** [developers.openai.com](https://developers.openai.com) (Realtime API docs)  
- **Coqui XTTS:** [github.com/coqui-ai/TTS](https://github.com/coqui-ai/TTS), [docs.coqui.ai](https://docs.coqui.ai)  
- **Kokoro:** [github.com/eduardolat/kokoro-web](https://github.com/eduardolat/kokoro-web)  
- **Whisper:** [github.com/openai/whisper](https://github.com/openai/whisper)

---

## 8. Next steps

- **Decide:** Start with **free/low-cost** (Polly/Deepgram/Whisper) for MVP, or aim straight for **avatar-optimised** (Inworld or Realtime)?  
- **If you want your own voice stack later:** Plan for **open-source TTS (XTTS/Qwen3) + Whisper** on your cloud GPU alongside the LLM (see [OPEN-SOURCE-LLM-FULL-CONTROL.md](./OPEN-SOURCE-LLM-FULL-CONTROL.md)).  
- **Integration:** Your backend can call any of these via REST or WebSocket; the frontend plays audio and (for full voice) captures microphone and sends to STT → LLM → TTS.

*Document version: March 2026. Pricing and offers may have changed; verify on provider sites before commitment.*
