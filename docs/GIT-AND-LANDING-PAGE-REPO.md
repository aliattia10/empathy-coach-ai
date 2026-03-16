# Git identity and landing page repo

## Git login for this repo

This repo is configured to use **aliattia10** for commits (local config):

- **user.name:** `aliattia10`
- **user.email:** `attiaali853@gmail.com`

To change it (e.g. different email):

```bash
git config user.name "aliattia10"
git config user.email "your-email@example.com"
```

Remote `origin` is already set to your GitHub repo:  
`https://github.com/aliattia10/empathy-coach-ai.git`

---

## ShiftED-AI-Landing-Page repo (you’re a collaborator)

**Repo:** https://github.com/KLDavies2016/ShiftED-AI-Landing-Page

Because you’re a collaborator, clone it from **your own terminal** (where you’re logged in to GitHub). If the repo is private, the clone from inside Cursor/automation may fail with “Repository not found”.

### Option A: Clone and copy content

Run these in your project folder (e.g. in PowerShell or Git Bash):

```bash
# Clone the landing page repo (you have access as collaborator)
git clone https://github.com/KLDavies2016/ShiftED-AI-Landing-Page.git shifted-landing-temp
cd shifted-landing-temp
```

Then copy the landing page files (HTML, React components, or styles) into this project — e.g. into `src/pages/MainLandingPage.tsx` or new components — and adapt colors to the platform (gradient, `#a16ae8`, `#f8f6f6`). Remove any Lovable branding. When done:

```bash
cd ..
rm -rf shifted-landing-temp
```

(On Windows PowerShell you can use `Remove-Item -Recurse -Force shifted-landing-temp`.)

### Option B: Add as a git remote and fetch

```bash
# From empathy-coach-ai root
git remote add landing https://github.com/KLDavies2016/ShiftED-AI-Landing-Page.git
git fetch landing

# Inspect or checkout files from the landing repo
git checkout landing/main -- .
# Or create a branch and copy only the files you need, then adapt to platform colors.
```

After you bring in the landing page:

- Keep **main site** at **`/`** and **testing** at **`/testing`** (see `src/App.tsx`).
- Use this project’s **platform colors** and remove any Lovable branding from the landing content.
