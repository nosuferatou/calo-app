import type { FoodEntry, MealCategory } from "@/types";

export const MEAL_ORDER: MealCategory[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export function suggestMealCategory(date: Date = new Date()): MealCategory {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) {
    return "breakfast";
  }

  if (hour >= 11 && hour < 15) {
    return "lunch";
  }

  if (hour >= 17 && hour < 21) {
    return "dinner";
  }

  return "snack";
}

export interface MealSessionGroup {
  sessionId: string;
  loggedAt: string;
  entries: FoodEntry[];
}

function sessionKey(entry: FoodEntry): string {
  if (entry.sessionId) {
    return entry.sessionId;
  }

  const date = new Date(entry.loggedAt);

  if (Number.isNaN(date.getTime())) {
    return entry.id;
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
}

export function groupEntriesIntoSessions(
  entries: FoodEntry[],
): MealSessionGroup[] {
  const groups = new Map<string, FoodEntry[]>();

  entries.forEach((entry) => {
    const key = sessionKey(entry);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  });

  return [...groups.entries()]
    .map(([sessionId, sessionEntries]) => {
      const sorted = [...sessionEntries].sort((a, b) =>
        a.loggedAt.localeCompare(b.loggedAt),
      );

      return {
        sessionId,
        loggedAt: sorted[0]?.loggedAt ?? "",
        entries: sorted,
      };
    })
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}

export function mealLabelKey(
  category: MealCategory,
): `common.${MealCategory}` | "common.snacks" {
  return category === "snack" ? "common.snacks" : `common.${category}`;
}
