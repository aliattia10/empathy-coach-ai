# ShiftED knowledge base

Atomic markdown docs with YAML front-matter for rule-based retrieval (Simon's Skills and Knowledge Base spec).

- **framework** — theory summaries (adapted; not verbatim worksheets)
- **skill** — procedural coaching moves
- **protocol** — hard rules (crisis first)
- **workbook / resource / persona / example** — supporting material

Runtime loader: `skills/knowledgeBase.cjs` (reads `knowledge-base/index.json`).
Rebuild index: `node scripts/generate-knowledge-base.cjs` then the index writer below regenerates JSON.
