import { describe, expect, it } from "vitest";
import type { Tables } from "@/types/database";
import {
  mapFoodEntry,
  mapProfile,
  mapSavedMeal,
} from "@/lib/repositories/mapping";

const foodEntryRow: Tables<"food_entries"> = {
  user_id: "11111111-1111-4111-8111-111111111111",
  id: "entry-1",
  session_id: null,
  log_date: "2026-11-02",
  meal_category: "lunch",
  food_id: "rice-1",
  name: "Rice",
  grams: 125.5,
  serving_label: null,
  logged_at: "2026-11-02T05:30:00.000Z",
  calories: 164.75,
  protein: 3.2,
  carbohydrates: 36.1,
  fat: 0.4,
  fiber: null,
  sugar: null,
  saturated_fat: null,
  sodium: null,
  created_at: "2026-11-02T05:30:00.000Z",
  updated_at: "2026-11-02T05:30:00.000Z",
};

describe("Supabase row mapping", () => {
  it("accepts PostgreSQL timestamps with explicit timezone offsets", () => {
    const profile: Tables<"profiles"> = {
      user_id: "11111111-1111-4111-8111-111111111111",
      display_name: null,
      age_years: null,
      biological_sex: null,
      height_cm: null,
      current_weight_kg: null,
      activity_level: null,
      workout_days_per_week: null,
      fitness_goal: null,
      target_weight_kg: null,
      desired_rate_kg_per_week: null,
      macro_preference: null,
      custom_protein_percent: null,
      custom_fat_percent: null,
      custom_carb_percent: null,
      created_at: "2026-11-02T05:30:00.000+00:00",
      updated_at: "2026-11-02T05:30:00.000+00:00",
    };

    expect(mapProfile(profile)).toMatchObject({
      id: profile.user_id,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });
  });

  it("preserves historical nutrition values and nullable nutrients without recalculation", () => {
    expect(mapFoodEntry(foodEntryRow)).toMatchObject({
      id: "entry-1",
      logDate: "2026-11-02",
      grams: 125.5,
      calories: 164.75,
      protein: 3.2,
      carbohydrates: 36.1,
      fat: 0.4,
      fiber: undefined,
      sugar: undefined,
      saturatedFat: undefined,
      sodium: undefined,
    });
  });

  it("maps saved meal items from their stored food snapshots", () => {
    const savedMeal: Tables<"saved_meals"> = {
      user_id: "11111111-1111-4111-8111-111111111111",
      id: "meal-1",
      name: "Lunch",
      created_at: "2026-11-02T05:30:00.000Z",
      updated_at: "2026-11-02T05:30:00.000Z",
    };
    const item: Tables<"saved_meal_items"> = {
      user_id: savedMeal.user_id,
      saved_meal_id: savedMeal.id,
      position: 0,
      grams: 125.5,
      food_snapshot: {
        id: "rice-1",
        createdAt: "2026-11-02T05:30:00.000Z",
        updatedAt: "2026-11-02T05:30:00.000Z",
        name: "Rice",
        category: "rice-grains",
        defaultGrams: 100,
        calories: 130,
        protein: 2.7,
        carbohydrates: 28,
        fat: 0.3,
        fiber: 0.4,
        sugar: 0.1,
        saturatedFat: 0.1,
        sodium: 1,
        synonyms: [],
        source: "Local demo catalog",
      },
      created_at: "2026-11-02T05:30:00.000Z",
      updated_at: "2026-11-02T05:30:00.000Z",
    };

    expect(mapSavedMeal(savedMeal, [item]).items[0]).toMatchObject({
      grams: 125.5,
      food: { id: "rice-1", calories: 130, carbohydrates: 28 },
    });
  });
});
