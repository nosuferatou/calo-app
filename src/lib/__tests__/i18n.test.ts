import { describe, expect, it } from "vitest";
import { getLocale, translate } from "@/lib/i18n";

describe("translations", () => {
  it("interpolates values", () => {
    expect(
      translate("en", "dashboard.remainingMessage", { count: "1,000" }),
    ).toContain("1,000 kcal");
    expect(
      translate("id", "onboarding.stepOf", { current: 2, total: 5 }),
    ).toBe("Langkah 2 dari 5");
  });

  it("keeps missing placeholders untouched", () => {
    expect(translate("en", "onboarding.stepOf", { current: 1 })).toContain(
      "{total}",
    );
  });

  it("returns the same key for both languages when no text is needed", () => {
    expect(translate("en", "app.name")).toBe("CALO");
    expect(translate("id", "app.name")).toBe("CALO");
  });

  it("maps languages to locales", () => {
    expect(getLocale("en")).toBe("en-US");
    expect(getLocale("id")).toBe("id-ID");
  });
});
