import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  coachLabel?: string;
  journeyTitle?: string;
  onSkip: () => void;
  onNext: (answer: string) => void;
  busy?: boolean;
};

/** Spec V1 mock: single prompt; multi-step set is configurable later (open question). */
export default function ReflectionMomentModal({
  open,
  coachLabel = "your coach",
  journeyTitle = "this journey",
  onSkip,
  onNext,
  busy,
}: Props) {
  const [answer, setAnswer] = useState("");

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onSkip(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Reflection Moment</DialogTitle>
          <DialogDescription>
            Pause and reflect on your conversation with {coachLabel} ({journeyTitle})
          </DialogDescription>
        </DialogHeader>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/3 bg-[#a16ae8] rounded-full" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reflection-answer">What surprised you most about this conversation?</Label>
          <p className="text-xs text-muted-foreground">
            Think about any assumptions you held before and whether they changed
          </p>
          <Textarea
            id="reflection-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="rounded-xl"
            placeholder="Write freely…"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" className="rounded-xl" disabled={busy} onClick={onSkip}>
            Skip for now
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={busy || !answer.trim()}
            onClick={() => onNext(answer.trim())}
          >
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
