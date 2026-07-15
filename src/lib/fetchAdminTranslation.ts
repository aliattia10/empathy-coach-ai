export type AdminTranslateLang = "auto" | "en" | "fr" | "es" | "de" | "ar" | "is";

export const ADMIN_TRANSLATE_TARGETS: { code: AdminTranslateLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "ar", label: "Arabic" },
  { code: "is", label: "Icelandic" },
];

export const ADMIN_TRANSLATE_SOURCES: { code: AdminTranslateLang; label: string }[] = [
  { code: "auto", label: "Auto-detect" },
  ...ADMIN_TRANSLATE_TARGETS,
];

export async function fetchAdminTranslation(opts: {
  text: string;
  targetLang: AdminTranslateLang;
  sourceLang?: AdminTranslateLang;
}): Promise<{ ok: true; translation: string } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: opts.text,
        targetLang: opts.targetLang,
        sourceLang: opts.sourceLang ?? "auto",
      }),
    });

    const data: { translation?: string; error?: string } = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "Translation failed." };
    }
    if (!data.translation?.trim()) {
      return { ok: false, error: "Translation returned empty." };
    }
    return { ok: true, translation: data.translation.trim() };
  } catch {
    return { ok: false, error: "Could not reach translation service." };
  }
}
