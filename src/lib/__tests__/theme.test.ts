import { afterEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  getThemeInitScript,
  isDarkTheme,
} from "@/lib/theme";
import { THEME_HINT_KEY } from "@/lib/storage/keys";

function writeSettings(theme: string) {
  localStorage.setItem(
    "calo:settings",
    JSON.stringify({ version: 1, data: { theme, language: "en" } }),
  );
}

describe("theme helpers", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
  });

  it("treats the light theme as not dark", () => {
    expect(isDarkTheme("light", false)).toBe(false);
  });

  it("treats the dark theme as dark", () => {
    expect(isDarkTheme("dark", false)).toBe(true);
  });

  it("resolves the system theme from the prefers-color-scheme flag", () => {
    expect(isDarkTheme("system", true)).toBe(true);
    expect(isDarkTheme("system", false)).toBe(false);
  });

  it("returns a blocking init script that reads the stored theme", () => {
    const script = getThemeInitScript();

    expect(script).toContain("calo:settings");
    expect(script).toContain("parsed.data.theme");
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain('root.classList.toggle("dark"');
  });

  it.each(["light", "dark"] as const)(
    "reads the %s preference from the versioned settings envelope",
    (theme) => {
      localStorage.setItem(
        "calo:settings",
        JSON.stringify({
          version: 1,
          data: { theme, language: "en" },
        }),
      );
      document.documentElement.classList.toggle("dark", theme === "light");

      window.eval(getThemeInitScript());

      expect(document.documentElement.classList.contains("dark")).toBe(
        theme === "dark",
      );
      expect(document.documentElement.style.colorScheme).toBe(theme);
    },
  );

  it("applies the dark class and color scheme for the dark theme", () => {
    expect(applyTheme("dark")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("removes the dark class and switches to light for the light theme", () => {
    document.documentElement.classList.add("dark");

    expect(applyTheme("light")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("paints the last rendered theme before the stored settings", () => {
    // A cloud account keeps its preference in account_preferences, so the
    // settings envelope can hold a stale value from an earlier demo session.
    writeSettings("dark");
    localStorage.setItem(THEME_HINT_KEY, "light");

    window.eval(getThemeInitScript());

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("ignores an unknown hint value and keeps the stored settings", () => {
    writeSettings("dark");
    localStorage.setItem(THEME_HINT_KEY, "sepia");

    window.eval(getThemeInitScript());

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("refreshes the hint every time a theme is applied", () => {
    expect(localStorage.getItem(THEME_HINT_KEY)).toBeNull();

    applyTheme("dark");
    expect(localStorage.getItem(THEME_HINT_KEY)).toBe("dark");

    applyTheme("light");
    expect(localStorage.getItem(THEME_HINT_KEY)).toBe("light");
  });
});
