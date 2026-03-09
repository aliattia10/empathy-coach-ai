export interface SurveyQuestion {
  id: string;
  category: "staff_satisfaction" | "legal_risks" | "communication_gaps";
  text: string;
  options: { value: number; label: string }[];
}

export const SURVEY_CATEGORIES = {
  staff_satisfaction: { label: "Staff Satisfaction", color: "teal" },
  legal_risks: { label: "Legal Risk Awareness", color: "destructive" },
  communication_gaps: { label: "Communication Gaps", color: "secondary" },
} as const;

export const BLIND_SPOT_SURVEY: SurveyQuestion[] = [
  {
    id: "ss1",
    category: "staff_satisfaction",
    text: "How often do you proactively ask your team members about their workload and wellbeing?",
    options: [
      { value: 1, label: "Rarely or never" },
      { value: 2, label: "Only during formal reviews" },
      { value: 3, label: "Monthly" },
      { value: 4, label: "Weekly or more" },
    ],
  },
  {
    id: "ss2",
    category: "staff_satisfaction",
    text: "When a team member raises a concern, how do you typically respond?",
    options: [
      { value: 1, label: "I tend to offer solutions immediately" },
      { value: 2, label: "I listen but often move on quickly" },
      { value: 3, label: "I listen and try to understand their perspective" },
      { value: 4, label: "I actively explore the issue together with them" },
    ],
  },
  {
    id: "lr1",
    category: "legal_risks",
    text: "How confident are you in recognising the early signs of workplace bullying or harassment?",
    options: [
      { value: 1, label: "Not confident at all" },
      { value: 2, label: "Somewhat unsure" },
      { value: 3, label: "Fairly confident" },
      { value: 4, label: "Very confident — I've had training" },
    ],
  },
  {
    id: "lr2",
    category: "legal_risks",
    text: "If an employee disclosed a mental health condition, what would you do first?",
    options: [
      { value: 1, label: "I wouldn't know what to do" },
      { value: 2, label: "I'd tell them to see a doctor" },
      { value: 3, label: "I'd listen and explore reasonable adjustments" },
      { value: 4, label: "I'd follow our formal process and signpost to support" },
    ],
  },
  {
    id: "cg1",
    category: "communication_gaps",
    text: "How do you typically deliver constructive feedback?",
    options: [
      { value: 1, label: "I tend to avoid it" },
      { value: 2, label: "I deliver it directly — sometimes too bluntly" },
      { value: 3, label: "I try to balance honesty with empathy" },
      { value: 4, label: "I use a structured approach (e.g., SBI framework)" },
    ],
  },
  {
    id: "cg2",
    category: "communication_gaps",
    text: "How do you adapt your communication style for different team members?",
    options: [
      { value: 1, label: "I don't — I treat everyone the same" },
      { value: 2, label: "I try, but I'm not sure how" },
      { value: 3, label: "I adjust tone and approach based on personality" },
      { value: 4, label: "I actively consider cultural, neuro, and identity-diverse needs" },
    ],
  },
];
