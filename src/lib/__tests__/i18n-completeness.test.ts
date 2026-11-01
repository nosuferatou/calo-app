import { describe, expect, it } from "vitest";
import { dictionaries, translate } from "@/lib/i18n";

describe("translation completeness", () => {
  it("has text for every key in both languages", () => {
    for (const language of ["en", "id"] as const) {
      const dictionary = dictionaries[language];
      for (const key of Object.keys(dictionary) as Parameters<
        typeof translate
      >[1][]) {
        expect(translate(language, key)).not.toBe(key);
      }
    }
  });

  it("keeps interpolation placeholders aligned across languages", () => {
    expect(translate("en", "onboarding.stepOf", { current: 1, total: 5 })).toBe(
      "Step 1 of 5",
    );
    expect(translate("id", "onboarding.stepOf", { current: 1, total: 5 })).toBe(
      "Langkah 1 dari 5",
    );
  });

  it("provides translated text for every authentication message", () => {
    const authKeys = Object.keys(dictionaries.en).filter((key) =>
      key.startsWith("auth."),
    );

    expect(authKeys.length).toBeGreaterThan(0);
    for (const key of authKeys as Parameters<typeof translate>[1][]) {
      expect(dictionaries.id[key]).not.toBe(dictionaries.en[key]);
    }
  });
});
