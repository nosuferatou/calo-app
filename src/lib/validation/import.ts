import { z } from "zod";
import {
  mealCategorySchema,
  nutritionTargetsSchema,
  userProfileSchema,
} from "@/lib/validation/schemas";

const entityMetaSchema = z
  .object({
    id: z.string().min(1),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .passthrough();

export const importFoodSchema = entityMetaSchema.extend({
  name: z.string().min(1),
  category: z.string().min(1),
  defaultGrams: z.number().positive(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbohydrates: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
  sugar: z.number().nonnegative(),
  saturatedFat: z.number().nonnegative(),
  sodium: z.number().nonnegative(),
  synonyms: z.array(z.string()),
  source: z.string(),
});

export const importFoodEntrySchema = entityMetaSchema.extend({
  foodId: z.string().min(1),
  name: z.string().min(1),
  grams: z.number().nonnegative(),
  mealCategory: mealCategorySchema,
  loggedAt: z.iso.datetime(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbohydrates: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

export const importWeightRecordSchema = entityMetaSchema.extend({
  weight: z.number().positive(),
  loggedAt: z.iso.datetime(),
});

export const importFavoriteSchema = entityMetaSchema.extend({
  foodId: z.string().min(1),
});

export const importSavedMealSchema = entityMetaSchema.extend({
  name: z.string().min(1),
  items: z.array(
    z.object({
      food: importFoodSchema,
      grams: z.number().nonnegative(),
    }),
  ),
});

export const caloBackupSchema = z.object({
  app: z.literal("CALO"),
  version: z.literal(1),
  exportedAt: z.iso.datetime(),
  profile: userProfileSchema,
  targets: nutritionTargetsSchema,
  entries: z.array(importFoodEntrySchema),
  weightRecords: z.array(importWeightRecordSchema),
  favorites: z.array(importFavoriteSchema),
  savedMeals: z.array(importSavedMealSchema),
});

export type CaloBackup = z.infer<typeof caloBackupSchema>;

export interface BackupSummary {
  entries: number;
  weightRecords: number;
  favorites: number;
  savedMeals: number;
}

export function summarizeBackup(backup: CaloBackup): BackupSummary {
  return {
    entries: backup.entries.length,
    weightRecords: backup.weightRecords.length,
    favorites: backup.favorites.length,
    savedMeals: backup.savedMeals.length,
  };
}

export function parseBackup(raw: string):
  | { ok: true; backup: CaloBackup; summary: BackupSummary }
  | { ok: false } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false };
  }

  const result = caloBackupSchema.safeParse(parsed);

  if (!result.success) {
    return { ok: false };
  }

  return {
    ok: true,
    backup: result.data,
    summary: summarizeBackup(result.data),
  };
}
