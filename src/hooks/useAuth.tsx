import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { closeOpenActivity } from "@/lib/phase3Api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      userIdRef.current = session?.user?.id ?? null;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && userIdRef.current) {
        void closeOpenActivity(userIdRef.current);
      }
      userIdRef.current = session?.user?.id ?? null;
      setUser(session?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        const onResetPage = window.location.pathname.startsWith("/testing/reset-password");
        if (!onResetPage) {
          window.location.assign("/testing/reset-password");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
