import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  estimateTokens,
  estimateMessagesTokens,
  trimMessagesForContext,
} = require("../../skills/llmChatHelpers.cjs");

describe("trimMessagesForContext", () => {
  it("keeps total under 4k budget with a huge latest user message", () => {
    const huge = "x".repeat(20000); // would be ~6.6k tokens alone
    const messages = [
      { role: "system", content: "You are a coach. ".repeat(200) },
      { role: "assistant", content: "Hello — what is going on?" },
      { role: "user", content: "I have a colleague issue." },
      { role: "assistant", content: "Tell me more about the situation." },
      { role: "user", content: huge },
    ];

    const trimmed = trimMessagesForContext(messages, {
      maxContextTokens: 4096,
      reserveOutputTokens: 450,
    });
    const total = estimateMessagesTokens(trimmed);
    expect(total).toBeLessThanOrEqual(4096 - 450 - 100);
    expect(trimmed[trimmed.length - 1].role).toBe("user");
    expect(trimmed[0].role).toBe("system");
    expect(trimmed[trimmed.length - 1].content.length).toBeLessThan(huge.length);
  });

  it("drops old history before truncating the latest user turn too hard", () => {
    const history = [];
    for (let i = 0; i < 20; i++) {
      history.push({ role: "user", content: `User turn ${i}: ${"detail ".repeat(40)}` });
      history.push({ role: "assistant", content: `Coach turn ${i}: ${"reply ".repeat(40)}` });
    }
    const messages = [
      { role: "system", content: "System rules. ".repeat(80) },
      ...history,
      { role: "user", content: "Short latest question about my goal." },
    ];
    const trimmed = trimMessagesForContext(messages, {
      maxContextTokens: 4096,
      reserveOutputTokens: 450,
    });
    expect(estimateMessagesTokens(trimmed)).toBeLessThanOrEqual(4096 - 450 - 100);
    expect(trimmed[trimmed.length - 1].content).toContain("Short latest question");
  });

  it("uses a conservative token estimate", () => {
    expect(estimateTokens("abcd")).toBeGreaterThanOrEqual(2);
  });
});
