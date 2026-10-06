import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAdminDomainEmail(value: string) {
  return value.trim().toLowerCase().endsWith("@admin.com");
}

function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}

function loginErrorMessage(err: unknown, email: string): string {
  const message = err instanceof Error ? err.message : "Something went wrong.";
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials") && isAdminDomainEmail(email)) {
    return (
      "Invalid email or password. For @admin.com accounts: do not use Sign up — use the password set in Supabase. " +
      "If unsure, ask your admin to reset it (scripts/reset-admin-password.js or Dashboard → Users → edit user)."
    );
  }
  if (
    (lower.includes("email not confirmed") || lower.includes("not confirmed")) &&
    isAdminDomainEmail(email)
  ) {
    return (
      "@admin.com addresses cannot receive verification mail. Run supabase/sql/CONFIRM_FAKE_ADMIN_EMAILS.sql in Supabase, then try again."
    );
  }
  return message;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from || "/testing/journeys";

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      // Always show the same success message whether or not the email exists.
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/testing/settings`,
      });
    } catch {
      // Swallow — generic message only
    } finally {
      toast.success("Check your inbox");
      setLoading(false);
      setIsReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (isSignUp) {
        if (isAdminDomainEmail(normalizedEmail)) {
          toast.error(
            "@admin.com accounts are created by an administrator in Supabase — do not sign up here. Use Sign in with the password you were given.",
          );
          return;
        }
        const { error } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        navigate(redirectTo);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        toast.success("Signed in.");
        navigate(redirectTo);
      }
    } catch (err: unknown) {
      toast.error(loginErrorMessage(err, normalizedEmail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-sm mx-auto px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display font-semibold text-lg text-foreground mb-1">
          {isReset ? "Reset password" : isSignUp ? "Create account" : "Sign in"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isReset
            ? "We’ll email a secure link if an account exists for that address."
            : isSignUp
              ? "Sign up to save your progress and survey responses."
              : "Sign in to access your saved data."}
        </p>
        <form onSubmit={isReset ? handleReset : handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
              placeholder="you@example.com"
              required
            />
          </div>
          {!isReset ? (
            <div>
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                placeholder="••••••••"
              />
            </div>
          ) : null}
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading
              ? "Please wait…"
              : isReset
                ? "Send reset link"
                : isSignUp
                  ? "Sign up"
                  : "Sign in"}
          </Button>
        </form>
        {!isReset && !isSignUp ? (
          <button
            type="button"
            onClick={() => setIsReset(true)}
            className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (isReset) {
              setIsReset(false);
              return;
            }
            setIsSignUp((v) => !v);
          }}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {isReset
            ? "Back to sign in"
            : isSignUp
              ? "Already have an account? Sign in"
              : "No account? Sign up"}
        </button>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            Back to main site
          </Link>
        </p>
      </div>
    </div>
  );
}
