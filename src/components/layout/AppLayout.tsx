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
      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>
      <AppFooter />
      <MobileNav />
    </div>
  );
}
