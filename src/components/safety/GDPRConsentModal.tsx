import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";

interface Props {
  open: boolean;
  onConsent: () => void;
}

export default function GDPRConsentModal({ open, onConsent }: Props) {
  const [dataConsent, setDataConsent] = useState(false);
  const [ageConsent, setAgeConsent] = useState(false);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-coral-light flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-secondary" />
          </div>
          <DialogTitle className="text-center font-display">Your Data, Your Control</DialogTitle>
          <DialogDescription className="text-center">
            We take your privacy seriously. Please review and consent before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={dataConsent} onCheckedChange={(v) => setDataConsent(!!v)} className="mt-0.5" />
            <span className="text-sm text-foreground">
              I consent to ShiftED AI collecting my responses for training purposes. My data is encrypted and I can request deletion at any time.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={ageConsent} onCheckedChange={(v) => setAgeConsent(!!v)} className="mt-0.5" />
            <span className="text-sm text-foreground">
              I confirm I am 18+ years old and understand this is a professional training tool, not therapy.
            </span>
          </label>
        </div>

        <Button
          onClick={onConsent}
          disabled={!dataConsent || !ageConsent}
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          I Agree — Let's Begin
        </Button>
      </DialogContent>
    </Dialog>
  );
}
