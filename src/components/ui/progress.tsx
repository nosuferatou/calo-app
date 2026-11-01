"use client";

import { cn } from "@/lib/utils";

export type ProgressTone = "neutral" | "success" | "warning" | "error" | "info";

const toneFillClass: Record<ProgressTone, string> = {
  neutral: "bg-brand-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-sky-500",
};

type ProgressProps = {
  value: number;
  max?: number;
  tone?: ProgressTone;
  className?: string;
};

export function Progress({
  value,
  max = 100,
  tone = "neutral",
  className,
}: ProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const clampedValue = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clampedValue / safeMax) * 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={Math.round(clampedValue)}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",
        className,
      )}
    >
      <div
        data-testid="progress-fill"
        className={cn("h-full rounded-full transition-[width] duration-300", toneFillClass[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
