/** Shared crisis-line wording — keep NHS references consistent across the app. */
export const CRISIS_LINES_SHORT =
  "Samaritans 116 123 · NHS 111 (England & Wales) · NHS 24 on 111 (Scotland) · Mind 0300 123 3393 · PAPYRUS HOPELINE247 0800 068 4141";

export const CRISIS_LINES_SIDEBAR =
  "Samaritans 116 123 · NHS 111 · NHS 24 on 111 · PAPYRUS 0800 068 4141";

export const NHS_SCOTLAND_URL = "https://www.nhs24.scot/";

/** Public NHS CNTW self-help library (booklets not hosted in-app). */
export const NHS_CNTW_SELF_HELP_URL = "https://www.cntw.nhs.uk/resource-library/";

export const CRISIS_RESOURCES = [
  {
    name: "NHS 24 (Scotland)",
    href: NHS_SCOTLAND_URL,
    desc: "24/7 health advice and support",
  },
  {
    name: "NHS 111 (England & Wales)",
    href: "https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/",
    desc: "Urgent medical advice",
  },
  { name: "Mind", href: "https://www.mind.org.uk/", desc: "Mental health information and support" },
  { name: "Samaritans", href: "https://www.samaritans.org/", desc: "116 123 — 24/7 emotional support" },
  {
    name: "PAPYRUS HOPELINE247",
    href: "https://www.papyrus-uk.org/hopeline247/",
    desc: "0800 068 4141 — suicide prevention support (under 35 / concerned about a young person)",
  },
  {
    name: "SHOUT",
    href: "https://giveusashout.org/",
    desc: "Text 85258 — 24/7 crisis text support",
  },
] as const;

/** Titles from Simon's NHS CNTW pack — link to the public library, not hosted PDFs. */
export const NHS_CNTW_SELF_HELP_GUIDES = [
  {
    title: "Bereavement",
    summary: "Self-help guide for grief and bereavement at your own pace.",
  },
  {
    title: "Depression and Low Mood",
    summary: "Understanding low mood and practical steps that can help.",
  },
  {
    title: "Food for Thought",
    summary: "Links between eating patterns, mood, and self-care.",
  },
  {
    title: "Health Anxiety",
    summary: "Worries about health and ways to respond differently.",
  },
  {
    title: "Managing Anger",
    summary: "Recognising anger patterns and safer responses.",
  },
  {
    title: "Self Harm",
    summary: "Information and support around self-harm — seek urgent help if at risk.",
  },
  {
    title: "Sleeping Problems",
    summary: "Practical guidance for common sleep difficulties.",
  },
  {
    title: "Social Anxiety",
    summary: "Understanding social anxiety and gradual approach steps.",
  },
  {
    title: "Stress",
    summary: "Stress responses and self-help strategies.",
  },
] as const;

export const HOPEBOX_BLURB =
  "Some people find a personal HOPEBOX or self-soothe kit helpful (comfort items for sight, smell, taste, sound, and touch). ShiftED can mention the idea; it does not build clinical safety plans — use PAPYRUS / NHS / Samaritans for crisis support.";
