import { useMemo, useState } from "react";
import { BookOpen, Brain, Check, ChevronDown, ChevronUp, GripVertical, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyState } from "@/types/journey";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_SUSTAINABILITY_PATH,
  normalizeSustainabilityPath,
  type SustainabilityPathItem,
  type SustainabilityPathStepId,
} from "@/lib/sustainabilityPath";

const ICONS: Record<SustainabilityPathStepId, typeof BookOpen> = {
  self_reflection: BookOpen,
  mindfulness: Brain,
  gratitude: Heart,
  social_logs: Users,
};

const SUMMARIES: Record<SustainabilityPathStepId, { summary: string; when: string }> = {
  self_reflection: {
    summary:
      "Pause and write what happened, what you felt, and what the hot thought was. Creates space before you act again.",
    when: "Use after a setback, or when a step feels foggy.",
  },
  mindfulness: {
    summary:
      "Short grounding: notice breath, body, and the room. Softens the stress spike so thinking can come back online.",
    when: "Use when flooded, rushed, or stuck in fight-or-flight.",
  },
  gratitude: {
    summary:
      "Name one steadying thing that went okay, then a brief settle. Rebuilds motivation without forcing the big step.",
    when: "Use when confidence drops or the day feels all-or-nothing.",
  },
  social_logs: {
    summary:
      "Log a real conversation: what you said, how it landed, what you’d try next time. Turns practice into memory.",
    when: "Use after trying a people-step (feedback, boundary, difficult talk).",
  },
};

type Props = {
  journey: JourneyState;
  className?: string;
  onReorder?: (items: SustainabilityPathItem[]) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
  busy?: boolean;
};

/**
 * Right-rail Sustainability Path — Miro layout.
 * Steps are reorderable (drag or ↑↓) and markable complete.
 */
export default function SustainabilityPathPanel({
  journey,
  className,
  onReorder,
  onToggleComplete,
  busy,
}: Props) {
  const steps = useMemo(
    () => normalizeSustainabilityPath(journey.sustainability_path),
    [journey.sustainability_path],
  );
  const [openId, setOpenId] = useState<SustainabilityPathStepId | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const openMeta = openId
    ? DEFAULT_SUSTAINABILITY_PATH.find((s) => s.id === openId) ?? null
    : null;
  const openStep = openId ? steps.find((s) => s.id === openId) : null;
  const editable = !!(onReorder || onToggleComplete);

  const move = (id: string, direction: "up" | "down") => {
    if (!onReorder) return;
    const index = steps.findIndex((s) => s.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= steps.length) return;
    const next = [...steps];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    onReorder(next.map((item, i) => ({ ...item, sort_order: i })));
  };

  const onDropOn = (toId: string) => {
    if (!onReorder || !dragId || dragId === toId) {
      setDragId(null);
      return;
    }
    const fromIndex = steps.findIndex((s) => s.id === dragId);
    const toIndex = steps.findIndex((s) => s.id === toId);
    if (fromIndex < 0 || toIndex < 0) {
      setDragId(null);
      return;
    }
    const next = [...steps];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    onReorder(next.map((item, i) => ({ ...item, sort_order: i })));
    setDragId(null);
  };

  return (
    <>
      <aside
        className={cn(
          "rounded-2xl border border-border bg-card/95 backdrop-blur p-4 flex flex-col",
          className,
        )}
        aria-label="The Sustainability Path"
      >
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">ShiftED</p>
          <h2 className="text-sm font-semibold mt-0.5">The Sustainability Path</h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Drag steps to reorder, mark complete when done. When a step is hard, the coach plugs these skills.
          </p>
        </div>

        {journey.sustainability_pivot_active && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-950 dark:text-amber-100 leading-snug">
            Recovery mode — focus here before retrying your action step.
          </div>
        )}

        <ol className="relative flex-1 space-y-2 pl-0">
          {steps.map((step, index) => {
            const Icon = ICONS[step.id as SustainabilityPathStepId] || BookOpen;
            const isActive = journey.sustainability_pivot_active && !step.completed && index === steps.findIndex((s) => !s.completed);
            return (
              <li
                key={step.id}
                draggable={editable && !!onReorder}
                onDragStart={() => setDragId(step.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropOn(step.id)}
                className={cn(
                  "relative flex gap-2 rounded-xl border border-border/80 p-2 bg-background/60",
                  dragId === step.id && "opacity-60",
                  isActive && "ring-1 ring-primary/40 bg-primary/5",
                  step.completed && "opacity-80",
                )}
              >
                {editable && onReorder ? (
                  <span
                    className="mt-1.5 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
                    aria-hidden
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                ) : null}

                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-xs font-bold text-primary">
                  {step.completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="text-left w-full"
                    onClick={() => setOpenId(step.id as SustainabilityPathStepId)}
                  >
                    <div className="flex items-start gap-1.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                      <p
                        className={cn(
                          "text-xs font-medium leading-snug",
                          step.completed && "line-through text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </p>
                    </div>
                  </button>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {onToggleComplete ? (
                      <label className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                        <Checkbox
                          checked={step.completed}
                          disabled={busy}
                          onCheckedChange={(checked) =>
                            onToggleComplete(step.id, checked === true)
                          }
                          aria-label={step.completed ? "Mark incomplete" : "Mark complete"}
                        />
                        Done
                      </label>
                    ) : null}
                    {isActive && !step.completed ? (
                      <span className="text-[10px] uppercase tracking-wide text-primary font-medium">
                        Now
                      </span>
                    ) : null}
                  </div>
                </div>

                {editable && onReorder ? (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={busy || index === 0}
                      aria-label="Move up"
                      onClick={() => move(step.id, "up")}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={busy || index === steps.length - 1}
                      aria-label="Move down"
                      onClick={() => move(step.id, "down")}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </aside>

      <Dialog open={!!openStep} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          {openStep && openMeta && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {steps.findIndex((s) => s.id === openStep.id) + 1}
                  </span>
                  {openStep.title}
                </DialogTitle>
                <DialogDescription className="text-left pt-2 space-y-2">
                  <span className="block text-sm text-foreground leading-relaxed">
                    {SUMMARIES[openStep.id as SustainabilityPathStepId]?.summary}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {SUMMARIES[openStep.id as SustainabilityPathStepId]?.when}
                  </span>
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
