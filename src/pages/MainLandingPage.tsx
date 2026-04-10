import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, ArrowRight } from "lucide-react";

/**
 * Main landing page (/) — ShiftED AI platform.
 * Uses platform colors (gradient #7C6CF3 → #A16AE8 → #C770D6).
 * All app features live under /testing.
 */
export default function MainLandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav sticky top-0 z-40 w-full">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-white tracking-tight">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" aria-hidden />
            <span className="text-lg">ShiftED</span>
            <span className="text-lg text-white/90">AI</span>
          </Link>
          <Link
            to="/testing/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 text-white hover:bg-white/25 text-sm font-medium transition-colors"
          >
            Sign in / Sign up
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="gradient-hero px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-3.5 h-3.5 text-white/90" />
              <span className="text-xs font-medium text-white/90">Practice-based training · Not therapy</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
              Build empathetic leaders,
              <br />
              <span className="text-white/95">one conversation at a time</span>
            </h1>

            <p className="mt-6 text-white/80 text-lg max-w-lg mx-auto leading-relaxed">
              ShiftED AI helps first-time managers master constructive feedback, inclusive communication, and critical thinking through AI-powered practice scenarios.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Button asChild size="lg" className="bg-white text-[#2d2d3a] hover:bg-white/95 rounded-xl gap-2 shadow-lg font-semibold">
                <Link to="/testing/login">
                  Sign in / Sign up <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold">
                <Link to="/testing/login">
                  <MessageSquare className="w-5 h-5" /> Sign in to start
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="px-6 py-16 max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">Current testing focus</h2>
          <div className="grid md:grid-cols-1 gap-6 max-w-xl mx-auto">
            <Link to="/testing/login" className="block p-6 rounded-2xl bg-card border border-border hover:shadow-elevated transition-shadow text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[#a16ae8]" />
              <h3 className="font-display font-semibold text-foreground mb-1">One guided session</h3>
              <p className="text-sm text-muted-foreground">Sign in, practice a difficult feedback conversation, and help us collect training data.</p>
            </Link>
          </div>
          <p className="text-center mt-8">
            <Link to="/testing/login" className="text-[#a16ae8] font-medium hover:underline">Sign in / Sign up →</Link>
          </p>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 py-6 px-4 text-center text-sm text-muted-foreground">
        <p>ShiftED AI — Empathy training for managers. Not a substitute for professional support.</p>
        <p className="mt-1">
          <a href="https://www.nhs24.com" className="underline">NHS 24</a> · <a href="https://www.mind.org.uk" className="underline">Mind</a> · <a href="https://www.samaritans.org" className="underline">Samaritans</a>
        </p>
      </footer>
    </div>
  );
}
