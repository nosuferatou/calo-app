import { FOOD_CATEGORIES } from "@/lib/food-search";
import type { CustomFood, CustomFoodInput, FoodCategory } from "@/types";

/**
 * Stored source label for user-entered foods. Custom foods are not verified by
 * CALO, so the label describes the origin rather than implying a reference.
 */
export const CUSTOM_FOOD_SOURCE = "User-entered values";

export const CUSTOM_FOOD_NUTRITION_FIELDS = [
  "calories",
  "protein",
  "carbohydrates",
  "fat",
  "fiber",
  "sugar",
  "saturatedFat",
  "sodium",
] as const;

export type CustomFoodNutritionField =
  (typeof CUSTOM_FOOD_NUTRITION_FIELDS)[number];
export type CustomFoodFormField =
  | "name"
  | "category"
  | "defaultGrams"
  | CustomFoodNutritionField;

export type CustomFoodFieldError =
  | "required"
  | "not-a-number"
  | "negative"
  | "positive"
  | "too-long"
  | "invalid-category";

export interface CustomFoodFormValues {
  name: string;
  category: string;
  defaultGrams: string;
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
  fiber: string;
  sugar: string;
  saturatedFat: string;
  sodium: string;
}

export type CustomFoodWarningCode =
  | "energy-mismatch"
  | "energy-too-high"
  | "macro-too-high"
  | "fiber-and-sugar"
  | "saturated-fat"
  | "sodium-high";

export interface CustomFoodWarning {
  code: CustomFoodWarningCode;
  values?: Record<string, number>;
}

export interface CustomFoodValidation {
  errors: Partial<Record<CustomFoodFormField, CustomFoodFieldError>>;
  warnings: CustomFoodWarning[];
  values: CustomFoodInput | null;
}

const NAME_MAX_LENGTH = 120;

/**
 * 4-4-9 factors from FDA 21 CFR 101.9(c)(1), the same factors recorded in
 * NUTRITION_CALCULATIONS.md. The tolerance is a warning threshold only; the
 * entered values are never rewritten.
 */
const ENERGY_TOLERANCE_ABSOLUTE_KCAL = 20;
const ENERGY_TOLERANCE_RATIO = 0.1;
const MAX_ENERGY_KCAL_PER_100_G = 900;
const MAX_MACRONUTRIENT_G_PER_100_G = 100;
const MAX_SODIUM_MG_PER_100_G = 5000;
const COMPARISON_TOLERANCE_G = 0.1;

export function emptyCustomFoodForm(): CustomFoodFormValues {
  return {
    name: "",
    category: "others",
    defaultGrams: "100",
    calories: "",
    protein: "",
    carbohydrates: "",
    fat: "",
    fiber: "",
    sugar: "",
    saturatedFat: "",
    sodium: "",
  };
}

export function customFoodToForm(food: CustomFood): CustomFoodFormValues {
  return {
    name: food.name,
    category: food.category,
    defaultGrams: String(food.defaultGrams),
    calories: String(food.calories),
    protein: String(food.protein),
    carbohydrates: String(food.carbohydrates),
    fat: String(food.fat),
    fiber: String(food.fiber),
    sugar: String(food.sugar),
    saturatedFat: String(food.saturatedFat),
    sodium: String(food.sodium),
  };
}

export function estimateEnergyFromMacros(
  protein: number,
  carbohydrates: number,
  fat: number,
): number {
  return protein * 4 + carbohydrates * 4 + fat * 9;
}

function isFoodCategory(value: string): value is FoodCategory {
  return (FOOD_CATEGORIES as string[]).includes(value);
}

function parseNumberField(
  raw: string,
  field: CustomFoodFormField,
  errors: Partial<Record<CustomFoodFormField, CustomFoodFieldError>>,
  options: { positive?: boolean } = {},
): number {
  const trimmed = raw.trim();

  if (!trimmed) {
    errors[field] = "required";
    return 0;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    errors[field] = "not-a-number";
    return 0;
  }

  if (value < 0) {
    errors[field] = "negative";
    return 0;
  }

  if (options.positive && value === 0) {
    errors[field] = "positive";
    return 0;
  }

  return value;
}

export function customFoodWarnings(
  values: CustomFoodInput,
): CustomFoodWarning[] {
  const warnings: CustomFoodWarning[] = [];
  const estimate = estimateEnergyFromMacros(
    values.protein,
    values.carbohydrates,
    values.fat,
  );
  const difference = Math.abs(values.calories - estimate);
  const tolerance = Math.max(
    ENERGY_TOLERANCE_ABSOLUTE_KCAL,
    Math.max(values.calories, estimate) * ENERGY_TOLERANCE_RATIO,
  );

  if (difference > tolerance) {
    warnings.push({
      code: "energy-mismatch",
      values: {
        estimate: Math.round(estimate),
        difference: Math.round(difference),
      },
    });
  }

  if (values.calories > MAX_ENERGY_KCAL_PER_100_G) {
    warnings.push({ code: "energy-too-high" });
  }

  if (
    values.protein > MAX_MACRONUTRIENT_G_PER_100_G ||
    values.carbohydrates > MAX_MACRONUTRIENT_G_PER_100_G ||
    values.fat > MAX_MACRONUTRIENT_G_PER_100_G
  ) {
    warnings.push({ code: "macro-too-high" });
  }

  if (
    values.fiber + values.sugar >
    values.carbohydrates + COMPARISON_TOLERANCE_G
  ) {
    warnings.push({ code: "fiber-and-sugar" });
  }

  if (values.saturatedFat > values.fat + COMPARISON_TOLERANCE_G) {
    warnings.push({ code: "saturated-fat" });
  }

  if (values.sodium > MAX_SODIUM_MG_PER_100_G) {
    warnings.push({ code: "sodium-high" });
  }

  return warnings;
}

export function validateCustomFoodForm(
  form: CustomFoodFormValues,
): CustomFoodValidation {
  const errors: Partial<Record<CustomFoodFormField, CustomFoodFieldError>> = {};
  const name = form.name.trim();

  if (!name) {
    errors.name = "required";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = "too-long";
  }

  if (!isFoodCategory(form.category)) {
    errors.category = "invalid-category";
  }

  const defaultGrams = parseNumberField(form.defaultGrams, "defaultGrams", errors, {
    positive: true,
  });
  const nutrition = Object.fromEntries(
    CUSTOM_FOOD_NUTRITION_FIELDS.map((field) => [
      field,
      parseNumberField(form[field], field, errors),
    ]),
  ) as Record<CustomFoodNutritionField, number>;

  if (Object.keys(errors).length > 0) {
    return { errors, warnings: [], values: null };
  }

  const values: CustomFoodInput = {
    name,
    category: form.category as FoodCategory,
    defaultGrams,
    ...nutrition,
  };

  return { errors, warnings: customFoodWarnings(values), values };
}
