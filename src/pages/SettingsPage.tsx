import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);

  const referralCode = profile?.referral_code || "—";

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://shifted-ai.com/join?ref=${referralCode}`);
    toast.success("Referral link copied!");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and organisation</p>
      </div>

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
          <CardTitle className="text-base font-display">Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your conversation data is encrypted and stored in compliance with GDPR. You can request a full data export or deletion at any time.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Export My Data</Button>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">Delete My Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
