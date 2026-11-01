import type { StorageKey } from "@/types/storage";
import { getSchemaVersion } from "./version";

export type Migration = (data: unknown) => unknown;

export type MigrationRegistry = Partial<
  Record<StorageKey, Record<number, Migration>>
>;

export type MigrationFailureReason =
  | "newer-version"
  | "missing-migration"
  | "migration-failed";

export type MigrationResult =
  | { ok: true; data: unknown; version: number }
  | { ok: false; reason: MigrationFailureReason; fromVersion: number };

// Migrations are keyed by the version they upgrade from.
export const migrations: MigrationRegistry = {};

export function runMigrations(
  key: StorageKey,
  version: number,
  data: unknown,
  registry: MigrationRegistry = migrations,
  targetVersion: number = getSchemaVersion(key),
): MigrationResult {
  if (version > targetVersion) {
    return { ok: false, reason: "newer-version", fromVersion: version };
  }

  let currentVersion = version;
  let currentData = data;

  while (currentVersion < targetVersion) {
    const migration = registry[key]?.[currentVersion];

    if (!migration) {
      return {
        ok: false,
        reason: "missing-migration",
        fromVersion: currentVersion,
      };
    }

    try {
      currentData = migration(currentData);
    } catch {
      return {
        ok: false,
        reason: "migration-failed",
        fromVersion: currentVersion,
      };
    }

    currentVersion += 1;
  }

  return { ok: true, data: currentData, version: currentVersion };
}
