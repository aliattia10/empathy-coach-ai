import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsentGate } from "@/hooks/useConsentGate";
import GDPRConsentModal from "@/components/safety/GDPRConsentModal";
import { toast } from "sonner";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { consented, checking, saving, grantConsent } = useConsentGate();

  if (loading || checking) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/testing/login" replace state={{ from: location.pathname }} />;
  }

  const handleConsent = async () => {
    try {
      await grantConsent();
    } catch {
      toast.error("Couldn't save your consent. Please try again.");
    }
  };

  return (
    <>
      <GDPRConsentModal open={!consented} onConsent={handleConsent} saving={saving} />
      {consented ? <Outlet /> : null}
    </>
  );
}
