import { supabase } from "@/integrations/supabase/client";
import type { PracticeStateForPrompt } from "@/types/journey";
import type { UserWorkbookStatus } from "@/lib/workbooks";
import { WORKBOOK_BY_ID } from "@/lib/workbooks";
import { NotSavedError } from "@/hooks/useChatSession";

const CONSENT_VERSION = "1";
const ACTIVITY_IDLE_MS = 5 * 60 * 1000;

export type UserWorkbookRow = {
  id: string;
  user_id: string;
  workbook_id: string;
  status: UserWorkbookStatus;
  source: "library" | "recommendation";
  chat_session_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  completion_rating: number | null;
  completion_description: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkbookRecommendationRow = {
  id: string;
  user_id: string;
  chat_session_id: string;
  message_id: string | null;
  workbook_id: string;
  decision: "added" | "skipped" | "started" | "pending" | null;
  decided_at: string | null;
  created_at: string;
};

export type ReflectionRow = {
  id: string;
  user_id: string;
  chat_session_id: string | null;
  prompt_key: string;
  answer: string | null;
  skipped: boolean;
  created_at: string;
};

export type JournalEntryRow = {
  id: string;
  user_id: string;
  chat_session_id: string | null;
  workbook_id: string | null;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in required.");
  return data.user.id;
}

export async function fetchUserWorkbooks(): Promise<UserWorkbookRow[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("user_workbooks")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserWorkbookRow[];
}

export async function upsertUserWorkbook(opts: {
  workbookId: string;
  status: UserWorkbookStatus;
  source: "library" | "recommendation";
  chatSessionId?: string | null;
  completionRating?: number | null;
  completionDescription?: string | null;
}): Promise<UserWorkbookRow> {
  const userId = await requireUserId();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    user_id: userId,
    workbook_id: opts.workbookId,
    status: opts.status,
    source: opts.source,
    chat_session_id: opts.chatSessionId ?? null,
    updated_at: now,
  };
  if (opts.status === "in_progress") {
    patch.started_at = now;
  }
  if (opts.status === "completed") {
    patch.completed_at = now;
    patch.completion_rating = opts.completionRating ?? null;
    patch.completion_description = opts.completionDescription ?? null;
  }

  const { data, error } = await supabase
    .from("user_workbooks")
    .upsert(patch, { onConflict: "user_id,workbook_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as UserWorkbookRow;
}

export async function saveWorkbookRecommendation(opts: {
  chatSessionId: string;
  messageId: string | null;
  workbookId: string;
  decision?: "added" | "skipped" | "started" | "pending";
}): Promise<WorkbookRecommendationRow> {
  const userId = await requireUserId();
  const decision = opts.decision ?? "pending";
  const { data, error } = await supabase
    .from("workbook_recommendations")
    .insert({
      user_id: userId,
      chat_session_id: opts.chatSessionId,
      message_id: opts.messageId,
      workbook_id: opts.workbookId,
      decision,
      decided_at: decision === "pending" ? null : new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as WorkbookRecommendationRow;
}

export async function decideWorkbookRecommendation(
  recommendationId: string,
  decision: "added" | "skipped" | "started",
): Promise<void> {
  const { data, error } = await supabase
    .from("workbook_recommendations")
    .update({ decision, decided_at: new Date().toISOString() })
    .eq("id", recommendationId)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new NotSavedError();
}

export async function fetchPendingRecommendations(
  chatSessionId: string,
): Promise<WorkbookRecommendationRow[]> {
  const { data, error } = await supabase
    .from("workbook_recommendations")
    .select("*")
    .eq("chat_session_id", chatSessionId)
    .or("decision.eq.pending,decision.is.null")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkbookRecommendationRow[];
}

export async function fetchPracticeStateForPrompt(): Promise<PracticeStateForPrompt> {
  try {
    const workbooks = await fetchUserWorkbooks();
    const open = workbooks
      .filter((w) => w.status === "added" || w.status === "in_progress")
      .map((w) => ({
        id: w.workbook_id,
        workbook_id: w.workbook_id,
        status: w.status,
        title: WORKBOOK_BY_ID[w.workbook_id]?.title,
      }));
    const completed = workbooks
      .filter((w) => w.status === "completed")
      .slice(0, 5)
      .map((w) => ({
        id: w.workbook_id,
        workbook_id: w.workbook_id,
        completion_rating: w.completion_rating,
        completion_description: w.completion_description,
      }));

    const userId = await requireUserId();
    const { data: reflections } = await supabase
      .from("reflections")
      .select("answer, skipped")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    return {
      openWorkbooks: open,
      completedWorkbooks: completed,
      recentReflections: (reflections ?? []) as Array<{ answer?: string | null; skipped?: boolean }>,
    };
  } catch {
    return {};
  }
}

export async function saveReflection(opts: {
  chatSessionId: string | null;
  answer?: string | null;
  skipped?: boolean;
  promptKey?: string;
}): Promise<ReflectionRow> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("reflections")
    .insert({
      user_id: userId,
      chat_session_id: opts.chatSessionId,
      prompt_key: opts.promptKey ?? "surprised_most",
      answer: opts.skipped ? null : opts.answer ?? null,
      skipped: !!opts.skipped,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ReflectionRow;
}

export async function fetchReflections(): Promise<ReflectionRow[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReflectionRow[];
}

export async function fetchJournalEntries(): Promise<JournalEntryRow[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JournalEntryRow[];
}

export async function upsertJournalEntry(opts: {
  id?: string;
  body: string;
  title?: string | null;
  chatSessionId?: string | null;
  workbookId?: string | null;
}): Promise<JournalEntryRow> {
  const userId = await requireUserId();
  const now = new Date().toISOString();
  if (opts.id) {
    const { data, error } = await supabase
      .from("journal_entries")
      .update({
        body: opts.body,
        title: opts.title ?? null,
        chat_session_id: opts.chatSessionId ?? null,
        workbook_id: opts.workbookId ?? null,
        updated_at: now,
      })
      .eq("id", opts.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    if (!data) throw new NotSavedError();
    return data as JournalEntryRow;
  }
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: userId,
      body: opts.body,
      title: opts.title ?? null,
      chat_session_id: opts.chatSessionId ?? null,
      workbook_id: opts.workbookId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as JournalEntryRow;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function closeOpenActivity(userId?: string): Promise<void> {
  try {
    const uid = userId ?? (await requireUserId());
    const { data: open } = await supabase
      .from("user_activity")
      .select("id, last_heartbeat_at")
      .eq("user_id", uid)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!open?.id) return;
    const endedAt = open.last_heartbeat_at ?? new Date().toISOString();
    await supabase.from("user_activity").update({ ended_at: endedAt }).eq("id", open.id);
  } catch {
    // best-effort
  }
}

export async function heartbeatActivity(path?: string): Promise<void> {
  try {
    const userId = await requireUserId();
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const { data: open } = await supabase
      .from("user_activity")
      .select("id, last_heartbeat_at")
      .eq("user_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (open?.id && open.last_heartbeat_at) {
      const idleMs = nowMs - new Date(open.last_heartbeat_at).getTime();
      if (idleMs > ACTIVITY_IDLE_MS) {
        await supabase
          .from("user_activity")
          .update({ ended_at: open.last_heartbeat_at })
          .eq("id", open.id);
      } else {
        const { data } = await supabase
          .from("user_activity")
          .update({ last_heartbeat_at: now, path: path ?? null })
          .eq("id", open.id)
          .select("id");
        if (data?.length) return;
      }
    }

    await supabase.from("user_activity").insert({
      user_id: userId,
      started_at: now,
      last_heartbeat_at: now,
      path: path ?? null,
    });
  } catch {
    // Activity tracking is best-effort
  }
}

export async function fetchActivityMinutes(): Promise<number> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("user_activity")
    .select("started_at, ended_at, last_heartbeat_at")
    .eq("user_id", userId);
  if (error || !data) return 0;
  let ms = 0;
  for (const row of data) {
    const start = new Date(row.started_at).getTime();
    const end = new Date(row.ended_at ?? row.last_heartbeat_at ?? row.started_at).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) ms += end - start;
  }
  return Math.round(ms / 60000);
}

export async function fetchGoalsAcrossJourneys(): Promise<
  Array<{ sessionId: string; sessionName: string | null; goals: unknown }>
> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, session_name, user_goals")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => ({
    sessionId: s.id,
    sessionName: s.session_name,
    goals: s.user_goals,
  }));
}

export async function fetchUserConsent(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_consents")
      .select("id")
      .eq("user_id", userId)
      .eq("version", CONSENT_VERSION)
      .maybeSingle();
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) return false;
      return false;
    }
    return !!data;
  } catch {
    return false;
  }
}

export async function saveUserConsent(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("user_consents")
    .upsert(
      { user_id: userId, version: CONSENT_VERSION, consented_at: new Date().toISOString() },
      { onConflict: "user_id,version" },
    )
    .select("id");
  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
      throw new Error("Consent storage is not available yet.");
    }
    throw error;
  }
  if (!data?.length) throw new NotSavedError();
}
