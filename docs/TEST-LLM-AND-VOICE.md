# Test LLM + Voice

**Where to set the OpenRouter key:** See **`docs/ENV-VARIABLES-AND-NETLIFY.md`** (section “Link OpenRouter API”) for Netlify vs local `.env`. Never put the key in a file committed to GitHub.

---

## Live on Netlify

On Netlify, the chat API runs as a **serverless function** and reads env vars from the Netlify dashboard.

1. In Netlify: **Site → Site configuration → Environment variables**
2. Add:
   - `LLM_API_KEY` = your OpenRouter API key (required for real LLM)
   - Optional: `VLLM_API_URL`, `VLLM_MODEL`, `VLLM_TEMPERATURE`, `VLLM_MAX_TOKENS`, `VLLM_TIMEOUT_MS`
3. Redeploy (or trigger a new deploy) so the function gets the new vars.
4. Open your live site → Avatar → Start avatar session → send a message. Voice works in the browser; replies use the LLM when `LLM_API_KEY` is set.

---

## Local

## 1. Link the LLM (OpenRouter free tier)

1. Get an API key from [openrouter.ai](https://openrouter.ai) (no card required).
2. In the project, create `server/.env` (copy from `server/.env.example`).
3. Set in `server/.env`:
   ```env
   VLLM_API_URL=https://openrouter.ai/api/v1/chat/completions
   LLM_API_KEY=your-openrouter-api-key-here
   VLLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
   ```

## 2. Start backend and frontend

**Terminal 1 – backend**
```bash
cd server
npm install
node server.js
```
You should see: `Backend running on port 3001`.

**Terminal 2 – frontend**
```bash
npm run dev
```
Open the URL shown (e.g. http://localhost:8080).

## 3. Test in the app

1. Go to **Avatar** → **Start avatar session** (or open `/avatar/session`).
2. Leave **Voice ON** (default).
3. Type a message in the input (e.g. “I need to give feedback to a team member who missed a deadline”) and send.
4. **Expected:**
   - Status shows “Thinking...” then “Speaking...” or “Ready”.
   - Reply appears in the transcript (from OpenRouter if `LLM_API_KEY` is set, otherwise fallback text).
   - If Voice ON: the reply is read aloud (browser TTS).

If the backend is not running or has no API key, you still get a fallback reply and can test voice with it.
