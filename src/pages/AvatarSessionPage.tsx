import { useState, useRef, useEffect } from "react";
import ChatTranscript from "@/components/avatar/ChatTranscript";
import ChatInput from "@/components/chat/ChatInput";
import { detectCrisis, CRISIS_RESPONSE } from "@/components/safety/CrisisDetector";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Bot,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock3,
  PanelLeft,
  PanelRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function AvatarSessionPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TranscriptMessage[]>([INITIAL_MESSAGE]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSessionActionLoading, setIsSessionActionLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState("");
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const handleSendRef = useRef<(text: string) => void>(() => {});
  const pendingSpeakTimeoutRef = useRef<number | null>(null);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

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
    return () => {
      if (pendingSpeakTimeoutRef.current !== null) {
        window.clearTimeout(pendingSpeakTimeoutRef.current);
        pendingSpeakTimeoutRef.current = null;
      }
      stop();
    };
  }, [stop]);

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

    setIsAiResponding(true);
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
      setIsAiResponding(false);
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
      setIsAiResponding(false);
    }
  };
  handleSendRef.current = handleSend;

  const stopAllAudioNow = () => {
    if (pendingSpeakTimeoutRef.current !== null) {
      window.clearTimeout(pendingSpeakTimeoutRef.current);
      pendingSpeakTimeoutRef.current = null;
    }
    stop();
  };

  const handleVoiceToggle = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) stopAllAudioNow();
      return next;
    });
  };

  const transcribeVoiceMessage = async (blob: Blob, mimeType: string) => {
    const audioBase64 = await blobToBase64(blob);
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, mimeType }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Voice transcription failed.");
    }
    return (data.text || "").trim();
  };

  const progressPercent = messages.length <= 1 ? 0 : Math.min(100, (messages.filter((m) => m.role === "user").length / 5) * 25);
  const statusLabel = isAiResponding ? "Thinking..." : isSpeaking ? "Speaking..." : "Ready";
  const selectedSession = sessions.find((session) => session.id === sessionId) || null;
  const userTurns = messages.filter((message) => message.role === "user").length;
  const empathyCuesWithStatus = DEFAULT_SCENARIO.cues.map((cue, index) => ({
    cue,
    complete: progressPercent >= (index + 1) * 30,
  }));

  const sessionsPanel = (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <Button size="sm" type="button" onClick={startNewSession} disabled={isSessionLoading || isSessionActionLoading}>
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>
      <div className="space-y-2 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
        {sessions.map((session, index) => {
          const isSelected = session.id === sessionId;
          const displayName = session.session_name?.trim() || `Session ${sessions.length - index}`;

          return (
            <div
              key={session.id}
              className={`rounded-xl border p-3 transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
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
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.updated_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock3 className="w-3 h-3" />
                      {new Date(session.updated_at).toLocaleTimeString()}
                    </p>
                  </button>
                  <div className="mt-3 flex gap-2">
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
                      <Pencil className="w-3 h-3 mr-1" /> Rename
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => removeSession(session.id)}
                      disabled={isSessionActionLoading}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
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
  );

  const progressPanel = (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-lg font-semibold">Progress & Goals</h3>
      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current level</p>
          <p className="text-2xl font-semibold mt-1">{Math.round(progressPercent)}%</p>
        </div>
        <div
          className="h-14 w-14 rounded-full grid place-items-center text-sm font-semibold text-foreground"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${progressPercent * 3.6}deg, hsl(var(--muted)) 0deg)`,
          }}
        >
          <span className="h-10 w-10 rounded-full bg-card grid place-items-center">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Goal</p>
          <p className="font-medium">{DEFAULT_SCENARIO.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{DEFAULT_SCENARIO.objective}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Key empathy cues</p>
          <ul className="space-y-2">
            {empathyCuesWithStatus.map((item) => (
              <li key={item.cue} className="flex items-center gap-2 text-sm">
                {item.complete ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
                <span>{item.cue}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 mb-1 text-foreground font-medium">
            <Bot className="w-4 h-4 text-primary" />
            Active session
          </p>
          <p>{selectedSession?.session_name || "Current session"} - {userTurns} user messages</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] px-3 md:px-5 py-4">
      <div className="max-w-5xl mx-auto relative">
        <div className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="secondary" className="rounded-full shadow-md">
                <PanelLeft className="w-4 h-4 mr-1" /> Sessions
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[92vw] sm:w-[420px] p-4">
              <SheetHeader className="mb-3">
                <SheetTitle>Sessions</SheetTitle>
              </SheetHeader>
              {sessionsPanel}
            </SheetContent>
          </Sheet>
        </div>
        <div className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="secondary" className="rounded-full shadow-md">
                Progress <PanelRight className="w-4 h-4 ml-1" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[92vw] sm:w-[420px] p-4">
              <SheetHeader className="mb-3">
                <SheetTitle>Progress & Goals</SheetTitle>
              </SheetHeader>
              {progressPanel}
            </SheetContent>
          </Sheet>
        </div>

        <main className="rounded-2xl border border-border bg-card/95 backdrop-blur p-4 md:p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">AI Coach</p>
              <h1 className="text-xl md:text-2xl font-semibold">{DEFAULT_SCENARIO.title}</h1>
              <p className="text-xs text-muted-foreground mt-1">{selectedSession?.session_name || "Current session"}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              {statusLabel}
            </div>
          </div>

          <Collapsible open={isToolsOpen} onOpenChange={setIsToolsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between rounded-xl">
                Session tools
                <ChevronDown className={`w-4 h-4 transition-transform ${isToolsOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Voice input</p>
                  <p className="text-sm text-muted-foreground">
                    Use the mic button near send to record a voice message. It is transcribed and sent as text automatically.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Session focus</p>
                  <p className="text-sm text-muted-foreground">
                    Keep each message concrete: situation, thought, emotion, and your goal for the conversation.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="rounded-xl border border-border bg-background/70 p-3">
            <ChatTranscript
              messages={messages}
              className="max-h-[58vh] min-h-[360px] rounded-lg bg-transparent border-0 p-0"
            />
            <div className="mt-3">
              <ChatInput
                onSend={handleSend}
                onTranscribeAudio={transcribeVoiceMessage}
                voiceEnabled={voiceEnabled}
                onToggleVoice={handleVoiceToggle}
                disabled={isAiResponding || isSessionLoading || isSessionActionLoading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
