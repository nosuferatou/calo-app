import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type InputProps = ComponentProps<"input">;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500",
        className,
      )}
      {...props}
    />
  );
}
