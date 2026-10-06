import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserConsent, saveUserConsent } from "@/lib/phase3Api";

const CACHE_KEY = "shifted_consent";

function readLocalConsent(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { userId?: string; ok?: boolean };
    return parsed.userId === userId && parsed.ok === true;
  } catch {
    return false;
  }
}

function writeLocalConsent(userId: string) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, ok: true }));
}

export function useConsentGate() {
  const { user, loading: authLoading } = useAuth();
  const [consented, setConsented] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setConsented(false);
      setChecking(false);
      return;
    }

    if (readLocalConsent(user.id)) {
      setConsented(true);
      setChecking(false);
      return;
    }

    let cancelled = false;
    void fetchUserConsent(user.id).then((ok) => {
      if (cancelled) return;
      if (ok) writeLocalConsent(user.id);
      setConsented(ok);
      setChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const grantConsent = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserConsent(user.id);
      writeLocalConsent(user.id);
      setConsented(true);
    } finally {
      setSaving(false);
    }
  }, [user]);

  return { consented, checking: authLoading || checking, saving, grantConsent };
}
