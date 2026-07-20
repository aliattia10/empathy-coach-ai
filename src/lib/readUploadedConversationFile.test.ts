import { describe, expect, it } from "vitest";
import {
  formatUploadedFileAsUserMessage,
  readUploadedConversationFile,
} from "./readUploadedConversationFile";

describe("readUploadedConversationFile", () => {
  it("rejects unsupported binary types", async () => {
    const file = new File(["abc"], "photo.png", { type: "image/png" });
    await expect(readUploadedConversationFile(file)).rejects.toThrow(/Unsupported file type/);
  });

  it("accepts plain text transcripts", async () => {
    const file = new File(["User: hello\nCoach: hi"], "transcript.txt", { type: "text/plain" });
    const message = await readUploadedConversationFile(file);
    expect(message).toContain("[Uploaded document for analysis: transcript.txt]");
    expect(message).toContain("User: hello");
  });
});

describe("formatUploadedFileAsUserMessage", () => {
  it("wraps uploaded text for the coach with analysis instructions", () => {
    const message = formatUploadedFileAsUserMessage("notes.txt", "Hello scenario notes");
    expect(message).toContain("[Uploaded document for analysis: notes.txt]");
    expect(message).toContain("Please read and analyse");
    expect(message).toContain("Hello scenario notes");
  });

  it("rejects empty content", () => {
    expect(() => formatUploadedFileAsUserMessage("empty.txt", "   ")).toThrow(/empty/i);
  });
});
