import type { ReactNode } from "react";

type PagePlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PagePlaceholder({
  title,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {title}
        </h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Under Construction</p>
        <p className="mt-1">
          This module is not implemented yet. The route exists so navigation
          stays honest.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Planned work for this module will appear here once the related phase
          is implemented.
        </p>
        {children}
      </div>
    </section>
  );
}
