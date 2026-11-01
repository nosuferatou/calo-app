import type { StorageKey } from "@/types/storage";

export const STORAGE_KEYS = {
  app: "calo:app",
  profile: "calo:profile",
  targets: "calo:targets",
  foodDiary: "calo:food-diary",
  customFoods: "calo:custom-foods",
  collections: "calo:collections",
  weightRecords: "calo:weight-records",
  mealCartDraft: "calo:meal-cart-draft",
  settings: "calo:settings",
  searchHistory: "calo:search-history",
} as const satisfies Record<string, StorageKey>;

export const STORAGE_PROBE_KEY = "calo:storage-probe";
export const QUARANTINE_KEY_PREFIX = "calo:corrupt:";

export function buildQuarantineKey(
  key: StorageKey,
  timestamp = Date.now(),
): string {
  return `${QUARANTINE_KEY_PREFIX}${key}:${timestamp}`;
}
