import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BOOTSTRAP_ADMIN_CREDENTIALS: Record<string, string> = {
  "kara@admin.com": "kara1*2",
  "josh@admin.com": "joshua123*",
  "simon@admin.com": "123*1",
  "louise@admin.com": "louise*as",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from || "/testing/avatar/session";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        navigate(redirectTo);
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

        // If known admin credentials don't exist yet, bootstrap the account once.
        if (error?.message?.toLowerCase().includes("invalid login credentials")) {
          const expected = BOOTSTRAP_ADMIN_CREDENTIALS[normalizedEmail];
          if (expected && expected === password) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: normalizedEmail,
              password,
            });
            if (!signUpError) {
              const { error: retryError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
              });
              if (!retryError) {
                toast.success("Admin account created and signed in.");
                navigate(redirectTo);
                return;
              }
            }
          }
        }

        if (error) throw error;
        toast.success("Signed in.");
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-sm mx-auto px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display font-semibold text-lg text-foreground mb-1">
          {isSignUp ? "Create account" : "Sign in"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isSignUp ? "Sign up to save your progress and survey responses." : "Sign in to access your saved data."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-foreground">Password</Label>
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
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setIsSignUp((v) => !v)}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {isSignUp ? "Already have an account? Sign in" : "No account? Sign up"}
        </button>
        <p className="mt-4 text-center">
          <Link to="/" className="text-sm text-primary hover:underline">Back to main site</Link>
        </p>
      </div>
    </div>
  );
}
