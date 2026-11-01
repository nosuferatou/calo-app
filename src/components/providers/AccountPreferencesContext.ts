import { createContext } from "react";
import type {
  LanguagePreference,
  ThemePreference,
} from "@/types";

export type AccountPreferencesContextValue =
  | { mode: "demo" }
  | {
      mode: "cloud";
      theme: ThemePreference;
      language: LanguagePreference;
      saveTheme: (theme: ThemePreference) => Promise<void>;
      saveLanguage: (language: LanguagePreference) => Promise<void>;
    };

export const AccountPreferencesContext =
  createContext<AccountPreferencesContextValue | null>(null);
