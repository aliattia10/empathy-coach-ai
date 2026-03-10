import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type AvatarStatus = "idle" | "listening" | "thinking" | "speaking";

interface AvatarDisplayProps {
  status?: AvatarStatus;
  className?: string;
}

export default function AvatarDisplay({ status = "idle", className }: AvatarDisplayProps) {
  const isActive = status === "listening" || status === "thinking" || status === "speaking";
  const isPulsing = status === "speaking";

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Large circular container - gradient orb placeholder (avatar-ready) */}
      <div className="relative">
        {/* Breathing glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7C6CF3] via-[#A16AE8] to-[#C770D6] opacity-40 blur-2xl"
          animate={
            isActive
              ? { scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }
              : { scale: [1, 1.05, 1], opacity: [0.25, 0.35, 0.25] }
          }
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        />
        {/* Orb / silhouette - future: replace with talking avatar, lip sync, expressions */}
        <motion.div
          className="relative w-40 h-40 rounded-full gradient-hero flex items-center justify-center shadow-elevated border-2 border-white/20"
          animate={
            isPulsing
              ? { scale: [1, 1.03, 1] }
              : isActive
                ? { scale: [1, 1.02, 1] }
                : {}
          }
          transition={{
            repeat: isActive ? Infinity : 0,
            duration: 1.2,
            ease: "easeInOut",
          }}
        >
          {/* Waveform ripple when speaking */}
          {status === "speaking" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary-foreground/40"
                  animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    delay: i * 0.25,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
          {/* Inner soft circle - placeholder for face/avatar asset */}
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center" />
        </motion.div>
      </div>

      <div className="text-center">
        <p className="font-display font-semibold text-foreground">AI Simulation Partner</p>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{status}</p>
      </div>
    </div>
  );
}
