export type EntityId = string;
export type IsoDateTime = string;

export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";
export type ThemePreference = "light" | "dark" | "system";
export type LanguagePreference = "en" | "id";

export type BiologicalSex = "female" | "male";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very-active"
  | "extra-active";
export type FitnessGoal = "weight-loss" | "maintenance" | "muscle-gain";
export type MacroPreference = "balanced" | "higher-protein" | "custom";
export interface CustomMacroSplit {
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
}
export type FoodCategory =
  | "rice-grains"
  | "meat"
  | "seafood"
  | "vegetables"
  | "fruits"
  | "dairy"
  | "beverages"
  | "snacks"
  | "others";

export interface EntityMeta {
  id: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface UserProfile extends EntityMeta {
  displayName?: string;
  ageYears?: number;
  biologicalSex?: BiologicalSex;
  heightCm?: number;
  currentWeightKg?: number;
  activityLevel?: ActivityLevel;
  workoutDaysPerWeek?: number;
  fitnessGoal?: FitnessGoal;
  targetWeightKg?: number;
  desiredRateKgPerWeek?: number;
  macroPreference?: MacroPreference;
  customMacroSplit?: CustomMacroSplit;
}

export interface NutritionTargets extends EntityMeta {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  source?: "manual" | "calculated";
  bmr?: number;
  tdee?: number;
  activityPal?: number;
  formulaVersion?: 1;
  calculatedAt?: IsoDateTime;
  requestedDeficitKcal?: number;
  actualDeficitKcal?: number;
  calorieGuardrailKcal?: number;
}

export interface FoodNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturatedFat: number;
  sodium: number;
}

export interface Food extends EntityMeta, FoodNutrition {
  name: string;
  category: FoodCategory;
  defaultGrams: number;
  synonyms: string[];
  source: string;
  isDemo?: boolean;
}

export interface CustomFood extends Food {
  isCustom: true;
}

export type CustomFoodInput = Pick<
  CustomFood,
  | "name"
  | "category"
  | "defaultGrams"
  | "calories"
  | "protein"
  | "carbohydrates"
  | "fat"
  | "fiber"
  | "sugar"
  | "saturatedFat"
  | "sodium"
>;

export interface MealSession extends EntityMeta {
  date: string;
  mealCategory: MealCategory;
}

export interface FavoriteFood extends EntityMeta {
  foodId: string;
  source?: "catalog" | "custom";
}

export interface SavedMealItem {
  food: Food;
  grams: number;
}

export interface SavedMeal extends EntityMeta {
  name: string;
  items: SavedMealItem[];
}

export interface MealCartItem {
  food: Food;
  grams: number;
}

export interface MealCartDraft extends EntityMeta {
  items: MealCartItem[];
  mealCategory: MealCategory;
  date: string;
}

export interface FoodEntry extends EntityMeta {
  foodId: string;
  name: string;
  grams: number;
  logDate?: string;
  servingLabel?: string;
  mealCategory: MealCategory;
  loggedAt: IsoDateTime;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  sodium?: number;
  sessionId?: string;
}

export interface WeightRecord extends EntityMeta {
  weight: number;
  loggedAt: IsoDateTime;
}

export interface AppSettings {
  theme: ThemePreference;
  language: LanguagePreference;
}
