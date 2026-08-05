import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type ThinkingIndicatorProps = {
  className?: string;
  /** When true, show cold-start copy + progress (RunPod scale-to-zero). */
  isWarming?: boolean;
};

/**
 * ChatGPT / Gemini-style waiting state: "Thinking" + animated three dots.
 * Title softens after a few seconds so long RunPod waits feel intentional.
 */
export default function ThinkingIndicator({ className, isWarming = false }: ThinkingIndicatorProps) {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [warmProgress, setWarmProgress] = useState(6);

  useEffect(() => {
    setElapsedSec(0);
    setWarmProgress(6);
    const tick = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(tick);
  }, [isWarming]);

  useEffect(() => {
    if (!isWarming) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setWarmProgress(Math.min(90, 6 + (elapsed / 180_000) * 84));
    }, 400);
    return () => window.clearInterval(id);
  }, [isWarming]);

  const title = isWarming
    ? elapsedSec < 20
      ? "Getting ready"
      : "Still starting up"
    : elapsedSec < 8
      ? "Thinking"
      : elapsedSec < 25
        ? "Still thinking"
        : "Taking a bit longer";

  const hint = isWarming
    ? "The coach GPU is waking up after idle — usually under a few minutes."
    : elapsedSec >= 25
      ? "Longer replies or a busy GPU can take a moment."
      : null;

  return (
    <div
      className={cn("flex justify-start", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rounded-2xl rounded-tl-md px-4 py-2.5 text-sm max-w-[85%] min-w-[11rem] bg-muted/80 text-foreground border border-border/50">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <span>{title}</span>
          <span className="inline-flex items-center gap-0.5" aria-hidden>
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/80" />
            <span className="thinking-dot thinking-dot-delay-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/80" />
            <span className="thinking-dot thinking-dot-delay-2 h-1.5 w-1.5 rounded-full bg-muted-foreground/80" />
          </span>
        </div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground/80 leading-snug">{hint}</p> : null}
        {isWarming ? <Progress value={warmProgress} className="mt-2 h-1.5 bg-primary/15" /> : null}
        <span className="sr-only">
          {isWarming ? "The coach is starting up." : "The coach is thinking."}
        </span>
      </div>
    </div>
  );
}
