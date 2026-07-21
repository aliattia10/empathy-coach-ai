# Super Prompt — Upload documents for coach analysis

**Meeting / product need:** Trainers and learners can upload transcripts, PDFs, Word files, or text notes into chat so the LLM can analyse them in context.

## Behaviour

1. User attaches a file (paperclip in chat, or **Upload for analysis** in Session tools).
2. Client extracts text (PDF via pdf.js, DOCX via mammoth, plain text as-is).
3. Message is sent as a normal user turn wrapped as:

```
[Uploaded document for analysis: filename.ext]

Please read and analyse this document…
---
{extracted text, truncated if long}
---
```

4. Coach replies with a short analysis + **one** clarifying question (existing protocol rules).

## Supported types

| Type | Extensions |
|------|------------|
| Text / transcript | `.txt` `.md` `.csv` `.json` `.html` `.log` … |
| PDF | `.pdf` (text-based; scanned images may extract poorly) |
| Word | `.docx` |

Max file size: **4 MB**. Extracted text capped (~**3.5k chars**) for the RunPod **4k** context budget.

## Code map

| Piece | Path |
|-------|------|
| Extract + wrap | `src/lib/readUploadedConversationFile.ts` |
| Chat paperclip | `src/components/chat/ChatInput.tsx` |
| Session tools upload | `src/components/avatar/TrainerSessionTools.tsx` |
| Coach rules | `skills/coachSystemPrompt.cjs` |

## Acceptance

- Any signed-in learner can upload (not admin-only).
- Uploaded content appears in chat history and is passed to `/api/chat`.
- Coach does not invent document content that was not extracted.
