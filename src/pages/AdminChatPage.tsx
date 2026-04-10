import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SessionRow = {
  id: string;
  user_id: string;
  scenario: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

const DEFAULT_ADMIN_CHAT_PASSWORD = "123josh*1";

export default function AdminChatPage() {
  const [gatePass, setGatePass] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const expectedPassword = useMemo(
    () => import.meta.env.VITE_ADMIN_CHAT_PASSWORD || DEFAULT_ADMIN_CHAT_PASSWORD,
    []
  );

  useEffect(() => {
    if (!unlocked) return;

    const loadSessions = async () => {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("id,user_id,scenario,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setLoadingSessions(false);
      if (error) return;
      setSessions((data || []) as SessionRow[]);
    };

    loadSessions();
  }, [unlocked]);

  useEffect(() => {
    if (!unlocked || !selectedSessionId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id,role,content,created_at")
        .eq("session_id", selectedSessionId)
        .order("created_at", { ascending: true });
      setLoadingMessages(false);
      if (error) return;
      setMessages((data || []) as MessageRow[]);
    };

    loadMessages();
  }, [unlocked, selectedSessionId]);

  const onUnlock = () => {
    if (gatePass === expectedPassword) setUnlocked(true);
  };

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h1 className="text-lg font-semibold">Admin chat access</h1>
          <p className="text-sm text-muted-foreground">
            Enter admin page password to view all AI chat conversations.
          </p>
          <Input
            type="password"
            value={gatePass}
            onChange={(e) => setGatePass(e.target.value)}
            placeholder="Enter password"
          />
          <Button onClick={onUnlock} className="w-full">
            Unlock
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Admin Chat Monitor</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 rounded-xl border border-border bg-card p-3 max-h-[70vh] overflow-y-auto">
          <h2 className="text-sm font-semibold mb-2">Sessions</h2>
          {loadingSessions && <p className="text-sm text-muted-foreground">Loading sessions…</p>}
          {!loadingSessions && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">No sessions found.</p>
          )}
          <div className="space-y-2">
            {sessions.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className={`w-full text-left rounded-lg border p-2 text-xs ${
                  selectedSessionId === s.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="font-semibold truncate">{s.user_id}</div>
                <div className="text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                <div className="text-muted-foreground">Scenario: {s.scenario}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-3 max-h-[70vh] overflow-y-auto">
          <h2 className="text-sm font-semibold mb-2">Messages</h2>
          {!selectedSessionId && (
            <p className="text-sm text-muted-foreground">Select a session to view messages.</p>
          )}
          {loadingMessages && <p className="text-sm text-muted-foreground">Loading messages…</p>}
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  {m.role.toUpperCase()} · {new Date(m.created_at).toLocaleString()}
                </div>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

