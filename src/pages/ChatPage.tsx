import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AvatarDisplay from "@/components/chat/AvatarDisplay";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { detectCrisis, CRISIS_RESPONSE } from "@/components/safety/CrisisDetector";
import { useAuth } from "@/hooks/useAuth";
import { createChatSession, saveChatMessage } from "@/hooks/useChatSession";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content: `Welcome! I'm **Alex**, your AI leadership coach. 🎯

I'm here to help you practice **constructive feedback** conversations through realistic scenarios.

Let's start: **Tell me about a situation where you need to deliver difficult feedback to a team member.** What's happening, and what makes it challenging for you?`,
};

// Simulated Socratic responses (will be replaced with LLM edge function)
function generateSocraticResponse(userMessage: string): string {
  const responses = [
    `That's a really thoughtful observation. Before we jump to solutions, let me ask you something:\n\n**How do you think your team member would describe this situation from their perspective?**\n\nUnderstanding their viewpoint is the first step toward empathetic feedback.`,
    `I appreciate you sharing that. Let's dig deeper:\n\n**What specific behavior or outcome are you addressing?** Try to separate the *person* from the *action*.\n\nFor example, instead of "they're lazy," what *observable behavior* have you noticed?`,
    `Good — you're thinking about this carefully. Here's a framework to consider:\n\n1. **Situation** — Describe the specific context\n2. **Behavior** — What did you observe?\n3. **Impact** — How did it affect the team?\n\n**Can you try framing your feedback using these three elements?**`,
    `That's a great start! Now let's think about the *emotional* dimension:\n\n**What emotions might your team member feel when hearing this feedback?**\n\nAnticipating their emotional response helps you prepare to be both honest and compassionate.`,
    `You're making excellent progress. One more thing to consider:\n\n**What does success look like after this conversation?** What would you want the team member to do differently, and how can you support them in getting there?\n\nRemember: the goal isn't just to deliver feedback — it's to build a *growth partnership*.`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Create a chat session when page loads (if user is logged in)
  useEffect(() => {
    if (user && !sessionId) {
      createChatSession(user.id).then((session) => {
        setSessionId(session.id);
        // Save the initial assistant message
        saveChatMessage(session.id, "assistant", INITIAL_MESSAGE.content).catch(console.error);
      }).catch(console.error);
    }
  }, [user, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Persist user message
    if (sessionId) {
      saveChatMessage(sessionId, "user", text).catch(console.error);
    }

    // Crisis detection
    if (detectCrisis(text)) {
      const crisisMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: CRISIS_RESPONSE };
      setMessages((prev) => [...prev, crisisMsg]);
      if (sessionId) saveChatMessage(sessionId, "assistant", CRISIS_RESPONSE).catch(console.error);
      return;
    }

    setIsTyping(true);
    setTimeout(async () => {
      const content = generateSocraticResponse(text);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);

      // Persist assistant message
      if (sessionId) {
        saveChatMessage(sessionId, "assistant", content).catch(console.error);
      }
    }, 1200 + Math.random() * 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-screen">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <AvatarDisplay speaking={isTyping} />
          <div>
            <h2 className="font-display font-semibold text-foreground">Constructive Feedback</h2>
            <p className="text-xs text-muted-foreground">Practice delivering difficult feedback empathetically</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChatMessage role={msg.role} content={msg.content} />
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 text-muted-foreground text-sm pl-11">
            <span className="animate-pulse">Alex is thinking...</span>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border bg-card">
        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}
