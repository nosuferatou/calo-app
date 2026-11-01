import { z } from "zod";
import type {
  CustomFood,
  FavoriteFood,
  Food,
  FoodEntry,
  MealCartDraft,
  MealCategory,
  MealSession,
  NutritionTargets,
  SavedMeal,
  SavedMealItem,
  UserProfile,
  WeightRecord,
} from "@/types";
import type { Json, Tables } from "@/types/database";
import { parseRecord } from "@/lib/repositories/errors";

type ProfileRow = Tables<"profiles">;
type TargetRow = Tables<"nutrition_targets">;
type MealSessionRow = Tables<"meal_sessions">;
type FoodEntryRow = Tables<"food_entries">;
type CustomFoodRow = Tables<"custom_foods">;
type FavoriteRow = Tables<"favorite_foods">;
type SavedMealRow = Tables<"saved_meals">;
type SavedMealItemRow = Tables<"saved_meal_items">;
type WeightRow = Tables<"weight_records">;
type MealCartDraftRow = Tables<"meal_cart_drafts">;
type AccountPreferencesRow = Tables<"account_preferences">;

const mealCategorySchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const timestampSchema = z.iso.datetime({ offset: true });
const foodCategorySchema = z.enum([
  "rice-grains",
  "meat",
  "seafood",
  "vegetables",
  "fruits",
  "dairy",
  "beverages",
  "snacks",
  "others",
]);
const foodSchema = z.object({
  id: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  name: z.string().min(1),
  category: foodCategorySchema,
  defaultGrams: z.number().finite().positive(),
  calories: z.number().finite().nonnegative(),
  protein: z.number().finite().nonnegative(),
  carbohydrates: z.number().finite().nonnegative(),
  fat: z.number().finite().nonnegative(),
  fiber: z.number().finite().nonnegative(),
  sugar: z.number().finite().nonnegative(),
  saturatedFat: z.number().finite().nonnegative(),
  sodium: z.number().finite().nonnegative(),
  synonyms: z.array(z.string()),
  source: z.string(),
  isDemo: z.boolean().optional(),
  isCustom: z.literal(true).optional(),
});
const draftItemsSchema = z.array(
  z.object({
    food: foodSchema,
    grams: z.number().finite().nonnegative(),
  }),
);
const customMacroSplitSchema = z.object({
  proteinPercent: z.number().finite(),
  fatPercent: z.number().finite(),
  carbPercent: z.number().finite(),
});

function optional<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function mapFood(value: unknown): Food {
  return parseRecord(foodSchema, value);
}

export function mapProfile(row: ProfileRow): UserProfile {
  const splitValues = [
    row.custom_protein_percent,
    row.custom_fat_percent,
    row.custom_carb_percent,
  ];
  const hasSplitValues = splitValues.some((value) => value !== null);
  const customMacroSplit = hasSplitValues
    ? customMacroSplitSchema.safeParse({
        proteinPercent: row.custom_protein_percent,
        fatPercent: row.custom_fat_percent,
        carbPercent: row.custom_carb_percent,
      })
    : undefined;

  if (customMacroSplit && !customMacroSplit.success) {
    return parseRecord(z.never(), row);
  }

  return parseRecord(z.object({
    id: z.string().uuid(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    displayName: z.string().optional(),
    ageYears: z.number().int().optional(),
    biologicalSex: z.enum(["female", "male"]).optional(),
    heightCm: z.number().finite().optional(),
    currentWeightKg: z.number().finite().optional(),
    activityLevel: z.enum([
      "sedentary",
      "light",
      "moderate",
      "very-active",
      "extra-active",
    ]).optional(),
    workoutDaysPerWeek: z.number().int().optional(),
    fitnessGoal: z.enum(["weight-loss", "maintenance", "muscle-gain"]).optional(),
    targetWeightKg: z.number().finite().optional(),
    desiredRateKgPerWeek: z.number().finite().optional(),
    macroPreference: z.enum(["balanced", "higher-protein", "custom"]).optional(),
    customMacroSplit: customMacroSplitSchema.optional(),
  }), {
    id: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    displayName: optional(row.display_name),
    ageYears: optional(row.age_years),
    biologicalSex: optional(row.biological_sex),
    heightCm: optional(row.height_cm),
    currentWeightKg: optional(row.current_weight_kg),
    activityLevel: optional(row.activity_level),
    workoutDaysPerWeek: optional(row.workout_days_per_week),
    fitnessGoal: optional(row.fitness_goal),
    targetWeightKg: optional(row.target_weight_kg),
    desiredRateKgPerWeek: optional(row.desired_rate_kg_per_week),
    macroPreference: optional(row.macro_preference),
    customMacroSplit:
      customMacroSplit && customMacroSplit.success
        ? customMacroSplit.data
        : undefined,
  });
}

export function mapNutritionTargets(row: TargetRow): NutritionTargets {
  return parseRecord(z.object({
    id: z.string().uuid(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    calories: z.number().finite().nonnegative(),
    protein: z.number().finite().nonnegative(),
    carbohydrates: z.number().finite().nonnegative(),
    fat: z.number().finite().nonnegative(),
    source: z.enum(["manual", "calculated"]).optional(),
    bmr: z.number().finite().optional(),
    tdee: z.number().finite().optional(),
    activityPal: z.number().finite().positive().optional(),
    formulaVersion: z.literal(1).optional(),
    calculatedAt: timestampSchema.optional(),
    requestedDeficitKcal: z.number().finite().nonnegative().optional(),
    actualDeficitKcal: z.number().finite().nonnegative().optional(),
    calorieGuardrailKcal: z.number().finite().positive().optional(),
  }), {
    id: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    calories: row.calories,
    protein: row.protein,
    carbohydrates: row.carbohydrates,
    fat: row.fat,
    source: optional(row.source),
    bmr: optional(row.bmr),
    tdee: optional(row.tdee),
    activityPal: optional(row.activity_pal),
    formulaVersion: optional(row.formula_version),
    calculatedAt: optional(row.calculated_at),
    requestedDeficitKcal: optional(row.requested_deficit_kcal),
    actualDeficitKcal: optional(row.actual_deficit_kcal),
    calorieGuardrailKcal: optional(row.calorie_guardrail_kcal),
  });
}

export function mapMealSession(row: MealSessionRow): MealSession {
  return parseRecord(z.object({
    id: z.string().min(1),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    date: z.iso.date(),
    mealCategory: mealCategorySchema,
  }), {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    date: row.log_date,
    mealCategory: row.meal_category,
  });
}

export function mapFoodEntry(row: FoodEntryRow): FoodEntry {
  return parseRecord(z.object({
    id: z.string().min(1),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    foodId: z.string().min(1),
    name: z.string().min(1),
    grams: z.number().finite().nonnegative(),
    logDate: z.iso.date(),
    servingLabel: z.string().optional(),
    mealCategory: mealCategorySchema,
    loggedAt: timestampSchema,
    calories: z.number().finite().nonnegative(),
    protein: z.number().finite().nonnegative(),
    carbohydrates: z.number().finite().nonnegative(),
    fat: z.number().finite().nonnegative(),
    fiber: z.number().finite().nonnegative().optional(),
    sugar: z.number().finite().nonnegative().optional(),
    saturatedFat: z.number().finite().nonnegative().optional(),
    sodium: z.number().finite().nonnegative().optional(),
    sessionId: z.string().optional(),
  }), {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    foodId: row.food_id,
    name: row.name,
    grams: row.grams,
    logDate: row.log_date,
    servingLabel: optional(row.serving_label),
    mealCategory: row.meal_category,
    loggedAt: row.logged_at,
    calories: row.calories,
    protein: row.protein,
    carbohydrates: row.carbohydrates,
    fat: row.fat,
    fiber: optional(row.fiber),
    sugar: optional(row.sugar),
    saturatedFat: optional(row.saturated_fat),
    sodium: optional(row.sodium),
    sessionId: optional(row.session_id),
  });
}

export function mapCustomFood(row: CustomFoodRow): CustomFood {
  const food = mapFood({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    category: row.category,
    defaultGrams: row.default_grams,
    calories: row.calories,
    protein: row.protein,
    carbohydrates: row.carbohydrates,
    fat: row.fat,
    fiber: row.fiber,
    sugar: row.sugar,
    saturatedFat: row.saturated_fat,
    sodium: row.sodium,
    synonyms: row.synonyms,
    source: row.source,
  });
  return { ...food, isCustom: true };
}

export function mapFavorite(row: FavoriteRow): FavoriteFood {
  const target =
    row.custom_food_id !== null
      ? { foodId: row.custom_food_id, source: "custom" as const }
      : row.catalog_food_id !== null
        ? { foodId: row.catalog_food_id, source: "catalog" as const }
        : undefined;

  if (!target) return parseRecord(z.never(), row);

  return parseRecord(z.object({
    id: z.string().min(1),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    foodId: z.string().min(1),
    source: z.enum(["catalog", "custom"]),
  }), {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...target,
  });
}

export function mapSavedMealItem(row: SavedMealItemRow): SavedMealItem {
  return parseRecord(z.object({
    food: foodSchema,
    grams: z.number().finite().nonnegative(),
  }), {
    food: mapFood(row.food_snapshot),
    grams: row.grams,
  });
}

export function mapSavedMeal(
  row: SavedMealRow,
  itemRows: SavedMealItemRow[],
): SavedMeal {
  const items = itemRows.map(mapSavedMealItem);
  return parseRecord(z.object({
    id: z.string().min(1),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    name: z.string().min(1),
    items: z.array(z.object({ food: foodSchema, grams: z.number().finite().nonnegative() })),
  }), {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    items,
  });
}

export function mapWeightRecord(row: WeightRow): WeightRecord {
  return parseRecord(z.object({
    id: z.string().min(1),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    weight: z.number().finite().positive(),
    loggedAt: timestampSchema,
  }), {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    weight: row.weight_kg,
    loggedAt: row.logged_at,
  });
}

export function mapMealCartDraft(row: MealCartDraftRow): MealCartDraft {
  const items = parseRecord(draftItemsSchema, row.items);
  return parseRecord(z.object({
    id: z.string().min(1),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    items: draftItemsSchema,
    mealCategory: mealCategorySchema,
    date: z.iso.date(),
  }), {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    mealCategory: row.meal_category,
    date: row.log_date,
  });
}

export function mapAccountPreferences(row: AccountPreferencesRow) {
  return parseRecord(z.object({
    theme: z.enum(["light", "dark", "system"]),
    language: z.enum(["en", "id"]),
    catalogViewMode: z.enum(["grid", "list"]).optional(),
  }), {
    theme: row.theme,
    language: row.language,
    catalogViewMode: optional(row.catalog_view_mode),
  });
}

export function mapSearchHistory(row: Tables<"search_history">) {
  return parseRecord(z.object({ queries: z.array(z.string()) }), {
    queries: row.queries,
  });
}

export function foodToSnapshot(food: Food): NonNullable<Json> {
  const snapshot: { [key: string]: Json | undefined } = {
    id: food.id,
    createdAt: food.createdAt,
    updatedAt: food.updatedAt,
    name: food.name,
    category: food.category,
    defaultGrams: food.defaultGrams,
    calories: food.calories,
    protein: food.protein,
    carbohydrates: food.carbohydrates,
    fat: food.fat,
    fiber: food.fiber,
    sugar: food.sugar,
    saturatedFat: food.saturatedFat,
    sodium: food.sodium,
    synonyms: food.synonyms,
    source: food.source,
    ...(food.isDemo === undefined ? {} : { isDemo: food.isDemo }),
    ...("isCustom" in food && food.isCustom === true
      ? { isCustom: true }
      : {}),
  };
  return snapshot;
}

export function toMealCategory(value: string): MealCategory {
  return parseRecord(mealCategorySchema, value);
}
