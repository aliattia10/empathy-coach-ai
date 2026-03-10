import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OnboardingSurvey from "@/components/avatar/OnboardingSurvey";
import type { OnboardingAnswers } from "@/components/avatar/OnboardingSurvey";
import { useAuth } from "@/hooks/useAuth";
import { saveOnboardingResponses } from "@/hooks/useSurveyResults";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = async (answers: OnboardingAnswers) => {
    if (user?.id) {
      try {
        await saveOnboardingResponses(user.id, answers);
      } catch (e) {
        console.error("Failed to save onboarding to Supabase:", e);
      }
    }
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
