import { useState } from "react";
import { Shield, X } from "lucide-react";

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="bg-coral-light border-b border-border px-4 py-2 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-secondary" />
        <span className="font-medium text-foreground">
          This AI is a training simulation and not therapy.
        </span>
        <span className="text-muted-foreground hidden sm:inline">
          If you're in crisis: Samaritans 116 123 · NHS 111 · Mind 0300 123 3393
        </span>
      </div>
      <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
