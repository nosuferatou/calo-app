import { z } from "zod";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { StorageKey } from "@/types/storage";

const entityMetaSchema = z
  .object({
    id: z.string().min(1),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .passthrough();

export const mealCategorySchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export const languagePreferenceSchema = z.enum(["en", "id"]);

export const biologicalSexSchema = z.enum(["female", "male"]);
export const activityLevelSchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "very-active",
  "extra-active",
]);
export const fitnessGoalSchema = z.enum([
  "weight-loss",
  "maintenance",
  "muscle-gain",
]);
export const macroPreferenceSchema = z.enum([
  "balanced",
  "higher-protein",
  "custom",
]);

export const customMacroSplitSchema = z
  .object({
    proteinPercent: z.number().finite(),
    fatPercent: z.number().finite(),
    carbPercent: z.number().finite(),
  })
  .passthrough();

const optionalProfileNumber = z.number().finite().optional();

export const userProfileSchema = entityMetaSchema
  .extend({
    displayName: z.string().optional(),
    ageYears: optionalProfileNumber,
    biologicalSex: biologicalSexSchema.optional(),
    heightCm: optionalProfileNumber,
    currentWeightKg: optionalProfileNumber,
    activityLevel: activityLevelSchema.optional(),
    workoutDaysPerWeek: optionalProfileNumber,
    fitnessGoal: fitnessGoalSchema.optional(),
    targetWeightKg: optionalProfileNumber,
    desiredRateKgPerWeek: optionalProfileNumber,
    macroPreference: macroPreferenceSchema.optional(),
    customMacroSplit: customMacroSplitSchema.optional(),
  })
  .passthrough();

export const nutritionTargetsSchema = entityMetaSchema
  .extend({
    calories: z.number().finite().nonnegative(),
    protein: z.number().finite().nonnegative(),
    carbohydrates: z.number().finite().nonnegative(),
    fat: z.number().finite().nonnegative(),
    source: z.enum(["manual", "calculated"]).optional(),
    bmr: z.number().finite().optional(),
    tdee: z.number().finite().optional(),
    activityPal: z.number().finite().positive().optional(),
    formulaVersion: z.literal(1).optional(),
    calculatedAt: z.iso.datetime().optional(),
    requestedDeficitKcal: z.number().finite().nonnegative().optional(),
    actualDeficitKcal: z.number().finite().nonnegative().optional(),
    calorieGuardrailKcal: z.number().finite().positive().optional(),
  })
  .passthrough();
export const foodSchema = entityMetaSchema;
export const customFoodSchema = entityMetaSchema;
export const mealSessionSchema = entityMetaSchema;
export const foodEntrySchema = entityMetaSchema;
export const favoriteFoodSchema = entityMetaSchema;
export const savedMealSchema = entityMetaSchema;
export const weightRecordSchema = entityMetaSchema;
export const mealCartDraftSchema = entityMetaSchema;

export const appSettingsSchema = z
  .object({
    theme: themePreferenceSchema,
    language: languagePreferenceSchema,
  })
  .passthrough();

export const appDataSchema = z.record(z.string(), z.unknown());

export const foodDiaryDataSchema = z
  .object({
    entries: z.array(foodEntrySchema),
  })
  .passthrough();

export const customFoodsDataSchema = z
  .object({
    foods: z.array(customFoodSchema),
  })
  .passthrough();

export const collectionsDataSchema = z
  .object({
    favoriteFoods: z.array(favoriteFoodSchema),
    savedMeals: z.array(savedMealSchema),
  })
  .passthrough();

export const weightRecordsDataSchema = z
  .object({
    records: z.array(weightRecordSchema),
  })
  .passthrough();

export const searchHistoryDataSchema = z
  .object({
    queries: z.array(z.string()),
  })
  .passthrough();

export const storageEnvelopeSchema = z
  .object({
    version: z.number().int().nonnegative(),
    data: z.unknown(),
  })
  .passthrough();

export type StorageSchemaMap = {
  [K in StorageKey]: z.ZodType<unknown>;
};

export const storageSchemas: StorageSchemaMap = {
  [STORAGE_KEYS.app]: appDataSchema,
  [STORAGE_KEYS.profile]: userProfileSchema,
  [STORAGE_KEYS.targets]: nutritionTargetsSchema,
  [STORAGE_KEYS.foodDiary]: foodDiaryDataSchema,
  [STORAGE_KEYS.customFoods]: customFoodsDataSchema,
  [STORAGE_KEYS.collections]: collectionsDataSchema,
  [STORAGE_KEYS.weightRecords]: weightRecordsDataSchema,
  [STORAGE_KEYS.mealCartDraft]: mealCartDraftSchema,
  [STORAGE_KEYS.settings]: appSettingsSchema,
  [STORAGE_KEYS.searchHistory]: searchHistoryDataSchema,
};
