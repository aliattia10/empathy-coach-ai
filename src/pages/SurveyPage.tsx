import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BLIND_SPOT_SURVEY, SURVEY_CATEGORIES, SurveyQuestion } from "@/data/blindSpotSurvey";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SurveyPage() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(false);

  const question = BLIND_SPOT_SURVEY[current];
  const progress = (Object.keys(answers).length / BLIND_SPOT_SURVEY.length) * 100;

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (current < BLIND_SPOT_SURVEY.length - 1) setCurrent((c) => c + 1);
    else setCompleted(true);
  };

  const handleBack = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  if (completed) {
    const categoryScores = Object.entries(SURVEY_CATEGORIES).map(([key, meta]) => {
      const qs = BLIND_SPOT_SURVEY.filter((q) => q.category === key);
      const total = qs.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
      const max = qs.length * 4;
      const pct = Math.round((total / max) * 100);
      return { key, ...meta, pct };
    });

    return (
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
          <h2 className="text-2xl font-display font-bold text-foreground">Assessment Complete</h2>
          <p className="text-muted-foreground text-sm mt-1">Here's your managerial blind spot profile</p>
        </motion.div>

        <div className="space-y-4">
          {categoryScores.map((cat) => (
            <div key={cat.key} className="bg-card rounded-xl p-4 shadow-soft border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold font-display text-foreground">{cat.label}</span>
                <span className="text-sm font-bold text-secondary">{cat.pct}%</span>
              </div>
              <Progress value={cat.pct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {cat.pct < 50 ? "⚠️ This is a growth area — consider focused training." : cat.pct < 75 ? "👍 Developing well. Keep building these skills." : "🌟 Strong competency. You're leading well here."}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cat = SURVEY_CATEGORIES[question.category];

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">Managerial Blind Spot Assessment</h2>
        <p className="text-sm text-muted-foreground mt-1">Identify your growth areas across 3 key dimensions</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {current + 1} of {BLIND_SPOT_SURVEY.length}</span>
          <span className="font-medium">{cat.label}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <p className="text-foreground font-medium leading-relaxed">{question.text}</p>

          <div className="space-y-2">
            {question.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                  answers[question.id] === opt.value
                    ? "border-secondary bg-coral-light text-foreground shadow-soft"
                    : "border-border bg-card text-foreground hover:border-secondary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} disabled={current === 0} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!answers[question.id]}
          className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-1"
        >
          {current === BLIND_SPOT_SURVEY.length - 1 ? "See Results" : "Next"} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
