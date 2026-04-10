import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ONLY_ADMIN_EMAIL = "josh@admin.com";

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

      if ((user.email || "").toLowerCase() !== ONLY_ADMIN_EMAIL) {
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
        setIsAdmin(!error && !!data && data.length > 0);
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
  if (!isAdmin) return <Navigate to="/testing/avatar/session" replace />;

  return <Outlet />;
}

