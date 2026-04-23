import { supabase } from "@/integrations/supabase/client";

export type ChatSession = {
  id: string;
  user_id: string;
  scenario: string;
  session_name: string | null;
  active_message_id: string | null;
  created_at: string;
  updated_at: string;
};

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
};

export async function createChatSession(
  userId: string,
  scenario = "constructive_feedback",
  sessionName?: string,
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

export async function setSessionActiveMessage(sessionId: string, messageId: string | null) {
  const { error } = await supabase
    .from("chat_sessions")
    .update({ active_message_id: messageId })
    .eq("id", sessionId);
  if (error) throw error;
}
