import { describe, expect, it } from "vitest";
import { demoFoods } from "@/data/foods";
import { categoryLabelKey, searchFoods } from "@/lib/food-search";

describe("food search", () => {
  it("matches a food name", () => {
    const results = searchFoods(demoFoods, "chicken breast");
    expect(results[0]?.id).toBe("food-chicken-breast");
  });

  it("matches Indonesian synonyms", () => {
    const results = searchFoods(demoFoods, "nasi goreng");
    expect(results[0]?.id).toBe("food-fried-rice");
  });

  it("ignores accents and punctuation", () => {
    const results = searchFoods(demoFoods, "  Oatmeal!  ");
    expect(results.some((food) => food.id === "food-oats")).toBe(true);
  });

  it("filters by category before ranking", () => {
    const results = searchFoods(demoFoods, "", { category: "fruits" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((food) => food.category === "fruits")).toBe(true);
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchFoods(demoFoods, "zzzz-not-a-food")).toEqual([]);
  });

  it("honours the result limit", () => {
    expect(searchFoods(demoFoods, "", { limit: 5 })).toHaveLength(5);
  });

  it("maps categories to translation keys", () => {
    expect(categoryLabelKey("rice-grains")).toBe("catalog.category.rice-grains");
  });
});
