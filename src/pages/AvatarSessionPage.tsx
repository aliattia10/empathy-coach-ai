import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ChatTranscript from "@/components/avatar/ChatTranscript";
import ChatInput from "@/components/chat/ChatInput";
import CoachWarmingIndicator from "@/components/avatar/CoachWarmingIndicator";
import { detectCrisis } from "@/components/safety/CrisisDetector";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  fetchJourneyById,
  renameChatSession,
  createMessageFeedback,
  deleteMessageFeedback,
  fetchChatHistory,
  fetchMessageFeedback,
  saveChatMessage,
  setSessionActiveMessage,
  setChatMessageAdminStar,
  updateJourneyState,
  updateProgressDashboard,
  type ChatMessage,
  type ChatFeedback,
  type FeedbackTag,
  type ChatSession,
} from "@/hooks/useChatSession";
import { isAutoNamedJourney, suggestJourneyTitle } from "@/lib/journeyNaming";
import { stripMarkdownForSpeech } from "@/lib/speech";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Loader2, ArrowLeft, ListTodo } from "lucide-react";
import type { TranscriptMessage } from "@/components/avatar/ChatTranscript";
import PhaseStepper from "@/components/avatar/PhaseStepper";
import { inferJourneyUpdates } from "@/lib/journeyInference";
import { extractProgressUpdates, extractLatestProgressFromHistory, sanitizeAssistantDisplayContent } from "@/lib/goalExtraction";
import { autoCompleteMatchingGoal } from "@/lib/dashboardGoals";
import { syncSessionTasks } from "@/lib/coachTaskSync";
import { syncPhaseChecklist } from "@/lib/phaseChecklist";
import { buildWelcomeMessage } from "@/lib/journeyWelcome";
import { fetchChatReply } from "@/lib/fetchChatReply";
import { detectAskedPhaseOneElements, nextPhaseOneElement } from "@/lib/phaseOneRouting";
import {
  journeyStateFromSession,
  toJourneyContextPayload,
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

function journeyTitle(session: ChatSession | null): string {
  const name = session?.session_name?.trim();
  if (name && !isAutoNamedJourney(name)) return name;
  if (session?.presenting_challenge?.trim()) {
    const snippet = session.presenting_challenge.trim();
    return snippet.length > 56 ? `${snippet.slice(0, 56)}…` : snippet;
  }
  return name || "New journey";
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function AvatarSessionPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
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
  const [chatError, setChatError] = useState<string | null>(null);
  const [isCoachWarming, setIsCoachWarming] = useState(false);
  const handleSendRef = useRef<(text: string) => void>(() => {});
  const pendingSpeakTimeoutRef = useRef<number | null>(null);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const buildDisplayMessages = (allMessages: StoredMessage[], activeMessageId: string | null) => {
    const display: TranscriptMessage[] = [];
    const variantParentsRendered = new Set<string>();

    const feedbackCountFor = (variant: StoredMessage) => {
      const sourceId = variant.regenerated_from_message_id || variant.id;
      const own = feedbackByMessageId[variant.id]?.length || 0;
      const fromSource = feedbackByMessageId[sourceId]?.length || 0;
      return Math.max(own, fromSource);
    };

    const pickVariant = (parentUserId: string) => {
      const variants = allMessages.filter(
        (candidate) => candidate.role === "assistant" && candidate.parent_message_id === parentUserId,
      );
      if (variants.length === 0) return null;

      let activeVariant = variants[variants.length - 1];
      if (activeMessageId) {
        const explicit = variants.find((candidate) => candidate.id === activeMessageId);
        if (explicit) activeVariant = explicit;
      }
      const activeIndex = variants.findIndex((candidate) => candidate.id === activeVariant.id);
      return { activeVariant, activeIndex, variants };
    };

    const pushAssistantVariant = (parentUserId: string) => {
      if (variantParentsRendered.has(parentUserId)) return;
      const picked = pickVariant(parentUserId);
      if (!picked) return;
      variantParentsRendered.add(parentUserId);
      display.push({
        ...picked.activeVariant,
        content: sanitizeAssistantDisplayContent(picked.activeVariant.content),
        variantIndex: picked.activeIndex,
        variantTotal: picked.variants.length,
        isActiveVariant: true,
        feedbackCount: feedbackCountFor(picked.activeVariant),
      });
    };

    for (const item of allMessages) {
      if (item.role === "user") {
        display.push(item);
        pushAssistantVariant(item.id);
        continue;
      }

      if (item.role === "assistant") {
        if (!item.parent_message_id) {
          display.push({
            ...item,
            variantIndex: 0,
            variantTotal: 1,
            isActiveVariant: true,
            feedbackCount: feedbackCountFor(item),
          });
          continue;
        }
        pushAssistantVariant(item.parent_message_id);
      }
    }

    return display;
  };

  const feedbackItemsForDisplay = useMemo(() => {
    const merged: Record<string, ChatFeedback[]> = { ...feedbackByMessageId };
    for (const msg of rawMessages) {
      if (msg.role !== "assistant") continue;
      const sourceId = msg.regenerated_from_message_id;
      if (!sourceId) continue;
      const sourceItems = merged[sourceId];
      if (!sourceItems?.length) continue;
      if (!merged[msg.id]?.length) {
        merged[msg.id] = sourceItems;
      }
    }
    return merged;
  }, [feedbackByMessageId, rawMessages]);

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

      if (!journeyId) {
        navigate("/testing/journeys", { replace: true });
        return;
      }

      try {
        setIsSessionLoading(true);
        let journey = await fetchJourneyById(journeyId, user.id);
        if (!journey) {
          navigate("/testing/journeys", { replace: true });
          return;
        }
        if (!isMounted) return;
        setJourneySession(journey);
        setSessionId(journey.id);

        const history = await fetchChatHistory(journey.id);
        if (!isMounted) return;
        const restored = mapHistoryToStoredMessages(history);

        const assistantHistory = restored
          .filter((m) => m.role === "assistant")
          .map((m) => m.content);
        const journeyState = journeyStateFromSession(journey);
        const recovered = extractLatestProgressFromHistory(assistantHistory, journeyState);
        if (recovered.goals || recovered.progressSummary) {
          await updateProgressDashboard(journey.id, {
            goals: recovered.goals ?? journeyState.user_goals,
            progressSummary: recovered.progressSummary ?? journeyState.progress_summary,
          });
          journey = {
            ...journey,
            user_goals: recovered.goals ?? journeyState.user_goals,
            progress_summary: recovered.progressSummary ?? journey.progress_summary,
          };
        }

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
  }, [user, journeyId, navigate]);

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

  const applyProgressDashboardUpdates = async (
    assistantContent: string,
    current: JourneyState,
    userMessage?: string,
  ) => {
    if (!sessionId) return current;

    const extracted = extractProgressUpdates(assistantContent, current);
    let nextGoals = current.user_goals;
    let nextSummary = current.progress_summary;
    let nextChecklist = syncPhaseChecklist(current);
    const progressPatch: Partial<JourneyState> = {};

    if (extracted.goals) {
      nextGoals = extracted.goals;
      progressPatch.user_goals = nextGoals;
      const goalRow = nextGoals.find((g) => g.tier === "goal" || g.step === "goal");
      if (goalRow?.title) {
        progressPatch.target_outcome = goalRow.title;
      }
      const activeSub = nextGoals.find(
        (g) => !g.completed && (g.tier === "sub" || (g.step && g.step.includes("."))),
      );
      const activeMajor = nextGoals.find((g) => !g.completed && g.tier === "major");
      const active = activeSub ?? activeMajor;
      if (active?.title) {
        progressPatch.active_micro_goal = active.title;
      }
    }
    if (extracted.progressSummary) {
      nextSummary = extracted.progressSummary;
      progressPatch.progress_summary = nextSummary;
    }
    if (extracted.phaseChecklist) {
      nextChecklist = extracted.phaseChecklist;
      progressPatch.phase_checklist = nextChecklist;
    }

    if (userMessage) {
      const autoCompleted = autoCompleteMatchingGoal(nextGoals, userMessage);
      if (autoCompleted) {
        nextGoals = autoCompleted;
        progressPatch.user_goals = nextGoals;
      }
    }

    const mergedForSync = { ...current, ...progressPatch, user_goals: nextGoals, phase_checklist: nextChecklist };
    const syncedChecklist = syncPhaseChecklist(mergedForSync);
    if (JSON.stringify(syncedChecklist) !== JSON.stringify(current.phase_checklist)) {
      nextChecklist = syncedChecklist;
      progressPatch.phase_checklist = nextChecklist;
    }

    const coachSync = syncSessionTasks({ ...mergedForSync, phase_checklist: nextChecklist });
    if (coachSync) {
      nextGoals = coachSync.user_goals;
      if (coachSync.progress_summary) {
        nextSummary = coachSync.progress_summary;
      }
      progressPatch.user_goals = nextGoals;
      if (coachSync.progress_summary) {
        progressPatch.progress_summary = nextSummary;
      }
    }

    if (Object.keys(progressPatch).length > 0) {
      await updateProgressDashboard(sessionId, {
        goals: progressPatch.user_goals ?? nextGoals,
        progressSummary: progressPatch.progress_summary ?? nextSummary,
        phaseChecklist: progressPatch.phase_checklist ?? nextChecklist,
      });
      setJourneySession((prev) =>
        prev && prev.id === sessionId
          ? {
              ...prev,
              ...progressPatch,
              updated_at: new Date().toISOString(),
            }
          : prev,
      );
    }

    return {
      ...current,
      user_goals: nextGoals,
      progress_summary: nextSummary,
      phase_checklist: nextChecklist,
    };
  };

  const maybeAutoRenameJourney = async (userTexts: string[]) => {
    if (!sessionId || !journeySession || !isAutoNamedJourney(journeySession.session_name)) return;
    const title = await suggestJourneyTitle(userTexts);
    if (!title) return;
    await renameChatSession(sessionId, title);
    setJourneySession((prev) => (prev ? { ...prev, session_name: title } : prev));
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
    setChatError(null);
    setIsCoachWarming(false);
    const chatHistory = buildDisplayMessages(persistedRawMessages, activeAssistantId).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const assistantTexts = chatHistory.filter((m) => m.role === "assistant").map((m) => m.content);
    const askedPhaseOne = detectAskedPhaseOneElements(assistantTexts);
    const journeyContext = toJourneyContextPayload(journeyState, chatHistory.length, {
      phaseOneNextElement:
        journeyState.phase_one_step === 2 && !journeyState.phase_one_confirmed
          ? nextPhaseOneElement(assistantTexts)
          : null,
      askedPhaseOneElements:
        askedPhaseOne.size > 0 ? [...askedPhaseOne].join(", ") : null,
    });

    try {
      const result = await fetchChatReply(
        {
          userMessage: text,
          chatHistory,
          possibleCrisisLanguage: detectCrisis(text),
          journeyContext,
        },
        { onWarmingChange: setIsCoachWarming },
      );

      if (!result.ok) {
        setIsCoachWarming(false);
        setChatError(result.error);
        toast.error(result.error);
        setIsAiResponding(false);
        return;
      }

      const content = result.reply;
      setIsCoachWarming(false);
      const { displayContent } = extractProgressUpdates(content || "", journeyState);
      const reply: TranscriptMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: displayContent || "I didn't get a response. Please try again.",
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
      const journeyUpdates = inferJourneyUpdates(text, previousAssistantContent, content, journeyState);
      await applyJourneyUpdates(journeyUpdates);
      const mergedState = { ...journeyState, ...journeyUpdates };
      await applyProgressDashboardUpdates(content, mergedState, text);
      const userTexts = buildDisplayMessages(nextRaw, savedReply.id)
        .filter((m) => m.role === "user")
        .map((m) => m.content);
      void maybeAutoRenameJourney(userTexts);
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
      const errMsg =
        "Connection lost — the coach may still be starting. Please send your message again in a minute.";
      setIsCoachWarming(false);
      setChatError(errMsg);
      toast.error(errMsg);
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
    setJourneySession((prev) =>
      prev && prev.id === sessionId ? { ...prev, active_message_id: messageId } : prev,
    );
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

  const collectFeedbackForVariant = async (target: StoredMessage) => {
    const ids = new Set<string>();
    let current: StoredMessage | undefined = target;
    while (current) {
      ids.add(current.id);
      if (!current.regenerated_from_message_id) break;
      const parent = rawMessages.find((item) => item.id === current!.regenerated_from_message_id);
      if (!parent) {
        ids.add(current.regenerated_from_message_id);
        break;
      }
      current = parent;
    }
    const lists = await Promise.all([...ids].map((id) => fetchMessageFeedback(id)));
    const merged = lists.flat();
    return [...new Map(merged.map((item) => [item.id, item])).values()];
  };

  const handleRegenerate = async (messageId: string) => {
    if (!sessionId) return;
    const target = rawMessages.find((item) => item.id === messageId && item.role === "assistant");
    if (!target) return;
    const parentUser = rawMessages.find((item) => item.id === target.parent_message_id && item.role === "user");
    if (!parentUser) return;
    const feedbackList = await collectFeedbackForVariant(target);
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
      setIsCoachWarming(false);
      const regenJourney = journeyStateFromSession(journeySession);
      const chatHistory = buildDisplayMessages(rawMessages, activeAssistantId).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await fetchChatReply(
        {
          mode: "regenerate",
          journeyContext: toJourneyContextPayload(regenJourney, rawMessages.length),
          regenerationContext: {
            originalUserMessage: parentUser.content,
            previousAssistantReply: target.content,
            feedbackList: regenerationFeedback,
            chatHistory,
          },
        },
        { onWarmingChange: setIsCoachWarming },
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const regeneratedContent = result.reply.trim();
      if (!regeneratedContent) {
        toast.error("The coach returned an empty reply. Try again in a moment.");
        return;
      }

      const branchRoot = target.branch_root_message_id || target.id;
      const saved = await saveChatMessage(sessionId, "assistant", regeneratedContent, {
        parentMessageId: parentUser.id,
        regeneratedFromMessageId: target.id,
        branchRootMessageId: branchRoot,
        generationMetadata: {
          modelProvider: "runpod",
          promptVersion: "feedback-v3",
          regenerated: true,
          feedbackIds: feedbackList.map((item) => item.id),
        },
      });
      const nextRaw = [
        ...rawMessages,
        {
          id: saved.id,
          role: "assistant" as const,
          content: saved.content,
          parent_message_id: parentUser.id,
          regenerated_from_message_id: target.id,
          branch_root_message_id: branchRoot,
          admin_quality_star: saved.admin_quality_star ?? false,
        },
      ];
      setRawMessages(nextRaw);
      await handleSelectVariant(saved.id);
      setFeedbackByMessageId((prev) => ({
        ...prev,
        [saved.id]: feedbackList,
      }));
      toast.success("Regenerated with RunPod — new variant selected.");
    } finally {
      setIsRegenerating(false);
      setIsCoachWarming(false);
    }
  };

  const journey = journeyStateFromSession(journeySession);
  const displayTitle = journeyTitle(journeySession);
  const userTurns = messages.filter((message) => message.role === "user").length;
  const statusLabel = isCoachWarming
    ? "Getting ready…"
    : isAiResponding
      ? "Thinking..."
      : isSpeaking
        ? "Speaking..."
        : "Ready";

  return (
    <div className="min-h-[calc(100vh-8rem)] px-3 md:px-5 py-4 pb-24 md:pb-4">
      <div className="max-w-5xl mx-auto relative">
        <main className="rounded-2xl border border-border bg-card/95 backdrop-blur p-4 md:p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <Link to="/testing/journeys">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to journeys
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                  <Link to={journeyId ? `/testing/journeys/${journeyId}` : "/testing/journeys"}>
                    <ListTodo className="w-4 h-4 mr-1.5" />
                    Tasks
                  </Link>
                </Button>
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">AI Coach</p>
              <h1 className="text-xl md:text-2xl font-semibold">{displayTitle}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {userTurns > 0 ? "Pick up where you left off" : "Share what's on your mind to begin"}
              </p>
              <PhaseStepper
                className="mt-3"
                currentPhase={journey.platform_phase}
                phaseOneConfirmed={journey.phase_one_confirmed}
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium">
              {isCoachWarming ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
              )}
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
              feedbackItemsByMessageId={feedbackItemsForDisplay}
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
              {isCoachWarming ? <CoachWarmingIndicator /> : null}
              {chatError ? (
                <p className="mb-2 text-sm text-destructive" role="alert">
                  {chatError}
                </p>
              ) : null}
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
