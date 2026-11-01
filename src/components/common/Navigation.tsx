"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  LayoutDashboard,
  Search,
  Settings,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/",
    labelKey: "nav.dashboard",
    mobileLabelKey: "nav.home",
    icon: LayoutDashboard,
  },
  {
    href: "/diary",
    labelKey: "nav.diary",
    mobileLabelKey: "nav.diary",
    icon: BookOpen,
  },
  {
    href: "/catalog",
    labelKey: "nav.catalog",
    mobileLabelKey: "nav.catalog",
    icon: Search,
  },
  {
    href: "/collection",
    labelKey: "nav.collection",
    mobileLabelKey: "nav.saved",
    icon: Bookmark,
  },
  {
    href: "/analytics",
    labelKey: "nav.analytics",
    mobileLabelKey: "nav.stats",
    icon: BarChart3,
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    mobileLabelKey: "nav.settings",
    icon: Settings,
  },
] as const satisfies ReadonlyArray<{
  href: string;
  labelKey: TranslationKey;
  mobileLabelKey: TranslationKey;
  icon: typeof LayoutDashboard;
}>;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-slate-200 bg-white md:flex md:flex-col dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              C
            </span>
            {t("app.name")}
          </Link>
        </div>

        <nav
          aria-label={t("nav.mainLabel")}
          className="flex-1 space-y-1 overflow-y-auto p-3"
        >
          {navigationItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  active
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <SignOutButton />
        </div>
      </aside>

      <nav
        aria-label={t("nav.mainLabel")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-6">
          {navigationItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={t(item.labelKey)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] leading-tight font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  active
                    ? "bg-slate-100 font-semibold text-brand-600 dark:bg-slate-800 dark:text-brand-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="w-full truncate text-center">
                  {t(item.mobileLabelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
