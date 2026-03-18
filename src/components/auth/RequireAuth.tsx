import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasAdminAccess } from "@/pages/AdminAccessPage";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user && !hasAdminAccess()) {
    return <Navigate to="/testing/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

