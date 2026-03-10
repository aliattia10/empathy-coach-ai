import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceControlsProps {
  state: VoiceState;
  sessionActive: boolean;
  onMicClick: () => void;
  onStartSession?: () => void;
  onPause?: () => void;
  onEndSession?: () => void;
  disabled?: boolean;
}

export default function VoiceControls({
  state,
  sessionActive,
  onMicClick,
  onStartSession,
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
      {/* Large mic button */}
      <motion.div
        className="relative"
        animate={
          isListening
            ? { scale: [1, 1.08, 1] }
            : isSpeaking
              ? { scale: [1, 1.04, 1] }
              : {}
        }
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <Button
          type="button"
          size="icon"
          onClick={onMicClick}
          disabled={disabled}
          className={cn(
            "h-20 w-20 rounded-full shadow-elevated transition-all duration-300",
            isListening && "bg-primary ring-4 ring-primary/30",
            isProcessing && "bg-muted animate-pulse",
            isSpeaking && "bg-secondary",
            !isActive && "gradient-hero text-primary-foreground hover:opacity-90"
          )}
          aria-label={
            isListening ? "Listening" : isProcessing ? "Processing" : isSpeaking ? "AI speaking" : "Start speaking"
          }
        >
          {isProcessing ? (
            <span className="w-8 h-8 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
          ) : (
            <Mic className={cn("w-9 h-9", isListening && "animate-pulse")} />
          )}
        </Button>
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            style={{ pointerEvents: "none" }}
          />
        )}
      </motion.div>

      <p className="text-sm text-muted-foreground capitalize">
        {state === "idle" && !sessionActive && "Tap mic or start session"}
        {state === "idle" && sessionActive && "Ready"}
        {state === "listening" && "Listening…"}
        {state === "processing" && "Thinking…"}
        {state === "speaking" && "AI speaking"}
      </p>

      {/* Session controls */}
      <div className="flex items-center gap-2">
        {onStartSession && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStartSession}
            disabled={sessionActive || disabled}
            className="rounded-xl gap-1.5"
          >
            <Play className="w-4 h-4" /> Start session
          </Button>
        )}
        {onPause && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPause}
            disabled={!sessionActive || disabled}
            className="rounded-xl gap-1.5"
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
            className="rounded-xl gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="w-4 h-4" /> End simulation
          </Button>
        )}
      </div>
    </div>
  );
}
