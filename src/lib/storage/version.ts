import type { StorageKey } from "@/types/storage";
import { STORAGE_KEYS } from "./keys";

// Each domain advances independently so one schema change never forces
// migrations for untouched domains.
export const SCHEMA_VERSIONS = {
  [STORAGE_KEYS.app]: 1,
  [STORAGE_KEYS.profile]: 1,
  [STORAGE_KEYS.targets]: 1,
  [STORAGE_KEYS.foodDiary]: 1,
  [STORAGE_KEYS.customFoods]: 1,
  [STORAGE_KEYS.collections]: 1,
  [STORAGE_KEYS.weightRecords]: 1,
  [STORAGE_KEYS.mealCartDraft]: 1,
  [STORAGE_KEYS.settings]: 1,
  [STORAGE_KEYS.searchHistory]: 1,
} as const satisfies Record<StorageKey, number>;

export function getSchemaVersion(key: StorageKey): number {
  return SCHEMA_VERSIONS[key];
}
