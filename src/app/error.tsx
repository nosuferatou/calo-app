"use client";

import { useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { getErrorMessageKey } from "@/lib/errors";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center gap-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-500">
          CALO
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("error.title")}
        </h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
          {t(getErrorMessageKey(error))}
        </p>
      </div>
      <div>
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 active:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {t("error.retry")}
        </button>
      </div>
    </section>
  );
}
