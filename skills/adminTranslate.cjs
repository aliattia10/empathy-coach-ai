/**
 * Admin panel translation — used by netlify/functions/translate.js and server/server.js.
 */

const LANGUAGE_NAMES = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  ar: "Arabic",
  is: "Icelandic",
};

const SUPPORTED_TARGET_LANGS = ["en", "fr", "es", "de", "ar", "is"];
const SUPPORTED_SOURCE_LANGS = ["auto", ...SUPPORTED_TARGET_LANGS];

function normalizeLang(code, allowed, fallback) {
  const raw = String(code || "").trim().toLowerCase();
  return allowed.includes(raw) ? raw : fallback;
}

function buildTranslationMessages(text, sourceLang, targetLang) {
  const target = LANGUAGE_NAMES[targetLang] || targetLang;
  const sourceHint =
    sourceLang === "auto"
      ? "Detect the source language automatically."
      : `The source language is ${LANGUAGE_NAMES[sourceLang] || sourceLang}.`;

  return [
    {
      role: "system",
      content: `You are a professional translator for ShiftED admin reviewers.
${sourceHint}
Translate into ${target}.
Preserve coaching tone, empathy, and meaning. Keep names and workplace terms unchanged when appropriate.
Output ONLY the translation — no quotes, labels, language names, or commentary.`,
    },
    { role: "user", content: String(text || "").trim().slice(0, 4000) },
  ];
}

function extractTranslationFromLlm(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return "";
  return content.trim().replace(/^["']|["']$/g, "");
}

module.exports = {
  LANGUAGE_NAMES,
  SUPPORTED_TARGET_LANGS,
  SUPPORTED_SOURCE_LANGS,
  normalizeLang,
  buildTranslationMessages,
  extractTranslationFromLlm,
};
