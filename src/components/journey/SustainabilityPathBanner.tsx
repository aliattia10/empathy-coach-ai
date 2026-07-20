import { AlertTriangle, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyState } from "@/types/journey";

type Props = {
  journey: JourneyState;
  className?: string;
};

/** Visible when the coach is in the Sustainability Pivot recovery path (15 Jul meeting). */
export default function SustainabilityPathBanner({ journey, className }: Props) {
  if (!journey.sustainability_pivot_active && !journey.architectural_backtrack_active) {
    return null;
  }

  const title = journey.sustainability_pivot_active
    ? "Sustainability path"
    : "Checking assumptions";
  const body = journey.sustainability_pivot_active
    ? "A step didn’t land as hoped. The coach will help you regulate, spot the blocking thought (HCPR), then retry the same step — not jump to a new topic."
    : "Something shifted. The coach is briefly re-checking earlier assumptions before you pick a smaller next step.";

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 flex gap-2.5",
        className,
      )}
      role="status"
    >
      {journey.sustainability_pivot_active ? (
        <HeartHandshake className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
          {title}
        </p>
        <p className="text-sm text-foreground/90 mt-0.5 leading-snug">{body}</p>
        {journey.active_micro_goal && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Retrying: <span className="text-foreground">{journey.active_micro_goal}</span>
          </p>
        )}
      </div>
    </div>
  );
}
