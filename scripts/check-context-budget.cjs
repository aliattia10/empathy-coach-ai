const { buildProductionSystemPrompt } = require("../skills/buildProductionSystemPrompt.cjs");
const { estimateTokens, trimMessagesForContext } = require("../skills/llmChatHelpers.cjs");

const sys = buildProductionSystemPrompt({
  forInference: true,
  journeyContext: {
    platformPhase: 1,
    phaseOneStep: 1,
    phaseOneConfirmed: false,
    messageCount: 2,
    isResuming: false,
  },
});

const welcome =
  "Welcome — I am Alex, your AI coaching partner. What is the main challenge you are facing right now?";
const user =
  "I am having difficulty with a colleague. We share an office but they always have people chatting.";

const messages = trimMessagesForContext(
  [
    { role: "system", content: sys },
    { role: "assistant", content: welcome },
    { role: "user", content: user },
  ],
  { reserveOutputTokens: 400 },
);

const total = messages.reduce((s, m) => s + estimateTokens(m.content) + 4, 0);
console.log("system est", estimateTokens(sys), "chars", sys.length);
console.log("total after trim", total, "budget", 4096 - 400, "ok", total <= 4096 - 400);
