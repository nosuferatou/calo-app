import { describe, expect, it } from "vitest";
import {
  groupEntriesIntoSessions,
  mealLabelKey,
  suggestMealCategory,
} from "@/lib/meals";
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
    loggedAt: "2026-10-31T04:00:00.000Z",
    calories: 130,
    protein: 2.7,
    carbohydrates: 28,
    fat: 0.3,
    ...overrides,
  };
}

describe("meal helpers", () => {
  it("suggests a meal category from the time of day", () => {
    expect(suggestMealCategory(new Date(2026, 9, 31, 7, 0))).toBe("breakfast");
    expect(suggestMealCategory(new Date(2026, 9, 31, 12, 0))).toBe("lunch");
    expect(suggestMealCategory(new Date(2026, 9, 31, 18, 0))).toBe("dinner");
    expect(suggestMealCategory(new Date(2026, 9, 31, 22, 0))).toBe("snack");
  });

  it("groups entries into sessions sorted by time", () => {
    const sessions = groupEntriesIntoSessions([
      makeEntry({
        id: "b",
        sessionId: "session-2",
        loggedAt: "2026-10-31T12:00:00.000Z",
      }),
      makeEntry({
        id: "a",
        sessionId: "session-1",
        loggedAt: "2026-10-31T07:00:00.000Z",
      }),
      makeEntry({
        id: "c",
        sessionId: "session-1",
        loggedAt: "2026-10-31T07:05:00.000Z",
      }),
    ]);

    expect(sessions.map((session) => session.sessionId)).toEqual([
      "session-1",
      "session-2",
    ]);
    expect(sessions[0].entries.map((entry) => entry.id)).toEqual(["a", "c"]);
  });

  it("falls back to a time-based key when a session id is missing", () => {
    const sessions = groupEntriesIntoSessions([
      makeEntry({ id: "a" }),
      makeEntry({ id: "b", loggedAt: "2026-10-31T04:00:30.000Z" }),
    ]);

    expect(sessions).toHaveLength(1);
  });

  it("maps snack to the plural label key", () => {
    expect(mealLabelKey("snack")).toBe("common.snacks");
    expect(mealLabelKey("lunch")).toBe("common.lunch");
  });
});
