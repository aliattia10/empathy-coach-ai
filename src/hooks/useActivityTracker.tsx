import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { closeOpenActivity, heartbeatActivity } from "@/lib/phase3Api";

/** Lightweight time-on-app heartbeat (no message content). */
export function useActivityTracker() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    void heartbeatActivity(location.pathname);
    const id = window.setInterval(() => {
      void heartbeatActivity(location.pathname);
    }, 60_000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void closeOpenActivity(user.id);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, location.pathname]);
}
