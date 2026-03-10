import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageSquare, Swords, MessageCircle, Heart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScenarioCard {
  id: string;
  title: string;
  description: string;
  skillFocus: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const scenarios: ScenarioCard[] = [
  {
    id: "constructive-feedback",
    title: "Constructive Feedback",
    description: "Practice delivering difficult feedback to a direct report while staying clear and empathetic.",
    skillFocus: "Clarity, empathy, structure",
    difficulty: "Beginner",
    to: "/avatar/session?scenario=constructive-feedback",
    icon: MessageSquare,
  },
  {
    id: "handling-conflict",
    title: "Handling Conflict",
    description: "Navigate a conflict between team members and facilitate a constructive conversation.",
    skillFocus: "Mediation, neutrality, listening",
    difficulty: "Intermediate",
    to: "/avatar/session?scenario=handling-conflict",
    icon: Swords,
  },
  {
    id: "difficult-conversations",
    title: "Difficult Conversations",
    description: "Prepare for and run high-stakes conversations with sensitivity and clarity.",
    skillFocus: "Courage, framing, follow-through",
    difficulty: "Intermediate",
    to: "/avatar?scenario=difficult",
    icon: MessageCircle,
  },
  {
    id: "empathy-practice",
    title: "Empathy Practice",
    description: "Strengthen your ability to listen, reflect, and respond with empathy.",
    skillFocus: "Listening, validation, curiosity",
    difficulty: "Beginner",
    to: "/avatar/session?scenario=empathy",
    icon: Heart,
  },
];

const difficultyColors = {
  Beginner: "bg-green-500/15 text-green-700 dark:text-green-400",
  Intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Advanced: "bg-red-500/15 text-red-700 dark:text-red-400",
};

interface ScenarioSelectorProps {
  onSelect?: (scenario: ScenarioCard) => void;
  className?: string;
}

export default function ScenarioSelector({ onSelect, className }: ScenarioSelectorProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-2", className)}>
      {scenarios.map((scenario, i) => (
        <motion.div
          key={scenario.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
        >
          <Link
            to={scenario.to}
            onClick={() => onSelect?.(scenario)}
            className="block h-full group"
          >
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground group-hover:shadow-glow transition-shadow">
                  <scenario.icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                    difficultyColors[scenario.difficulty]
                  )}
                >
                  {scenario.difficulty}
                </span>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {scenario.title}
              </h3>
              <p className="text-sm text-muted-foreground flex-1 mb-3">{scenario.description}</p>
              <p className="text-xs text-muted-foreground mb-3">
                <span className="font-medium text-foreground">Focus:</span> {scenario.skillFocus}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                Start simulation <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export { scenarios };
