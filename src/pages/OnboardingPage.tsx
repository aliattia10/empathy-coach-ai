import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OnboardingSurvey from "@/components/avatar/OnboardingSurvey";
import type { OnboardingAnswers } from "@/components/avatar/OnboardingSurvey";

export default function OnboardingPage() {
  const navigate = useNavigate();

  const handleComplete = (_answers: OnboardingAnswers) => {
    localStorage.setItem("shifted_onboarding_done", "true");
    navigate("/scenarios");
  };

  const handleSkip = () => {
    localStorage.setItem("shifted_onboarding_done", "true");
    navigate("/avatar");
  };

  return (
    <div className="container px-4 py-12 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <OnboardingSurvey onComplete={handleComplete} onSkip={handleSkip} />
      </motion.div>
    </div>
  );
}
