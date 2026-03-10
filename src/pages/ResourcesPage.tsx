import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Heart, Phone } from "lucide-react";

const resources = [
  { name: "NHS 24", href: "https://www.nhs24.scot/", desc: "24/7 health advice and support", icon: Phone },
  { name: "Mind", href: "https://www.mind.org.uk/", desc: "Mental health information and support", icon: Heart },
  { name: "Samaritans", href: "https://www.samaritans.org/", desc: "116 123 — 24/7 emotional support", icon: Phone },
];

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
          ShiftED AI is a training simulation, not therapy. If you or someone you know needs support, please use the resources below.
        </p>
        <ul className="space-y-3">
          {resources.map((r) => (
            <li key={r.name}>
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft hover:shadow-elevated hover:border-primary/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <r.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
