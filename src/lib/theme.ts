import { THEME_HINT_KEY } from "@/lib/storage/keys";
import type { ThemePreference } from "@/types/domain";

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifyThemeChange(): void {
  listeners.forEach((listener) => listener());
}

export function prefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(DARK_MEDIA_QUERY).matches;
}

export function isDarkTheme(
  theme: ThemePreference,
  prefersDarkValue: boolean = prefersDark(),
): boolean {
  if (theme === "light") {
    return false;
  }

  if (theme === "dark") {
    return true;
  }

  return prefersDarkValue;
}

export function getThemeInitScript(): string {
  return `(function () {
  var theme = "system";
  try {
    var known = ["light", "dark", "system"];
    var raw = localStorage.getItem("calo:settings");
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.data && known.indexOf(parsed.data.theme) !== -1) {
        theme = parsed.data.theme;
      }
    }
    var hint = localStorage.getItem(${JSON.stringify(THEME_HINT_KEY)});
    if (known.indexOf(hint) !== -1) {
      theme = hint;
    }
  } catch (error) {
    theme = "system";
  }
  try {
    var dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (error) {}
})();`;
}

function writeThemeHint(theme: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_HINT_KEY, theme);
  } catch {
    // The hint only removes the first-paint flash; losing it is not an error.
  }
}

export function applyTheme(
  theme: ThemePreference,
  prefersDarkValue: boolean = prefersDark(),
): boolean {
  const dark = isDarkTheme(theme, prefersDarkValue);

  if (typeof document === "undefined") {
    return dark;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  writeThemeHint(theme);

  return dark;
}
