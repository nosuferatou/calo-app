"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { readStorage, writeStorage } from "@/lib/storage/client";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  applyLanguage,
  getStoredLanguage,
  notifyLanguageChange,
  subscribeLanguage,
  DEFAULT_LANGUAGE,
} from "@/lib/language";
import type { AppSettings, LanguagePreference } from "@/types/domain";
import { AccountPreferencesContext } from "@/components/providers/AccountPreferencesContext";

function getServerLanguageSnapshot(): LanguagePreference {
  return DEFAULT_LANGUAGE;
}

export function useLanguage() {
  const localLanguage = useSyncExternalStore(
    subscribeLanguage,
    getStoredLanguage,
    getServerLanguageSnapshot,
  );
  const preferences = useContext(AccountPreferencesContext);
  const language =
    preferences?.mode === "cloud" ? preferences.language : localLanguage;

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  const setLanguage = useCallback((next: LanguagePreference) => {
    if (preferences?.mode === "cloud") {
      void preferences.saveLanguage(next);
      return;
    }

    applyLanguage(next);

    const current = readStorage(STORAGE_KEYS.settings);
    const settings: AppSettings =
      current.status === "ok"
        ? { ...current.data, language: next }
        : { theme: "system", language: next };

    void writeStorage(STORAGE_KEYS.settings, settings);
    notifyLanguageChange();
  }, [preferences]);

  return { language, setLanguage };
}
