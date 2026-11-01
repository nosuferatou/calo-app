import type { Food, FoodCategory } from "@/types";

export const FOOD_CATEGORIES: FoodCategory[] = [
  "rice-grains",
  "meat",
  "seafood",
  "vegetables",
  "fruits",
  "dairy",
  "beverages",
  "snacks",
  "others",
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreFood(food: Food, query: string): number {
  const normalizedName = normalize(food.name);
  const normalizedSynonyms = food.synonyms.map(normalize);
  const terms = normalizedSynonyms.length > 0 ? [normalizedName, ...normalizedSynonyms] : [normalizedName];

  if (terms.some((term) => term === query)) {
    return 100;
  }

  if (terms.some((term) => term.startsWith(query))) {
    return 80;
  }

  if (terms.some((term) => term.split(" ").some((word) => word.startsWith(query)))) {
    return 60;
  }

  if (terms.some((term) => term.includes(query))) {
    return 40;
  }

  return 0;
}

export interface SearchFoodsOptions {
  category?: FoodCategory | "all";
  limit?: number;
}

export function searchFoods(
  foods: Food[],
  query: string,
  options: SearchFoodsOptions = {},
): Food[] {
  const normalizedQuery = normalize(query);
  const category = options.category ?? "all";

  const filtered =
    category === "all"
      ? foods
      : foods.filter((food) => food.category === category);

  const ranked = filtered
    .map((food) => ({
      food,
      score: normalizedQuery ? scoreFood(food, normalizedQuery) : 1,
    }))
    .filter((item) => (normalizedQuery ? item.score > 0 : true))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.food.name.localeCompare(b.food.name);
    })
    .map((item) => item.food);

  return typeof options.limit === "number" ? ranked.slice(0, options.limit) : ranked;
}

export function categoryLabelKey(
  category: FoodCategory,
): `catalog.category.${FoodCategory}` {
  return `catalog.category.${category}`;
}
