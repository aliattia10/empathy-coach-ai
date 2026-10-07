import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Heart, Phone } from "lucide-react";
import {
  CRISIS_RESOURCES,
  HOPEBOX_BLURB,
  NHS_CNTW_SELF_HELP_GUIDES,
  NHS_CNTW_SELF_HELP_URL,
} from "@/lib/crisisResources";

const iconFor = (name: string) => {
  if (name.includes("Mind") || name.includes("SHOUT")) return Heart;
  return Phone;
};

export default function ResourcesPage() {
  return (
    <div className="container px-4 py-12 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Resources & support</h1>
            <p className="text-sm text-muted-foreground">Public helplines and wellbeing resources</p>
          </div>
        </div>
        <p className="text-muted-foreground mb-6">
          ShiftED AI is a training simulation, not therapy. If you or someone you know needs support, please use the
          resources below.
        </p>

        <h2 className="font-display font-semibold text-lg text-foreground mb-3">Crisis & helplines</h2>
        <ul className="space-y-3 mb-10">
          {CRISIS_RESOURCES.map((r) => {
            const Icon = iconFor(r.name);
            return (
              <li key={r.name}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${r.name} — ${r.desc} (opens in new tab)`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft hover:shadow-elevated hover:border-primary/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>

        <h2 className="font-display font-semibold text-lg text-foreground mb-2">Self-soothe / HOPEBOX</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{HOPEBOX_BLURB}</p>

        <h2 className="font-display font-semibold text-lg text-foreground mb-2">Self-help guides (NHS CNTW)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Public NHS Cumbria, Northumberland, Tyne and Wear self-help booklets. ShiftED links out — we do not host the
          PDFs.
        </p>
        <a
          href={NHS_CNTW_SELF_HELP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-4"
        >
          Open NHS CNTW resource library <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <ul className="space-y-2">
          {NHS_CNTW_SELF_HELP_GUIDES.map((g) => (
            <li key={g.title} className="rounded-xl border border-border bg-card/60 px-4 py-3">
              <p className="font-medium text-foreground text-sm">{g.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{g.summary}</p>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
