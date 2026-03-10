import { supabase } from "@/integrations/supabase/client";
import type { OnboardingAnswers } from "@/components/avatar/OnboardingSurvey";

export async function saveSurveyResult(
  userId: string,
  answers: Record<string, number>,
  categoryScores: Record<string, number>
) {
  const { error } = await supabase.from("survey_results").insert({
    user_id: userId,
    survey_type: "blind_spot",
    answers: answers as any,
    category_scores: categoryScores as any,
    completed_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Save onboarding (short survey) responses to Supabase. */
export async function saveOnboardingResponses(userId: string, answers: OnboardingAnswers) {
  const { error } = await supabase.from("survey_results").insert({
    user_id: userId,
    survey_type: "onboarding",
    answers: answers as any,
    category_scores: null,
    completed_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchSurveyResults(userId: string) {
  const { data, error } = await supabase
    .from("survey_results")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data;
}
