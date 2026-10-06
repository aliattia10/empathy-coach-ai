import { isKnownWorkbookId, WORKBOOK_BY_ID, type WorkbookDefinition } from "@/lib/workbooks";

const WORKBOOK_CLOSED_RE = /\[\[WORKBOOK\]\]([\s\S]*?)\[\[\/WORKBOOK\]\]/gi;
const WORKBOOK_OPEN_RE = /\[\[WORKBOOK\]\]/i;

export type WorkbookRecommendationPayload = {
  id: string;
  reason?: string;
  workbook: WorkbookDefinition;
};

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

function findWorkbookPayloadJson(text: string): string | null {
  const closed = text.match(/\[\[WORKBOOK\]\]([\s\S]*?)\[\[\/WORKBOOK\]\]/i);
  if (closed?.[1]) {
    const json = extractJsonObject(closed[1]);
    if (json) return json;
  }
  const marker = text.search(WORKBOOK_OPEN_RE);
  if (marker < 0) return null;
  const after = text.slice(marker).replace(/^\[\[WORKBOOK\]\]/i, "");
  return extractJsonObject(after);
}

export function parseWorkbookRecommendation(text: string): WorkbookRecommendationPayload | null {
  const json = findWorkbookPayloadJson(text);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as { id?: string; reason?: string };
    const id = typeof parsed?.id === "string" ? parsed.id.trim() : "";
    if (!id || !isKnownWorkbookId(id)) return null;
    return {
      id,
      reason: typeof parsed.reason === "string" ? parsed.reason.trim() : undefined,
      workbook: WORKBOOK_BY_ID[id],
    };
  } catch {
    return null;
  }
}

/** Remove [[WORKBOOK]] blocks (closed or unclosed). */
export function stripWorkbookBlock(text: string): string {
  let out = String(text || "");
  out = out.replace(WORKBOOK_CLOSED_RE, "");
  out = out.replace(/\[\[\/WORKBOOK\]\]/gi, "");
  const openIdx = out.search(WORKBOOK_OPEN_RE);
  if (openIdx >= 0) out = out.slice(0, openIdx).trimEnd();
  return out
    .replace(/\[\[WORKBOOK\]\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
