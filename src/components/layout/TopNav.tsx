import { Link, useLocation } from "react-router-dom";
import { Bot, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navTabs = [
  { to: "/testing/avatar/session", icon: Bot, label: "Session" },
];

export default function TopNav() {
  const location = useLocation();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="glass-nav sticky top-0 z-40 w-full">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/testing" className="flex items-center gap-2 font-display font-bold text-white tracking-tight">
          <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" aria-hidden />
          <span className="text-lg">ShiftED</span>
          <span className="text-lg text-white/90">AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navTabs.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/testing" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-white/90 truncate max-w-[140px]" title={user.email}>
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link
              to="/testing/login"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors border border-white/10 text-sm font-medium"
            >
              <LogIn className="w-4 h-4" /> Sign in
            </Link>
          )}
          {user ? (
            <Link
              to="/testing/avatar/session"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
              aria-label="Session"
            >
              <User className="w-5 h-5" />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
