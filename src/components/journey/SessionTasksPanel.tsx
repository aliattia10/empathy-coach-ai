import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Plus, Sparkles, Trash2 } from "lucide-react";
import { PHASE_LABELS, pruneOrphanCoachGoals, sortGoalsByStep, type JourneyState, type UserGoal } from "@/types/journey";
import { computeJourneyProgressPercent, goalsCompletionRatio } from "@/lib/journeyProgress";
import GuidanceLadderWidget from "@/components/journey/GuidanceLadderWidget";

type SessionTasksPanelProps = {
  journey: JourneyState;
  displayTitle: string;
  journeyId?: string | null;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onAddTask: (title: string) => void;
  onRemoveTask: (taskId: string) => void;
  busyTaskId?: string | null;
  adding?: boolean;
};

export default function SessionTasksPanel({
  journey,
  displayTitle,
  journeyId,
  onToggleTask,
  onAddTask,
  onRemoveTask,
  busyTaskId,
  adding,
}: SessionTasksPanelProps) {
  const [draft, setDraft] = useState("");
  const progressPercent = computeJourneyProgressPercent(journey, 0);
  const { done, total } = goalsCompletionRatio(journey.user_goals);
  const tasks = sortGoalsByStep(pruneOrphanCoachGoals(journey.user_goals));

  const handleAdd = () => {
    const title = draft.trim();
    if (!title) return;
    onAddTask(title);
    setDraft("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Session</p>
          <h2 className="text-xl font-semibold mt-1">{displayTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">{PHASE_LABELS[journey.platform_phase]}</p>
        </div>

        {journey.progress_summary && (
          <p className="text-sm leading-relaxed text-foreground/90 border-l-2 border-primary/40 pl-3">
            {journey.progress_summary}
          </p>
        )}

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {total > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {done} of {total} tasks completed
            </p>
          )}
        </div>
      </div>

      <GuidanceLadderWidget journey={journey} journeyId={journeyId} variant="full" />

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium mb-3">Add a task</p>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Draft what I want to say in tomorrow's meeting"
            className="rounded-xl"
            maxLength={120}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button
            type="button"
            className="rounded-xl shrink-0"
            onClick={handleAdd}
            disabled={!draft.trim() || adding}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium mb-4">Your tasks</p>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-60" />
            Add your own tasks, or agree a Goal and steps with your coach in chat — the plan will appear here.
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                busy={busyTaskId === task.id}
                onToggle={onToggleTask}
                onRemove={onRemoveTask}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  busy,
  onToggle,
  onRemove,
}: {
  task: UserGoal;
  busy: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const fromCoach = task.source === "ai" || task.source === "system";
  const isSub = task.tier === "sub" || (task.step?.includes(".") ?? false);
  const isGoal = task.tier === "goal" || task.step === "goal";
  const stepPrefix = task.step && task.step !== "goal" ? `${task.step}. ` : task.step === "goal" ? "Goal: " : "";

  return (
    <li
      className={`flex items-start gap-2 rounded-xl border border-border/80 p-3 hover:bg-muted/30 transition-colors ${
        isSub ? "ml-4 border-l-2 border-l-primary/30" : isGoal ? "bg-primary/5 border-primary/20" : ""
      }`}
    >
      <Checkbox
        checked={task.completed}
        disabled={busy}
        onCheckedChange={(checked) => onToggle(task.id, checked === true)}
        className="mt-0.5"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`leading-snug ${
            isGoal ? "text-sm font-semibold text-foreground" : "text-sm"
          } ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {stepPrefix}
          {task.title}
        </p>
        {fromCoach && !isGoal && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {task.tier === "major" ? "Major step" : task.tier === "sub" ? "Sub-step" : "Suggested by coach"}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
        disabled={busy}
        aria-label="Remove task"
        onClick={() => onRemove(task.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </li>
  );
}
