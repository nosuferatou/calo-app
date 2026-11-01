import type { ReactNode } from "react";
import Link from "next/link";
import { LanguageToggle } from "@/components/common/LanguageToggle";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-xl font-bold tracking-tight text-slate-900 hover:text-brand-700 active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 dark:text-white dark:hover:text-brand-300"
          >
            CALO
          </Link>
          <LanguageToggle />
        </header>
        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
