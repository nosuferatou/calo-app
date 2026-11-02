import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "max-w-full rounded-md bg-slate-200 dark:bg-slate-800",
        className,
      )}
    />
  );
}
