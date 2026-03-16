import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProgressPage() {
  return (
    <div className="container px-4 py-12 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">Progress</h1>
        <p className="text-muted-foreground">
          Track your practice sessions, strengths, and areas to develop. Coming soon.
        </p>
        <Button asChild variant="outline" className="rounded-xl gap-2" size="lg">
          <Link to="/testing/dashboard">
            View dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
