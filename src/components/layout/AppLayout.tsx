import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import AppFooter from "./AppFooter";
import MobileNav from "./MobileNav";
import DisclaimerBanner from "../safety/DisclaimerBanner";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <DisclaimerBanner />
      <main className="flex-1 pb-20 md:pb-8 md:mx-4 md:mb-4 md:rounded-3xl overflow-hidden bg-[#f8f6f6]/98 backdrop-blur-md border border-white/30 shadow-xl max-w-6xl md:mx-auto w-full">
        <Outlet />
      </main>
      <AppFooter />
      <MobileNav />
    </div>
  );
}
