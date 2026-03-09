import { motion } from "framer-motion";
import { Bot } from "lucide-react";

interface Props {
  speaking?: boolean;
}

export default function AvatarDisplay({ speaking }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="relative w-20 h-20 rounded-full gradient-hero flex items-center justify-center shadow-elevated"
        animate={speaking ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <Bot className="w-10 h-10 text-primary-foreground" />
        {speaking && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-secondary"
            animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          />
        )}
      </motion.div>
      <div className="text-center">
        <p className="text-sm font-display font-semibold text-foreground">Alex</p>
        <p className="text-[10px] text-muted-foreground">AI Leadership Coach</p>
      </div>
    </div>
  );
}
