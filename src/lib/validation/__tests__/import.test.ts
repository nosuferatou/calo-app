import { describe, expect, it } from "vitest";
import {
  mockFavorites,
  mockNutritionTargets,
  mockSavedMeals,
  mockUserProfile,
  mockWeightRecords,
} from "@/data/mock";
import {
  parseBackup,
  summarizeBackup,
  type CaloBackup,
} from "@/lib/validation/import";
import type { FoodEntry } from "@/types";

const entry: FoodEntry = {
  id: "entry-1",
  createdAt: "2026-10-31T07:00:00.000Z",
  updatedAt: "2026-10-31T07:00:00.000Z",
  foodId: "food-1",
  name: "Rice",
  grams: 100,
  mealCategory: "lunch",
  loggedAt: "2026-10-31T07:00:00.000Z",
  calories: 130,
  protein: 2.7,
  carbohydrates: 28,
  fat: 0.3,
};

function validBackup() {
  return JSON.stringify({
    app: "CALO",
    version: 1,
    exportedAt: "2026-10-31T08:00:00.000Z",
    profile: mockUserProfile,
    targets: mockNutritionTargets,
    entries: [entry],
    weightRecords: mockWeightRecords.slice(0, 1),
    favorites: mockFavorites.slice(0, 1),
    savedMeals: mockSavedMeals.slice(0, 1),
  });
}

describe("backup import", () => {
  it("accepts a valid backup and summarizes it", () => {
    const result = parseBackup(validBackup());

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.summary).toEqual({
        entries: 1,
        weightRecords: 1,
        favorites: 1,
        savedMeals: 1,
      });
      expect(result.backup.entries[0].name).toBe("Rice");
    }
  });

  it("rejects malformed JSON", () => {
    expect(parseBackup("{not json").ok).toBe(false);
  });

  it("rejects JSON that is not a CALO backup", () => {
    expect(parseBackup(JSON.stringify({ app: "OTHER" })).ok).toBe(false);
  });

  it("rejects backups with invalid entries", () => {
    const backup = JSON.parse(validBackup());
    backup.entries[0].mealCategory = "brunch";

    expect(parseBackup(JSON.stringify(backup)).ok).toBe(false);
  });

  it("summarizes counts without touching the data", () => {
    expect(
      summarizeBackup({
        app: "CALO",
        version: 1,
        exportedAt: "2026-10-31T08:00:00.000Z",
        profile: mockUserProfile,
        targets: mockNutritionTargets,
        entries: [entry, { ...entry, id: "entry-2" }],
        weightRecords: mockWeightRecords,
        favorites: mockFavorites,
        savedMeals: mockSavedMeals,
      } as CaloBackup),
    ).toEqual({
      entries: 2,
      weightRecords: mockWeightRecords.length,
      favorites: mockFavorites.length,
      savedMeals: mockSavedMeals.length,
    });
  });
});
