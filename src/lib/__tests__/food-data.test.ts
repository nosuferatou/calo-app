import { describe, expect, it } from "vitest";
import type { Food } from "@/types";
import { demoFoods } from "@/data/foods";
import { foodDatasetErrors, validateFoodDataset } from "@/lib/food-data";

describe("validateFoodDataset", () => {
  it("flags structural problems instead of accepting them silently", () => {
    const broken = {
      ...demoFoods[0],
      id: demoFoods[1].id,
      name: " ",
      category: "not-a-category",
      source: "",
      synonyms: ["ok", " "],
      defaultGrams: 0,
      protein: Number.NaN,
    } as unknown as Food;

    const codes = validateFoodDataset([demoFoods[1], broken]).map(
      (issue) => issue.code,
    );

    expect(codes).toEqual(expect.arrayContaining([
      "duplicate-id",
      "missing-name",
      "unknown-category",
      "missing-source",
      "invalid-synonyms",
      "invalid-default-grams",
      "invalid-nutrition",
    ]));
  });

  it("accepts a well-formed record", () => {
    expect(validateFoodDataset([demoFoods[0]])).toEqual([]);
  });

  it("ships no structurally invalid records", () => {
    expect(foodDatasetErrors(validateFoodDataset(demoFoods))).toEqual([]);
  });

  it("documents every plausibility advisory awaiting source review", () => {
    const warnings = validateFoodDataset(demoFoods)
      .filter((issue) => issue.severity === "warning")
      .map((issue) => `${issue.foodId}:${issue.code}`);

    // Illustrative values that exceed a 4-4-9 / composition sanity check are
    // listed here until the cited source table corrects them.
    expect(warnings).toEqual(["food-mango:unusual-fiber-and-sugar"]);
  });
});
