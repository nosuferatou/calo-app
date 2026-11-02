"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  AccountPreferencesContext,
  type AccountPreferencesContextValue,
} from "@/components/providers/AccountPreferencesContext";
import { CloudDataProvider } from "@/components/providers/CloudDataProvider";
import { DemoDataProvider } from "@/components/providers/DemoDataProvider";
import { useI18n } from "@/hooks/use-i18n";
import { createClient } from "@/lib/supabase/client";

/**
 * Upper bound for a single identity-resolution call (`getSession`/`getClaims`).
 * A timed-out resolution becomes an explicit error state with a retry action; it
 * never resolves to "anonymous" (demo mode) and never grants authenticated
 * access, so a stalled network cannot silently expose cloud data or hide a
 * signed-in account behind the demo provider.
 */
export const IDENTITY_TIMEOUT_MS = 15_000;

class IdentityTimeoutError extends Error {
  constructor() {
    super("Identity resolution timed out.");
    this.name = "IdentityTimeoutError";
  }
}

type IdentityErrorReason = "timeout" | "network";

const DEMO_ACCOUNT_PREFERENCES: AccountPreferencesContextValue = {
  mode: "demo",
};

type IdentityState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; userId: string }
  | { status: "error"; reason: IdentityErrorReason }
  | { status: "expired" };

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [identity, setIdentity] = useState<IdentityState>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    let active = true;
    let revision = 0;
    const client = createClient();
    const timers = timersRef.current;

    function bounded<T>(promise: Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          reject(new IdentityTimeoutError());
        }, IDENTITY_TIMEOUT_MS);
        timers.add(timer);
        promise.then(
          (value) => {
            timers.delete(timer);
            clearTimeout(timer);
            resolve(value);
          },
          (error) => {
            timers.delete(timer);
            clearTimeout(timer);
            reject(error);
          },
        );
      });
    }

    function reasonFor(error: unknown): IdentityErrorReason {
      return error instanceof IdentityTimeoutError ? "timeout" : "network";
    }

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
        const { data, error } = await bounded(client.auth.getClaims());
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
      } catch (error) {
        if (!active || requestRevision !== revision) return;
        setIdentity({ status: "error", reason: reasonFor(error) });
      }
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        void resolveSession(session);
      });
    });

    void bounded(client.auth.getSession())
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setIdentity({ status: "error", reason: "network" });
          return;
        }
        void resolveSession(data.session);
      })
      .catch((error) => {
        if (!active) return;
        setIdentity({ status: "error", reason: reasonFor(error) });
      });

    return () => {
      active = false;
      revision += 1;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
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
    const description = expired
      ? null
      : identity.reason === "timeout"
        ? t("cloud.identityTimeout")
        : t("cloud.identityError");
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          role="alert"
        >
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {expired ? t("cloud.sessionExpired") : t("error.title")}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          ) : null}
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
    <AccountPreferencesContext.Provider value={DEMO_ACCOUNT_PREFERENCES}>
      <DemoDataProvider>{children}</DemoDataProvider>
    </AccountPreferencesContext.Provider>
  );
}
