import { describe, expect, it } from "vitest";
import {
  CUSTOM_FOOD_SOURCE,
  customFoodToForm,
  customFoodWarnings,
  emptyCustomFoodForm,
  estimateEnergyFromMacros,
  validateCustomFoodForm,
  type CustomFoodFormValues,
  type CustomFoodWarning,
} from "@/lib/custom-foods";
import type { CustomFood, CustomFoodInput } from "@/types";

function makeForm(
  overrides: Partial<CustomFoodFormValues> = {},
): CustomFoodFormValues {
  return {
    name: "Homemade soup",
    category: "others",
    defaultGrams: "250",
    calories: "130",
    protein: "2.7",
    carbohydrates: "28",
    fat: "0.3",
    fiber: "0.4",
    sugar: "0.1",
    saturatedFat: "0.1",
    sodium: "1",
    ...overrides,
  };
}

function makeInput(overrides: Partial<CustomFoodInput> = {}): CustomFoodInput {
  return {
    name: "Test food",
    category: "others",
    defaultGrams: 100,
    calories: 130,
    protein: 2.7,
    carbohydrates: 28,
    fat: 0.3,
    fiber: 0.4,
    sugar: 0.1,
    saturatedFat: 0.1,
    sodium: 1,
    ...overrides,
  };
}

function warningCodes(warnings: CustomFoodWarning[]): string[] {
  return warnings.map((warning) => warning.code);
}

describe("custom food form helpers", () => {
  it("converts a valid form into numeric values and preserves decimals", () => {
    const result = validateCustomFoodForm(
      makeForm({
        name: "  Homemade soup  ",
        defaultGrams: "125.5",
        protein: "0.25",
      }),
    );

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual([]);
    expect(result.values).toEqual({
      name: "Homemade soup",
      category: "others",
      defaultGrams: 125.5,
      calories: 130,
      protein: 0.25,
      carbohydrates: 28,
      fat: 0.3,
      fiber: 0.4,
      sugar: 0.1,
      saturatedFat: 0.1,
      sodium: 1,
    });
  });

  it("reports missing values for the name, portion, and every nutrient", () => {
    const result = validateCustomFoodForm(
      makeForm({
        name: "   ",
        defaultGrams: "",
        calories: "",
        protein: "",
        carbohydrates: "",
        fat: "",
        fiber: "",
        sugar: "",
        saturatedFat: "",
        sodium: "",
      }),
    );

    expect(result.values).toBeNull();
    expect(result.errors).toMatchObject({
      name: "required",
      defaultGrams: "required",
      calories: "required",
      protein: "required",
      carbohydrates: "required",
      fat: "required",
      fiber: "required",
      sugar: "required",
      saturatedFat: "required",
      sodium: "required",
    });
  });

  it("rejects text, negative numbers, a zero portion, long names, and unknown categories", () => {
    expect(
      validateCustomFoodForm(makeForm({ calories: "many" })).errors.calories,
    ).toBe("not-a-number");

    expect(
      validateCustomFoodForm(makeForm({ protein: "-1" })).errors.protein,
    ).toBe("negative");

    expect(
      validateCustomFoodForm(makeForm({ defaultGrams: "0" })).errors.defaultGrams,
    ).toBe("positive");

    expect(
      validateCustomFoodForm(makeForm({ name: "a".repeat(121) })).errors.name,
    ).toBe("too-long");

    expect(
      validateCustomFoodForm(makeForm({ category: "space-food" })).errors.category,
    ).toBe("invalid-category");
  });

  it("does not calculate warnings while a form field is invalid", () => {
    const result = validateCustomFoodForm(makeForm({ sodium: "" }));

    expect(result.values).toBeNull();
    expect(result.errors.sodium).toBe("required");
    expect(result.warnings).toEqual([]);
  });

  it("round-trips a stored custom food through form values", () => {
    const food: CustomFood = {
      id: "custom-food-1",
      createdAt: "2026-11-01T10:00:00.000Z",
      updatedAt: "2026-11-01T10:00:00.000Z",
      name: "Soup",
      category: "others",
      defaultGrams: 250,
      calories: 130,
      protein: 2.7,
      carbohydrates: 28,
      fat: 0.3,
      fiber: 0.4,
      sugar: 0.1,
      saturatedFat: 0.1,
      sodium: 1,
      synonyms: [],
      source: CUSTOM_FOOD_SOURCE,
      isCustom: true,
    };

    const form = customFoodToForm(food);

    expect(form).toMatchObject({
      name: "Soup",
      category: "others",
      defaultGrams: "250",
      calories: "130",
      protein: "2.7",
      carbohydrates: "28",
      sodium: "1",
    });
    expect(validateCustomFoodForm(form).values).toEqual({
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
    });
  });

  it("starts a new form at a 100 g portion in the Others category", () => {
    expect(emptyCustomFoodForm()).toEqual({
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
    });
  });
});

describe("custom food warnings", () => {
  it("uses the 4-4-9 factors documented for energy estimates", () => {
    expect(estimateEnergyFromMacros(10, 20, 5)).toBe(165);
  });

  it("accepts values that agree with the macro estimate within tolerance", () => {
    expect(customFoodWarnings(makeInput({ calories: 130 }))).toEqual([]);
  });

  it("warns when calories differ from the macro estimate by more than 20 kcal or 10%", () => {
    const [warning] = customFoodWarnings(makeInput({ calories: 200 }));

    expect(warning).toEqual({
      code: "energy-mismatch",
      values: { estimate: 126, difference: 75 },
    });
  });

  it("warns about implausible per-100 g values without rewriting them", () => {
    const input = makeInput({
      calories: 950,
      protein: 101,
      carbohydrates: 50,
      fat: 10,
      fiber: 40,
      sugar: 20,
      saturatedFat: 12,
      sodium: 5001,
    });

    expect(warningCodes(customFoodWarnings(input))).toEqual(
      expect.arrayContaining([
        "energy-mismatch",
        "energy-too-high",
        "macro-too-high",
        "fiber-and-sugar",
        "saturated-fat",
        "sodium-high",
      ]),
    );
    expect(input.calories).toBe(950);
  });
});
