import { Link, useLocation } from "react-router-dom";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/testing/avatar/session", icon: Bot, label: "Session" },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-white/10 px-2 py-1">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-colors",
                active ? "text-white" : "text-white/70"
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
