import { describe, expect, it } from "vitest";
import {
  buildRegenerationUserPrompt,
  extractExactTargetReply,
} from "../../skills/regenerationHelpers.cjs";

describe("extractExactTargetReply", () => {
  it("extracts reply after explicit prefix", () => {
    const target = extractExactTargetReply([
      {
        feedbackText:
          "Use this exact reply: That sounds really tough. What felt hardest about that conversation for you?",
      },
    ]);
    expect(target).toContain("That sounds really tough");
  });

  it("extracts long coach-style feedback pasted as the desired reply", () => {
    const pasted =
      "I hear how frustrating that meeting was for you. It makes sense you'd feel stuck after that. What would a good outcome look like for you this week?";
    expect(extractExactTargetReply([{ feedbackText: pasted }])).toBe(pasted);
  });

  it("ignores short meta instructions", () => {
    expect(extractExactTargetReply([{ feedbackText: "Be more empathetic and shorter." }])).toBeNull();
  });
});

describe("buildRegenerationUserPrompt", () => {
  it("includes mandatory target block when exact reply is detected", () => {
    const prompt = buildRegenerationUserPrompt({
      originalUserMessage: "My manager ignored me.",
      previousAssistantReply: "Tell me more about your manager.",
      feedbackList: [
        {
          feedbackText:
            "Reply should be: That sounds really tough — what part of that hit you hardest?",
        },
      ],
    });
    expect(prompt).toContain("[MANDATORY TARGET REPLY");
    expect(prompt).toContain("Return the mandatory target reply exactly");
  });
});
