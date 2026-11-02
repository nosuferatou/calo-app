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

/**
 * Pre-paint theme hint, written by `applyTheme` and read by the blocking script
 * in the root layout. The authoritative preference lives in `calo:settings`
 * (demo) or `account_preferences` (cloud); the cloud value only arrives after
 * an authenticated fetch, which is too late for the first frame. This key is a
 * display hint only and is never treated as a source of truth.
 */
export const THEME_HINT_KEY = "calo:theme";

export function buildQuarantineKey(
  key: StorageKey,
  timestamp = Date.now(),
): string {
  return `${QUARANTINE_KEY_PREFIX}${key}:${timestamp}`;
}
