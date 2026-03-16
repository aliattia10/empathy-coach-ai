import { Link, useLocation } from "react-router-dom";
import { MessageSquare, BarChart3, ClipboardList, Settings, Home, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/testing", icon: Home, label: "Home" },
  { to: "/testing/chat", icon: MessageSquare, label: "AI Coach" },
  { to: "/testing/survey", icon: ClipboardList, label: "Assessments" },
  { to: "/testing/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/testing/settings", icon: Settings, label: "Settings" },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 gradient-hero min-h-screen p-4">
      <div className="mb-8 px-3 pt-2">
        <h1 className="text-xl font-display font-bold text-primary-foreground tracking-tight">
          ShiftED<span className="text-secondary"> AI</span>
        </h1>
        <p className="text-xs text-primary-foreground/60 mt-1">Empathy-driven leadership training</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 py-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border">
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <Shield className="w-4 h-4 text-secondary" />
          <span className="text-xs font-medium">This is not therapy</span>
        </div>
        <p className="text-[10px] text-primary-foreground/50 mt-1">
          For crisis support: Samaritans 116 123 · NHS 111
        </p>
      </div>
    </aside>
  );
}
