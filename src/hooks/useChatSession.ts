import { supabase } from "@/integrations/supabase/client";

export type ChatSession = {
  id: string;
  user_id: string;
  scenario: string;
  session_name: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
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

export async function saveChatMessage(sessionId: string, role: "user" | "assistant", content: string) {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ session_id: sessionId, role, content });
  if (error) throw error;
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
