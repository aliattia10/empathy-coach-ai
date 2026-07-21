# Super Prompt — Remove artificial limits (use the full model window)

**Ask:** Prefer no product caps on uploads / chat length if possible.

## Reality

The RunPod coach model still has a **hard GPU context window** (today often **4096 tokens** unless you deploy a larger-context model). That cannot be removed in app code alone.

What we *can* remove are **early artificial caps** that cut documents before the model even sees them.

## What changed (21 Jul 2026)

| Before | After |
|--------|--------|
| Upload extract cut at ~3.5k chars | Full extract sent (up to ~1.5M chars / HTTP safety) |
| PDF capped at 40 pages | All pages extracted |
| File max 4 MB | File max **25 MB** |
| Uploads competed with chat history for ~45% of window | Uploads get **~85%** of the window; older turns drop first |
| Middle of long docs lost | Packer keeps **head + tail** of long text |
| Toast pushed “start a fresh journey” | Softer retry copy |

Server packing still fits requests under `VLLM_MAX_CONTEXT_TOKENS` (default `4096`) so the API does not reject.

## Truly larger capacity (ops)

When you deploy a bigger-context model on RunPod, set in Netlify:

```env
VLLM_MAX_CONTEXT_TOKENS=8192
# or 16384 / 32768 — match the model’s real max
```

Then the same packing code automatically uses the larger window — no further client caps needed.

## Acceptance

- Long PDFs / transcripts upload without a 3.5k cut in the browser.
- Coach still answers (packer may omit the middle of huge docs to fit the GPU window).
- Raising `VLLM_MAX_CONTEXT_TOKENS` increases how much fits without code changes.
