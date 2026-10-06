/** Minimal message shape for reflection gating tests. */
export type ReflectionGateMessage = { role: "user" | "assistant"; content?: string };

/**
 * Reflection Moment may open only when the coach has replied at least once
 * after the user's first message (welcome starter alone does not count).
 */
export function hasCoachReplyAfterFirstUserMessage(messages: ReflectionGateMessage[]): boolean {
  const firstUserIdx = messages.findIndex((m) => m.role === "user");
  if (firstUserIdx < 0) return false;
  return messages.slice(firstUserIdx + 1).some((m) => m.role === "assistant");
}

export function shouldOfferReflectionMoment(opts: {
  messages: ReflectionGateMessage[];
  isAiResponding: boolean;
  isCoachWarming: boolean;
  alreadyShownThisVisit: boolean;
}): boolean {
  if (opts.alreadyShownThisVisit) return false;
  if (opts.isAiResponding || opts.isCoachWarming) return false;
  return hasCoachReplyAfterFirstUserMessage(opts.messages);
}
