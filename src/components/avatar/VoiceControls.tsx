import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceControlsProps {
  state: VoiceState;
  sessionActive: boolean;
  onMicClick: () => void;
  onMute?: () => void;
  onSpeaker?: () => void;
  onPause?: () => void;
  onEndSession?: () => void;
  disabled?: boolean;
}

export default function VoiceControls({
  state,
  sessionActive,
  onMicClick,
  onMute,
  onSpeaker,
  onPause,
  onEndSession,
  disabled,
}: VoiceControlsProps) {
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isSpeaking = state === "speaking";
  const isActive = isListening || isProcessing || isSpeaking;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between gap-6 w-full max-w-sm">
        {/* Mute */}
        <button
          type="button"
          onClick={onMute}
          className="flex flex-col items-center gap-2 group"
          aria-label="Mute"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-muted/80 transition-all">
            <MicOff className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Mute</span>
        </button>

        {/* Main: Mic / processing - solid primary for clarity */}
        <motion.div
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isListening ? Infinity : 0, duration: 2, ease: "easeInOut" }}
        >
          <Button
            type="button"
            size="icon"
            onClick={onMicClick}
            disabled={disabled}
            className={cn(
              "w-20 h-20 rounded-full bg-[#a16ae8] text-white shadow-lg shadow-[#a16ae8]/35 hover:bg-[#8f5ad4] hover:scale-105 transition-all",
              isProcessing && "animate-pulse"
            )}
            aria-label={isProcessing ? "Processing" : isSpeaking ? "AI speaking" : isListening ? "Listening" : "Start"}
          >
            {isProcessing ? (
              <span className="w-8 h-8 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <Mic className={cn("w-9 h-9", isListening && "animate-pulse")} />
            )}
          </Button>
        </motion.div>

        {/* Speaker */}
        <button
          type="button"
          onClick={onSpeaker}
          className="flex flex-col items-center gap-2 group"
          aria-label="Speaker"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-muted/80 transition-all">
            <Volume2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Speaker</span>
        </button>
      </div>

      <span className="text-xs font-bold text-foreground uppercase tracking-widest">Session</span>

      {/* Optional: Pause / End */}
      <div className="flex items-center gap-2">
        {onPause && (
          <Button
            type="button"
            size="sm"
            onClick={onPause}
            disabled={!sessionActive || disabled}
            className="rounded-xl gap-1.5 bg-[#a16ae8] text-white font-semibold hover:bg-[#8f5ad4] shadow-md"
          >
            <Pause className="w-4 h-4" /> Pause
          </Button>
        )}
        {onEndSession && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEndSession}
            disabled={!sessionActive || disabled}
            className="rounded-xl gap-1.5 text-foreground/90 hover:text-destructive hover:bg-destructive/10"
          >
            End session
          </Button>
        )}
      </div>
    </div>
  );
}
