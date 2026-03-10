import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type AvatarStatus = "idle" | "listening" | "thinking" | "speaking";

interface AvatarDisplayProps {
  status?: AvatarStatus;
  className?: string;
}

export default function AvatarDisplay({ status = "idle", className }: AvatarDisplayProps) {
  const isActive = status === "listening" || status === "thinking" || status === "speaking";
  const isSpeaking = status === "speaking";

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Outer decorative voice rings */}
      <div className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80">
        <div className="absolute inset-0 rounded-full voice-ring scale-110 opacity-10" />
        <div className="absolute inset-0 rounded-full voice-ring scale-125 opacity-5" />

        {/* Glassmorphic face circle */}
        <div className="relative w-full h-full rounded-full glass shadow-2xl flex flex-col items-center justify-center overflow-hidden border border-primary/20">
          {/* Abstract face: two eyes */}
          <div className="flex gap-12 mb-8">
            <motion.div
              className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(161,106,232,0.5)]"
              animate={isSpeaking ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } : {}}
              transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.6 }}
            />
            <motion.div
              className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(161,106,232,0.5)]"
              animate={isSpeaking ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } : {}}
              transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.6, delay: 0.1 }}
            />
          </div>
          {/* Mouth: animated line */}
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full opacity-80" />
          {/* Waveform overlay (subtle) */}
          <div className="absolute bottom-10 flex items-end gap-1 h-8">
            <div className="w-1 bg-primary/40 rounded-full h-4" />
            <div className="w-1 bg-primary/60 rounded-full h-6" />
            <motion.div
              className="w-1 bg-primary rounded-full h-8"
              animate={isActive ? { scaleY: [1, 1.2, 1] } : {}}
              transition={{ repeat: isActive ? Infinity : 0, duration: 0.6 }}
            />
            <div className="w-1 bg-primary/60 rounded-full h-5" />
            <div className="w-1 bg-primary/40 rounded-full h-3" />
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="font-display font-semibold text-foreground">AI Simulation Partner</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 uppercase tracking-wider">{status}</p>
      </div>
    </div>
  );
}
