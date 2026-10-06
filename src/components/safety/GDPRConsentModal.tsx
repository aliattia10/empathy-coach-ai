import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield, X } from "lucide-react";

interface Props {
  open: boolean;
  onConsent: () => void | Promise<void>;
  onDismiss?: () => void;
  allowClose?: boolean;
  saving?: boolean;
}

export default function GDPRConsentModal({ open, onConsent, onDismiss, allowClose = false, saving = false }: Props) {
  const [dataConsent, setDataConsent] = useState(false);
  const [ageConsent, setAgeConsent] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && allowClose) onDismiss?.();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (!allowClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!allowClose) e.preventDefault();
        }}
      >
        {allowClose ? (
          <button
            type="button"
            onClick={() => onDismiss?.()}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
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
          onClick={() => void onConsent()}
          disabled={!dataConsent || !ageConsent || saving}
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "I Agree — Let's Begin"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
