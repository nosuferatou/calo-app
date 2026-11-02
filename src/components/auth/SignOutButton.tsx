"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { clearDemoModeOptIn } from "@/lib/auth/demo-mode";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    void supabase.auth
      .getClaims()
      .then(({ data: claimsData, error }) => {
        if (active) {
          setSignedIn(!error && Boolean(claimsData?.claims?.sub));
        }
      })
      .catch(() => {
        if (active) {
          setSignedIn(false);
        }
      });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (busy) {
      return;
    }

    setBusy(true);
    setFailed(false);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setFailed(true);
        return;
      }

      // Sign-out returns the visitor to the login gate; a stale demo opt-in
      // must not silently drop them back into the demo dashboard.
      clearDemoModeOptIn();
      router.replace("/login");
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        className="h-11 w-full"
        onClick={signOut}
        type="button"
        variant="outline"
        disabled={busy}
      >
        {busy ? t("auth.loading") : t("auth.action.signOut")}
      </Button>
      {failed ? (
        <p className="text-sm text-error" role="alert">
          {t("auth.error.generic")}
        </p>
      ) : null}
    </div>
  );
}
