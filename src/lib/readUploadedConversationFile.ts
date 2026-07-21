const MAX_UPLOAD_BYTES = 4_000_000; // 4 MB
const MAX_EXTRACTED_CHARS = 3_500; // ~1k tokens — leave room for system + history in 4k models

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".json",
  ".html",
  ".htm",
  ".xml",
  ".log",
  ".rtf",
  ".yaml",
  ".yml",
]);

const PDF_EXTENSIONS = new Set([".pdf"]);
const DOCX_EXTENSIONS = new Set([".docx"]);

export const UPLOAD_ACCEPT =
  ".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.log,.rtf,.yaml,.yml,.pdf,.docx,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function formatUploadedFileAsUserMessage(filename: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("That file is empty or no text could be extracted.");
  }
  const body =
    trimmed.length > MAX_EXTRACTED_CHARS
      ? `${trimmed.slice(0, MAX_EXTRACTED_CHARS)}\n\n[…truncated for length — uploaded ${trimmed.length} characters total…]`
      : trimmed;

  return `[Uploaded document for analysis: ${filename}]

Please read and analyse this document in the context of our coaching conversation. Summarise what matters for my situation, name any useful insights or risks, and ask exactly one clear question to help me use it.

---
${body}
---`;
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    try {
      return await file.text();
    } catch {
      /* fall through */
    }
  }
  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsText(file);
  });
}

function extensionOf(filename: string): string {
  const lower = filename.toLowerCase();
  return lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker (pdf.js 4.x)
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  const maxPages = Math.min(pdf.numPages, 40);
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? String(item.str) : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (line) pages.push(line);
  }
  if (pdf.numPages > maxPages) {
    pages.push(`[…${pdf.numPages - maxPages} more page(s) not extracted…]`);
  }
  return pages.join("\n\n");
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

export async function readUploadedConversationFile(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large (max 4 MB). Try a shorter PDF/DOCX or paste an excerpt.");
  }

  const extension = extensionOf(file.name);
  const isPlainText =
    TEXT_EXTENSIONS.has(extension) ||
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    file.type === "application/xml";
  const isPdf =
    PDF_EXTENSIONS.has(extension) || file.type === "application/pdf";
  const isDocx =
    DOCX_EXTENSIONS.has(extension) ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  let text = "";
  if (isPdf) {
    try {
      text = await extractPdfText(file);
    } catch (err) {
      console.error(err);
      throw new Error("Could not read that PDF. Try exporting it as text, or paste the content.");
    }
  } else if (isDocx) {
    try {
      text = await extractDocxText(file);
    } catch (err) {
      console.error(err);
      throw new Error("Could not read that Word document. Try .txt or paste the content.");
    }
  } else if (isPlainText) {
    text = await readFileText(file);
  } else {
    throw new Error(
      "Unsupported file type. Upload PDF, Word (.docx), or text (.txt, .md, .csv, .json, etc.).",
    );
  }

  return formatUploadedFileAsUserMessage(file.name, text);
}
