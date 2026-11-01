"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AccountPreferencesContext } from "@/components/providers/AccountPreferencesContext";
import { CloudDataProvider } from "@/components/providers/CloudDataProvider";
import { DemoDataProvider } from "@/components/providers/DemoDataProvider";
import { useI18n } from "@/hooks/use-i18n";
import { createClient } from "@/lib/supabase/client";

type IdentityState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; userId: string }
  | { status: "error" }
  | { status: "expired" };

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [identity, setIdentity] = useState<IdentityState>({ status: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const client = createClient();

    async function resolveSession(
      session: Awaited<ReturnType<typeof client.auth.getSession>>["data"]["session"],
    ) {
      const requestRevision = ++revision;
      if (!session) {
        setIdentity({ status: "anonymous" });
        return;
      }

      setIdentity({ status: "loading" });
      try {
        const { data, error } = await client.auth.getClaims();
        if (!active || requestRevision !== revision) return;
        const subject = data?.claims?.sub;
        if (
          error ||
          typeof subject !== "string" ||
          subject !== session.user.id
        ) {
          setIdentity({ status: "expired" });
          return;
        }
        setIdentity({ status: "authenticated", userId: subject });
      } catch {
        if (active && requestRevision === revision) {
          setIdentity({ status: "error" });
        }
      }
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        void resolveSession(session);
      });
    });

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setIdentity({ status: "error" });
          return;
        }
        void resolveSession(data.session);
      })
      .catch(() => {
        if (active) setIdentity({ status: "error" });
      });

    return () => {
      active = false;
      revision += 1;
      subscription.unsubscribe();
    };
  }, [retry]);

  const onSessionExpired = useCallback(() => {
    setIdentity({ status: "expired" });
  }, []);

  if (identity.status === "loading") {
    return (
      <main
        className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {t("cloud.loadingIdentity")}
          </p>
        </div>
      </main>
    );
  }

  if (identity.status === "error" || identity.status === "expired") {
    const expired = identity.status === "expired";
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          role="alert"
        >
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {expired ? t("cloud.sessionExpired") : t("error.title")}
          </h1>
          {expired ? (
            <Link
              href="/login"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {t("cloud.signInAgain")}
            </Link>
          ) : (
            <button
              type="button"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              onClick={() => setRetry((current) => current + 1)}
            >
              {t("cloud.retry")}
            </button>
          )}
        </section>
      </main>
    );
  }

  if (identity.status === "authenticated") {
    return (
      <CloudDataProvider
        key={identity.userId}
        userId={identity.userId}
        onSessionExpired={onSessionExpired}
      >
        {children}
      </CloudDataProvider>
    );
  }

  return (
    <AccountPreferencesContext.Provider value={{ mode: "demo" }}>
      <DemoDataProvider>{children}</DemoDataProvider>
    </AccountPreferencesContext.Provider>
  );
}
