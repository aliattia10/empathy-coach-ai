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
import {
  createChatSession,
  deleteChatSession,
  fetchChatHistory,
  fetchUserSessions,
  renameChatSession,
  saveChatMessage,
  type ChatSession,
} from "@/hooks/useChatSession";
import { stripMarkdownForSpeech } from "@/lib/speech";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSessionActionLoading, setIsSessionActionLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const handleSendRef = useRef<(text: string) => void>(() => {});
  const pendingSpeakTimeoutRef = useRef<number | null>(null);
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
    let isMounted = true;

    const bootstrapSessions = async () => {
      if (!isMounted) return;

      if (!user) {
        setIsSessionLoading(false);
        return;
      }

      try {
        setIsSessionLoading(true);
        const existingSessions = await fetchUserSessions(user.id);
        if (!isMounted) return;
        setSessions(existingSessions);

        if (existingSessions.length > 0) {
          const selectedSession = existingSessions[0];
          const history = await fetchChatHistory(selectedSession.id);
          if (!isMounted) return;
          const restored: TranscriptMessage[] = history.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }));
          setSessionId(selectedSession.id);
          setMessages(restored.length > 0 ? restored : [INITIAL_MESSAGE]);
        } else {
          const s = await createChatSession(user.id, "constructive_feedback", "Session 1");
          if (!isMounted) return;
          setSessionId(s.id);
          setSessions([s]);
          setMessages([INITIAL_MESSAGE]);
          await saveChatMessage(s.id, "assistant", INITIAL_MESSAGE.content);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsSessionLoading(false);
      }
    };

    bootstrapSessions();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const startNewSession = async () => {
    if (!user) return;
    try {
      setIsSessionActionLoading(true);
      const sessionCount = sessions.length + 1;
      const s = await createChatSession(user.id, "constructive_feedback", `Session ${sessionCount}`);
      setSessionId(s.id);
      setMessages([INITIAL_MESSAGE]);
      setSessions((prev) => [s, ...prev]);
      await saveChatMessage(s.id, "assistant", INITIAL_MESSAGE.content);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSessionActionLoading(false);
    }
  };

  const openSession = async (nextSessionId: string) => {
    try {
      setIsSessionActionLoading(true);
      const history = await fetchChatHistory(nextSessionId);
      const restored: TranscriptMessage[] = history.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));

      setSessionId(nextSessionId);
      setMessages(restored.length > 0 ? restored : [INITIAL_MESSAGE]);

      // Ensure at least one assistant starter message exists in an empty/restored session.
      if (restored.length === 0) {
        await saveChatMessage(nextSessionId, "assistant", INITIAL_MESSAGE.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSessionActionLoading(false);
    }
  };

  const saveSessionName = async (targetSessionId: string) => {
    const cleaned = editingSessionName.trim();
    if (!cleaned) return;
    try {
      setIsSessionActionLoading(true);
      const updated = await renameChatSession(targetSessionId, cleaned);
      setSessions((prev) => prev.map((s) => (s.id === targetSessionId ? updated : s)));
      setEditingSessionId(null);
      setEditingSessionName("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSessionActionLoading(false);
    }
  };

  const removeSession = async (targetSessionId: string) => {
    const confirmed = window.confirm("Delete this session permanently?");
    if (!confirmed) return;

    try {
      setIsSessionActionLoading(true);
      await deleteChatSession(targetSessionId);
      const remainingSessions = sessions.filter((s) => s.id !== targetSessionId);
      setSessions(remainingSessions);

      if (targetSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          await openSession(remainingSessions[0].id);
        } else if (user) {
          const s = await createChatSession(user.id, "constructive_feedback", "Session 1");
          setSessions([s]);
          setSessionId(s.id);
          setMessages([INITIAL_MESSAGE]);
          await saveChatMessage(s.id, "assistant", INITIAL_MESSAGE.content);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSessionActionLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (pendingSpeakTimeoutRef.current !== null) {
        window.clearTimeout(pendingSpeakTimeoutRef.current);
        pendingSpeakTimeoutRef.current = null;
      }
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (isSpeaking) setVoiceState("speaking");
    else setVoiceState((s) => (s === "speaking" ? "idle" : s));
  }, [isSpeaking]);

  const handleSend = async (text: string) => {
    if (isSessionLoading || isSessionActionLoading) return;

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
        if (plain) {
          if (pendingSpeakTimeoutRef.current !== null) window.clearTimeout(pendingSpeakTimeoutRef.current);
          pendingSpeakTimeoutRef.current = window.setTimeout(() => {
            speak(plain);
            pendingSpeakTimeoutRef.current = null;
          }, 300);
        }
      }
      setVoiceState("idle");
    } catch {
      const content = generateFallbackResponse();
      const reply: TranscriptMessage = { id: (Date.now() + 1).toString(), role: "assistant", content };
      setMessages((prev) => [...prev, reply]);
      if (sessionId) saveChatMessage(sessionId, "assistant", content).catch(console.error);
      if (voiceEnabled) {
        const plain = stripMarkdownForSpeech(content);
        if (plain) {
          if (pendingSpeakTimeoutRef.current !== null) window.clearTimeout(pendingSpeakTimeoutRef.current);
          pendingSpeakTimeoutRef.current = window.setTimeout(() => {
            speak(plain);
            pendingSpeakTimeoutRef.current = null;
          }, 300);
        }
      }
      setVoiceState("idle");
    }
  };
  handleSendRef.current = handleSend;

  const onMicClick = () => {
    if (isSessionLoading || isSessionActionLoading) return;

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

  const stopAllAudioNow = () => {
    if (pendingSpeakTimeoutRef.current !== null) {
      window.clearTimeout(pendingSpeakTimeoutRef.current);
      pendingSpeakTimeoutRef.current = null;
    }
    stop();
    stopRecognition();
    setVoiceState((s) => (s === "speaking" || s === "listening" ? "idle" : s));
  };

  const handleVoiceToggle = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) stopAllAudioNow();
      return next;
    });
  };

  const handleMuteClick = () => {
    stopAllAudioNow();
    setVoiceEnabled(false);
  };

  const handleSpeakerClick = () => {
    stopAllAudioNow();
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
            onClick={handleVoiceToggle}
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
          onMute={handleMuteClick}
          onSpeaker={handleSpeakerClick}
          onPause={() => {
            stopAllAudioNow();
            setSessionActive(false);
          }}
          onEndSession={() => {
            stopAllAudioNow();
            setSessionActive(false);
          }}
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
          <ChatInput
            onSend={handleSend}
            disabled={voiceState === "processing" || isSessionLoading || isSessionActionLoading}
          />
        </div>
      </div>

      <div className="fixed top-20 left-4 z-20 w-72 max-h-[75vh] overflow-hidden rounded-xl border border-border bg-card shadow-sm flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Sessions</p>
          <Button size="sm" type="button" onClick={startNewSession} disabled={isSessionLoading || isSessionActionLoading}>
            New
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sessions.map((session, index) => {
            const isSelected = session.id === sessionId;
            const displayName = session.session_name?.trim() || `Session ${sessions.length - index}`;

            return (
              <div
                key={session.id}
                className={`rounded-lg border p-2 ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
              >
                {editingSessionId === session.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editingSessionName}
                      onChange={(e) => setEditingSessionName(e.target.value)}
                      placeholder="Session name"
                      disabled={isSessionActionLoading}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => saveSessionName(session.id)}
                        disabled={isSessionActionLoading || !editingSessionName.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingSessionId(null);
                          setEditingSessionName("");
                        }}
                        disabled={isSessionActionLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => openSession(session.id)}
                      disabled={isSessionActionLoading}
                    >
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.updated_at).toLocaleString()}
                      </p>
                    </button>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingSessionId(session.id);
                          setEditingSessionName(session.session_name?.trim() || "");
                        }}
                        disabled={isSessionActionLoading}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => removeSession(session.id)}
                        disabled={isSessionActionLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {sessions.length === 0 && !isSessionLoading && (
            <p className="text-xs text-muted-foreground p-2">No saved sessions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
