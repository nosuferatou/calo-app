"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { readStorage, writeStorage } from "@/lib/storage/client";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { AccountPreferencesContext } from "@/components/providers/AccountPreferencesContext";
import {
  applyTheme,
  notifyThemeChange,
  subscribeTheme,
} from "@/lib/theme";
import type { AppSettings, ThemePreference } from "@/types/domain";

function getThemeSnapshot(): ThemePreference {
  const result = readStorage(STORAGE_KEYS.settings);

  return result.status === "ok" ? result.data.theme : "system";
}

function getServerThemeSnapshot(): ThemePreference {
  return "system";
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const preferences = useContext(AccountPreferencesContext);
  const selectedTheme =
    preferences?.mode === "cloud" ? preferences.theme : theme;

  useEffect(() => {
    applyTheme(selectedTheme);

    if (selectedTheme !== "system" || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [selectedTheme]);

  const setTheme = useCallback((next: ThemePreference) => {
    if (preferences?.mode === "cloud") {
      void preferences.saveTheme(next);
      return;
    }

    applyTheme(next);

    const current = readStorage(STORAGE_KEYS.settings);
    const settings: AppSettings =
      current.status === "ok"
        ? { ...current.data, theme: next }
        : { theme: next, language: "id" };

    void writeStorage(STORAGE_KEYS.settings, settings);
    notifyThemeChange();
  }, [preferences]);

  return { theme: selectedTheme, setTheme };
}
