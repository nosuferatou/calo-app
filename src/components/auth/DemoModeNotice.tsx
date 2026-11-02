"use client";

import { LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { exitDemoMode } from "@/lib/auth/demo-mode";
import { getSafeReturnPath } from "@/lib/auth/paths";

/**
 * Shown only while the visitor is browsing demo data, so the way back to the
 * login gate is always reachable — including on phones, where the sidebar with
 * the sign-out control is hidden. Leaving demo mode clears the opt-in cookie
 * only; the demo data stays in this browser.
 */
export function DemoModeNotice() {
  const { dataMode } = useDemoData();
  const { t } = useI18n();
  const pathname = usePathname();

  if (dataMode !== "demo") {
    return null;
  }

  const next = getSafeReturnPath(pathname);

  function login() {
    exitDemoMode(next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <p className="min-w-0 flex-1 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-900 dark:text-white">
            {t("common.demoData")}
          </span>
          {" — "}
          {t("demoMode.notice")}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={login}
        >
          <LogIn className="size-4" aria-hidden="true" />
          {t("auth.action.login")}
        </Button>
      </div>
    </div>
  );
}
