import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ADMIN_FLAG_KEY = "shifted_admin_access";

export function clearAdminAccess() {
  localStorage.removeItem(ADMIN_FLAG_KEY);
}

export function hasAdminAccess() {
  return localStorage.getItem(ADMIN_FLAG_KEY) === "true";
}

export default function AdminAccessPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");

  const configured = useMemo(() => {
    const v = import.meta.env.VITE_ADMIN_PIN;
    return typeof v === "string" && v.trim().length > 0;
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_PIN;
    if (typeof expected !== "string" || expected.trim() === "") {
      toast.error("Admin PIN is not configured.");
      return;
    }
    if (pin.trim() !== expected.trim()) {
      toast.error("Incorrect PIN.");
      return;
    }

    localStorage.setItem(ADMIN_FLAG_KEY, "true");
    toast.success("Admin access enabled for this browser.");
    navigate("/testing/avatar/session");
  };

  return (
    <div className="container max-w-sm mx-auto px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display font-semibold text-lg text-foreground mb-1">Admin access</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Unlock testing without email login. This is intended for internal testing only.
        </p>

        {!configured ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Set <span className="font-mono">VITE_ADMIN_PIN</span> in Netlify environment variables, then redeploy.
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <Label htmlFor="pin" className="text-foreground">
                PIN
              </Label>
              <Input
                id="pin"
                type="password"
                autoComplete="one-time-code"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-1.5"
                placeholder="••••••"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl">
              Unlock
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

