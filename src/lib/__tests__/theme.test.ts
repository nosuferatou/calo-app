import { afterEach, describe, expect, it } from "vitest";
import { applyTheme, getThemeInitScript, isDarkTheme } from "@/lib/theme";

describe("theme helpers", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
    localStorage.removeItem("calo:settings");
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
});
