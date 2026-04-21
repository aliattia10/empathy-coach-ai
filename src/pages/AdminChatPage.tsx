import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

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

type UserRow = {
  userId: string;
  displayName: string | null;
  email: string | null;
  sessionCount: number;
  lastActivity: string;
};

function shortUserId(userId: string) {
  return userId.length > 12 ? `${userId.slice(0, 8)}…` : userId;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

function sanitizeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_");
}

const DEFAULT_ADMIN_CHAT_PASSWORD = "123josh*1";
const ONLY_ADMIN_EMAIL = "josh@admin.com";

export default function AdminChatPage() {
  const { user, loading } = useAuth();
  const [gatePass, setGatePass] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState(ONLY_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string | null>>({});
  const [userEmails, setUserEmails] = useState<Record<string, string | null>>({});
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [exportingSingle, setExportingSingle] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingUserZip, setExportingUserZip] = useState(false);
  const [exportingAllZip, setExportingAllZip] = useState(false);

  const expectedPassword = useMemo(
    () => import.meta.env.VITE_ADMIN_CHAT_PASSWORD || DEFAULT_ADMIN_CHAT_PASSWORD,
    []
  );

  useEffect(() => {
    const checkRole = async () => {
      if (!user || (user.email || "").toLowerCase() !== ONLY_ADMIN_EMAIL) {
        setHasAdminRole(false);
        setCheckingRole(false);
        return;
      }

      setCheckingRole(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);
      setHasAdminRole(!error && !!data && data.length > 0);
      setCheckingRole(false);
    };

    checkRole();
  }, [user]);

  useEffect(() => {
    if (!unlocked || !hasAdminRole) return;

    const loadSessions = async () => {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("id,user_id,scenario,created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      setLoadingSessions(false);
      if (error) return;
      setSessions((data || []) as SessionRow[]);
    };

    loadSessions();
  }, [unlocked, hasAdminRole]);

  useEffect(() => {
    if (!unlocked || !hasAdminRole || sessions.length === 0) {
      setProfileNames({});
      setUserEmails({});
      return;
    }

    const ids = [...new Set(sessions.map((s) => s.user_id))];

    let cancelled = false;
    (async () => {
      const map: Record<string, string | null> = {};
      const emailMap: Record<string, string | null> = {};
      for (const part of chunkArray(ids, 100)) {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", part);
        if (error || cancelled) break;
        for (const row of data || []) {
          map[row.user_id] = row.display_name;
        }
      }
      const { data: directoryData, error: directoryError } = await supabase.rpc(
        "admin_chat_user_directory",
        { user_ids: ids },
      );
      if (!directoryError && Array.isArray(directoryData)) {
        for (const row of directoryData) {
          if (!row?.user_id) continue;
          emailMap[row.user_id] = row.email ?? null;
          if (row.display_name && !map[row.user_id]) {
            map[row.user_id] = row.display_name;
          }
        }
      }
      if (!cancelled) {
        setProfileNames(map);
        setUserEmails(emailMap);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [unlocked, hasAdminRole, sessions]);

  useEffect(() => {
    if (!unlocked || !selectedSessionId || !hasAdminRole) return;

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
  }, [unlocked, selectedSessionId, hasAdminRole]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoginLoading(false);
    if (error) {
      alert(error.message || "Admin login failed.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUnlocked(false);
    setSessions([]);
    setMessages([]);
    setSelectedUserId(null);
    setSelectedSessionId(null);
    setProfileNames({});
    setUserEmails({});
  };

  const userRows = useMemo((): UserRow[] => {
    const byUser = new Map<string, { count: number; lastActivity: string }>();
    for (const s of sessions) {
      const prev = byUser.get(s.user_id);
      if (!prev) {
        byUser.set(s.user_id, { count: 1, lastActivity: s.created_at });
      } else {
        prev.count += 1;
        if (new Date(s.created_at) > new Date(prev.lastActivity)) {
          prev.lastActivity = s.created_at;
        }
      }
    }
    const rows: UserRow[] = [];
    for (const [userId, { count, lastActivity }] of byUser) {
      rows.push({
        userId,
        displayName: profileNames[userId] ?? null,
        email: userEmails[userId] ?? null,
        sessionCount: count,
        lastActivity,
      });
    }
    rows.sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
    );
    return rows;
  }, [sessions, profileNames, userEmails]);

  const sessionsForSelectedUser = useMemo(() => {
    if (!selectedUserId) return [];
    return sessions
      .filter((s) => s.user_id === selectedUserId)
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [sessions, selectedUserId]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );

  const getUserLabel = (userId: string) =>
    profileNames[userId]?.trim() ||
    userEmails[userId]?.trim() ||
    `user-${shortUserId(userId)}`;

  const fetchMessagesBySessionId = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id,role,content,created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []) as MessageRow[];
  };

  const buildTranscriptPdf = (session: SessionRow, transcriptMessages: MessageRow[]) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 40;
    const right = 40;
    const top = 40;
    const bottom = 40;
    const lineHeight = 14;
    const maxWidth = pageWidth - left - right;
    let y = top;

    const addLine = (text: string, options?: { bold?: boolean; gapAfter?: number }) => {
      doc.setFont("helvetica", options?.bold ? "bold" : "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(text, maxWidth) as string[];
      for (const line of lines) {
        if (y + lineHeight > pageHeight - bottom) {
          doc.addPage();
          y = top;
        }
        doc.text(line, left, y);
        y += lineHeight;
      }
      y += options?.gapAfter ?? 0;
    };

    addLine("ShiftED AI - Chat Transcript", { bold: true, gapAfter: 6 });
    addLine(`Session ID: ${session.id}`);
    addLine(`User: ${getUserLabel(session.user_id)} (${session.user_id})`);
    addLine(`Scenario: ${session.scenario}`);
    addLine(`Session created: ${new Date(session.created_at).toLocaleString()}`, { gapAfter: 8 });
    addLine("------------------------------------------------------------", { gapAfter: 4 });

    if (transcriptMessages.length === 0) {
      addLine("No messages in this session.");
    } else {
      transcriptMessages.forEach((message, index) => {
        addLine(
          `${message.role.toUpperCase()} - ${new Date(message.created_at).toLocaleString()}`,
          { bold: true },
        );
        addLine(message.content || "(empty message)", { gapAfter: 6 });
        if (index < transcriptMessages.length - 1) {
          addLine(" ");
        }
      });
    }

    return doc;
  };

  const buildTranscriptFilename = (session: SessionRow) => {
    const createdDate = new Date(session.created_at).toISOString().slice(0, 10);
    const safeUser = sanitizeFilename(getUserLabel(session.user_id));
    const safeSession = sanitizeFilename(session.id.slice(0, 8));
    return `chat-transcript-${safeUser}-${createdDate}-${safeSession}.pdf`;
  };

  const downloadTranscriptPdf = (session: SessionRow, transcriptMessages: MessageRow[]) => {
    const doc = buildTranscriptPdf(session, transcriptMessages);
    doc.save(buildTranscriptFilename(session));
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const buildSessionFolderName = (session: SessionRow) => {
    const safeDate = new Date(session.created_at).toISOString().replace(/[:]/g, "-");
    const safeScenario = sanitizeFilename(session.scenario || "session");
    return `${safeDate}_${safeScenario}_${session.id.slice(0, 8)}`;
  };

  const handleDownloadSelectedTranscript = async () => {
    if (!selectedSessionId || !selectedSession) return;
    setExportingSingle(true);
    try {
      const transcriptMessages =
        selectedSessionId === selectedSession?.id && messages.length > 0
          ? messages
          : await fetchMessagesBySessionId(selectedSessionId);
      downloadTranscriptPdf(selectedSession, transcriptMessages);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export transcript.";
      alert(message);
    } finally {
      setExportingSingle(false);
    }
  };

  const handleDownloadAllTranscripts = async () => {
    if (sessions.length === 0) return;
    setExportingAll(true);
    try {
      for (const session of sessions) {
        const transcriptMessages = await fetchMessagesBySessionId(session.id);
        downloadTranscriptPdf(session, transcriptMessages);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export all transcripts.";
      alert(message);
    } finally {
      setExportingAll(false);
    }
  };

  const handleDownloadSelectedUserZip = async () => {
    if (!selectedUserId) return;
    setExportingUserZip(true);
    try {
      const zip = new JSZip();
      const selectedUserSessions = sessions
        .filter((session) => session.user_id === selectedUserId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const userFolder = zip.folder(sanitizeFilename(getUserLabel(selectedUserId)));
      if (!userFolder) throw new Error("Failed to create user folder in zip.");

      for (const session of selectedUserSessions) {
        const transcriptMessages = await fetchMessagesBySessionId(session.id);
        const sessionFolder = userFolder.folder(buildSessionFolderName(session));
        if (!sessionFolder) continue;
        const pdfDoc = buildTranscriptPdf(session, transcriptMessages);
        const pdfBuffer = pdfDoc.output("arraybuffer");
        sessionFolder.file(buildTranscriptFilename(session), pdfBuffer);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      triggerBlobDownload(
        blob,
        `chat-transcripts-${sanitizeFilename(getUserLabel(selectedUserId))}.zip`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate user zip.";
      alert(message);
    } finally {
      setExportingUserZip(false);
    }
  };

  const handleDownloadAllUsersZip = async () => {
    if (sessions.length === 0) return;
    setExportingAllZip(true);
    try {
      const zip = new JSZip();
      const sessionsByUser = new Map<string, SessionRow[]>();
      for (const session of sessions) {
        const list = sessionsByUser.get(session.user_id) || [];
        list.push(session);
        sessionsByUser.set(session.user_id, list);
      }

      for (const [userId, userSessions] of sessionsByUser.entries()) {
        const userFolder = zip.folder(sanitizeFilename(getUserLabel(userId)));
        if (!userFolder) continue;
        const orderedSessions = [...userSessions].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        for (const session of orderedSessions) {
          const transcriptMessages = await fetchMessagesBySessionId(session.id);
          const sessionFolder = userFolder.folder(buildSessionFolderName(session));
          if (!sessionFolder) continue;
          const pdfDoc = buildTranscriptPdf(session, transcriptMessages);
          const pdfBuffer = pdfDoc.output("arraybuffer");
          sessionFolder.file(buildTranscriptFilename(session), pdfBuffer);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      triggerBlobDownload(blob, "chat-transcripts-all-users.zip");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate zip.";
      alert(message);
    } finally {
      setExportingAllZip(false);
    }
  };

  const onUnlock = () => {
    if (gatePass === expectedPassword) setUnlocked(true);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h1 className="text-lg font-semibold">Admin sign in</h1>
          <p className="text-sm text-muted-foreground">
            Only Joshua account can access admin chat.
          </p>
          <form className="space-y-3" onSubmit={handleAdminLogin}>
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loginLoading}>
              {loginLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if ((user.email || "").toLowerCase() !== ONLY_ADMIN_EMAIL) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            /adminchat is restricted to {ONLY_ADMIN_EMAIL}.
          </p>
          <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  if (checkingRole) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Checking admin role…</p>
        </div>
      </div>
    );
  }

  if (!hasAdminRole) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h1 className="text-lg font-semibold">Admin role missing</h1>
          <p className="text-sm text-muted-foreground">
            Login succeeded, but this user does not have admin role in `user_roles`.
            Run `supabase/sql/ADMIN_CHAT_SETUP.sql` in Supabase SQL Editor.
          </p>
          <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>
    );
  }

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
          <Button variant="ghost" onClick={handleSignOut} className="w-full">
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-[1400px] mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Admin Chat Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Users with at least one saved session. Select a user, then a session, to read the chat.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="outline"
            onClick={handleDownloadSelectedTranscript}
            disabled={
              !selectedSessionId ||
              loadingMessages ||
              exportingSingle ||
              exportingAll ||
              exportingUserZip ||
              exportingAllZip
            }
          >
            {exportingSingle ? "Generating PDF..." : "Download selected transcript PDF"}
          </Button>
          <Button
            onClick={handleDownloadAllTranscripts}
            disabled={
              sessions.length === 0 ||
              loadingSessions ||
              exportingAll ||
              exportingSingle ||
              exportingUserZip ||
              exportingAllZip
            }
          >
            {exportingAll
              ? "Generating all PDFs..."
              : "Download all transcripts (one PDF per conversation)"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadSelectedUserZip}
            disabled={
              !selectedUserId ||
              loadingSessions ||
              exportingSingle ||
              exportingAll ||
              exportingUserZip ||
              exportingAllZip
            }
          >
            {exportingUserZip ? "Building user ZIP..." : "Download selected user ZIP"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadAllUsersZip}
            disabled={
              sessions.length === 0 ||
              loadingSessions ||
              exportingSingle ||
              exportingAll ||
              exportingUserZip ||
              exportingAllZip
            }
          >
            {exportingAllZip ? "Building all-user ZIP..." : "Download all users ZIP (folders by user/session)"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 rounded-xl border border-border bg-card overflow-hidden flex flex-col max-h-[75vh]">
          <div className="px-3 py-2 border-b border-border">
            <h2 className="text-sm font-semibold">Users</h2>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            {loadingSessions && (
              <p className="text-sm text-muted-foreground p-3">Loading…</p>
            )}
            {!loadingSessions && userRows.length === 0 && (
              <p className="text-sm text-muted-foreground p-3">No sessions yet.</p>
            )}
            {!loadingSessions && userRows.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">User</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="hidden sm:table-cell">Last activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRows.map((row) => {
                    const label =
                      row.displayName?.trim() ||
                      row.email?.trim() ||
                      `User ${shortUserId(row.userId)}`;
                    const selected = selectedUserId === row.userId;
                    return (
                      <TableRow
                        key={row.userId}
                        data-state={selected ? "selected" : undefined}
                        className={cn("cursor-pointer", selected && "bg-muted")}
                        onClick={() => {
                          setSelectedUserId(row.userId);
                          setSelectedSessionId(null);
                          setMessages([]);
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="truncate" title={row.userId}>
                            {label}
                          </div>
                          {row.email && row.displayName && (
                            <div className="text-xs text-muted-foreground truncate" title={row.email}>
                              {row.email}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground font-normal truncate sm:hidden">
                            {new Date(row.lastActivity).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.sessionCount}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(row.lastActivity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-border bg-card overflow-hidden flex flex-col max-h-[75vh]">
          <div className="px-3 py-2 border-b border-border">
            <h2 className="text-sm font-semibold">Sessions</h2>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0 p-2 space-y-2">
            {!selectedUserId && (
              <p className="text-sm text-muted-foreground p-2">Select a user to see their sessions.</p>
            )}
            {selectedUserId && sessionsForSelectedUser.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">No sessions for this user.</p>
            )}
            {selectedUserId &&
              sessionsForSelectedUser.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-2 text-xs transition-colors",
                    selectedSessionId === s.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className="font-medium text-foreground">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground mt-0.5">Scenario: {s.scenario}</div>
                  <div className="text-muted-foreground font-mono text-[10px] mt-1 truncate" title={s.id}>
                    {s.id}
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-border bg-card overflow-hidden flex flex-col max-h-[75vh]">
          <div className="px-3 py-2 border-b border-border">
            <h2 className="text-sm font-semibold">Chat</h2>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0 p-3 space-y-3">
            {!selectedSessionId && (
              <p className="text-sm text-muted-foreground">Select a session to view messages.</p>
            )}
            {loadingMessages && (
              <p className="text-sm text-muted-foreground">Loading messages…</p>
            )}
            {selectedSessionId &&
              !loadingMessages &&
              messages.length === 0 && (
                <p className="text-sm text-muted-foreground">No messages in this session.</p>
              )}
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

