"use client";

import { useLanguage } from "@/hooks/use-language";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { LanguagePreference } from "@/types/domain";

const languageOptions: { value: LanguagePreference; label: string }[] = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
];

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();

  return (
    <div
      className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900"
      role="group"
      aria-label={t("settings.language")}
    >
      {languageOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
          className={cn(
            "min-h-11 rounded-md px-3 text-sm font-medium transition-colors motion-reduce:transition-none active:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:active:bg-slate-700",
            language === option.value
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
