/** Shared crisis-line wording — keep NHS references consistent across the app. */
export const CRISIS_LINES_SHORT =
  "Samaritans 116 123 · NHS 111 (England & Wales) · NHS 24 on 111 (Scotland) · Mind 0300 123 3393";

export const CRISIS_LINES_SIDEBAR = "Samaritans 116 123 · NHS 111 (England & Wales) · NHS 24 on 111 (Scotland)";

export const NHS_SCOTLAND_URL = "https://www.nhs24.scot/";

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
] as const;
