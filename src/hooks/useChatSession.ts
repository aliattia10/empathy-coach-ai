import { supabase } from "@/integrations/supabase/client";
import type { JourneyState, UserGoal } from "@/types/journey";
import { normalizeUserGoals } from "@/types/journey";

export type ChatSession = {
  id: string;
  user_id: string;
  scenario: string;
  session_name: string | null;
  active_message_id: string | null;
  created_at: string;
  updated_at: string;
} & JourneyState;

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  parent_message_id: string | null;
  regenerated_from_message_id: string | null;
  branch_root_message_id: string | null;
  generation_metadata: Record<string, unknown> | null;
  created_at: string;
  admin_quality_star?: boolean;
  admin_starred_at?: string | null;
};

export type FeedbackTag =
  | "tone"
  | "clarity"
  | "empathy"
  | "relevance"
  | "safety"
  | "too_long"
  | "too_short"
  | "other";

export type ChatFeedback = {
  id: string;
  conversation_id: string;
  message_id: string;
  admin_user_id: string;
  feedback_text: string;
  rating: number | null;
  tags: FeedbackTag[] | null;
  created_at: string;
  apply_to_global_instructions?: boolean;
};

export const COACHING_JOURNEY_SCENARIO = "coaching_journey";
/** @deprecated Use DEFAULT_JOURNEY_NAME — kept for legacy rows */
export const COACHING_JOURNEY_NAME = "Your coaching journey";
export const DEFAULT_JOURNEY_NAME = "New journey";

export async function createChatSession(
  userId: string,
  scenario = COACHING_JOURNEY_SCENARIO,
  sessionName: string | null = DEFAULT_JOURNEY_NAME,
) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId, scenario, session_name: sessionName ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as ChatSession;
}

export async function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  options?: {
    parentMessageId?: string | null;
    regeneratedFromMessageId?: string | null;
    branchRootMessageId?: string | null;
    generationMetadata?: Record<string, unknown> | null;
  },
) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      parent_message_id: options?.parentMessageId ?? null,
      regenerated_from_message_id: options?.regeneratedFromMessageId ?? null,
      branch_root_message_id: options?.branchRootMessageId ?? null,
      generation_metadata: options?.generationMetadata ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function fetchChatHistory(sessionId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function fetchUserSessions(userId: string) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChatSession[];
}

export async function fetchJourneyById(journeyId: string, userId: string): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", journeyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ChatSession | null) ?? null;
}

export async function createNewJourney(userId: string, name = DEFAULT_JOURNEY_NAME): Promise<ChatSession> {
  return createChatSession(userId, COACHING_JOURNEY_SCENARIO, name);
}

export async function fetchUserJourneys(userId: string): Promise<ChatSession[]> {
  return fetchUserSessions(userId);
}

export async function renameChatSession(sessionId: string, sessionName: string) {
  const { error } = await supabase
    .from("chat_sessions")
    .update({ session_name: sessionName })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function deleteChatSession(sessionId: string) {
  const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionId);
  if (error) throw error;
}

export async function createMessageFeedback(input: {
  conversationId: string;
  messageId: string;
  adminUserId: string;
  feedbackText: string;
  rating?: number | null;
  tags?: FeedbackTag[];
  applyToGlobalInstructions?: boolean;
}) {
  const { data, error } = await supabase
    .from("chat_feedback")
    .insert({
      conversation_id: input.conversationId,
      message_id: input.messageId,
      admin_user_id: input.adminUserId,
      feedback_text: input.feedbackText,
      rating: input.rating ?? null,
      tags: input.tags ?? [],
      apply_to_global_instructions: input.applyToGlobalInstructions !== false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChatFeedback;
}

export async function fetchMessageFeedback(messageId: string) {
  const { data, error } = await supabase
    .from("chat_feedback")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChatFeedback[];
}

export async function deleteMessageFeedback(feedbackId: string) {
  const { error } = await supabase
    .from("chat_feedback")
    .delete()
    .eq("id", feedbackId);
  if (error) throw error;
}

export async function setChatMessageAdminStar(messageId: string, starred: boolean) {
  const { error } = await supabase.rpc("set_chat_message_admin_star", {
    p_message_id: messageId,
    p_starred: starred,
  });
  if (error) throw error;
}

export async function setSessionActiveMessage(sessionId: string, messageId: string | null) {
  const { error } = await supabase
    .from("chat_sessions")
    .update({ active_message_id: messageId })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function updateJourneyState(sessionId: string, updates: Partial<JourneyState>) {
  if (Object.keys(updates).length === 0) return;
  const { error } = await supabase.from("chat_sessions").update(updates).eq("id", sessionId);
  if (error) throw error;
}

export async function updateProgressDashboard(
  sessionId: string,
  patch: {
    goals?: UserGoal[];
    progressSummary?: string | null;
    phaseChecklist?: JourneyState["phase_checklist"];
  },
) {
  const updates: Partial<JourneyState> = {};
  if (patch.goals !== undefined) updates.user_goals = patch.goals;
  if (patch.progressSummary !== undefined) updates.progress_summary = patch.progressSummary;
  if (patch.phaseChecklist !== undefined) updates.phase_checklist = patch.phaseChecklist;
  if (Object.keys(updates).length === 0) return;
  await updateJourneyState(sessionId, updates);
}

export async function updateUserGoals(sessionId: string, goals: UserGoal[], progressSummary?: string | null) {
  await updateProgressDashboard(sessionId, { goals, progressSummary });
}

export function toggleGoalInList(goals: UserGoal[], goalId: string, completed: boolean): UserGoal[] {
  const now = new Date().toISOString();
  return goals.map((g) =>
    g.id === goalId
      ? { ...g, completed, completed_at: completed ? now : null }
      : g,
  );
}

function newTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addUserTask(goals: UserGoal[], title: string): UserGoal[] {
  const trimmed = title.trim().slice(0, 120);
  if (!trimmed) return goals;
  const exists = goals.some((g) => g.title.toLowerCase() === trimmed.toLowerCase());
  if (exists) return goals;
  const now = new Date().toISOString();
  return [
    ...goals,
    {
      id: newTaskId(),
      title: trimmed,
      completed: false,
      completed_at: null,
      source: "user" as const,
      created_at: now,
    },
  ];
}

export function removeUserTask(goals: UserGoal[], taskId: string): UserGoal[] {
  return goals.filter((g) => g.id !== taskId);
}
