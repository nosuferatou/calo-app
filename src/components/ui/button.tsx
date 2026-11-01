"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white hover:bg-brand-700 active:brightness-90",
        outline:
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 active:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 dark:active:bg-slate-700",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-12 rounded-md px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
