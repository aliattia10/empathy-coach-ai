import { supabase } from "@/integrations/supabase/client";

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

export async function fetchSurveyResults(userId: string) {
  const { data, error } = await supabase
    .from("survey_results")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data;
}
