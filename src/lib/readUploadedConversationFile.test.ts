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
});

describe("formatUploadedFileAsUserMessage", () => {
  it("wraps uploaded text for the coach", () => {
    const message = formatUploadedFileAsUserMessage("notes.txt", "Hello scenario notes");
    expect(message).toContain("[Uploaded file: notes.txt]");
    expect(message).toContain("Hello scenario notes");
  });

  it("rejects empty content", () => {
    expect(() => formatUploadedFileAsUserMessage("empty.txt", "   ")).toThrow(/empty/i);
  });
});
