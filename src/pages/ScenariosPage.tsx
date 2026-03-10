import { motion } from "framer-motion";
import ScenarioSelector from "@/components/avatar/ScenarioSelector";

export default function ScenariosPage() {
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
          Training scenarios
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose a scenario to practice with your AI simulation partner. Each launches an avatar session.
        </p>
      </motion.div>
      <ScenarioSelector />
    </div>
  );
}
