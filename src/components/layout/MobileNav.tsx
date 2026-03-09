import { Link, useLocation } from "react-router-dom";
import { MessageSquare, BarChart3, ClipboardList, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/chat", icon: MessageSquare, label: "Coach" },
  { to: "/survey", icon: ClipboardList, label: "Assess" },
  { to: "/dashboard", icon: BarChart3, label: "Stats" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 py-1 shadow-elevated">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                active ? "text-secondary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
