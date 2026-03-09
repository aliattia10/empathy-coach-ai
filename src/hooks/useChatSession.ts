import { supabase } from "@/integrations/supabase/client";

export async function createChatSession(userId: string, scenario = "constructive_feedback") {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId, scenario })
    .select()
    .single();
  if (error) throw error;
  return data;
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
  return data;
}

export async function fetchUserSessions(userId: string) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
