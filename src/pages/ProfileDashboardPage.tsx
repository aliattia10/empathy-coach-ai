import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChartLine, Clock, NotebookPen, Target, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WORKBOOK_BY_ID } from "@/lib/workbooks";
import {
  fetchActivityMinutes,
  fetchGoalsAcrossJourneys,
  fetchJournalEntries,
  fetchReflections,
  fetchUserWorkbooks,
  type JournalEntryRow,
  type ReflectionRow,
  type UserWorkbookRow,
} from "@/lib/phase3Api";
import type { UserGoal } from "@/types/journey";
import { normalizeUserGoals } from "@/types/journey";

export default function ProfileDashboardPage() {
  const { user } = useAuth();
  const [workbooks, setWorkbooks] = useState<UserWorkbookRow[]>([]);
  const [journal, setJournal] = useState<JournalEntryRow[]>([]);
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [minutes, setMinutes] = useState(0);
  const [goalBundles, setGoalBundles] = useState<
    Array<{ sessionId: string; sessionName: string | null; goals: UserGoal[] }>
  >([]);

  useEffect(() => {
    void Promise.all([
      fetchUserWorkbooks().catch(() => []),
      fetchJournalEntries().catch(() => []),
      fetchReflections().catch(() => []),
      fetchActivityMinutes().catch(() => 0),
      fetchGoalsAcrossJourneys().catch(() => []),
    ]).then(([wb, j, r, m, g]) => {
      setWorkbooks(wb);
      setJournal(j);
      setReflections(r);
      setMinutes(m);
      setGoalBundles(
        g.map((row) => ({
          sessionId: row.sessionId,
          sessionName: row.sessionName,
          goals: normalizeUserGoals(row.goals),
        })),
      );
    });
  }, []);

  const byStatus = useMemo(() => {
    const saved = workbooks.filter((w) => w.status === "added");
    const inProgress = workbooks.filter((w) => w.status === "in_progress");
    const completed = workbooks.filter((w) => w.status === "completed");
    return { saved, inProgress, completed };
  }, [workbooks]);

  const changeSeries = byStatus.completed
    .filter((w) => w.completion_rating != null)
    .slice()
    .reverse();

  const openGoals = goalBundles.flatMap((b) =>
    b.goals
      .filter((g) => !g.completed)
      .map((g) => ({ ...g, journey: b.sessionName || "Journey", sessionId: b.sessionId })),
  );

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-[#a16ae8]" />
          Your practice space
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Progress, workbooks, journal, reflections, and analytics across all journeys.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 grid sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time on app
          </p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{minutes} min</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Workbooks completed</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">
            {byStatus.completed.length}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Journal entries</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{journal.length}</p>
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-[#a16ae8]" /> Workbooks
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(
            [
              ["In progress", byStatus.inProgress],
              ["Saved", byStatus.saved],
              ["Completed", byStatus.completed],
            ] as const
          ).map(([label, list]) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">{label}</h3>
              <ul className="space-y-2">
                {list.map((w) => (
                  <li key={w.id}>
                    <Link
                      to={`/testing/library/${w.workbook_id}`}
                      className="text-sm text-[#7c4db8] hover:underline"
                    >
                      {WORKBOOK_BY_ID[w.workbook_id]?.title ?? w.workbook_id}
                    </Link>
                    {w.completion_rating != null ? (
                      <span className="text-xs text-muted-foreground"> · {w.completion_rating}/10</span>
                    ) : null}
                  </li>
                ))}
                {list.length === 0 ? (
                  <li className="text-xs text-muted-foreground">None yet</li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>
        <ButtonLink to="/testing/library" label="Browse library" />
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-[#a16ae8]" /> Goals across journeys
        </h2>
        <ul className="space-y-2 rounded-2xl border border-border bg-card p-4">
          {openGoals.slice(0, 12).map((g) => (
            <li key={`${g.sessionId}-${g.id}`} className="text-sm">
              <Link to={`/testing/journeys/${g.sessionId}`} className="text-[#7c4db8] hover:underline">
                {g.title}
              </Link>
              <span className="text-xs text-muted-foreground"> · {g.journey}</span>
            </li>
          ))}
          {openGoals.length === 0 ? (
            <li className="text-sm text-muted-foreground">No open goals yet — set them in a journey chat.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2 mb-3">
          <ChartLine className="w-5 h-5 text-[#a16ae8]" /> Behavioural change over time
        </h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          {changeSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete a workbook or goal with a self-rating to see change here.
            </p>
          ) : (
            <ul className="space-y-3">
              {changeSeries.map((w) => (
                <li key={w.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {WORKBOOK_BY_ID[w.workbook_id]?.title ?? w.workbook_id}
                    </span>
                    <span className="text-[#a16ae8] font-semibold">{w.completion_rating}/10</span>
                  </div>
                  {w.completion_description ? (
                    <p className="text-xs text-muted-foreground mt-1">{w.completion_description}</p>
                  ) : null}
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[#a16ae8] rounded-full"
                      style={{ width: `${((w.completion_rating ?? 0) / 10) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
            <NotebookPen className="w-4 h-4 text-[#a16ae8]" /> Journal
          </h2>
          <ul className="space-y-2">
            {journal.slice(0, 5).map((e) => (
              <li key={e.id} className="text-sm text-foreground line-clamp-2">
                {e.title || e.body}
              </li>
            ))}
            {journal.length === 0 ? (
              <li className="text-sm text-muted-foreground">No journal entries yet.</li>
            ) : null}
          </ul>
          <ButtonLink to="/testing/journal" label="Open journal" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display font-semibold text-foreground mb-3">Reflections</h2>
          <ul className="space-y-2">
            {reflections.slice(0, 5).map((r) => (
              <li key={r.id} className="text-sm text-muted-foreground">
                {r.skipped ? "(Skipped)" : r.answer}
              </li>
            ))}
            {reflections.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                Reflection Moments appear when you leave a conversation.
              </li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-display font-semibold text-foreground">Personal info</h2>
        <p className="text-sm">
          <span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Username:</span>{" "}
          {user?.email?.split("@")[0] ?? "—"}
        </p>
        <ButtonLink to="/testing/settings" label="Password & settings" />
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
        <h2 className="font-display font-semibold text-foreground">Billing</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Subscription type: placeholder only — no payment integration in this release.
        </p>
      </section>
    </div>
  );
}

function ButtonLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex mt-3 text-sm font-medium text-[#7c4db8] hover:underline"
    >
      {label} →
    </Link>
  );
}
