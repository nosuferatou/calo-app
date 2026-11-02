import { toDateKey, type DateKey } from "@/lib/dates";
import type { Food, FoodEntry } from "@/types";

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface FullNutritionTotals extends NutritionTotals {
  fiber: number;
  sugar: number;
  saturatedFat: number;
  sodium: number;
}

export type CalorieStatusKey = "not-logged" | "under" | "on" | "over";
export type CalorieStatusTone = "neutral" | "success" | "info" | "error";

export interface CalorieStatus {
  key: CalorieStatusKey;
  tone: CalorieStatusTone;
}

export function scaleFoodNutrition(food: Food, grams: number): FullNutritionTotals {
  const safeGrams = Number.isFinite(grams) && grams > 0 ? grams : 0;
  const factor = safeGrams / 100;

  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbohydrates: food.carbohydrates * factor,
    fat: food.fat * factor,
    fiber: food.fiber * factor,
    sugar: food.sugar * factor,
    saturatedFat: food.saturatedFat * factor,
    sodium: food.sodium * factor,
  };
}

export function scaleFoodEntry(entry: FoodEntry, grams: number): FoodEntry {
  const safeGrams = Number.isFinite(grams) && grams > 0 ? grams : 0;
  const factor = entry.grams > 0 ? safeGrams / entry.grams : 0;

  return {
    ...entry,
    grams: safeGrams,
    calories: entry.calories * factor,
    protein: entry.protein * factor,
    carbohydrates: entry.carbohydrates * factor,
    fat: entry.fat * factor,
    fiber: entry.fiber === undefined ? undefined : entry.fiber * factor,
    sugar: entry.sugar === undefined ? undefined : entry.sugar * factor,
    saturatedFat:
      entry.saturatedFat === undefined ? undefined : entry.saturatedFat * factor,
    sodium: entry.sodium === undefined ? undefined : entry.sodium * factor,
  };
}

export function sumFoodEntries(entries: FoodEntry[]): NutritionTotals {
  return entries.reduce<NutritionTotals>(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbohydrates: totals.carbohydrates + entry.carbohydrates,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );
}

export function getCalorieStatus(
  consumed: number,
  target: number,
): CalorieStatus {
  if (!Number.isFinite(consumed) || consumed <= 0) {
    return { key: "not-logged", tone: "neutral" };
  }

  if (!Number.isFinite(target) || target <= 0) {
    return { key: "not-logged", tone: "neutral" };
  }

  const ratio = consumed / target;

  if (ratio < 0.85) {
    return { key: "under", tone: "success" };
  }

  if (ratio > 1) {
    return { key: "over", tone: "error" };
  }

  return { key: "on", tone: "info" };
}

export function groupEntriesByDate(
  entries: FoodEntry[],
): Map<DateKey, FoodEntry[]> {
  const groups = new Map<DateKey, FoodEntry[]>();

  entries.forEach((entry) => {
    const date = entry.logDate
      ? new Date(`${entry.logDate}T00:00:00`)
      : new Date(entry.loggedAt);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = toDateKey(date);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  });

  return groups;
}

export interface AverageNutrition {
  totals: NutritionTotals;
  loggedDays: number;
  periodDays: number;
}

/**
 * Averages only over days that actually contain logs. Days without logs are
 * excluded rather than treated as zero-calorie days.
 */
export function averageDailyNutrition(
  entries: FoodEntry[],
  dateKeys: DateKey[],
): AverageNutrition {
  const grouped = groupEntriesByDate(entries);
  const loggedTotals = dateKeys
    .map((key) => grouped.get(key))
    .filter((dayEntries): dayEntries is FoodEntry[] => Boolean(dayEntries?.length))
    .map((dayEntries) => sumFoodEntries(dayEntries));

  if (loggedTotals.length === 0) {
    return {
      totals: { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
      loggedDays: 0,
      periodDays: dateKeys.length,
    };
  }

  const combined = loggedTotals.reduce<NutritionTotals>(
    (totals, day) => ({
      calories: totals.calories + day.calories,
      protein: totals.protein + day.protein,
      carbohydrates: totals.carbohydrates + day.carbohydrates,
      fat: totals.fat + day.fat,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );

  return {
    totals: {
      calories: combined.calories / loggedTotals.length,
      protein: combined.protein / loggedTotals.length,
      carbohydrates: combined.carbohydrates / loggedTotals.length,
      fat: combined.fat / loggedTotals.length,
    },
    loggedDays: loggedTotals.length,
    periodDays: dateKeys.length,
  };
}
