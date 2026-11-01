import { readStorage } from "@/lib/storage/client";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { LanguagePreference } from "@/types/domain";

export const DEFAULT_LANGUAGE: LanguagePreference = "id";

const listeners = new Set<() => void>();

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifyLanguageChange(): void {
  listeners.forEach((listener) => listener());
}

export function getStoredLanguage(): LanguagePreference {
  const result = readStorage(STORAGE_KEYS.settings);

  if (result.status !== "ok") {
    return DEFAULT_LANGUAGE;
  }

  const language = result.data.language;

  return language === "en" || language === "id"
    ? language
    : DEFAULT_LANGUAGE;
}

export function applyLanguage(language: LanguagePreference): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = language;
}
