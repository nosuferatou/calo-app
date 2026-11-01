"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        error: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
        info: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
