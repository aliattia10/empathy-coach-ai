import { cn } from "@/lib/utils";
import { Target, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ScenarioSidebarProps {
  scenarioTitle: string;
  objective: string;
  cues: string[];
  progressPercent?: number;
  className?: string;
}

export default function ScenarioSidebar({
  scenarioTitle,
  objective,
  cues,
  progressPercent = 0,
  className,
}: ScenarioSidebarProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/10 shadow-soft p-4 w-64 glass-light dark:bg-background-dark/50",
        "fixed right-4 top-24 z-30 hidden xl:block",
        className
      )}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Scenario Guidance
      </h3>
      <p className="font-display font-semibold text-foreground mb-3">{scenarioTitle}</p>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Objective</p>
            <p className="text-sm text-foreground">{objective}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Key empathy cues</p>
            <ul className="text-sm text-foreground space-y-0.5">
              {cues.map((cue, i) => (
                <li key={i}>• {cue}</li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Progress</p>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>
      <button
        type="button"
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 py-3 text-primary font-bold text-sm hover:bg-primary/20 transition-all"
      >
        View Session Objectives
      </button>
    </div>
  );
}
