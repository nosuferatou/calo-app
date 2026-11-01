"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBasket } from "lucide-react";
import { MealCartDrawer } from "@/components/cart/MealCartDrawer";
import { AppDataProvider } from "@/components/providers/AppDataProvider";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { Navigation } from "./Navigation";
import { StorageStatusBanner } from "./StorageStatusBanner";

function CartTrigger() {
  const { cartItems, cartOpen, openCart } = useDemoData();
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={t("cart.open")}
      aria-expanded={cartOpen}
      className={cn(
        "fixed right-4 bottom-20 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-medium text-white shadow-lg transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 md:right-8 md:bottom-8",
        cartOpen && "pointer-events-none opacity-0",
      )}
    >
      <ShoppingBasket className="size-5" aria-hidden="true" />
      <span className="hidden sm:inline">{t("cart.title")}</span>
      {cartItems.length > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-semibold text-brand-700">
          {cartItems.length}
        </span>
      ) : null}
    </button>
  );
}

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isStandaloneRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth/");

  if (isStandaloneRoute) {
    return children;
  }

  return (
    <AppDataProvider>
      <AppShellContent>{children}</AppShellContent>
    </AppDataProvider>
  );
}

function AppShellContent({ children }: AppShellProps) {
  const { dataMode } = useDemoData();
  const { t } = useI18n();
  return (
      <div className="min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:border focus:border-slate-300 focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg dark:focus:border-slate-700 dark:focus:bg-slate-900"
        >
          {t("common.skipToContent")}
        </a>
        <Navigation />
        <div className="md:pl-60">
          {dataMode === "demo" ? <StorageStatusBanner /> : null}
          <main
            id="main-content"
            className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 md:pt-10 md:pb-10 lg:px-8"
          >
            {children}
          </main>
        </div>
        <CartTrigger />
        <MealCartDrawer />
      </div>
  );
}
