import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface OnboardingAnswers {
  managingPeople: "yes" | "no";
  comfortFeedback: "very" | "somewhat" | "not much";
  struggleSituations: string[];
}

interface OnboardingSurveyProps {
  onComplete: (answers: OnboardingAnswers) => void;
  onSkip?: () => void;
  className?: string;
}

const struggleOptions = [
  "Giving negative feedback",
  "Handling conflict between others",
  "Saying no or setting boundaries",
  "Supporting someone in distress",
  "Having difficult conversations remotely",
];

export default function OnboardingSurvey({ onComplete, onSkip, className }: OnboardingSurveyProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({
    struggleSituations: [],
  });

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1);
    else onComplete(answers as OnboardingAnswers);
  };

  const toggleStruggle = (item: string) => {
    setAnswers((prev) => ({
      ...prev,
      struggleSituations: prev.struggleSituations?.includes(item)
        ? prev.struggleSituations.filter((x) => x !== item)
        : [...(prev.struggleSituations || []), item],
    }));
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-soft max-w-lg mx-auto", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-semibold text-lg text-foreground">Quick wellbeing & communication check</h2>
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
            Skip
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="space-y-4"
          >
            <Label className="text-foreground">Are you currently managing people?</Label>
            <RadioGroup
              value={answers.managingPeople}
              onValueChange={(v) => setAnswers((prev) => ({ ...prev, managingPeople: v as "yes" | "no" }))}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="mp-yes" />
                <Label htmlFor="mp-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="mp-no" />
                <Label htmlFor="mp-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="space-y-4"
          >
            <Label className="text-foreground">How comfortable are you giving feedback?</Label>
            <RadioGroup
              value={answers.comfortFeedback}
              onValueChange={(v) => setAnswers((prev) => ({ ...prev, comfortFeedback: v as OnboardingAnswers["comfortFeedback"] }))}
              className="flex flex-col gap-2"
            >
              {(["very", "somewhat", "not much"] as const).map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`cf-${opt}`} />
                  <Label htmlFor={`cf-${opt}`} className="font-normal cursor-pointer capitalize">
                    {opt.replace("-", " ")}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="space-y-4"
          >
            <Label className="text-foreground">What situations do you struggle with? (select any)</Label>
            <div className="flex flex-col gap-2">
              {struggleOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleStruggle(opt)}
                  className={cn(
                    "text-left px-3 py-2 rounded-xl border text-sm transition-colors",
                    answers.struggleSituations?.includes(opt)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleNext} className="rounded-xl">
          {step < 2 ? "Next" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
