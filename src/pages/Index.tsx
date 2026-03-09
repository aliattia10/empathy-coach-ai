import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, ClipboardList, BarChart3, Shield, ArrowRight, Bot } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Avatar Coach",
    desc: "Practice tough conversations with an empathetic AI that uses Socratic questioning.",
    to: "/chat",
  },
  {
    icon: ClipboardList,
    title: "Blind Spot Assessment",
    desc: "Identify gaps in staff satisfaction, legal awareness, and communication.",
    to: "/survey",
  },
  {
    icon: BarChart3,
    title: "Organisation Dashboard",
    desc: "Track anonymised progress across your management team.",
    to: "/dashboard",
  },
];

export default function Index() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero */}
      <section className="gradient-hero px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-sidebar-accent/40 border border-sidebar-border rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-medium text-primary-foreground/80">Practice-based training · Not therapy</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground leading-tight">
            Build empathetic leaders,<br />
            <span className="text-secondary">one conversation at a time</span>
          </h1>

          <p className="mt-4 text-primary-foreground/70 text-lg max-w-lg mx-auto leading-relaxed">
            ShiftED AI helps first-time managers master constructive feedback, inclusive communication, and critical thinking through AI-powered practice scenarios.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl gap-2 shadow-glow">
              <Link to="/chat">
                <MessageSquare className="w-4 h-4" /> Start Practicing <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl border-primary-foreground/20 text-primary-foreground hover:bg-sidebar-accent/30">
              <Link to="/survey">Take Assessment</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <Link to={f.to} className="block group">
                <div className="bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-elevated transition-shadow h-full">
                  <div className="w-10 h-10 rounded-xl bg-coral-light flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                    <f.icon className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
