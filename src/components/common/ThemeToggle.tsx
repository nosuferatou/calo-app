"use client";

import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/types/domain";

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900"
      role="group"
      aria-label="Theme preference"
    >
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          aria-pressed={theme === option.value}
          className={cn(
            "min-h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
            theme === option.value
              ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
