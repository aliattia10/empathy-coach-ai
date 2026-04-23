import { describe, expect, it } from "vitest";
import { composeRegenerationPrompt } from "@/lib/regenerationPrompt";
import type { ChatFeedback } from "@/hooks/useChatSession";

const baseFeedback: ChatFeedback = {
  id: "f-1",
  conversation_id: "c-1",
  message_id: "m-1",
  admin_user_id: "a-1",
  feedback_text: "Be more empathetic and less verbose.",
  rating: 2,
  tags: ["empathy", "too_long"],
  created_at: new Date().toISOString(),
};

describe("composeRegenerationPrompt", () => {
  it("includes all core sections and feedback text", () => {
    const prompt = composeRegenerationPrompt({
      originalUserInput: "I need to give feedback to my teammate.",
      previousAssistantOutput: "Try saying exactly this in your next meeting...",
      feedbackList: [baseFeedback],
    });

    expect(prompt).toContain("[Original user message]");
    expect(prompt).toContain("[Previous assistant reply]");
    expect(prompt).toContain("[Admin feedback summary]");
    expect(prompt).toContain("[What to improve]");
    expect(prompt).toContain("[Safety constraints]");
    expect(prompt).toContain("Be more empathetic and less verbose.");
  });

  it("summarizes ratings and tags across multiple feedback entries", () => {
    const prompt = composeRegenerationPrompt({
      originalUserInput: "Context",
      previousAssistantOutput: "Previous answer",
      feedbackList: [
        baseFeedback,
        {
          ...baseFeedback,
          id: "f-2",
          feedback_text: "Improve clarity.",
          rating: 4,
          tags: ["clarity"],
        },
      ],
    });

    expect(prompt).toContain("Average 3.0/5 from 2 rating(s)");
    expect(prompt).toContain("empathy (1)");
    expect(prompt).toContain("too_long (1)");
    expect(prompt).toContain("clarity (1)");
  });

  it("handles missing ratings and tags gracefully", () => {
    const prompt = composeRegenerationPrompt({
      originalUserInput: "Context",
      previousAssistantOutput: "Previous answer",
      feedbackList: [
        {
          ...baseFeedback,
          rating: null,
          tags: [],
        },
      ],
    });

    expect(prompt).toContain("Rating signals: No ratings");
    expect(prompt).toContain("Tag priorities: No tags");
  });
});
