import { demoFoods } from "@/data/foods";
import { addDays, parseDateKey, todayKey } from "@/lib/dates";
import { scaleFoodNutrition } from "@/lib/nutrition";
import type {
  FavoriteFood,
  Food,
  FoodEntry,
  MealCategory,
  NutritionTargets,
  SavedMeal,
  UserProfile,
  WeightRecord,
} from "@/types";

const CREATED_AT = "2026-10-01T08:00:00.000Z";

// Mirrors the app's `weightIso`/`entryIso` convention: build the timestamp from
// the local date so a record logged on a given day keeps that local day in every
// timezone. A fixed `T07:00:00.000Z` suffix would drift to the previous local day
// in negative UTC offsets and would sort after app-generated same-day records.
function localIso(dateKey: string, hour: number, minute: number): string {
  const date = parseDateKey(dateKey);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const mockUserProfile: UserProfile = {
  id: "user-mock-001",
  createdAt: CREATED_AT,
  updatedAt: "2026-10-31T07:00:00.000Z",
  displayName: "Alex",
  ageYears: 32,
  biologicalSex: "male",
  heightCm: 178,
  currentWeightKg: 78.6,
  activityLevel: "moderate",
  workoutDaysPerWeek: 4,
  fitnessGoal: "maintenance",
  targetWeightKg: 76,
  desiredRateKgPerWeek: 0.25,
  macroPreference: "balanced",
};

export const mockNutritionTargets: NutritionTargets = {
  id: "target-mock-001",
  createdAt: CREATED_AT,
  updatedAt: "2026-10-31T07:00:00.000Z",
  calories: 2200,
  protein: 150,
  carbohydrates: 180,
  fat: 73,
  source: "manual",
};

export const mockWeightRecords: WeightRecord[] = [
  { id: "weight-mock-001", createdAt: CREATED_AT, updatedAt: CREATED_AT, weight: 80.2, loggedAt: localIso(addDays(todayKey(), -30), 7, 0) },
  { id: "weight-mock-002", createdAt: CREATED_AT, updatedAt: CREATED_AT, weight: 79.8, loggedAt: localIso(addDays(todayKey(), -24), 7, 0) },
  { id: "weight-mock-003", createdAt: CREATED_AT, updatedAt: CREATED_AT, weight: 79.5, loggedAt: localIso(addDays(todayKey(), -18), 7, 0) },
  { id: "weight-mock-004", createdAt: CREATED_AT, updatedAt: CREATED_AT, weight: 79.1, loggedAt: localIso(addDays(todayKey(), -12), 7, 0) },
  { id: "weight-mock-005", createdAt: CREATED_AT, updatedAt: CREATED_AT, weight: 78.9, loggedAt: localIso(addDays(todayKey(), -6), 7, 0) },
  { id: "weight-mock-006", createdAt: CREATED_AT, updatedAt: CREATED_AT, weight: 78.6, loggedAt: localIso(todayKey(), 7, 0) },
];

export const mockRecentSearches = ["nasi", "chicken", "tempeh"];

const foodById = new Map(demoFoods.map((food) => [food.id, food]));

function getFood(id: string): Food {
  const food = foodById.get(id);

  if (!food) {
    throw new Error(`Missing demo food: ${id}`);
  }

  return food;
}

function makeEntry(options: {
  id: string;
  foodId: string;
  grams: number;
  dateKey: string;
  hour: number;
  minute: number;
  mealCategory: MealCategory;
  sessionId: string;
}): FoodEntry {
  const food = getFood(options.foodId);
  const nutrition = scaleFoodNutrition(food, options.grams);
  const loggedAt = localIso(options.dateKey, options.hour, options.minute);

  return {
    id: options.id,
    createdAt: loggedAt,
    updatedAt: loggedAt,
    foodId: food.id,
    name: food.name,
    grams: options.grams,
    mealCategory: options.mealCategory,
    loggedAt,
    sessionId: options.sessionId,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbohydrates: nutrition.carbohydrates,
    fat: nutrition.fat,
    fiber: nutrition.fiber,
    sugar: nutrition.sugar,
    saturatedFat: nutrition.saturatedFat,
    sodium: nutrition.sodium,
  };
}

const today = todayKey();

export const mockFoodEntries: FoodEntry[] = [
  makeEntry({ id: "entry-today-001", foodId: "food-scrambled-egg", grams: 180, dateKey: today, hour: 7, minute: 10, mealCategory: "breakfast", sessionId: `session-${today}-breakfast` }),
  makeEntry({ id: "entry-today-002", foodId: "food-greek-yogurt", grams: 250, dateKey: today, hour: 7, minute: 20, mealCategory: "breakfast", sessionId: `session-${today}-breakfast` }),
  makeEntry({ id: "entry-today-003", foodId: "food-chicken-breast", grams: 150, dateKey: today, hour: 12, minute: 15, mealCategory: "lunch", sessionId: `session-${today}-lunch` }),
  makeEntry({ id: "entry-today-004", foodId: "food-brown-rice", grams: 150, dateKey: today, hour: 12, minute: 20, mealCategory: "lunch", sessionId: `session-${today}-lunch` }),
  makeEntry({ id: "entry-today-005", foodId: "food-salmon", grams: 170, dateKey: today, hour: 18, minute: 30, mealCategory: "dinner", sessionId: `session-${today}-dinner` }),
  makeEntry({ id: "entry-today-006", foodId: "food-broccoli", grams: 100, dateKey: today, hour: 18, minute: 35, mealCategory: "dinner", sessionId: `session-${today}-dinner` }),
  makeEntry({ id: "entry-today-007", foodId: "food-almonds", grams: 30, dateKey: today, hour: 15, minute: 45, mealCategory: "snack", sessionId: `session-${today}-snack` }),
];

const HISTORY_OFFSETS = [
  1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 24, 25,
  26, 27, 28, 29, 30,
];

export const mockHistoricalEntries: FoodEntry[] = HISTORY_OFFSETS.flatMap(
  (offset, index) => {
    const dateKey = addDays(today, -offset);
    const variation = 1 + (index % 5) * 0.04;
    const sessionBase = `session-${dateKey}`;

    return [
      makeEntry({
        id: `history-${offset}-breakfast-1`,
        foodId: "food-oats",
        grams: 200 * variation,
        dateKey,
        hour: 7,
        minute: 15,
        mealCategory: "breakfast",
        sessionId: `${sessionBase}-breakfast`,
      }),
      makeEntry({
        id: `history-${offset}-breakfast-2`,
        foodId: "food-banana",
        grams: 120,
        dateKey,
        hour: 7,
        minute: 25,
        mealCategory: "breakfast",
        sessionId: `${sessionBase}-breakfast`,
      }),
      makeEntry({
        id: `history-${offset}-lunch-1`,
        foodId: "food-white-rice",
        grams: 150 * variation,
        dateKey,
        hour: 12,
        minute: 10,
        mealCategory: "lunch",
        sessionId: `${sessionBase}-lunch`,
      }),
      makeEntry({
        id: `history-${offset}-lunch-2`,
        foodId: "food-chicken-breast",
        grams: 150,
        dateKey,
        hour: 12,
        minute: 15,
        mealCategory: "lunch",
        sessionId: `${sessionBase}-lunch`,
      }),
      makeEntry({
        id: `history-${offset}-lunch-3`,
        foodId: "food-broccoli",
        grams: 100,
        dateKey,
        hour: 12,
        minute: 20,
        mealCategory: "lunch",
        sessionId: `${sessionBase}-lunch`,
      }),
      makeEntry({
        id: `history-${offset}-dinner-1`,
        foodId: "food-salmon",
        grams: 120,
        dateKey,
        hour: 18,
        minute: 40,
        mealCategory: "dinner",
        sessionId: `${sessionBase}-dinner`,
      }),
      makeEntry({
        id: `history-${offset}-dinner-2`,
        foodId: "food-sweet-potato",
        grams: 150,
        dateKey,
        hour: 18,
        minute: 45,
        mealCategory: "dinner",
        sessionId: `${sessionBase}-dinner`,
      }),
      makeEntry({
        id: `history-${offset}-snack-1`,
        foodId: "food-almonds",
        grams: 25,
        dateKey,
        hour: 16,
        minute: 0,
        mealCategory: "snack",
        sessionId: `${sessionBase}-snack`,
      }),
    ];
  },
);

export const mockDiaryEntries: FoodEntry[] = [
  ...mockHistoricalEntries,
  ...mockFoodEntries,
];

export const mockFavorites: FavoriteFood[] = [
  { id: "favorite-001", createdAt: CREATED_AT, updatedAt: CREATED_AT, foodId: "food-chicken-breast" },
  { id: "favorite-002", createdAt: CREATED_AT, updatedAt: CREATED_AT, foodId: "food-greek-yogurt" },
  { id: "favorite-003", createdAt: CREATED_AT, updatedAt: CREATED_AT, foodId: "food-white-rice" },
  { id: "favorite-004", createdAt: CREATED_AT, updatedAt: CREATED_AT, foodId: "food-almonds" },
];

export const mockSavedMeals: SavedMeal[] = [
  {
    id: "saved-meal-001",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    name: "Chicken rice bowl",
    items: [
      { food: getFood("food-white-rice"), grams: 150 },
      { food: getFood("food-chicken-breast"), grams: 150 },
      { food: getFood("food-broccoli"), grams: 100 },
    ],
  },
  {
    id: "saved-meal-002",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    name: "High-protein breakfast",
    items: [
      { food: getFood("food-oats"), grams: 200 },
      { food: getFood("food-greek-yogurt"), grams: 200 },
      { food: getFood("food-banana"), grams: 120 },
    ],
  },
  {
    id: "saved-meal-003",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    name: "Salmon dinner",
    items: [
      { food: getFood("food-salmon"), grams: 150 },
      { food: getFood("food-sweet-potato"), grams: 150 },
      { food: getFood("food-broccoli"), grams: 100 },
    ],
  },
];
