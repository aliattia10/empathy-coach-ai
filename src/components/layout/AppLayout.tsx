import { Outlet, useLocation } from "react-router-dom";
import TopNav from "./TopNav";
import AppFooter from "./AppFooter";
import MobileNav from "./MobileNav";
import DisclaimerBanner from "../safety/DisclaimerBanner";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { pathname } = useLocation();
  const fullBleed =
    pathname.startsWith("/testing/avatar/session") ||
    /^\/testing\/journeys\/[^/]+$/.test(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <DisclaimerBanner />
      <main
        className={cn(
          "flex-1 pb-20 md:pb-8 overflow-hidden bg-[#f8f6f6]/98 backdrop-blur-md border border-white/30 shadow-xl w-full",
          fullBleed
            ? "md:mx-2 md:mb-2 md:rounded-2xl max-w-none"
            : "md:mx-4 md:mb-4 md:rounded-3xl max-w-6xl md:mx-auto",
        )}
      >
        <Outlet />
      </main>
      <AppFooter />
      <MobileNav />
    </div>
  );
}
