import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type PageState = "loading" | "ready" | "error";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const searchParams = new URLSearchParams(window.location.search);

      const hashError = hashParams.get("error");
      if (hashError) {
        if (!cancelled) {
          setErrorMessage(
            "This link has expired or was already used — request a new one.",
          );
          setPageState("error");
        }
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          if (!cancelled) {
            setErrorMessage(
              "This link has expired or was already used — request a new one.",
            );
            setPageState("error");
          }
          return;
        }
        window.history.replaceState({}, "", window.location.pathname);
        if (!cancelled) setPageState("ready");
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) {
            setErrorMessage(
              "This link has expired or was already used — request a new one.",
            );
            setPageState("error");
          }
          return;
        }
        window.history.replaceState({}, "", window.location.pathname);
        if (!cancelled) setPageState("ready");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (!cancelled) setPageState("ready");
        return;
      }

      if (!cancelled) {
        setErrorMessage(
          "This link has expired or was already used — request a new one.",
        );
        setPageState("error");
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate("/testing/journeys");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container max-w-sm mx-auto px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h1 className="font-display font-semibold text-lg text-foreground mb-1">Set a new password</h1>

        {pageState === "loading" ? (
          <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
        ) : null}

        {pageState === "error" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button asChild className="w-full rounded-xl">
              <Link to="/testing/login">Back to sign in</Link>
            </Button>
          </div>
        ) : null}

        {pageState === "ready" ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                placeholder="Your password"
                minLength={8}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
                placeholder="Your password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
