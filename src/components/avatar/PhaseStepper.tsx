import { cn } from "@/lib/utils";
import { PHASE_LABELS, type PlatformPhase } from "@/types/journey";

const STEPS: PlatformPhase[] = [1, 2, 3];

type PhaseStepperProps = {
  currentPhase: PlatformPhase;
  phaseOneConfirmed: boolean;
  className?: string;
};

export default function PhaseStepper({ currentPhase, phaseOneConfirmed, className }: PhaseStepperProps) {
  return (
    <div className={cn("flex items-center gap-1 w-full max-w-md", className)} aria-label="Journey phase progress">
      {STEPS.map((step, index) => {
        const isComplete =
          step < currentPhase || (step === 1 && phaseOneConfirmed && currentPhase > 1);
        const isActive = step === currentPhase;
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={cn(
                  "h-2 w-full rounded-full transition-colors",
                  isComplete && "bg-primary",
                  isActive && !isComplete && "bg-primary/60",
                  !isActive && !isComplete && "bg-muted",
                )}
              />
              <span
                className={cn(
                  "text-[10px] mt-1 truncate w-full text-center",
                  isActive ? "text-primary font-medium" : "text-muted-foreground",
                )}
              >
                {PHASE_LABELS[step]}
              </span>
            </div>
            {index < STEPS.length - 1 && <div className="w-1 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}
