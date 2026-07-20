import { Check, Circle, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  PHASE_LABELS,
  pruneOrphanCoachGoals,
  sortGoalsByStep,
  type JourneyState,
  type UserGoal,
} from "@/types/journey";
import { parseBeliefStrengthBefore } from "@/lib/beliefRatings";
import SustainabilityPathBanner from "@/components/journey/SustainabilityPathBanner";

type Props = {
  journey: JourneyState;
  journeyId?: string | null;
  /** compact = chat strip; full = Tasks page */
  variant?: "compact" | "full";
  /** When false, omit the amber recovery banner (e.g. session uses SustainabilityPathPanel). */
  showSustainabilityBanner?: boolean;
  className?: string;
};

function activeLadderItems(goals: UserGoal[]) {
  const sorted = sortGoalsByStep(pruneOrphanCoachGoals(goals));
  const goal = sorted.find((g) => g.tier === "goal" || g.step === "goal");
  const incomplete = sorted.filter((g) => !g.completed && g !== goal);
  const active = incomplete[0] ?? null;
  const majors = sorted.filter((g) => g.tier === "major" || (/^\d+$/.test(g.step || "") && g.tier !== "sub"));
  return { goal, active, majors: majors.slice(0, 5), sorted };
}

export default function GuidanceLadderWidget({
  journey,
  journeyId,
  variant = "compact",
  showSustainabilityBanner = true,
  className,
}: Props) {
  const { goal, active, majors, sorted } = activeLadderItems(journey.user_goals);
  const milestones = journey.phase_checklist || [];
  const beliefBefore = parseBeliefStrengthBefore(journey.conceptualisation_summary);
  const beliefNow = journey.belief_strength_pct;
  const showBelief = beliefNow != null || beliefBefore != null;
  const isCompact = variant === "compact";

  const ladderEmpty = sorted.length === 0;
  const milestonesEmpty = milestones.length === 0;

  if (ladderEmpty && milestonesEmpty && !showBelief && !journey.sustainability_pivot_active) {
    if (isCompact) {
      return (
        <div className={cn("rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5", className)}>
          <p className="text-xs text-muted-foreground">
            Guidance appears here once you and the coach agree a Goal and steps.{" "}
            {journeyId ? (
              <Link to={`/testing/journeys/${journeyId}`} className="text-primary underline-offset-2 hover:underline">
                Open Tasks
              </Link>
            ) : null}
          </p>
        </div>
      );
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showSustainabilityBanner ? <SustainabilityPathBanner journey={journey} /> : null}

      <div
        className={cn(
          "rounded-xl border border-border bg-card",
          isCompact ? "px-3 py-2.5" : "p-4",
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guidance
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">{PHASE_LABELS[journey.platform_phase]}</span>
        </div>

        {showBelief && (
          <div className="mb-3 rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Belief strength
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <span>
                <span className="text-muted-foreground text-xs">Before </span>
                <span className="font-semibold tabular-nums">
                  {beliefBefore != null ? `${beliefBefore}%` : "—"}
                </span>
              </span>
              <span className="text-muted-foreground">→</span>
              <span>
                <span className="text-muted-foreground text-xs">Now </span>
                <span className="font-semibold tabular-nums text-primary">
                  {beliefNow != null ? `${beliefNow}%` : "—"}
                </span>
              </span>
              {beliefBefore != null && beliefNow != null && beliefBefore !== beliefNow && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    beliefNow < beliefBefore ? "text-emerald-600" : "text-amber-700",
                  )}
                >
                  {beliefNow < beliefBefore
                    ? `↓ ${beliefBefore - beliefNow} pts`
                    : `↑ ${beliefNow - beliefBefore} pts`}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Compare how strong the hot thought felt at the start vs after the work.
            </p>
          </div>
        )}

        {!ladderEmpty && (
          <div className="space-y-1.5">
            {goal && (
              <LadderRow
                label="Goal"
                title={goal.title}
                completed={goal.completed}
                emphasize
              />
            )}
            {(isCompact ? (active ? [active] : majors.slice(0, 3)) : sorted.filter((g) => g !== goal)).map(
              (item) => (
                <LadderRow
                  key={item.id}
                  label={item.step && item.step !== "goal" ? item.step : undefined}
                  title={item.title}
                  completed={item.completed}
                  active={active?.id === item.id}
                  indent={item.tier === "sub" || (item.step?.includes(".") ?? false)}
                />
              ),
            )}
            {isCompact && sorted.length > 4 && journeyId && (
              <Link
                to={`/testing/journeys/${journeyId}`}
                className="block text-xs text-primary mt-1 hover:underline underline-offset-2"
              >
                View full ladder on Tasks →
              </Link>
            )}
          </div>
        )}

        {ladderEmpty && (
          <p className="text-xs text-muted-foreground">
            No Goal ladder yet — agree one in chat and it will tick here.
          </p>
        )}

        {!milestonesEmpty && (
          <div className={cn("mt-3 pt-3 border-t border-border/80", isCompact && "mt-2 pt-2")}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Session milestones
            </p>
            <ul className="space-y-1">
              {(isCompact ? milestones.slice(0, 4) : milestones).map((m) => (
                <li key={m.id} className="flex items-start gap-1.5 text-xs">
                  {m.completed ? (
                    <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5" />
                  )}
                  <span className={m.completed ? "text-muted-foreground" : "text-foreground"}>
                    {m.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function LadderRow({
  label,
  title,
  completed,
  active,
  emphasize,
  indent,
}: {
  label?: string;
  title: string;
  completed: boolean;
  active?: boolean;
  emphasize?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-1.5 text-xs rounded-md px-1.5 py-1",
        indent && "ml-3",
        active && "bg-primary/10 ring-1 ring-primary/20",
        emphasize && "font-semibold",
      )}
    >
      {completed ? (
        <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
      ) : (
        <Circle className={cn("h-3 w-3 shrink-0 mt-0.5", active ? "text-primary" : "text-muted-foreground/50")} />
      )}
      <span className={cn(completed && "text-muted-foreground line-through")}>
        {label ? <span className="text-muted-foreground mr-1">{label}.</span> : null}
        {title}
        {active && !completed ? (
          <span className="ml-1.5 text-[10px] uppercase tracking-wide text-primary font-medium">Now</span>
        ) : null}
      </span>
    </div>
  );
}
