# Environment Variables — Linked to Netlify & Local

**Use:** One place for all env vars. Set the same keys in **Netlify** (for the live site) and in **local `.env`** (for dev). Supabase vars are required for auth, survey storage, and exporting data for training.

**Do not put API keys in GitHub.** Use Netlify’s environment variables for the live site, and local `.env` files (which are in `.gitignore`) for development. Never commit `.env` or paste real keys into any file that is pushed to the repo.

---

## Link OpenRouter API (quick guide)

**Where to put the key:**  
- **Live site (Netlify):** Netlify → your site → **Site configuration** → **Environment variables**.  
- **Local dev:** In a **`server/.env`** file (create from `server/.env.example`). This file is in `.gitignore` and must **not** be committed to GitHub.

**Steps:**

1. **Get an API key:** Sign up at [openrouter.ai](https://openrouter.ai) and create an API key (free tier available, no card).
2. **For the live site (Netlify):**  
   - Open Netlify → your project → **Site configuration** → **Environment variables**.  
   - Click **Add a variable** (or **Edit** if they already exist).  
   - Add:  
     - **Key:** `LLM_API_KEY` → **Value:** your OpenRouter API key.  
     - Optional: `VLLM_API_URL` = `https://openrouter.ai/api/v1/chat/completions`, `VLLM_MODEL` = `meta-llama/llama-3.2-3b-instruct:free`.  
   - Save, then trigger a **new deploy** so the serverless chat function gets the key.
3. **For local development:**  
   - Copy `server/.env.example` to `server/.env`.  
   - In `server/.env` set `LLM_API_KEY=your-openrouter-api-key`.  
   - Do **not** commit `server/.env` to GitHub (it’s already in `.gitignore`).

**Other guides in this repo:**  
- **Full env list and Netlify:** this file (`docs/ENV-VARIABLES-AND-NETLIFY.md`).  
- **Test LLM and voice (local + Netlify):** `docs/TEST-LLM-AND-VOICE.md`.  
- **Cloud LLM options (OpenRouter, Groq, self-hosted):** `docs/LINK-CLOUD-LLM.md`.

---

## Netlify (deployed app)

**Where:** Netlify → your site → **Site configuration** → **Environment variables** → **Add a variable** / **Edit**.

Add these so the **live site** works:

| Variable | Required | Description |
|----------|----------|-------------|
| **LLM_API_KEY** | Yes (for chat) | OpenRouter API key (or other open-source LLM provider). Used by the serverless `/api/chat` function. |
| **VLLM_API_URL** | No (has default) | Chat API URL. Default: `https://openrouter.ai/api/v1/chat/completions`. |
| **VLLM_MODEL** | No (has default) | Model id, e.g. `meta-llama/llama-3.2-3b-instruct:free`. |
| **VITE_SUPABASE_URL** | Yes | Supabase project URL, e.g. `https://YOUR_PROJECT_REF.supabase.co`. Needed for auth, survey, chat storage. |
| **VITE_SUPABASE_PUBLISHABLE_KEY** | Yes | Supabase anon/public key. Needed for auth and Supabase client in the browser. |

Optional (for the chat function):

| Variable | Description |
|----------|-------------|
| VLLM_TEMPERATURE | e.g. `0.7` |
| VLLM_MAX_TOKENS | e.g. `500` |
| VLLM_TIMEOUT_MS | e.g. `60000` |

**Important:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are **baked into the frontend at build time**. If they’re missing in Netlify, the deployed app won’t be able to reach Supabase (login, survey, saving chats). Add them in Netlify with the same values as in your local `.env`.

---

## Local development

**Frontend (Vite):** Use a `.env` file in the **project root** (or `env` in the Vite config). Vite only exposes variables that start with `VITE_`.

**Backend (server):** Use `server/.env` for the Express server (or copy from `server/.env.example`).

### Root `.env` (frontend + scripts)

```env
# Supabase (required for auth, survey, chat storage)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### `server/.env` (local backend / LLM)

```env
VLLM_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_API_KEY=your-openrouter-api-key
VLLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

### Scripts (generate data, export Supabase)

- **Generate synthetic training data:** `OPENROUTER_API_KEY` or `LLM_API_KEY`; optional: `VLLM_API_URL`, `VLLM_MODEL`.
- **Export Supabase to JSONL:** `VITE_SUPABASE_URL` (or `SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY` if you only have anon key).

---

## Where each variable is used

| Variable | Used by |
|----------|--------|
| LLM_API_KEY | Netlify function `netlify/functions/chat.js`, `server/server.js`, `scripts/generate-training-data-openrouter.js` |
| VLLM_API_URL | Same as above |
| VLLM_MODEL | Same as above |
| VITE_SUPABASE_URL | Frontend `src/integrations/supabase/client.ts`, `scripts/export-supabase-to-jsonl.js` |
| VITE_SUPABASE_PUBLISHABLE_KEY | Frontend `src/integrations/supabase/client.ts` |
| SUPABASE_SERVICE_ROLE_KEY | `scripts/export-supabase-to-jsonl.js` only (for full export; not needed in Netlify) |

---

## Checklist: link Netlify to your setup

1. **Netlify → Environment variables:** Add (or confirm) **VITE_SUPABASE_URL** and **VITE_SUPABASE_PUBLISHABLE_KEY** with the same values as in your root `.env`.
2. **Redeploy** (or trigger a new deploy) so the new build gets the Supabase vars.
3. **LLM:** You already have **LLM_API_KEY**, **VLLM_API_URL**, **VLLM_MODEL** in Netlify; no change needed unless you switch provider or model.

After that, the live site will have both **chat (OpenRouter/open-source LLM)** and **Supabase (auth, survey, storage)** correctly linked.

---

## See also

- **Root:** `.env.example` — Supabase vars for frontend; copy to `.env` for local dev.
- **Server:** `server/.env.example` — LLM vars for local backend and for reference (Netlify uses its own env for the function).
