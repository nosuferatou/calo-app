import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nowIso } from "@/lib/datetime";
import type {
  CustomFood,
  FavoriteFood,
  Food,
  FoodEntry,
  LanguagePreference,
  MealCartDraft,
  MealCategory,
  MealSession,
  NutritionTargets,
  SavedMeal,
  ThemePreference,
  UserProfile,
  WeightRecord,
} from "@/types";
import type { Database, Json, TablesInsert, TablesUpdate } from "@/types/database";
import {
  invalidInput,
  RepositoryError,
  requireUserId,
  throwDatabaseError,
  validateInput,
} from "@/lib/repositories/errors";
import {
  foodToSnapshot,
  mapAccountPreferences,
  mapCustomFood,
  mapFavorite,
  mapFoodEntry,
  mapMealCartDraft,
  mapMealSession,
  mapNutritionTargets,
  mapProfile,
  mapSavedMeal,
  mapSavedMealItem,
  mapSearchHistory,
  mapWeightRecord,
} from "@/lib/repositories/mapping";

const idSchema = z.string().min(1);
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
const numericNutrition = z.number().finite().nonnegative();

const profilePatchSchema = z.object({
  displayName: z.string().optional(),
  ageYears: z.number().int().optional(),
  biologicalSex: z.enum(["female", "male"]).optional(),
  heightCm: z.number().finite().positive().optional(),
  currentWeightKg: z.number().finite().positive().optional(),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "very-active",
    "extra-active",
  ]).optional(),
  workoutDaysPerWeek: z.number().int().min(0).max(7).optional(),
  fitnessGoal: z.enum(["weight-loss", "maintenance", "muscle-gain"]).optional(),
  targetWeightKg: z.number().finite().positive().optional(),
  desiredRateKgPerWeek: z.number().finite().nonnegative().optional(),
  macroPreference: z.enum(["balanced", "higher-protein", "custom"]).optional(),
  customMacroSplit: z.object({
    proteinPercent: z.number().finite(),
    fatPercent: z.number().finite(),
    carbPercent: z.number().finite(),
  }).optional(),
}).strict();

const targetInputSchema = z.object({
  calories: numericNutrition,
  protein: numericNutrition,
  carbohydrates: numericNutrition,
  fat: numericNutrition,
  source: z.enum(["manual", "calculated"]).optional(),
  bmr: z.number().finite().optional(),
  tdee: z.number().finite().optional(),
  activityPal: z.number().finite().positive().optional(),
  formulaVersion: z.literal(1).optional(),
  calculatedAt: timestampSchema.optional(),
  requestedDeficitKcal: numericNutrition.optional(),
  actualDeficitKcal: numericNutrition.optional(),
  calorieGuardrailKcal: z.number().finite().positive().optional(),
}).strict();

const foodEntryInputSchema = z.object({
  id: idSchema,
  foodId: idSchema,
  name: z.string().min(1),
  grams: numericNutrition,
  logDate: z.iso.date(),
  servingLabel: z.string().optional(),
  mealCategory: mealCategorySchema,
  loggedAt: timestampSchema,
  calories: numericNutrition,
  protein: numericNutrition,
  carbohydrates: numericNutrition,
  fat: numericNutrition,
  fiber: numericNutrition.optional(),
  sugar: numericNutrition.optional(),
  saturatedFat: numericNutrition.optional(),
  sodium: numericNutrition.optional(),
  sessionId: z.string().optional(),
}).strict();
const foodEntryPatchSchema = foodEntryInputSchema.omit({ id: true }).partial();

const customFoodInputSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  category: foodCategorySchema,
  defaultGrams: z.number().finite().positive(),
  calories: numericNutrition,
  protein: numericNutrition,
  carbohydrates: numericNutrition,
  fat: numericNutrition,
  fiber: numericNutrition,
  sugar: numericNutrition,
  saturatedFat: numericNutrition,
  sodium: numericNutrition,
  synonyms: z.array(z.string()),
  source: z.string().min(1),
}).strict();
const customFoodPatchSchema = customFoodInputSchema.omit({ id: true }).partial();

const weightInputSchema = z.object({
  id: idSchema,
  weight: z.number().finite().positive(),
  loggedAt: timestampSchema,
}).strict();

const foodSnapshotSchema = z.object({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  name: z.string().min(1),
  category: foodCategorySchema,
  defaultGrams: z.number().finite().positive(),
  calories: numericNutrition,
  protein: numericNutrition,
  carbohydrates: numericNutrition,
  fat: numericNutrition,
  fiber: numericNutrition,
  sugar: numericNutrition,
  saturatedFat: numericNutrition,
  sodium: numericNutrition,
  synonyms: z.array(z.string()),
  source: z.string(),
  isDemo: z.boolean().optional(),
}).passthrough();

const draftInputSchema = z.object({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  date: z.iso.date(),
  mealCategory: mealCategorySchema,
  items: z.array(z.object({
    food: foodSnapshotSchema,
    grams: numericNutrition,
  })),
}).strict();

function requireRow<T>(data: T | null, error: { code: string } | null): T {
  if (error) throwDatabaseError(error);
  if (data === null) {
    throw new RepositoryError("database", "The requested record was not returned.");
  }
  return data;
}

function requireRows<T>(data: T[] | null, error: { code: string } | null): T[] {
  if (error) throwDatabaseError(error);
  return data ?? [];
}

function profilePatchToRow(
  patch: Partial<UserProfile>,
): TablesUpdate<"profiles"> {
  const parsed = validateInput(profilePatchSchema, patch);
  const row: TablesUpdate<"profiles"> = { updated_at: nowIso() };
  if ("displayName" in parsed) row.display_name = parsed.displayName ?? null;
  if ("ageYears" in parsed) row.age_years = parsed.ageYears ?? null;
  if ("biologicalSex" in parsed) row.biological_sex = parsed.biologicalSex ?? null;
  if ("heightCm" in parsed) row.height_cm = parsed.heightCm ?? null;
  if ("currentWeightKg" in parsed) row.current_weight_kg = parsed.currentWeightKg ?? null;
  if ("activityLevel" in parsed) row.activity_level = parsed.activityLevel ?? null;
  if ("workoutDaysPerWeek" in parsed) {
    row.workout_days_per_week = parsed.workoutDaysPerWeek ?? null;
  }
  if ("fitnessGoal" in parsed) row.fitness_goal = parsed.fitnessGoal ?? null;
  if ("targetWeightKg" in parsed) row.target_weight_kg = parsed.targetWeightKg ?? null;
  if ("desiredRateKgPerWeek" in parsed) {
    row.desired_rate_kg_per_week = parsed.desiredRateKgPerWeek ?? null;
  }
  if ("macroPreference" in parsed) row.macro_preference = parsed.macroPreference ?? null;
  if ("customMacroSplit" in parsed) {
    row.custom_protein_percent = parsed.customMacroSplit?.proteinPercent ?? null;
    row.custom_fat_percent = parsed.customMacroSplit?.fatPercent ?? null;
    row.custom_carb_percent = parsed.customMacroSplit?.carbPercent ?? null;
  }
  if (Object.keys(row).length === 1) invalidInput();
  return row;
}

function targetToRow(
  values: Omit<NutritionTargets, "id" | "createdAt" | "updatedAt">,
  userId: string,
): TablesInsert<"nutrition_targets"> {
  const parsed = validateInput(targetInputSchema, values);
  return {
    user_id: userId,
    calories: parsed.calories,
    protein: parsed.protein,
    carbohydrates: parsed.carbohydrates,
    fat: parsed.fat,
    source: parsed.source ?? null,
    bmr: parsed.bmr ?? null,
    tdee: parsed.tdee ?? null,
    activity_pal: parsed.activityPal ?? null,
    formula_version: parsed.formulaVersion ?? null,
    calculated_at: parsed.calculatedAt ?? null,
    requested_deficit_kcal: parsed.requestedDeficitKcal ?? null,
    actual_deficit_kcal: parsed.actualDeficitKcal ?? null,
    calorie_guardrail_kcal: parsed.calorieGuardrailKcal ?? null,
    updated_at: nowIso(),
  };
}

function foodEntryToRow(
  values: Omit<FoodEntry, "createdAt" | "updatedAt"> & { logDate: string },
  userId: string,
): TablesInsert<"food_entries"> {
  const parsed = validateInput(foodEntryInputSchema, values);
  return {
    user_id: userId,
    id: parsed.id,
    food_id: parsed.foodId,
    name: parsed.name,
    grams: parsed.grams,
    log_date: parsed.logDate,
    serving_label: parsed.servingLabel ?? null,
    meal_category: parsed.mealCategory,
    logged_at: parsed.loggedAt,
    calories: parsed.calories,
    protein: parsed.protein,
    carbohydrates: parsed.carbohydrates,
    fat: parsed.fat,
    fiber: parsed.fiber ?? null,
    sugar: parsed.sugar ?? null,
    saturated_fat: parsed.saturatedFat ?? null,
    sodium: parsed.sodium ?? null,
    session_id: parsed.sessionId ?? null,
    updated_at: nowIso(),
  };
}

function entryPatchToRow(patch: Partial<FoodEntry> & { logDate?: string }): TablesUpdate<"food_entries"> {
  const row: TablesUpdate<"food_entries"> = { updated_at: nowIso() };
  const parsed = validateInput(foodEntryPatchSchema, patch);
  if ("foodId" in parsed) row.food_id = parsed.foodId;
  if ("name" in parsed) row.name = parsed.name;
  if ("grams" in parsed) row.grams = parsed.grams;
  if ("logDate" in parsed) row.log_date = parsed.logDate;
  if ("servingLabel" in parsed) row.serving_label = parsed.servingLabel ?? null;
  if ("mealCategory" in parsed) row.meal_category = parsed.mealCategory;
  if ("loggedAt" in parsed) row.logged_at = parsed.loggedAt;
  if ("calories" in parsed) row.calories = parsed.calories;
  if ("protein" in parsed) row.protein = parsed.protein;
  if ("carbohydrates" in parsed) row.carbohydrates = parsed.carbohydrates;
  if ("fat" in parsed) row.fat = parsed.fat;
  if ("fiber" in parsed) row.fiber = parsed.fiber ?? null;
  if ("sugar" in parsed) row.sugar = parsed.sugar ?? null;
  if ("saturatedFat" in parsed) row.saturated_fat = parsed.saturatedFat ?? null;
  if ("sodium" in parsed) row.sodium = parsed.sodium ?? null;
  if ("sessionId" in parsed) row.session_id = parsed.sessionId ?? null;
  if (Object.keys(row).length === 1) invalidInput();
  return row;
}

function customFoodToRow(
  value: Omit<CustomFood, "createdAt" | "updatedAt" | "isCustom">,
  userId: string,
): TablesInsert<"custom_foods"> {
  const parsed = validateInput(customFoodInputSchema, value);
  return {
    user_id: userId,
    id: parsed.id,
    name: parsed.name,
    category: parsed.category,
    default_grams: parsed.defaultGrams,
    calories: parsed.calories,
    protein: parsed.protein,
    carbohydrates: parsed.carbohydrates,
    fat: parsed.fat,
    fiber: parsed.fiber,
    sugar: parsed.sugar,
    saturated_fat: parsed.saturatedFat,
    sodium: parsed.sodium,
    synonyms: parsed.synonyms,
    source: parsed.source,
    updated_at: nowIso(),
  };
}

function customFoodPatchToRow(
  patch: Partial<Omit<CustomFood, "id" | "createdAt" | "updatedAt" | "isCustom">>,
): TablesUpdate<"custom_foods"> {
  const parsed = validateInput(customFoodPatchSchema, patch);
  const row: TablesUpdate<"custom_foods"> = { updated_at: nowIso() };
  if ("name" in parsed) row.name = parsed.name;
  if ("category" in parsed) row.category = parsed.category;
  if ("defaultGrams" in parsed) row.default_grams = parsed.defaultGrams;
  if ("calories" in parsed) row.calories = parsed.calories;
  if ("protein" in parsed) row.protein = parsed.protein;
  if ("carbohydrates" in parsed) row.carbohydrates = parsed.carbohydrates;
  if ("fat" in parsed) row.fat = parsed.fat;
  if ("fiber" in parsed) row.fiber = parsed.fiber;
  if ("sugar" in parsed) row.sugar = parsed.sugar;
  if ("saturatedFat" in parsed) row.saturated_fat = parsed.saturatedFat;
  if ("sodium" in parsed) row.sodium = parsed.sodium;
  if ("synonyms" in parsed) row.synonyms = parsed.synonyms;
  if ("source" in parsed) row.source = parsed.source;
  if (Object.keys(row).length === 1) invalidInput();
  return row;
}

function weightToRow(
  value: Omit<WeightRecord, "createdAt" | "updatedAt">,
  userId: string,
): TablesInsert<"weight_records"> {
  const parsed = validateInput(weightInputSchema, value);
  return {
    user_id: userId,
    id: parsed.id,
    weight_kg: parsed.weight,
    logged_at: parsed.loggedAt,
  };
}

function foodSnapshot(value: Food): NonNullable<Json> {
  const parsed = validateInput(foodSnapshotSchema, value);
  return foodToSnapshot(parsed);
}

export function createRepositories(
  client: SupabaseClient<Database>,
  expectedUserId?: string,
) {
  const ownerId = async () => {
    const userId = await requireUserId(client);
    if (expectedUserId !== undefined && userId !== expectedUserId) {
      throw new RepositoryError(
        "unauthenticated",
        "The active account changed during this request.",
      );
    }
    return userId;
  };

  const profiles = {
    async get(): Promise<UserProfile | null> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapProfile(data) : null;
    },
    async update(patch: Partial<UserProfile>): Promise<UserProfile> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("profiles")
        .update(profilePatchToRow(patch))
        .eq("user_id", userId)
        .select("*")
        .single();
      return mapProfile(requireRow(data, error));
    },
  };

  const nutritionTargets = {
    async get(): Promise<NutritionTargets | null> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("nutrition_targets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapNutritionTargets(data) : null;
    },
    async save(
      values: Omit<NutritionTargets, "id" | "createdAt" | "updatedAt">,
    ): Promise<NutritionTargets> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("nutrition_targets")
        .upsert(targetToRow(values, userId), { onConflict: "user_id" })
        .select("*")
        .single();
      return mapNutritionTargets(requireRow(data, error));
    },
    async delete(): Promise<boolean> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("nutrition_targets")
        .delete()
        .eq("user_id", userId)
        .select("user_id");
      return requireRows(data, error).length > 0;
    },
  };

  const mealSessions = {
    async list(date?: string): Promise<MealSession[]> {
      const userId = await ownerId();
      let query = client.from("meal_sessions").select("*").eq("user_id", userId);
      if (date !== undefined) {
        const validDate = z.iso.date().safeParse(date);
        if (!validDate.success) invalidInput();
        query = query.eq("log_date", date);
      }
      const { data, error } = await query
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: true });
      return requireRows(data, error).map(mapMealSession);
    },
    async create(
      value: Pick<MealSession, "id" | "date" | "mealCategory">,
    ): Promise<MealSession> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        id: idSchema,
        date: z.iso.date(),
        mealCategory: mealCategorySchema,
      }), value);
      const { data, error } = await client
        .from("meal_sessions")
        .insert({
          user_id: userId,
          id: parsed.id,
          log_date: parsed.date,
          meal_category: parsed.mealCategory,
        })
        .select("*")
        .single();
      return mapMealSession(requireRow(data, error));
    },
    async createMany(
      values: Pick<MealSession, "id" | "date" | "mealCategory">[],
    ): Promise<MealSession[]> {
      const userId = await ownerId();
      const parsed = validateInput(z.array(z.object({
        id: idSchema,
        date: z.iso.date(),
        mealCategory: mealCategorySchema,
      })), values);
      if (parsed.length === 0) return [];
      const { data, error } = await client
        .from("meal_sessions")
        .insert(parsed.map((value) => ({
          user_id: userId,
          id: value.id,
          log_date: value.date,
          meal_category: value.mealCategory,
        })))
        .select("*");
      return requireRows(data, error).map(mapMealSession);
    },
    async delete(
      id: string,
      date: string,
      mealCategory: MealCategory,
    ): Promise<boolean> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        id: idSchema,
        date: z.iso.date(),
        mealCategory: mealCategorySchema,
      }), { id, date, mealCategory });
      const { data, error } = await client
        .from("meal_sessions")
        .delete()
        .eq("user_id", userId)
        .eq("id", parsed.id)
        .eq("log_date", parsed.date)
        .eq("meal_category", parsed.mealCategory)
        .select("id");
      return requireRows(data, error).length > 0;
    },
  };

  const foodEntries = {
    async list(date?: string): Promise<FoodEntry[]> {
      const userId = await ownerId();
      let query = client.from("food_entries").select("*").eq("user_id", userId);
      if (date !== undefined) {
        if (!z.iso.date().safeParse(date).success) invalidInput();
        query = query.eq("log_date", date);
      }
      const { data, error } = await query.order("logged_at", { ascending: true });
      return requireRows(data, error).map(mapFoodEntry);
    },
    async create(
      value: Omit<FoodEntry, "createdAt" | "updatedAt"> & { logDate: string },
    ): Promise<FoodEntry> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("food_entries")
        .insert(foodEntryToRow(value, userId))
        .select("*")
        .single();
      return mapFoodEntry(requireRow(data, error));
    },
    async createMany(
      values: (Omit<FoodEntry, "createdAt" | "updatedAt"> & { logDate: string })[],
    ): Promise<FoodEntry[]> {
      const userId = await ownerId();
      const parsed = validateInput(
        z.array(foodEntryInputSchema),
        values,
      );
      if (parsed.length === 0) return [];
      const { data, error } = await client
        .from("food_entries")
        .insert(parsed.map((value) => foodEntryToRow(value, userId)))
        .select("*");
      return requireRows(data, error).map(mapFoodEntry);
    },
    async update(
      id: string,
      patch: Partial<Omit<FoodEntry, "id" | "createdAt" | "updatedAt">>,
    ): Promise<FoodEntry | null> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, id);
      const { data, error } = await client
        .from("food_entries")
        .update(entryPatchToRow(patch))
        .eq("user_id", userId)
        .eq("id", validId)
        .select("*")
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapFoodEntry(data) : null;
    },
    async delete(id: string): Promise<boolean> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, id);
      const { data, error } = await client
        .from("food_entries")
        .delete()
        .eq("user_id", userId)
        .eq("id", validId)
        .select("id");
      return requireRows(data, error).length > 0;
    },
    async deleteMany(ids: string[]): Promise<number> {
      const userId = await ownerId();
      const parsed = validateInput(z.array(idSchema), ids);
      if (parsed.length === 0) return 0;
      const { data, error } = await client
        .from("food_entries")
        .delete()
        .eq("user_id", userId)
        .in("id", parsed)
        .select("id");
      return requireRows(data, error).length;
    },
  };

  const customFoods = {
    async list(): Promise<CustomFood[]> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("custom_foods")
        .select("*")
        .eq("user_id", userId)
        .order("name");
      return requireRows(data, error).map(mapCustomFood);
    },
    async get(id: string): Promise<CustomFood | null> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, id);
      const { data, error } = await client
        .from("custom_foods")
        .select("*")
        .eq("user_id", userId)
        .eq("id", validId)
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapCustomFood(data) : null;
    },
    async create(
      value: Omit<CustomFood, "createdAt" | "updatedAt" | "isCustom">,
    ): Promise<CustomFood> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("custom_foods")
        .insert(customFoodToRow(value, userId))
        .select("*")
        .single();
      return mapCustomFood(requireRow(data, error));
    },
    async update(
      id: string,
      patch: Partial<Omit<CustomFood, "id" | "createdAt" | "updatedAt" | "isCustom">>,
    ): Promise<CustomFood | null> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, id);
      const { data, error } = await client
        .from("custom_foods")
        .update(customFoodPatchToRow(patch))
        .eq("user_id", userId)
        .eq("id", validId)
        .select("*")
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapCustomFood(data) : null;
    },
    async delete(id: string): Promise<boolean> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, id);
      const { data, error } = await client
        .from("custom_foods")
        .delete()
        .eq("user_id", userId)
        .eq("id", validId)
        .select("id");
      return requireRows(data, error).length > 0;
    },
  };

  const favorites = {
    async list(): Promise<FavoriteFood[]> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("favorite_foods")
        .select("*")
        .eq("user_id", userId)
        .order("created_at");
      return requireRows(data, error).map(mapFavorite);
    },
    async create(value: {
      id: string;
      foodId: string;
      source: "catalog" | "custom";
    }): Promise<FavoriteFood> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        id: idSchema,
        foodId: idSchema,
        source: z.enum(["catalog", "custom"]),
      }), value);
      const row: TablesInsert<"favorite_foods"> = {
        user_id: userId,
        id: parsed.id,
        catalog_food_id: parsed.source === "catalog" ? parsed.foodId : null,
        custom_food_id: parsed.source === "custom" ? parsed.foodId : null,
        updated_at: nowIso(),
      };
      const { data, error } = await client
        .from("favorite_foods")
        .insert(row)
        .select("*")
        .single();
      return mapFavorite(requireRow(data, error));
    },
    async delete(id: string): Promise<boolean> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, id);
      const { data, error } = await client
        .from("favorite_foods")
        .delete()
        .eq("user_id", userId)
        .eq("id", validId)
        .select("id");
      return requireRows(data, error).length > 0;
    },
  };

  const savedMeals = {
    async list(): Promise<SavedMeal[]> {
      const userId = await ownerId();
      const { data: parents, error: parentError } = await client
        .from("saved_meals")
        .select("*")
        .eq("user_id", userId)
        .order("name");
      const rows = requireRows(parents, parentError);
      if (rows.length === 0) return [];
      const { data: children, error: childrenError } = await client
        .from("saved_meal_items")
        .select("*")
        .eq("user_id", userId)
        .in("saved_meal_id", rows.map((row) => row.id))
        .order("position");
      const itemRows = requireRows(children, childrenError);
      return rows.map((row) =>
        mapSavedMeal(
          row,
          itemRows.filter((item) => item.saved_meal_id === row.id),
        ),
      );
    },
    async create(value: SavedMeal): Promise<SavedMeal> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        id: idSchema,
        name: z.string().min(1),
        createdAt: timestampSchema.optional(),
        updatedAt: timestampSchema.optional(),
        items: z.array(z.object({
          food: foodSnapshotSchema,
          grams: numericNutrition,
        })),
      }), value);
      const { data, error } = await client
        .from("saved_meals")
        .insert({
          user_id: userId,
          id: parsed.id,
          name: parsed.name,
          updated_at: nowIso(),
        })
        .select("*")
        .single();
      const parent = requireRow(data, error);
      if (parsed.items.length === 0) return mapSavedMeal(parent, []);
      const insertItems: TablesInsert<"saved_meal_items">[] = parsed.items.map(
        (item, position) => ({
          user_id: userId,
          saved_meal_id: parent.id,
          position,
          grams: item.grams,
          food_snapshot: foodSnapshot(item.food),
          updated_at: nowIso(),
        }),
      );
      const { data: itemRows, error: itemError } = await client
        .from("saved_meal_items")
        .insert(insertItems)
        .select("*");
      if (itemError) {
        // The item insert is one statement, so nothing was written: remove the
        // parent instead of leaving an empty saved meal behind.
        await client
          .from("saved_meals")
          .delete()
          .eq("user_id", userId)
          .eq("id", parent.id);
        throw new RepositoryError(
          "partial-write",
          "The saved meal was created, but its items could not be saved.",
          itemError.code,
        );
      }
      const savedItems = requireRows(itemRows, null);
      if (savedItems.length !== insertItems.length) {
        await client
          .from("saved_meals")
          .delete()
          .eq("user_id", userId)
          .eq("id", parent.id);
        throw new RepositoryError(
          "partial-write",
          "The saved meal was created, but not all items were confirmed.",
        );
      }
      return mapSavedMeal(parent, savedItems);
    },
    async updateName(id: string, name: string): Promise<SavedMeal | null> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        id: idSchema,
        name: z.string().min(1),
      }), { id, name });
      const { data, error } = await client
        .from("saved_meals")
        .update({ name: parsed.name, updated_at: nowIso() })
        .eq("user_id", userId)
        .eq("id", parsed.id)
        .select("*")
        .maybeSingle();
      if (error) throwDatabaseError(error);
      if (!data) return null;
      const { data: items, error: itemsError } = await client
        .from("saved_meal_items")
        .select("*")
        .eq("user_id", userId)
        .eq("saved_meal_id", parsed.id)
        .order("position");
      return mapSavedMeal(data, requireRows(items, itemsError));
    },
    async delete(id: string): Promise<boolean> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, id);
      const { data, error } = await client
        .from("saved_meals")
        .delete()
        .eq("user_id", userId)
        .eq("id", validId)
        .select("id");
      return requireRows(data, error).length > 0;
    },
  };

  const savedMealItems = {
    async list(savedMealId: string): Promise<SavedMeal["items"]> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, savedMealId);
      const { data, error } = await client
        .from("saved_meal_items")
        .select("*")
        .eq("user_id", userId)
        .eq("saved_meal_id", validId)
        .order("position");
      return requireRows(data, error).map(mapSavedMealItem);
    },
    async create(
      savedMealId: string,
      item: { position: number; grams: number; food: Food },
    ): Promise<void> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        savedMealId: idSchema,
        position: z.number().int().nonnegative(),
        grams: numericNutrition,
        food: foodSnapshotSchema,
      }), { savedMealId, ...item });
      const { error } = await client.from("saved_meal_items").insert({
        user_id: userId,
        saved_meal_id: parsed.savedMealId,
        position: parsed.position,
        grams: parsed.grams,
        food_snapshot: foodSnapshot(parsed.food),
        updated_at: nowIso(),
      });
      if (error) throwDatabaseError(error);
    },
    async update(
      savedMealId: string,
      position: number,
      patch: { grams?: number; food?: Food },
    ): Promise<boolean> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        savedMealId: idSchema,
        position: z.number().int().nonnegative(),
        grams: numericNutrition.optional(),
        food: foodSnapshotSchema.optional(),
      }).refine((value) => value.grams !== undefined || value.food !== undefined), {
        savedMealId,
        position,
        ...patch,
      });
      const update: TablesUpdate<"saved_meal_items"> = { updated_at: nowIso() };
      if (parsed.grams !== undefined) update.grams = parsed.grams;
      if (parsed.food !== undefined) update.food_snapshot = foodSnapshot(parsed.food);
      const { data, error } = await client
        .from("saved_meal_items")
        .update(update)
        .eq("user_id", userId)
        .eq("saved_meal_id", parsed.savedMealId)
        .eq("position", parsed.position)
        .select("position");
      return requireRows(data, error).length > 0;
    },
    async delete(savedMealId: string, position: number): Promise<boolean> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        savedMealId: idSchema,
        position: z.number().int().nonnegative(),
      }), { savedMealId, position });
      const { data, error } = await client
        .from("saved_meal_items")
        .delete()
        .eq("user_id", userId)
        .eq("saved_meal_id", parsed.savedMealId)
        .eq("position", parsed.position)
        .select("position");
      return requireRows(data, error).length > 0;
    },
  };

  const weightRecords = {
    async list(): Promise<WeightRecord[]> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("weight_records")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });
      return requireRows(data, error).map(mapWeightRecord);
    },
    async create(value: Omit<WeightRecord, "createdAt" | "updatedAt">): Promise<WeightRecord> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("weight_records")
        .insert(weightToRow(value, userId))
        .select("*")
        .single();
      return mapWeightRecord(requireRow(data, error));
    },
    async update(
      id: string,
      patch: Partial<Pick<WeightRecord, "weight" | "loggedAt">>,
    ): Promise<WeightRecord | null> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        id: idSchema,
        weight: z.number().finite().positive().optional(),
        loggedAt: timestampSchema.optional(),
      }).refine((value) => value.weight !== undefined || value.loggedAt !== undefined), {
        id,
        ...patch,
      });
      const update: TablesUpdate<"weight_records"> = { updated_at: nowIso() };
      if (parsed.weight !== undefined) update.weight_kg = parsed.weight;
      if (parsed.loggedAt !== undefined) update.logged_at = parsed.loggedAt;
      const { data, error } = await client
        .from("weight_records")
        .update(update)
        .eq("user_id", userId)
        .eq("id", parsed.id)
        .select("*")
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapWeightRecord(data) : null;
    },
    async delete(id: string): Promise<boolean> {
      const userId = await ownerId();
      const validId = validateInput(idSchema, id);
      const { data, error } = await client
        .from("weight_records")
        .delete()
        .eq("user_id", userId)
        .eq("id", validId)
        .select("id");
      return requireRows(data, error).length > 0;
    },
  };

  const mealCartDraft = {
    async get(): Promise<MealCartDraft | null> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("meal_cart_drafts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapMealCartDraft(data) : null;
    },
    async save(value: MealCartDraft): Promise<MealCartDraft> {
      const userId = await ownerId();
      const parsed = validateInput(draftInputSchema, value);
      const items: Json = parsed.items.map((item) => ({
        food: foodToSnapshot(item.food),
        grams: item.grams,
      }));
      const { data, error } = await client
        .from("meal_cart_drafts")
        .upsert({
          user_id: userId,
          id: parsed.id,
          log_date: parsed.date,
          meal_category: parsed.mealCategory,
          items,
          updated_at: nowIso(),
        }, { onConflict: "user_id" })
        .select("*")
        .single();
      return mapMealCartDraft(requireRow(data, error));
    },
    async delete(): Promise<boolean> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("meal_cart_drafts")
        .delete()
        .eq("user_id", userId)
        .select("user_id");
      return requireRows(data, error).length > 0;
    },
  };

  const accountPreferences = {
    async get(): Promise<{
      theme: ThemePreference;
      language: LanguagePreference;
      catalogViewMode?: "grid" | "list";
    } | null> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("account_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapAccountPreferences(data) : null;
    },
    async save(value: {
      theme: ThemePreference;
      language: LanguagePreference;
      catalogViewMode?: "grid" | "list";
    }): Promise<{
      theme: ThemePreference;
      language: LanguagePreference;
      catalogViewMode?: "grid" | "list";
    }> {
      const userId = await ownerId();
      const parsed = validateInput(z.object({
        theme: z.enum(["light", "dark", "system"]),
        language: z.enum(["en", "id"]),
        catalogViewMode: z.enum(["grid", "list"]).optional(),
      }), value);
      const row: TablesInsert<"account_preferences"> = {
        user_id: userId,
        theme: parsed.theme,
        language: parsed.language,
        catalog_view_mode: parsed.catalogViewMode ?? null,
        updated_at: nowIso(),
      };
      const { data, error } = await client
        .from("account_preferences")
        .upsert(row, { onConflict: "user_id" })
        .select("*")
        .single();
      return mapAccountPreferences(requireRow(data, error));
    },
    async delete(): Promise<boolean> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("account_preferences")
        .delete()
        .eq("user_id", userId)
        .select("user_id");
      return requireRows(data, error).length > 0;
    },
  };

  const searchHistory = {
    async get(): Promise<string[]> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("search_history")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throwDatabaseError(error);
      return data ? mapSearchHistory(data).queries : [];
    },
    async save(queries: string[]): Promise<string[]> {
      const userId = await ownerId();
      const parsed = validateInput(z.array(z.string()), queries);
      const { data, error } = await client
        .from("search_history")
        .upsert({
          user_id: userId,
          queries: parsed,
          updated_at: nowIso(),
        }, { onConflict: "user_id" })
        .select("*")
        .single();
      return mapSearchHistory(requireRow(data, error)).queries;
    },
    async delete(): Promise<boolean> {
      const userId = await ownerId();
      const { data, error } = await client
        .from("search_history")
        .delete()
        .eq("user_id", userId)
        .select("user_id");
      return requireRows(data, error).length > 0;
    },
  };

  return {
    profiles,
    nutritionTargets,
    mealSessions,
    foodEntries,
    customFoods,
    favorites,
    savedMeals,
    savedMealItems,
    weightRecords,
    mealCartDraft,
    accountPreferences,
    searchHistory,
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
export { RepositoryError } from "@/lib/repositories/errors";
