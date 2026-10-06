import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const referralCode = profile?.referral_code || "—";

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://shiftedai.netlify.app/join?ref=${referralCode}`);
    toast.success("Referral link copied!");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      toast.success("Password updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and organisation</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-display">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}
          </p>
          <form onSubmit={changePassword} className="space-y-3 pt-2 border-t border-border">
            <Label htmlFor="new-password">Change password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
            />
            <Button type="submit" size="sm" className="rounded-xl" disabled={busy || !user}>
              Update password
            </Button>
            <p className="text-xs text-muted-foreground">
              Password reset links from email expire after 60 minutes (configure in Supabase Auth;
              see docs/AUTH-PASSWORD-RESET.md in the repo).
            </p>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Share2 className="w-4 h-4 text-secondary" /> Referral Programme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share ShiftED AI with other organisations and earn credits towards your subscription.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">Your Referral Code</Label>
            <div className="flex gap-2">
              <Input value={loading ? "Loading…" : referralCode} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyReferral} disabled={!profile}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {!user && (
            <p className="text-xs text-muted-foreground">Sign in to get your referral code.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-display">Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Subscription type: placeholder only — payments are out of scope for this release.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base font-display">Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your conversation data is encrypted and stored in compliance with GDPR. You can request a
            full data export or deletion at any time.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export My Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Delete My Data
            </Button>
          </div>
          <p className="text-xs">
            Need immediate help?{" "}
            <Link to="/testing/resources" className="text-[#7c4db8] underline">
              Resources
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
