import type {
  AppSettings,
  CustomFood,
  FavoriteFood,
  FoodEntry,
  MealCartDraft,
  NutritionTargets,
  SavedMeal,
  UserProfile,
  WeightRecord,
} from "./domain";

export type StorageKey =
  | "calo:app"
  | "calo:profile"
  | "calo:targets"
  | "calo:food-diary"
  | "calo:custom-foods"
  | "calo:collections"
  | "calo:weight-records"
  | "calo:meal-cart-draft"
  | "calo:settings"
  | "calo:search-history";

export interface StorageEnvelope<T> {
  version: number;
  data: T;
}

export type AppData = Record<string, unknown>;

export interface FoodDiaryData {
  entries: FoodEntry[];
}

export interface CustomFoodsData {
  foods: CustomFood[];
}

export interface CollectionsData {
  favoriteFoods: FavoriteFood[];
  savedMeals: SavedMeal[];
}

export interface WeightRecordsData {
  records: WeightRecord[];
}

export interface SearchHistoryData {
  queries: string[];
}

export type StoredDataMap = {
  "calo:app": AppData;
  "calo:profile": UserProfile;
  "calo:targets": NutritionTargets;
  "calo:food-diary": FoodDiaryData;
  "calo:custom-foods": CustomFoodsData;
  "calo:collections": CollectionsData;
  "calo:weight-records": WeightRecordsData;
  "calo:meal-cart-draft": MealCartDraft;
  "calo:settings": AppSettings;
  "calo:search-history": SearchHistoryData;
};

export type StorageErrorCode =
  | "storage-unavailable"
  | "storage-read-failed"
  | "storage-write-failed"
  | "storage-remove-failed"
  | "invalid-json"
  | "invalid-envelope"
  | "validation-failed"
  | "unsupported-version"
  | "migration-failed"
  | "quota-exceeded"
  | "confirmation-required"
  | "recovery-not-required"
  | "unexpected";

export interface StorageError {
  code: StorageErrorCode;
  message: string;
}

export interface StorageSuccess<T> {
  status: "ok";
  data: T;
  version: number;
}

export interface StorageMissing {
  status: "missing";
}

export interface StorageFailure {
  status: "error";
  error: StorageError;
  quarantineKey?: string;
  version?: number;
}

export type StorageResult<T> =
  | StorageSuccess<T>
  | StorageMissing
  | StorageFailure;

export interface StorageMutationSuccess {
  status: "ok";
  quarantineKey?: string;
}

export type StorageMutationResult = StorageMutationSuccess | StorageFailure;

export interface StorageStatus {
  available: boolean;
  readOnly: boolean;
}

export interface DestructiveStorageOptions {
  confirmed: true;
}

export interface QuarantineRecord {
  quarantineKey: string;
  sourceKey: StorageKey;
  timestamp: number;
}
