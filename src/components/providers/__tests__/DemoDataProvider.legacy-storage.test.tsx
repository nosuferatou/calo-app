import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDiaryEntries, mockUserProfile } from "@/data/mock";
import {
  DemoDataProvider,
  useDemoData,
} from "@/components/providers/DemoDataProvider";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { FoodEntry, NutritionTargets, UserProfile } from "@/types";

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function LegacyDataProbe() {
  const { hydrated, profile, targets, entries } = useDemoData();

  if (!hydrated) {
    return null;
  }

  return (
    <output data-testid="legacy-data">
      {JSON.stringify({ profile, targets, entries })}
    </output>
  );
}

describe("DemoDataProvider legacy nutrition storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads v1 profile, manual targets, and diary snapshots without rewriting or recalculating them", async () => {
    const legacyProfile = { ...mockUserProfile };
    const legacyTargets = {
      id: "target-legacy",
      createdAt: "2025-01-01T10:00:00.000Z",
      updatedAt: "2025-01-01T10:00:00.000Z",
      calories: 1875,
      protein: 106,
      carbohydrates: 231,
      fat: 58,
    };
    const legacyEntries = [mockDiaryEntries[0]];
    const rawRecords = {
      [STORAGE_KEYS.profile]: JSON.stringify({
        version: 1,
        data: legacyProfile,
      }),
      [STORAGE_KEYS.targets]: JSON.stringify({
        version: 1,
        data: legacyTargets,
      }),
      [STORAGE_KEYS.foodDiary]: JSON.stringify({
        version: 1,
        data: { entries: legacyEntries },
      }),
    };

    for (const [key, value] of Object.entries(rawRecords)) {
      localStorage.setItem(key, value);
    }

    render(
      <DemoDataProvider>
        <LegacyDataProbe />
      </DemoDataProvider>,
    );

    const result = await screen.findByTestId("legacy-data");
    const loaded = JSON.parse(result.textContent ?? "") as {
      profile: UserProfile;
      targets: NutritionTargets;
      entries: FoodEntry[];
    };

    expect(loaded.profile).toEqual(legacyProfile);
    expect(loaded.targets).toMatchObject(legacyTargets);
    expect(loaded.targets.source).toBeUndefined();
    expect(loaded.targets.formulaVersion).toBeUndefined();
    expect(loaded.targets.calculatedAt).toBeUndefined();
    expect(loaded.entries).toEqual(legacyEntries);

    for (const [key, value] of Object.entries(rawRecords)) {
      expect(localStorage.getItem(key)).toBe(value);
    }
  });
});
