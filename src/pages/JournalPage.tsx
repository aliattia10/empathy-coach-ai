import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  deleteJournalEntry,
  fetchJournalEntries,
  upsertJournalEntry,
  type JournalEntryRow,
} from "@/lib/phase3Api";

export default function JournalPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const [entries, setEntries] = useState<JournalEntryRow[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try {
      setEntries(await fetchJournalEntries());
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load your journal. Please try again.");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const save = async () => {
    if (!body.trim()) {
      toast.error("Write something first.");
      return;
    }
    setBusy(true);
    try {
      await upsertJournalEntry({
        id: editingId ?? undefined,
        title: title.trim() || null,
        body: body.trim(),
        chatSessionId: sessionId,
      });
      setTitle("");
      setBody("");
      setEditingId(null);
      toast.success(editingId ? "Entry updated." : "Entry saved.");
      await reload();
    } catch (err) {
      console.error(err);
      toast.error("Could not save entry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-foreground">Journal</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Self-reflection and journaling — also linked from your Sustainability Path.
        {sessionId ? " Linked to your current journey." : ""}
      </p>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3 mb-8">
        <div>
          <Label htmlFor="j-title">Title (optional)</Label>
          <Input
            id="j-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 rounded-xl"
            placeholder="e.g. After today's check-in"
          />
        </div>
        <div>
          <Label htmlFor="j-body">Entry</Label>
          <Textarea
            id="j-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1.5 rounded-xl"
            rows={5}
            placeholder="What happened, what you felt, what the hot thought was…"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" className="rounded-xl" disabled={busy} onClick={save}>
            {editingId ? "Update entry" : "Save entry"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setBody("");
              }}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
      </div>

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-medium text-foreground">
                  {entry.title?.trim() || "Untitled entry"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(entry.updated_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    setEditingId(entry.id);
                    setTitle(entry.title ?? "");
                    setBody(entry.body);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-destructive"
                  onClick={() =>
                    deleteJournalEntry(entry.id)
                      .then(reload)
                      .then(() => toast.success("Deleted."))
                      .catch(() => toast.error("Could not delete."))
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
            <p className="text-sm text-foreground mt-3 whitespace-pre-wrap">{entry.body}</p>
          </li>
        ))}
        {entries.length === 0 ? (
          <li className="text-sm text-muted-foreground text-center py-8">No entries yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
