import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  detectEmotions,
  detectIntents,
  formatKnowledgeForPrompt,
  retrieveKnowledge,
  routeSkills,
} = require("../../skills/knowledgeBase.cjs");

describe("knowledgeBase skill router", () => {
  it("routes afternoon scrolling to behavioural activation / micro goals", () => {
    const text = "I can't stop scrolling at 3:30pm instead of finishing my reports";
    const route = routeSkills(text);
    expect(route.protocolId).toBeNull();
    expect(route.skillIds[0]).toBe("behavioral_activation");
    expect(route.skillIds).toEqual(expect.arrayContaining(["behavioral_activation"]));
    expect(detectIntents(text)).toContain("activation");
  });

  it("routes overwhelm and panic to grounding", () => {
    const text = "I feel overwhelmed and panicky";
    const route = routeSkills(text);
    expect(route.skillIds[0]).toBe("grounding_and_breathing");
    expect(detectEmotions(text)).toEqual(expect.arrayContaining(["panic", "overwhelm"]));
  });

  it("prioritises crisis protocol over coaching skills", () => {
    const text = "I want to die and I have a plan to kill myself";
    const route = routeSkills(text);
    expect(route.protocolId).toBe("protocol-crisis-response");
    expect(route.skillIds).toEqual([]);
    const retrieved = retrieveKnowledge(text);
    expect(retrieved.docs[0]?.id).toBe("protocol-crisis-response");
    const prompt = formatKnowledgeForPrompt(text, { condensed: true });
    expect(prompt.toLowerCase()).toContain("crisis");
  });

  it("keeps condensed retrieval compact", () => {
    const prompt = formatKnowledgeForPrompt("I'm burnt out and wired all day", {
      condensed: true,
    });
    expect(prompt.length).toBeLessThan(600);
  });
});
