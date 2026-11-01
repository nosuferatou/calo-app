"use client";

import { useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import {
  getLocale,
  translate,
  type TranslationKey,
  type TranslationValues,
} from "@/lib/i18n";

export function useI18n() {
  const { language, setLanguage } = useLanguage();
  const locale = getLocale(language);

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) =>
      translate(language, key, values),
    [language],
  );

  return { language, locale, setLanguage, t };
}
