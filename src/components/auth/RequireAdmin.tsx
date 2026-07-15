import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { hasAdminRole, isTrainerAdminEmail } from "@/lib/adminAccess";

export default function RequireAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setCheckingRole(false);
        }
        return;
      }

      if (!isTrainerAdminEmail(user.email)) {
        if (mounted) {
          setIsAdmin(false);
          setCheckingRole(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);

      if (mounted) {
        setIsAdmin(!error && hasAdminRole(data));
        setCheckingRole(false);
      }
    };

    setCheckingRole(true);
    checkRole();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading || checkingRole) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking admin access…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/testing/login" replace />;
  if (!isAdmin) return <Navigate to="/testing/journeys" replace />;

  return <Outlet />;
}
