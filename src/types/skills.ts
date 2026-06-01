/** Mirrors public.skills and skills/skillsLibrary.cjs */

export type SkillCategory = "core" | "development_activation";

export type PlatformPhase = 1 | 2 | 3;

export type SkillDefinition = {
  id: string;
  name: string;
  category: SkillCategory;
  platformPhase: PlatformPhase;
  acronym: string | null;
  description: string;
  gapSignals: string[];
  whenToUse: string;
};
