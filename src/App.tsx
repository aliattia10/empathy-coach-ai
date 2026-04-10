import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import GDPRConsentModal from "@/components/safety/GDPRConsentModal";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireAdmin from "@/components/auth/RequireAdmin";
import MainLandingPage from "./pages/MainLandingPage";
import NotFound from "./pages/NotFound";
import AvatarSessionPage from "./pages/AvatarSessionPage";
import AdminChatPage from "./pages/AdminChatPage";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

const App = () => {
  const [consented, setConsented] = useState(() => localStorage.getItem("shifted_consent") === "true");

  const handleConsent = () => {
    localStorage.setItem("shifted_consent", "true");
    setConsented(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GDPRConsentModal open={!consented} onConsent={handleConsent} />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLandingPage />} />
            <Route path="/testing/login" element={<LoginPage />} />
            <Route path="/adminchat" element={<RequireAuth />}>
              <Route element={<RequireAdmin />}>
                <Route element={<AppLayout />}>
                  <Route index element={<AdminChatPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="/testing" element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/testing/avatar/session" replace />} />
                <Route path="avatar/session" element={<AvatarSessionPage />} />
                <Route path="*" element={<Navigate to="/testing/avatar/session" replace />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
