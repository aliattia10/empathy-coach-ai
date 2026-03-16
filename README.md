# ShiftED AI — Empathy Training for Managers

Practice-based empathy and critical thinking training for first-time managers using AI avatars. **Not therapy.**

## Structure

- **`/`** — Main landing page (ShiftED AI platform).
- **`/testing`** — Testing area: Avatar, Scenarios, Progress, Resources, onboarding, login, and all current features.

## Run locally

```sh
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:8080). Use **Go to Testing** or **Enter Testing** to open the app at `/testing`.

### Backend (for chat/LLM)

```sh
cd server
npm install
cp .env.example .env
# Set LLM_API_KEY (e.g. OpenRouter) in server/.env
node server.js
```

See `docs/ENV-VARIABLES-AND-NETLIFY.md` and `docs/TEST-LLM-AND-VOICE.md` for OpenRouter and env setup.

## Deploy (Netlify)

- Build: `npm run build` — publish `dist`.
- Set env vars in Netlify (e.g. `LLM_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). See `docs/ENV-VARIABLES-AND-NETLIFY.md`.

## Tech

- Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- Supabase (auth, survey, chat storage)
- Netlify (hosting + serverless chat function)

## Docs

- `docs/ENV-VARIABLES-AND-NETLIFY.md` — Env vars and OpenRouter
- `docs/TEST-LLM-AND-VOICE.md` — Test LLM and voice
- `docs/NEXT-STEPS-AND-BUDGET.md` — Cloud, voice, avatar roadmap
- `docs/HOW-TO-START-TRAINING-THE-MODEL.md` — Fine-tune with OpenRouter + Supabase
