const MAX_UPLOAD_BYTES = 512_000;
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

export function formatUploadedFileAsUserMessage(filename: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("That file is empty.");
  }
  return `[Uploaded file: ${filename}]\n\n${trimmed}`;
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }
  const buffer = await file.arrayBuffer();
  return new TextDecoder().decode(buffer);
}

export async function readUploadedConversationFile(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large (max 500 KB). Split it or paste a shorter excerpt.");
  }

  const lowerName = file.name.toLowerCase();
  const extension = lowerName.includes(".") ? lowerName.slice(lowerName.lastIndexOf(".")) : "";
  const isPlainText =
    TEXT_EXTENSIONS.has(extension) ||
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    file.type === "application/xml";

  if (!isPlainText) {
    throw new Error(
      "Unsupported file type. Upload plain text files (.txt, .md, .csv, .json, .html, .log, etc.).",
    );
  }

  const text = await readFileText(file);
  return formatUploadedFileAsUserMessage(file.name, text);
}
