import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { WORKBOOK_BY_ID } from "@/lib/workbooks";
import { fetchUserWorkbooks, upsertUserWorkbook, type UserWorkbookRow } from "@/lib/phase3Api";

export default function WorkbookDetailPage() {
  const { workbookId = "" } = useParams();
  const navigate = useNavigate();
  const workbook = WORKBOOK_BY_ID[workbookId];
  const [row, setRow] = useState<UserWorkbookRow | null>(null);
  const [rating, setRating] = useState("7");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchUserWorkbooks()
      .then((list) => setRow(list.find((w) => w.workbook_id === workbookId) ?? null))
      .catch(() => setRow(null));
  }, [workbookId]);

  if (!workbook) {
    return (
      <div className="container px-4 py-12 max-w-lg mx-auto text-center">
        <p className="text-muted-foreground">Workbook not found.</p>
        <Button asChild className="mt-4 rounded-xl">
          <Link to="/testing/library">Back to library</Link>
        </Button>
      </div>
    );
  }

  const start = async () => {
    setBusy(true);
    try {
      const saved = await upsertUserWorkbook({
        workbookId: workbook.id,
        status: "in_progress",
        source: row?.source ?? "library",
      });
      setRow(saved);
      toast.success("Workbook started.");
    } catch (err) {
      console.error(err);
      toast.error("Could not start workbook.");
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      toast.error("Rate yourself from 1–10.");
      return;
    }
    setBusy(true);
    try {
      const saved = await upsertUserWorkbook({
        workbookId: workbook.id,
        status: "completed",
        source: row?.source ?? "library",
        completionRating: n,
        completionDescription: description.trim() || null,
      });
      setRow(saved);
      toast.success("Workbook completed — change captured on your profile.");
      navigate("/testing/profile");
    } catch (err) {
      console.error(err);
      toast.error("Could not complete workbook.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container px-4 py-8 max-w-xl mx-auto">
      <Button variant="ghost" size="sm" className="rounded-xl mb-4" asChild>
        <Link to="/testing/library">
          <ArrowLeft className="w-4 h-4 mr-1" /> Library
        </Link>
      </Button>
      <span className="inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#a16ae8]/10 text-[#7c4db8]">
        {workbook.eiCategory}
      </span>
      <h1 className="font-display font-bold text-2xl text-foreground mt-3">{workbook.title}</h1>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{workbook.description}</p>
      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {workbook.durationMin} min · {workbook.level}
        {row ? ` · Status: ${row.status}` : ""}
      </p>

      {workbook.image ? (
        <figure className="mt-6 overflow-hidden rounded-2xl border border-border bg-muted/20">
          <img
            src={workbook.image}
            alt=""
            className="w-full h-auto object-contain max-h-[420px] mx-auto"
            loading="lazy"
          />
        </figure>
      ) : null}

      {workbook.body ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {workbook.body}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Full workbook steps are coming soon. Use this space to practice the skill briefly, then mark complete with a
          self-rating.
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        {row?.status !== "in_progress" && row?.status !== "completed" ? (
          <Button type="button" className="rounded-xl" disabled={busy} onClick={start}>
            Start workbook
          </Button>
        ) : null}
        {!row ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={busy}
            onClick={() =>
              upsertUserWorkbook({ workbookId: workbook.id, status: "added", source: "library" })
                .then(setRow)
                .then(() => toast.success("Saved to profile."))
                .catch(() => toast.error("Couldn't save. Please try again."))
            }
          >
            Save to profile
          </Button>
        ) : row.status === "added" ? (
          <Button type="button" variant="outline" className="rounded-xl" disabled>
            Saved ✓
          </Button>
        ) : null}
      </div>

      {row?.status !== "completed" ? (
        <div className="mt-8 space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display font-semibold text-foreground">Mark complete</h2>
          <p className="text-xs text-muted-foreground">
            Capture behavioural change: a short self-rating and what shifted for you.
          </p>
          <div>
            <Label htmlFor="rating">Self-rating (1–10)</Label>
            <Input
              id="rating"
              type="number"
              min={1}
              max={10}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="mt-1.5 rounded-xl max-w-[120px]"
            />
          </div>
          <div>
            <Label htmlFor="desc">What changed?</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 rounded-xl"
              rows={3}
              placeholder="Describe the shift you noticed…"
            />
          </div>
          <Button type="button" className="rounded-xl" disabled={busy} onClick={complete}>
            Complete workbook
          </Button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-foreground">
          Completed{row.completion_rating != null ? ` · ${row.completion_rating}/10` : ""}
          {row.completion_description ? ` — ${row.completion_description}` : ""}
        </p>
      )}
    </div>
  );
}
