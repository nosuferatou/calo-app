import { describe, expect, it } from "vitest";
import { demoFoods } from "@/data/foods";
import {
  averageDailyNutrition,
  getCalorieStatus,
  groupEntriesByDate,
  scaleFoodEntry,
  scaleFoodNutrition,
  sumFoodEntries,
} from "@/lib/nutrition";
import type { FoodEntry } from "@/types";

function makeEntry(overrides: Partial<FoodEntry>): FoodEntry {
  return {
    id: "entry-1",
    createdAt: "2026-10-31T00:00:00.000Z",
    updatedAt: "2026-10-31T00:00:00.000Z",
    foodId: "food-1",
    name: "Rice",
    grams: 100,
    mealCategory: "lunch",
    loggedAt: "2026-10-31T00:00:00.000Z",
    calories: 130,
    protein: 2.7,
    carbohydrates: 28,
    fat: 0.3,
    ...overrides,
  };
}

describe("nutrition totals", () => {
  it("returns zero totals for an empty diary", () => {
    expect(sumFoodEntries([])).toEqual({
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
    });
  });

  it("sums calories and macros across entries", () => {
    const totals = sumFoodEntries([
      makeEntry({ calories: 100, protein: 10, carbohydrates: 12, fat: 2 }),
      makeEntry({
        id: "entry-2",
        name: "Chicken",
        calories: 200,
        protein: 30,
        carbohydrates: 0,
        fat: 5,
      }),
    ]);

    expect(totals.calories).toBe(300);
    expect(totals.protein).toBe(40);
    expect(totals.carbohydrates).toBe(12);
    expect(totals.fat).toBe(7);
  });

  it("preserves decimal precision when summing macros across entries", () => {
    const totals = sumFoodEntries([
      makeEntry({ calories: 100.5, protein: 10.2, carbohydrates: 12.4, fat: 2.1 }),
      makeEntry({
        id: "entry-2",
        calories: 200.25,
        protein: 30.3,
        carbohydrates: 0.5,
        fat: 5.2,
      }),
    ]);

    expect(totals.calories).toBeCloseTo(300.75);
    expect(totals.protein).toBeCloseTo(40.5);
    expect(totals.carbohydrates).toBeCloseTo(12.9);
    expect(totals.fat).toBeCloseTo(7.3);
  });
});

describe("nutrition scaling", () => {
  const rice = demoFoods.find((food) => food.id === "food-white-rice")!;

  it("scales per-100g values by the selected quantity", () => {
    const nutrition = scaleFoodNutrition(rice, 250);

    expect(nutrition.calories).toBeCloseTo(325);
    expect(nutrition.protein).toBeCloseTo(6.75);
    expect(nutrition.carbohydrates).toBeCloseTo(70.5);
    expect(nutrition.fat).toBeCloseTo(0.75);
  });

  it("treats invalid quantities as zero", () => {
    expect(scaleFoodNutrition(rice, Number.NaN).calories).toBe(0);
    expect(scaleFoodNutrition(rice, -50).calories).toBe(0);
  });

  it("recalculates an existing entry proportionally", () => {
    const entry = makeEntry({
      grams: 100,
      calories: 130,
      protein: 2.7,
      carbohydrates: 28,
      fat: 0.3,
      fiber: 0.4,
    });
    const scaled = scaleFoodEntry(entry, 250);

    expect(scaled.grams).toBe(250);
    expect(scaled.calories).toBeCloseTo(325);
    expect(scaled.protein).toBeCloseTo(6.75);
    expect(scaled.carbohydrates).toBeCloseTo(70);
    expect(scaled.fat).toBeCloseTo(0.75);
    expect(scaled.fiber).toBeCloseTo(1);
  });
});

describe("diary grouping and averages", () => {
  const firstDay = new Date(2026, 9, 29, 12, 0, 0).toISOString();
  const secondDay = new Date(2026, 9, 30, 12, 0, 0).toISOString();

  it("groups entries by their local date", () => {
    const grouped = groupEntriesByDate([
      makeEntry({ id: "a", loggedAt: firstDay, calories: 100 }),
      makeEntry({ id: "b", loggedAt: firstDay, calories: 50 }),
      makeEntry({ id: "c", loggedAt: secondDay, calories: 200 }),
    ]);

    expect(grouped.get("2026-10-29")).toHaveLength(2);
    expect(grouped.get("2026-10-30")).toHaveLength(1);
  });

  it("excludes unlogged days from the average", () => {
    const result = averageDailyNutrition(
      [
        makeEntry({ id: "a", loggedAt: firstDay, calories: 100, protein: 10 }),
        makeEntry({ id: "b", loggedAt: firstDay, calories: 100, protein: 10 }),
        makeEntry({ id: "c", loggedAt: secondDay, calories: 300, protein: 30 }),
      ],
      ["2026-10-28", "2026-10-29", "2026-10-30"],
    );

    expect(result.loggedDays).toBe(2);
    expect(result.periodDays).toBe(3);
    expect(result.totals.calories).toBeCloseTo(250);
    expect(result.totals.protein).toBeCloseTo(25);
  });

  it("returns zero averages when no day has logs", () => {
    const result = averageDailyNutrition([], ["2026-10-29", "2026-10-30"]);

    expect(result.loggedDays).toBe(0);
    expect(result.totals.calories).toBe(0);
  });

  it("classifies calorie progress without inventing a target", () => {
    expect(getCalorieStatus(0, 2000).key).toBe("not-logged");
    expect(getCalorieStatus(1000, 2000).key).toBe("under");
    expect(getCalorieStatus(1900, 2000).key).toBe("on");
    expect(getCalorieStatus(2400, 2000).key).toBe("over");
    expect(getCalorieStatus(500, 0).key).toBe("not-logged");
  });
});
