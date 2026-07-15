import { jsPDF } from "jspdf";

export type TranscriptMessageRow = {
  role: string;
  content: string;
  created_at: string;
};

export type TranscriptSessionMeta = {
  id: string;
  user_id?: string;
  userLabel?: string;
  scenario?: string;
  session_name?: string | null;
  created_at: string;
};

export function sanitizeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_");
}

export function buildTranscriptPlainText(
  session: TranscriptSessionMeta,
  messages: TranscriptMessageRow[],
): string {
  const lines: string[] = [
    "ShiftED AI - Chat Transcript",
    `Session ID: ${session.id}`,
  ];
  if (session.userLabel || session.user_id) {
    lines.push(`User: ${session.userLabel || session.user_id}`);
  }
  if (session.session_name?.trim()) {
    lines.push(`Journey: ${session.session_name.trim()}`);
  }
  if (session.scenario) {
    lines.push(`Scenario: ${session.scenario}`);
  }
  lines.push(`Session created: ${new Date(session.created_at).toLocaleString()}`, "", "---", "");

  if (messages.length === 0) {
    lines.push("No messages in this session.");
  } else {
    for (const message of messages) {
      lines.push(
        `${message.role.toUpperCase()} - ${new Date(message.created_at).toLocaleString()}`,
        message.content || "(empty message)",
        "",
      );
    }
  }

  return lines.join("\n");
}

export function buildTranscriptPdf(session: TranscriptSessionMeta, messages: TranscriptMessageRow[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 40;
  const right = 40;
  const top = 40;
  const bottom = 40;
  const lineHeight = 14;
  const maxWidth = pageWidth - left - right;
  let y = top;

  const addLine = (text: string, options?: { bold?: boolean; gapAfter?: number }) => {
    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      if (y + lineHeight > pageHeight - bottom) {
        doc.addPage();
        y = top;
      }
      doc.text(line, left, y);
      y += lineHeight;
    }
    y += options?.gapAfter ?? 0;
  };

  addLine("ShiftED AI - Chat Transcript", { bold: true, gapAfter: 6 });
  addLine(`Session ID: ${session.id}`);
  if (session.userLabel || session.user_id) {
    addLine(`User: ${session.userLabel || session.user_id}`);
  }
  if (session.session_name?.trim()) {
    addLine(`Journey: ${session.session_name.trim()}`);
  }
  if (session.scenario) {
    addLine(`Scenario: ${session.scenario}`);
  }
  addLine(`Session created: ${new Date(session.created_at).toLocaleString()}`, { gapAfter: 8 });
  addLine("------------------------------------------------------------", { gapAfter: 4 });

  if (messages.length === 0) {
    addLine("No messages in this session.");
  } else {
    messages.forEach((message, index) => {
      addLine(
        `${message.role.toUpperCase()} - ${new Date(message.created_at).toLocaleString()}`,
        { bold: true },
      );
      addLine(message.content || "(empty message)", { gapAfter: 6 });
      if (index < messages.length - 1) addLine(" ");
    });
  }

  return doc;
}

export function buildTranscriptFilename(
  session: TranscriptSessionMeta,
  extension: "pdf" | "txt" = "pdf",
) {
  const createdDate = new Date(session.created_at).toISOString().slice(0, 10);
  const safeUser = sanitizeFilename(session.userLabel || session.user_id || "session");
  const safeSession = sanitizeFilename(session.id.slice(0, 8));
  return `chat-transcript-${safeUser}-${createdDate}-${safeSession}.${extension}`;
}

export function downloadTranscriptPdf(session: TranscriptSessionMeta, messages: TranscriptMessageRow[]) {
  const doc = buildTranscriptPdf(session, messages);
  doc.save(buildTranscriptFilename(session, "pdf"));
}

export function downloadTranscriptTxt(session: TranscriptSessionMeta, messages: TranscriptMessageRow[]) {
  const text = buildTranscriptPlainText(session, messages);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerBlobDownload(blob, buildTranscriptFilename(session, "txt"));
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
