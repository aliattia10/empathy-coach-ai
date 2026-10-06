import { describe, expect, it } from "vitest";
import {
  hasCoachReplyAfterFirstUserMessage,
  shouldOfferReflectionMoment,
} from "./reflectionGating";

describe("reflection gating", () => {
  it("does not count welcome-only assistant message before user speaks", () => {
    expect(
      hasCoachReplyAfterFirstUserMessage([
        { role: "assistant", content: "Welcome" },
      ]),
    ).toBe(false);
  });

  it("requires an assistant reply after the first user message", () => {
    expect(
      hasCoachReplyAfterFirstUserMessage([
        { role: "assistant", content: "Welcome" },
        { role: "user", content: "Hi" },
      ]),
    ).toBe(false);

    expect(
      hasCoachReplyAfterFirstUserMessage([
        { role: "assistant", content: "Welcome" },
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" },
      ]),
    ).toBe(true);
  });

  it("blocks while coach is responding and only once per visit", () => {
    const messages = [
      { role: "assistant" as const },
      { role: "user" as const },
      { role: "assistant" as const },
    ];

    expect(
      shouldOfferReflectionMoment({
        messages,
        isAiResponding: true,
        isCoachWarming: false,
        alreadyShownThisVisit: false,
      }),
    ).toBe(false);

    expect(
      shouldOfferReflectionMoment({
        messages,
        isAiResponding: false,
        isCoachWarming: false,
        alreadyShownThisVisit: true,
      }),
    ).toBe(false);

    expect(
      shouldOfferReflectionMoment({
        messages,
        isAiResponding: false,
        isCoachWarming: false,
        alreadyShownThisVisit: false,
      }),
    ).toBe(true);
  });
});
