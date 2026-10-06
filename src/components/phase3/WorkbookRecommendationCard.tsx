import { BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkbookDefinition } from "@/lib/workbooks";

type Props = {
  workbook: WorkbookDefinition;
  reason?: string;
  busy?: boolean;
  onAdd: () => void;
  onSkip: () => void;
  onStart: () => void;
};

export default function WorkbookRecommendationCard({
  workbook,
  reason,
  busy,
  onAdd,
  onSkip,
  onStart,
}: Props) {
  return (
    <div className="mt-3 rounded-2xl border border-[#a16ae8]/30 bg-gradient-to-br from-white to-[#f8f0ff] p-4 shadow-soft max-w-md">
      <p className="text-xs font-medium uppercase tracking-wide text-[#a16ae8] mb-2">
        Suggested workbook
      </p>
      <p className="text-sm text-foreground mb-3">
        {reason?.trim() || `Sounds like ${workbook.eiCategory} would be a great skill to develop…`}
      </p>
      <div className="rounded-xl border border-border bg-card p-3 mb-3">
        <span className="inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#a16ae8]/10 text-[#7c4db8]">
          {workbook.eiCategory}
        </span>
        <h4 className="font-display font-semibold text-foreground mt-2 flex items-start gap-2">
          <BookOpen className="w-4 h-4 mt-0.5 text-[#a16ae8] shrink-0" />
          {workbook.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{workbook.description}</p>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {workbook.durationMin} min · {workbook.level}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          size="sm"
          className="rounded-xl flex-1"
          disabled={busy}
          onClick={onAdd}
        >
          Add Workbook to Profile
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-xl flex-1"
          disabled={busy}
          onClick={onStart}
        >
          Start Now
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-xl"
          disabled={busy}
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        You always choose — ShiftED is practice training, not therapy.
      </p>
    </div>
  );
}
