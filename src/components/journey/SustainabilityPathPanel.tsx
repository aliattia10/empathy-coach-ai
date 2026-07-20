import { useState } from "react";
import { BookOpen, Brain, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyState } from "@/types/journey";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Miro “Sustainability Path” nodes (right rail on session UI). */
export const SUSTAINABILITY_PATH_STEPS = [
  {
    id: "self_reflection",
    number: 1,
    title: "Self-Reflection and journaling",
    icon: BookOpen,
    summary:
      "Pause and write what happened, what you felt, and what the hot thought was. Creates space before you act again.",
    when: "Use after a setback, or when a step feels foggy.",
  },
  {
    id: "mindfulness",
    number: 2,
    title: "Mindfulness Exercise",
    icon: Brain,
    summary:
      "Short grounding: notice breath, body, and the room. Softens the stress spike so thinking can come back online.",
    when: "Use when flooded, rushed, or stuck in fight-or-flight.",
  },
  {
    id: "gratitude",
    number: 3,
    title: "Gratitude and Meditation",
    icon: Heart,
    summary:
      "Name one steadying thing that went okay, then a brief settle. Rebuilds motivation without forcing the big step.",
    when: "Use when confidence drops or the day feels all-or-nothing.",
  },
  {
    id: "social_logs",
    number: 4,
    title: "Social Interaction Logs",
    icon: Users,
    summary:
      "Log a real conversation: what you said, how it landed, what you’d try next time. Turns practice into memory.",
    when: "Use after trying a people-step (feedback, boundary, difficult talk).",
  },
] as const;

export type SustainabilityPathStepId = (typeof SUSTAINABILITY_PATH_STEPS)[number]["id"];

function unlockedStepIds(journey: JourneyState): Set<SustainabilityPathStepId> {
  const unlocked = new Set<SustainabilityPathStepId>();
  // Always show step 1 once Phase One is underway
  if (journey.phase_one_step >= 2 || journey.phase_one_confirmed || journey.belief_strength_pct != null) {
    unlocked.add("self_reflection");
  }
  if (journey.phase_one_confirmed || journey.sustainability_pivot_active) {
    unlocked.add("self_reflection");
    unlocked.add("mindfulness");
  }
  if (journey.platform_phase >= 2 || journey.sustainability_pivot_active) {
    unlocked.add("gratitude");
  }
  if (journey.platform_phase >= 3 || journey.user_goals.some((g) => g.completed)) {
    unlocked.add("social_logs");
  }
  // Pivot unlocks the full recovery toolkit
  if (journey.sustainability_pivot_active || journey.architectural_backtrack_active) {
    SUSTAINABILITY_PATH_STEPS.forEach((s) => unlocked.add(s.id));
  }
  return unlocked;
}

function activeStepId(journey: JourneyState): SustainabilityPathStepId | null {
  if (journey.sustainability_pivot_active) {
    if (journey.architectural_backtrack_active) return "self_reflection";
    return "mindfulness";
  }
  if (journey.platform_phase >= 3) return "social_logs";
  if (journey.platform_phase === 2) return "gratitude";
  if (journey.phase_one_confirmed) return "mindfulness";
  if (journey.phase_one_step >= 2) return "self_reflection";
  return null;
}

type Props = {
  journey: JourneyState;
  className?: string;
};

/**
 * Right-rail Sustainability Path — matches ShiftED Miro mock:
 * vertical numbered nodes; unlock as user progresses; click opens skill pop-up.
 */
export default function SustainabilityPathPanel({ journey, className }: Props) {
  const unlocked = unlockedStepIds(journey);
  const active = activeStepId(journey);
  const [openId, setOpenId] = useState<SustainabilityPathStepId | null>(null);
  const openStep = SUSTAINABILITY_PATH_STEPS.find((s) => s.id === openId) ?? null;

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
            Steps unlock as you progress. When a step is hard, the coach plugs these skills so you can continue.
          </p>
        </div>

        {journey.sustainability_pivot_active && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-950 dark:text-amber-100 leading-snug">
            Recovery mode — focus here before retrying your action step.
          </div>
        )}

        <ol className="relative flex-1 space-y-0 pl-1">
          {/* vertical connector */}
          <span
            className="absolute left-[1.15rem] top-4 bottom-4 w-0.5 bg-primary/25"
            aria-hidden
          />
          {SUSTAINABILITY_PATH_STEPS.map((step) => {
            const isUnlocked = unlocked.has(step.id);
            const isActive = active === step.id;
            const Icon = step.icon;
            return (
              <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && setOpenId(step.id)}
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25",
                    !isActive && isUnlocked && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
                    !isUnlocked && "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                  )}
                  aria-label={
                    isUnlocked ? `Open ${step.title}` : `${step.title} (locked until you progress)`
                  }
                >
                  {step.number}
                </button>
                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && setOpenId(step.id)}
                  className={cn(
                    "min-w-0 flex-1 text-left rounded-xl px-2 py-1.5 -ml-1 transition-colors",
                    isUnlocked && "hover:bg-muted/50",
                    !isUnlocked && "cursor-not-allowed",
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 mt-0.5",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-xs leading-snug",
                          isActive ? "font-semibold text-foreground" : "font-medium text-foreground/90",
                          !isUnlocked && "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </p>
                      {isActive && (
                        <p className="text-[10px] uppercase tracking-wide text-primary mt-0.5">Now</p>
                      )}
                      {!isUnlocked && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Unlocks as you progress</p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <Dialog open={!!openStep} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          {openStep && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {openStep.number}
                  </span>
                  {openStep.title}
                </DialogTitle>
                <DialogDescription className="text-left pt-2 space-y-2">
                  <span className="block text-sm text-foreground leading-relaxed">{openStep.summary}</span>
                  <span className="block text-xs text-muted-foreground">{openStep.when}</span>
                  <span className="block text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                    In chat, your coach will guide this skill when you need it — especially after a setback.
                    You can also note insights on your Tasks page.
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
