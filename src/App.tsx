import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import GDPRConsentModal from "@/components/safety/GDPRConsentModal";
import RequireAuth from "@/components/auth/RequireAuth";
import MainLandingPage from "./pages/MainLandingPage";
import NotFound from "./pages/NotFound";
import AvatarSessionPage from "./pages/AvatarSessionPage";
import SessionWorkspacePage from "./pages/SessionWorkspacePage";
import JourneysDashboardPage from "./pages/JourneysDashboardPage";
import AdminChatPage from "./pages/AdminChatPage";
import LoginPage from "./pages/LoginPage";
import SkillsLibraryPage from "./pages/SkillsLibraryPage";
import WorkbookDetailPage from "./pages/WorkbookDetailPage";
import ProfileDashboardPage from "./pages/ProfileDashboardPage";
import JournalPage from "./pages/JournalPage";
import ResourcesPage from "./pages/ResourcesPage";
import SettingsPage from "./pages/SettingsPage";

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
            <Route path="/adminchat" element={<AppLayout />}>
              <Route index element={<AdminChatPage />} />
            </Route>
            <Route path="/testing" element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/testing/journeys" replace />} />
                <Route path="journeys" element={<JourneysDashboardPage />} />
                <Route path="journeys/:journeyId" element={<SessionWorkspacePage />} />
                <Route path="avatar/session/:journeyId" element={<AvatarSessionPage />} />
                <Route path="avatar/session" element={<Navigate to="/testing/journeys" replace />} />
                <Route path="library" element={<SkillsLibraryPage />} />
                <Route path="library/:workbookId" element={<WorkbookDetailPage />} />
                <Route path="profile" element={<ProfileDashboardPage />} />
                <Route path="dashboard" element={<Navigate to="/testing/profile" replace />} />
                <Route path="journal" element={<JournalPage />} />
                <Route path="resources" element={<ResourcesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/testing/journeys" replace />} />
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
