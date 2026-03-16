import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, ArrowRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AvatarPage() {
  return (
    <div className="container px-4 py-12 max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center mx-auto shadow-glow">
          <Bot className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
          AI simulation partner
        </h1>
        <p className="text-muted-foreground">
          Practice empathy, leadership, and critical thinking through voice-first conversations with a talking AI avatar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg" className="rounded-xl gap-2 gradient-hero text-primary-foreground hover:opacity-90">
            <Link to="/testing/avatar/session">
              <Bot className="w-5 h-5" /> Start avatar session <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl gap-2">
            <Link to="/testing/scenarios">
              <LayoutGrid className="w-5 h-5" /> Choose scenario
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
