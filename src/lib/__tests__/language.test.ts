import { afterEach, describe, expect, it } from "vitest";
import { applyLanguage, DEFAULT_LANGUAGE, getStoredLanguage } from "@/lib/language";

describe("language helpers", () => {
  afterEach(() => {
    applyLanguage(DEFAULT_LANGUAGE);
  });

  it("returns the default language when no valid preference is stored", () => {
    expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it("applies the requested language to the document element", () => {
    applyLanguage("en");
    expect(document.documentElement.lang).toBe("en");

    applyLanguage("id");
    expect(document.documentElement.lang).toBe("id");
  });
});
