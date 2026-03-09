import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SettingsPage() {
  const [referralCode] = useState("SHIFTED-" + Math.random().toString(36).substring(2, 8).toUpperCase());

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
              <Input value={referralCode} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyReferral}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
            <Users className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-sm font-medium text-foreground">3 referrals</p>
              <p className="text-xs text-muted-foreground">2 active · 1 pending</p>
            </div>
          </div>
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
