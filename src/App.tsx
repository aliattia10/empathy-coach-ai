import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import GDPRConsentModal from "@/components/safety/GDPRConsentModal";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import SurveyPage from "./pages/SurveyPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import AvatarPage from "./pages/AvatarPage";
import AvatarSessionPage from "./pages/AvatarSessionPage";
import ScenariosPage from "./pages/ScenariosPage";
import ProgressPage from "./pages/ProgressPage";
import ResourcesPage from "./pages/ResourcesPage";
import OnboardingPage from "./pages/OnboardingPage";

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
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/scenarios" element={<ScenariosPage />} />
              <Route path="/avatar" element={<AvatarPage />} />
              <Route path="/avatar/session" element={<AvatarSessionPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
