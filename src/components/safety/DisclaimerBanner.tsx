import { useState } from "react";
import { Shield, X } from "lucide-react";

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="bg-white/10 backdrop-blur-sm border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs text-white/90">
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-white" />
        <span className="font-medium">
          This AI is a training simulation and not therapy.
        </span>
        <span className="hidden sm:inline text-white/70">
          Samaritans 116 123 · NHS 111 · Mind 0300 123 3393
        </span>
      </div>
      <button onClick={() => setVisible(false)} className="text-white/70 hover:text-white p-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
