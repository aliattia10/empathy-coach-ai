import { describe, expect, it } from "vitest";
import { parseWorkbookRecommendation, stripWorkbookBlock } from "./workbookRecommendation";
import { sanitizeAssistantDisplayContent } from "./goalExtraction";

describe("workbook recommendation parsing", () => {
  it("parses a known workbook id and strips the block from display", () => {
    const raw =
      'Sounds like Active Listening would help.\n[[WORKBOOK]]{"id":"wb_active_listening","reason":"They interrupt"}[[/WORKBOOK]]';
    const parsed = parseWorkbookRecommendation(raw);
    expect(parsed?.id).toBe("wb_active_listening");
    expect(parsed?.workbook.title).toContain("Active Listening");
    expect(sanitizeAssistantDisplayContent(raw)).not.toContain("[[WORKBOOK]]");
    expect(sanitizeAssistantDisplayContent(raw)).toContain("Active Listening would help");
  });

  it("rejects invented workbook ids", () => {
    const raw = '[[WORKBOOK]]{"id":"wb_made_up","reason":"x"}[[/WORKBOOK]]';
    expect(parseWorkbookRecommendation(raw)).toBeNull();
    expect(stripWorkbookBlock(raw).trim()).toBe("");
  });

  it("strips workbook alongside progress blocks", () => {
    const raw =
      'Nice work.\n[[PROGRESS]]{"summary":"Goal: practice"}[[/PROGRESS]]\n[[WORKBOOK]]{"id":"wb_self_reflection","reason":"pause"}[[/WORKBOOK]]';
    const display = sanitizeAssistantDisplayContent(raw);
    expect(display).toBe("Nice work.");
    expect(parseWorkbookRecommendation(raw)?.id).toBe("wb_self_reflection");
  });
});
