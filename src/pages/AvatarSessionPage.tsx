import { useState, useRef, useEffect } from "react";
import ChatTranscript from "@/components/avatar/ChatTranscript";
import ChatInput from "@/components/chat/ChatInput";
import { detectCrisis } from "@/components/safety/CrisisDetector";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  COACHING_JOURNEY_NAME,
  createMessageFeedback,
  deleteMessageFeedback,
  fetchChatHistory,
  fetchMessageFeedback,
  resolveCoachingJourneySession,
  saveChatMessage,
  setSessionActiveMessage,
  setChatMessageAdminStar,
  updateJourneyState,
  type ChatMessage,
  type ChatFeedback,
  type FeedbackTag,
  type ChatSession,
} from "@/hooks/useChatSession";
import { stripMarkdownForSpeech } from "@/lib/speech";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bot, ChevronDown, CheckCircle2, Circle, PanelRight } from "lucide-react";
import type { TranscriptMessage } from "@/components/avatar/ChatTranscript";
import PhaseStepper from "@/components/avatar/PhaseStepper";
import { inferJourneyUpdates } from "@/lib/journeyInference";
import { buildFallbackResponse, buildWelcomeMessage } from "@/lib/journeyWelcome";
import {
  journeyStateFromSession,
  toJourneyContextPayload,
  PHASE_LABELS,
  PHASE_ONE_STEP_LABELS,
  PHASE_CHECKLIST,
  checklistProgress,
  type JourneyState,
} from "@/types/journey";

type StoredMessage = TranscriptMessage & {
  parent_message_id?: string | null;
  regenerated_from_message_id?: string | null;
  branch_root_message_id?: string | null;
};

type RegenerationPayloadFeedback = {
  feedbackText: string;
  rating: number | null;
  tags: string[];
};

function starterMessage(session: Partial<JourneyState> | null | undefined): TranscriptMessage {
  return {
    id: "init",
    role: "assistant",
    content: buildWelcomeMessage(journeyStateFromSession(session)),
  };
}

const DEFAULT_SCENARIO = {
  title: "Your coaching journey",
  objective: "Phase 1: understand. Phase 2: plan small steps. Phase 3: practise and sustain across logins.",
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
  const [messages, setMessages] = useState<TranscriptMessage[]>([starterMessage(null)]);
  const [rawMessages, setRawMessages] = useState<StoredMessage[]>([starterMessage(null)]);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [journeySession, setJourneySession] = useState<ChatSession | null>(null);
  const [feedbackByMessageId, setFeedbackByMessageId] = useState<Record<string, ChatFeedback[]>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<
    Record<
      string,
      {
        text: string;
        rating: number | null;
        tags: FeedbackTag[];
        open: boolean;
        composing: boolean;
        applyToGlobal: boolean;
      }
    >
  >({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const handleSendRef = useRef<(text: string) => void>(() => {});
  const pendingSpeakTimeoutRef = useRef<number | null>(null);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const buildDisplayMessages = (allMessages: StoredMessage[], activeMessageId: string | null) => {
    const selectedAssistantIds = new Set<string>();
    const display: TranscriptMessage[] = [];
    const indexed = allMessages.map((item, index) => ({ item, index }));
    const linkedUserIds = new Set(
      allMessages
        .filter((item) => item.role === "assistant" && !!item.parent_message_id)
        .map((item) => item.parent_message_id as string),
    );

    for (const { item, index } of indexed) {
      if (item.role === "user") {
        display.push(item);
        continue;
      }

      // Keep backward compatibility for legacy sessions where assistant rows were
      // saved without parent_message_id. Render them exactly as chronological chat.
      if (!item.parent_message_id || !linkedUserIds.has(item.parent_message_id)) {
        display.push({
          ...item,
          variantIndex: 0,
          variantTotal: 1,
          isActiveVariant: true,
          feedbackCount: feedbackByMessageId[item.id]?.length || 0,
        });
        selectedAssistantIds.add(item.id);
        continue;
      }

      const parentIndex = indexed.findIndex((entry) => entry.item.id === item.parent_message_id);
      if (parentIndex !== index - 1) {
        // Only render linked variant groups once, adjacent to their parent user turn.
        continue;
      }

      const variants = allMessages.filter(
        (candidate) =>
          candidate.role === "assistant" && candidate.parent_message_id === item.parent_message_id,
      );
      if (variants.length === 0) continue;
      let activeVariant = variants[variants.length - 1];
      if (activeMessageId) {
        const explicit = variants.find((candidate) => candidate.id === activeMessageId);
        if (explicit) activeVariant = explicit;
      }
      const activeIndex = variants.findIndex((candidate) => candidate.id === activeVariant.id);
      display.push({
        ...activeVariant,
        variantIndex: activeIndex,
        variantTotal: variants.length,
        isActiveVariant: true,
        feedbackCount: feedbackByMessageId[activeVariant.id]?.length || 0,
      });
      selectedAssistantIds.add(activeVariant.id);
    }

    return display.map((row) =>
      row.role === "assistant"
        ? {
            ...row,
            isActiveVariant: selectedAssistantIds.has(row.id),
          }
        : row,
    );
  };

  const mapHistoryToStoredMessages = (history: ChatMessage[]): StoredMessage[] =>
    history.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      parent_message_id: m.parent_message_id,
      regenerated_from_message_id: m.regenerated_from_message_id,
      branch_root_message_id: m.branch_root_message_id,
      admin_quality_star: m.admin_quality_star ?? false,
    }));

  const loadFeedbackForMessages = async (messageList: StoredMessage[]) => {
    const assistantMessages = messageList.filter((item) => item.role === "assistant");
    const entries = await Promise.all(
      assistantMessages.map(async (item) => [item.id, await fetchMessageFeedback(item.id)] as const),
    );
    setFeedbackByMessageId(Object.fromEntries(entries));
  };

  useEffect(() => {
    let active = true;
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);
      if (!active) return;
      setIsAdmin(!error && !!data && data.length > 0);
    };
    checkAdmin().catch(console.error);
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapJourney = async () => {
      if (!isMounted) return;

      if (!user) {
        setIsSessionLoading(false);
        return;
      }

      try {
        setIsSessionLoading(true);
        const journey = await resolveCoachingJourneySession(user.id);
        if (!isMounted) return;
        setJourneySession(journey);
        setSessionId(journey.id);

        const history = await fetchChatHistory(journey.id);
        if (!isMounted) return;
        const restored = mapHistoryToStoredMessages(history);
        const emptyStarter = starterMessage(journey);
        setRawMessages(restored.length > 0 ? restored : [emptyStarter]);
        setActiveAssistantId(journey.active_message_id || null);
        setMessages(
          buildDisplayMessages(restored.length > 0 ? restored : [emptyStarter], journey.active_message_id || null),
        );
        await loadFeedbackForMessages(restored);

        if (restored.length === 0) {
          const welcome = starterMessage(journey);
          const initial = await saveChatMessage(journey.id, "assistant", welcome.content);
          if (!isMounted) return;
          setRawMessages([{ ...welcome, id: initial.id, admin_quality_star: initial.admin_quality_star ?? false }]);
          setMessages([{ ...welcome, id: initial.id, admin_quality_star: initial.admin_quality_star ?? false }]);
          setActiveAssistantId(initial.id);
          await setSessionActiveMessage(journey.id, initial.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsSessionLoading(false);
      }
    };

    bootstrapJourney();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
    setMessages(buildDisplayMessages(rawMessages, activeAssistantId));
  }, [rawMessages, activeAssistantId, feedbackByMessageId]);

  const applyJourneyUpdates = async (updates: Partial<JourneyState>) => {
    if (!sessionId || Object.keys(updates).length === 0) return;
    await updateJourneyState(sessionId, updates);
    setJourneySession((prev) =>
      prev && prev.id === sessionId ? { ...prev, ...updates, updated_at: new Date().toISOString() } : prev,
    );
  };

  const handleSend = async (text: string) => {
    if (isSessionLoading) return;

    const localUserId = Date.now().toString();
    const userMsg: StoredMessage = { id: localUserId, role: "user", content: text };
    const nextRawWithLocalUser = [...rawMessages, userMsg];
    setRawMessages(nextRawWithLocalUser);
    setMessages(buildDisplayMessages(nextRawWithLocalUser, activeAssistantId));
    if (!sessionId) return;

    const journeyState = journeyStateFromSession(journeySession);
    const previousAssistantContent =
      [...rawMessages].reverse().find((m) => m.role === "assistant")?.content ?? "";

    const persistedUser = await saveChatMessage(sessionId, "user", text, {
      parentMessageId: activeAssistantId,
    });
    const persistedRawMessages = nextRawWithLocalUser.map((item) =>
      item.id === localUserId ? { ...item, id: persistedUser.id, parent_message_id: activeAssistantId } : item,
    );
    setRawMessages(persistedRawMessages);
    setMessages(buildDisplayMessages(persistedRawMessages, activeAssistantId));

    setIsAiResponding(true);
    const chatHistory = buildDisplayMessages(persistedRawMessages, activeAssistantId).map((m) => ({ role: m.role, content: m.content }));
    const journeyContext = toJourneyContextPayload(journeyState, chatHistory.length);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: text,
          chatHistory,
          possibleCrisisLanguage: detectCrisis(text),
          journeyContext,
        }),
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
      const savedReply = await saveChatMessage(sessionId, "assistant", reply.content, {
        parentMessageId: persistedUser.id,
      });
      const nextRaw = [
        ...persistedRawMessages,
        {
          ...reply,
          id: savedReply.id,
          parent_message_id: persistedUser.id,
          admin_quality_star: savedReply.admin_quality_star ?? false,
        },
      ];
      setRawMessages(nextRaw);
      setActiveAssistantId(savedReply.id);
      setMessages(buildDisplayMessages(nextRaw, savedReply.id));
      await setSessionActiveMessage(sessionId, savedReply.id);
      const journeyUpdates = inferJourneyUpdates(text, previousAssistantContent, reply.content, journeyState);
      await applyJourneyUpdates(journeyUpdates);
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
      const content = buildFallbackResponse(journeyState.platform_phase);
      const savedReply = await saveChatMessage(sessionId, "assistant", content, {
        parentMessageId: persistedUser.id,
      });
      const nextRaw = [
        ...persistedRawMessages,
        {
          id: savedReply.id,
          role: "assistant",
          content,
          parent_message_id: persistedUser.id,
          admin_quality_star: savedReply.admin_quality_star ?? false,
        },
      ];
      setRawMessages(nextRaw);
      setActiveAssistantId(savedReply.id);
      setMessages(buildDisplayMessages(nextRaw, savedReply.id));
      await setSessionActiveMessage(sessionId, savedReply.id);
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
  const handleToggleAdminQualityStar = async (messageId: string, nextStarred: boolean) => {
    if (!isAdmin) return;
    try {
      await setChatMessageAdminStar(messageId, nextStarred);
      setRawMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, admin_quality_star: nextStarred } : m)),
      );
    } catch (err) {
      console.error(err);
      window.alert("Could not update the star. Apply the latest Supabase migration and ensure you are an admin.");
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

  const handleFeedbackDraftChange = (
    messageId: string,
    next: {
      text: string;
      rating: number | null;
      tags: FeedbackTag[];
      open: boolean;
      composing: boolean;
      applyToGlobal: boolean;
    },
  ) => {
    setFeedbackDrafts((prev) => ({ ...prev, [messageId]: next }));
  };

  const handleSubmitFeedback = async (messageId: string) => {
    if (!sessionId || !user || !isAdmin) return;
    const draft = feedbackDrafts[messageId];
    if (!draft?.text.trim()) return;
    try {
      setIsSubmittingFeedback(true);
      const created = await createMessageFeedback({
        conversationId: sessionId,
        messageId,
        adminUserId: user.id,
        feedbackText: draft.text.trim(),
        rating: draft.rating ?? null,
        tags: draft.tags,
        applyToGlobalInstructions: draft.applyToGlobal !== false,
      });
      setFeedbackByMessageId((prev) => ({
        ...prev,
        [messageId]: [created, ...(prev[messageId] || [])],
      }));
      setFeedbackDrafts((prev) => ({
        ...prev,
        [messageId]: { text: "", rating: null, tags: [], open: true, composing: false, applyToGlobal: true },
      }));
      if (draft.applyToGlobal !== false) {
        toast.success("Trainer feedback saved — applies to all users on their next messages.");
      } else {
        toast.success("Feedback saved (trainer-only, not added to global standards).");
      }
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId
            ? { ...item, feedbackCount: (feedbackByMessageId[messageId]?.length || 0) + 1 }
            : item,
        ),
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleDeleteFeedback = async (messageId: string, feedbackId: string) => {
    if (!isAdmin) return;
    const confirmed = window.confirm("Delete this feedback?");
    if (!confirmed) return;
    await deleteMessageFeedback(feedbackId);
    setFeedbackByMessageId((prev) => ({
      ...prev,
      [messageId]: (prev[messageId] || []).filter((item) => item.id !== feedbackId),
    }));
  };

  const handleSelectVariant = async (messageId: string) => {
    if (!sessionId) return;
    setActiveAssistantId(messageId);
    setMessages(buildDisplayMessages(rawMessages, messageId));
    await setSessionActiveMessage(sessionId, messageId);
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, active_message_id: messageId } : s)));
  };

  const handleCycleVariant = async (messageId: string, direction: "prev" | "next") => {
    const current = rawMessages.find((item) => item.id === messageId && item.role === "assistant");
    if (!current?.parent_message_id) return;
    const siblings = rawMessages.filter(
      (item) => item.role === "assistant" && item.parent_message_id === current.parent_message_id,
    );
    if (siblings.length <= 1) return;
    const currentIndex = siblings.findIndex((item) => item.id === messageId);
    if (currentIndex < 0) return;
    const delta = direction === "prev" ? -1 : 1;
    const nextIndex = (currentIndex + delta + siblings.length) % siblings.length;
    const next = siblings[nextIndex];
    await handleSelectVariant(next.id);
  };

  const handleRegenerate = async (messageId: string) => {
    if (!sessionId) return;
    const target = rawMessages.find((item) => item.id === messageId && item.role === "assistant");
    if (!target) return;
    const parentUser = rawMessages.find((item) => item.id === target.parent_message_id && item.role === "user");
    if (!parentUser) return;
    const feedbackList = await fetchMessageFeedback(messageId);
    if (feedbackList.length === 0) {
      alert("Add at least one feedback entry before regenerating.");
      return;
    }
    const regenerationFeedback: RegenerationPayloadFeedback[] = feedbackList.map((item) => ({
      feedbackText: item.feedback_text,
      rating: item.rating,
      tags: item.tags || [],
    }));
    try {
      setIsRegenerating(true);
      const regenJourney = journeyStateFromSession(journeySession);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "regenerate",
          journeyContext: toJourneyContextPayload(regenJourney, rawMessages.length),
          regenerationContext: {
            originalUserMessage: parentUser.content,
            previousAssistantReply: target.content,
            feedbackList: regenerationFeedback,
          },
        }),
      });
      const data = await response.json();
      const regeneratedContent = response.ok ? data.reply ?? "" : data.error ?? "";
      const branchRoot = target.branch_root_message_id || target.id;
      const saved = await saveChatMessage(sessionId, "assistant", regeneratedContent || "Unable to regenerate.", {
        parentMessageId: parentUser.id,
        regeneratedFromMessageId: target.id,
        branchRootMessageId: branchRoot,
        generationMetadata: { modelProvider: "groq", promptVersion: "feedback-v2", regenerated: true },
      });
      const nextRaw = [
        ...rawMessages,
        {
          id: saved.id,
          role: "assistant",
          content: saved.content,
          parent_message_id: parentUser.id,
          regenerated_from_message_id: target.id,
          branch_root_message_id: branchRoot,
          admin_quality_star: saved.admin_quality_star ?? false,
        },
      ];
      setRawMessages(nextRaw);
      await handleSelectVariant(saved.id);
      const latestFeedback = await fetchMessageFeedback(saved.id);
      setFeedbackByMessageId((prev) => ({ ...prev, [saved.id]: latestFeedback }));
    } finally {
      setIsRegenerating(false);
    }
  };

  const journey = journeyStateFromSession(journeySession);
  const userTurns = messages.filter((message) => message.role === "user").length;
  const progressPercent = (() => {
    const phaseBase = journey.platform_phase === 1 ? 0 : journey.platform_phase === 2 ? 34 : 67;
    if (journey.platform_phase === 1) {
      return journey.phase_one_confirmed ? 33 : Math.min(28, userTurns * 6);
    }
    if (journey.platform_phase === 2) {
      if (journey.active_micro_goal && (journey.micro_goal_confidence ?? 0) >= 7) return 66;
      return phaseBase + Math.min(30, userTurns * 4);
    }
    if (journey.sustainability_pivot_active) return 72;
    if (journey.last_check_in_at) return Math.min(100, 80 + userTurns * 2);
    return phaseBase + Math.min(28, userTurns * 3);
  })();
  const statusLabel = isAiResponding ? "Thinking..." : isSpeaking ? "Speaking..." : "Ready";
  const phaseChecklist = PHASE_CHECKLIST[journey.platform_phase];
  const checklistDone = checklistProgress(journey);
  const empathyCuesWithStatus = phaseChecklist.map((cue, index) => ({
    cue,
    complete: checklistDone[index] ?? false,
  }));

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
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Journey phase</p>
          <p className="font-medium">{PHASE_LABELS[journey.platform_phase]}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {journey.platform_phase === 1 && !journey.phase_one_confirmed && PHASE_ONE_STEP_LABELS[journey.phase_one_step]}
            {journey.platform_phase === 1 && journey.phase_one_confirmed && "Conceptualisation confirmed — action planning unlocked."}
            {journey.platform_phase === 2 && "Micro-goals and confidence check (7/10 minimum)."}
            {journey.platform_phase === 3 && journey.sustainability_pivot_active && "Sustainability pivot — regulating first."}
            {journey.platform_phase === 3 && journey.architectural_backtrack_active && "Updating assumptions before the next step."}
            {journey.platform_phase === 3 &&
              !journey.sustainability_pivot_active &&
              !journey.architectural_backtrack_active &&
              "Checking in and practising your action plan."}
          </p>
        </div>
        {journey.presenting_challenge && journey.platform_phase === 1 && (
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Presenting challenge</p>
            <p className="text-sm line-clamp-4">{journey.presenting_challenge}</p>
          </div>
        )}
        {journey.belief_strength_pct != null && (
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Belief strength</p>
            <p className="text-sm font-medium">{journey.belief_strength_pct}%</p>
          </div>
        )}
        {journey.conceptualisation_summary && (
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Conceptualisation</p>
            <p className="text-sm line-clamp-5">{journey.conceptualisation_summary}</p>
          </div>
        )}
        {journey.target_outcome && (
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Target outcome</p>
            <p className="text-sm">{journey.target_outcome}</p>
          </div>
        )}
        {journey.active_micro_goal && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Active micro-goal</p>
            <p className="text-sm font-medium">{journey.active_micro_goal}</p>
            {journey.micro_goal_confidence != null && (
              <p className="text-xs text-muted-foreground mt-1">Confidence: {journey.micro_goal_confidence}/10</p>
            )}
          </div>
        )}
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Goal</p>
          <p className="font-medium">{DEFAULT_SCENARIO.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{DEFAULT_SCENARIO.objective}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Phase checklist</p>
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
            Your journey
          </p>
          <p>
            {COACHING_JOURNEY_NAME} — {userTurns} messages
            {journeySession?.updated_at
              ? ` · last active ${new Date(journeySession.updated_at).toLocaleDateString()}`
              : ""}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] px-3 md:px-5 py-4 pb-24 md:pb-4">
      <div className="max-w-5xl mx-auto relative">
        <div className="fixed right-3 bottom-20 md:right-4 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-30">
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
              <p className="text-xs text-muted-foreground mt-1">
                {COACHING_JOURNEY_NAME} — pick up where you left off
              </p>
              <PhaseStepper
                className="mt-3"
                currentPhase={journey.platform_phase}
                phaseOneConfirmed={journey.phase_one_confirmed}
              />
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
              isAdmin={isAdmin}
              feedbackItemsByMessageId={feedbackByMessageId}
              feedbackDrafts={feedbackDrafts}
              onFeedbackDraftChange={handleFeedbackDraftChange}
              onSubmitFeedback={handleSubmitFeedback}
              onDeleteFeedback={handleDeleteFeedback}
              onRegenerate={handleRegenerate}
              onSelectVariant={handleSelectVariant}
              onCycleVariant={handleCycleVariant}
              onToggleAdminQualityStar={isAdmin ? handleToggleAdminQualityStar : undefined}
              isSubmittingFeedback={isSubmittingFeedback}
              isRegenerating={isRegenerating}
            />
            <div className="mt-3">
              <ChatInput
                onSend={handleSend}
                onTranscribeAudio={transcribeVoiceMessage}
                voiceEnabled={voiceEnabled}
                onToggleVoice={handleVoiceToggle}
                disabled={isAiResponding || isSessionLoading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
