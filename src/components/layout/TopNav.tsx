import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Bot, TrendingUp, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navTabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/scenarios", icon: LayoutGrid, label: "Scenarios" },
  { to: "/avatar", icon: Bot, label: "Avatar" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
  { to: "/resources", icon: BookOpen, label: "Resources" },
];

export default function TopNav() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-foreground">
          <span className="text-lg tracking-tight">ShiftED</span>
          <span className="text-lg tracking-tight text-primary">AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navTabs.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Profile and settings"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
