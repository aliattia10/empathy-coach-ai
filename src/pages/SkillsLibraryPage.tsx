import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EI_CATEGORIES, WORKBOOK_CATALOGUE } from "@/lib/workbooks";
import { upsertUserWorkbook } from "@/lib/phase3Api";

export default function SkillsLibraryPage() {
  const [filter, setFilter] = useState<string>("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = useMemo(() => {
    if (filter === "All") return WORKBOOK_CATALOGUE;
    return WORKBOOK_CATALOGUE.filter((w) => w.eiCategory === filter);
  }, [filter]);

  const handleAdd = async (workbookId: string) => {
    setBusyId(workbookId);
    try {
      await upsertUserWorkbook({
        workbookId,
        status: "added",
        source: "library",
      });
      toast.success("Workbook added to your profile.");
    } catch (err) {
      console.error(err);
      toast.error("Could not add workbook. Apply the Phase 3 migration if this is a new table.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Development Skills Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse practice workbooks. Add any to your profile — the coach recommends from this same list.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["All", ...EI_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === cat
                ? "bg-[#a16ae8] text-white border-[#a16ae8]"
                : "bg-card text-muted-foreground border-border hover:border-[#a16ae8]/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((wb) => (
          <article
            key={wb.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col"
          >
            <span className="inline-flex self-start text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#a16ae8]/10 text-[#7c4db8]">
              {wb.eiCategory}
            </span>
            <h2 className="font-display font-semibold text-foreground mt-3 flex items-start gap-2">
              <BookOpen className="w-4 h-4 mt-0.5 text-[#a16ae8] shrink-0" />
              {wb.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 flex-1 leading-relaxed">{wb.description}</p>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {wb.durationMin} min · {wb.level}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                size="sm"
                className="rounded-xl flex-1"
                disabled={busyId === wb.id}
                onClick={() => handleAdd(wb.id)}
              >
                Add to profile
              </Button>
              <Button type="button" size="sm" variant="outline" className="rounded-xl" asChild>
                <Link to={`/testing/library/${wb.id}`}>Open</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
