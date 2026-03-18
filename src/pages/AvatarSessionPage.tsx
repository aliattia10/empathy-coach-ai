import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AvatarDisplay from "@/components/avatar/AvatarDisplay";
import VoiceControls, { type VoiceState } from "@/components/avatar/VoiceControls";
import ChatTranscript from "@/components/avatar/ChatTranscript";
import ScenarioSidebar from "@/components/avatar/ScenarioSidebar";
import ChatInput from "@/components/chat/ChatInput";
import { detectCrisis, CRISIS_RESPONSE } from "@/components/safety/CrisisDetector";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { createChatSession, saveChatMessage } from "@/hooks/useChatSession";
import { stripMarkdownForSpeech } from "@/lib/speech";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import type { TranscriptMessage } from "@/components/avatar/ChatTranscript";

const INITIAL_MESSAGE: TranscriptMessage = {
  id: "init",
  role: "assistant",
  content: `Welcome! I'm **Alex**, your AI simulation partner.

I'm here to help you practice **constructive feedback** through realistic conversations.

**Tell me about a situation where you need to deliver difficult feedback.** What's happening, and what makes it challenging?`,
};

function generateFallbackResponse(): string {
  const responses = [
    "That's a thoughtful observation. **How do you think your team member would describe this situation?**",
    "**What specific behavior are you addressing?** Try to separate the person from the action.",
    "Consider: **Situation — Behavior — Impact.** Can you frame your feedback using these three elements?",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

const DEFAULT_SCENARIO = {
  title: "Constructive Feedback",
  objective: "Deliver feedback clearly, show empathy, and encourage reflection.",
  cues: ["Use 'I' statements", "Describe impact, not intent", "Invite their perspective"],
};

export default function AvatarSessionPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TranscriptMessage[]>([INITIAL_MESSAGE]);
  const [sessionActive, setSessionActive] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const handleSendRef = useRef<(text: string) => void>(() => {});
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const {
    isListening: isRecognitionListening,
    displayTranscript,
    error: recognitionError,
    start: startRecognition,
    stop: stopRecognition,
    supported: recognitionSupported,
  } = useSpeechRecognition({
    onFinalTranscript: (text) => {
      handleSendRef.current?.(text);
      stopRecognition();
    },
  });

  useEffect(() => {
    if (user && !sessionId) {
      createChatSession(user.id).then((s) => {
        setSessionId(s.id);
        saveChatMessage(s.id, "assistant", INITIAL_MESSAGE.content).catch(console.error);
      }).catch(console.error);
    }
  }, [user, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isSpeaking) setVoiceState("speaking");
    else setVoiceState((s) => (s === "speaking" ? "idle" : s));
  }, [isSpeaking]);

  const handleSend = async (text: string) => {
    const userMsg: TranscriptMessage = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (sessionId) saveChatMessage(sessionId, "user", text).catch(console.error);

    if (detectCrisis(text)) {
      const crisisMsg: TranscriptMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: CRISIS_RESPONSE };
      setMessages((prev) => [...prev, crisisMsg]);
      if (sessionId) saveChatMessage(sessionId, "assistant", CRISIS_RESPONSE).catch(console.error);
      return;
    }

    setVoiceState("processing");
    const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: text, chatHistory }),
      });
      const data = await response.json();
      const content = response.ok
        ? (data.reply ?? "")
        : (typeof data.error === "string" ? data.error : "");
      const reply: TranscriptMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: content || "I didn't get a response. Please try again.",
      };
      setMessages((prev) => [...prev, reply]);
      if (sessionId) saveChatMessage(sessionId, "assistant", reply.content).catch(console.error);
      if (voiceEnabled) {
        const plain = stripMarkdownForSpeech(reply.content);
        if (plain) setTimeout(() => speak(plain), 300);
      }
      setVoiceState("idle");
    } catch {
      const content = generateFallbackResponse();
      const reply: TranscriptMessage = { id: (Date.now() + 1).toString(), role: "assistant", content };
      setMessages((prev) => [...prev, reply]);
      if (sessionId) saveChatMessage(sessionId, "assistant", content).catch(console.error);
      if (voiceEnabled) {
        const plain = stripMarkdownForSpeech(content);
        if (plain) setTimeout(() => speak(plain), 300);
      }
      setVoiceState("idle");
    }
  };
  handleSendRef.current = handleSend;

  const onMicClick = () => {
    if (voiceState === "listening") {
      stopRecognition();
      setVoiceState("idle");
    } else if (sessionActive && voiceState !== "processing" && voiceState !== "speaking") {
      if (recognitionSupported) {
        startRecognition();
        setVoiceState("listening");
      } else {
        setVoiceState("idle");
      }
    }
  };

  const avatarStatus = voiceState === "processing" ? "thinking" : voiceState === "speaking" ? "speaking" : voiceState === "listening" ? "listening" : "idle";
  const progressPercent = messages.length <= 1 ? 0 : Math.min(100, (messages.filter((m) => m.role === "user").length / 5) * 25);

  const statusLabel = avatarStatus === "thinking" ? "Thinking..." : avatarStatus === "speaking" ? "Speaking..." : avatarStatus === "listening" ? "Listening..." : "Ready";

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center px-4 py-6">
      <ScenarioSidebar
        scenarioTitle={DEFAULT_SCENARIO.title}
        objective={DEFAULT_SCENARIO.objective}
        cues={DEFAULT_SCENARIO.cues}
        progressPercent={progressPercent}
      />

      <div className="flex flex-col items-center gap-8 max-w-2xl w-full">
        {/* Live Session badge + status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live Session
          </div>
          <h1 className="font-display text-foreground text-3xl md:text-4xl font-bold leading-tight mb-2">
            {statusLabel}
          </h1>
          <p className="text-foreground/80 text-sm max-w-md mx-auto">
            &ldquo;How can I help you with your learning today?&rdquo;
          </p>
        </div>

        {/* Abstract minimalist avatar */}
        <AvatarDisplay status={avatarStatus} />

        {/* Voice toggle */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={voiceEnabled ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setVoiceEnabled((v) => !v)}
            className="rounded-xl gap-1.5"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">{voiceEnabled ? "Voice ON" : "Voice off"}</span>
          </Button>
        </div>

        {/* Session controls: Mute | Mic/Pause | Speaker */}
        <VoiceControls
          state={voiceState}
          sessionActive={sessionActive}
          onMicClick={onMicClick}
          onPause={() => setSessionActive(false)}
          onEndSession={() => setSessionActive(false)}
          disabled={!sessionActive}
        />

        {/* Live transcription: verify mic and Avatar/voice session */}
        <div className="w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Live transcription</p>
          {!recognitionSupported && (
            <p className="text-sm text-muted-foreground">Use Chrome or Edge to see your speech as text and test the mic.</p>
          )}
          {recognitionSupported && (
            <>
              {recognitionError && (
                <p className="text-sm text-destructive mb-1">{recognitionError}</p>
              )}
              <p className="text-sm text-foreground min-h-[1.5rem]">
                {isRecognitionListening && !displayTranscript && "Listening… speak now."}
                {displayTranscript && <span className="text-muted-foreground">You&apos;re saying: </span>}
                {displayTranscript && <span className="font-medium">{displayTranscript}</span>}
                {!isRecognitionListening && !displayTranscript && !recognitionError && "Click the mic to speak; your words appear here and are sent when you pause."}
              </p>
            </>
          )}
        </div>

        {/* Transcript in glass card */}
        <div className="w-full glass rounded-2xl p-6 border border-primary/5">
          <ChatTranscript messages={messages} />
          <div ref={bottomRef} />
        </div>

        {/* Text input */}
        <div className="w-full">
          <ChatInput onSend={handleSend} disabled={voiceState === "processing"} />
        </div>
      </div>
    </div>
  );
}
