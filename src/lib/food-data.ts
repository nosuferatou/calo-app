import type { CustomFoodInput } from "@/types";
import type { Food } from "@/types";
import { FOOD_CATEGORIES } from "@/lib/food-search";
import { customFoodWarnings } from "@/lib/custom-foods";

export type FoodDatasetIssueSeverity = "error" | "warning";

export interface FoodDatasetIssue {
  foodId: string;
  code: string;
  detail: string;
  severity: FoodDatasetIssueSeverity;
}

const NAME_MAX_LENGTH = 120;
const MAX_DEFAULT_GRAMS = 2000;
const NUTRITION_FIELDS = [
  "calories",
  "protein",
  "carbohydrates",
  "fat",
  "fiber",
  "sugar",
  "saturatedFat",
  "sodium",
] as const;

/**
 * Structural and plausibility validation for a static food dataset. Values are
 * never rewritten: a record that fails is reported so it can be corrected or
 * removed against its cited source.
 */
export function validateFoodDataset(foods: Food[]): FoodDatasetIssue[] {
  const issues: FoodDatasetIssue[] = [];
  const seenIds = new Map<string, string>();

  foods.forEach((food, index) => {
    const report = (
      code: string,
      detail: string,
      severity: FoodDatasetIssueSeverity = "error",
    ) => {
      issues.push({ foodId: food.id || `#${index}`, code, detail, severity });
    };

    if (!food.id) {
      report("missing-id", "Food has no id.");
    } else {
      const first = seenIds.get(food.id);
      if (first) {
        report("duplicate-id", `id "${food.id}" is reused by another record.`);
      } else {
        seenIds.set(food.id, food.name);
      }
    }

    const name = food.name?.trim() ?? "";
    if (!name) report("missing-name", "Food has no name.");
    if (name.length > NAME_MAX_LENGTH) {
      report("name-too-long", `name exceeds ${NAME_MAX_LENGTH} characters.`);
    }
    if (!(FOOD_CATEGORIES as readonly string[]).includes(food.category)) {
      report("unknown-category", `category "${food.category}" is not valid.`);
    }
    if (!food.source?.trim()) {
      report("missing-source", "Nutrition values require a source reference.");
    }
    if (!Array.isArray(food.synonyms) || food.synonyms.some((s) => !s.trim())) {
      report("invalid-synonyms", "Synonyms must be an array of non-empty names.");
    }
    if (!Number.isFinite(food.defaultGrams) || food.defaultGrams <= 0) {
      report("invalid-default-grams", "defaultGrams must be a positive number.");
    } else if (food.defaultGrams > MAX_DEFAULT_GRAMS) {
      report("default-grams-too-high", `defaultGrams ${food.defaultGrams} is implausible.`);
    }

    for (const field of NUTRITION_FIELDS) {
      const value = food[field];
      if (!Number.isFinite(value) || value < 0) {
        report("invalid-nutrition", `${field} must be a finite non-negative number.`);
      }
    }

    for (const warning of customFoodWarnings(food as CustomFoodInput)) {
      // Plausibility findings are advisories: they never rewrite a cited value,
      // they mark the record for source review.
      report(
        `unusual-${warning.code}`,
        `${warning.code} is outside the expected range.`,
        "warning",
      );
    }
  });

  return issues;
}

export function foodDatasetErrors(issues: FoodDatasetIssue[]): FoodDatasetIssue[] {
  return issues.filter((issue) => issue.severity === "error");
}
