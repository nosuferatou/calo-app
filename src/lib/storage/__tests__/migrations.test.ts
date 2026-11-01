import { beforeEach, describe, expect, it } from "vitest";
import { readStorage } from "@/lib/storage/client";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  runMigrations,
  type MigrationRegistry,
} from "@/lib/storage/migrations";
import { getSchemaVersion } from "@/lib/storage/version";

const profileVersion = getSchemaVersion(STORAGE_KEYS.profile);

describe("storage migrations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns current-version data unchanged", () => {
    const data = { id: "profile-1" };

    expect(runMigrations(STORAGE_KEYS.profile, profileVersion, data)).toEqual({
      ok: true,
      data,
      version: profileVersion,
    });
  });

  it("rejects newer versions", () => {
    expect(
      runMigrations(STORAGE_KEYS.profile, profileVersion + 1, {}),
    ).toEqual({
      ok: false,
      reason: "newer-version",
      fromVersion: profileVersion + 1,
    });
  });

  it("fails when no migration is registered", () => {
    expect(runMigrations(STORAGE_KEYS.profile, 0, {})).toEqual({
      ok: false,
      reason: "missing-migration",
      fromVersion: 0,
    });
  });

  it("applies a registered migration", () => {
    const registry: MigrationRegistry = {
      [STORAGE_KEYS.profile]: {
        0: (data) => ({
          ...(data as Record<string, unknown>),
          id: "migrated",
        }),
      },
    };

    expect(
      runMigrations(STORAGE_KEYS.profile, 0, { id: "old" }, registry),
    ).toEqual({
      ok: true,
      data: { id: "migrated" },
      version: profileVersion,
    });
  });

  it("uses a per-key target version", () => {
    expect(
      runMigrations(STORAGE_KEYS.profile, 0, { id: "old" }, {}, 0),
    ).toEqual({
      ok: true,
      data: { id: "old" },
      version: 0,
    });
  });

  it("reports a migration that throws", () => {
    const registry: MigrationRegistry = {
      [STORAGE_KEYS.profile]: {
        0: () => {
          throw new Error("broken migration");
        },
      },
    };

    expect(runMigrations(STORAGE_KEYS.profile, 0, {}, registry)).toEqual({
      ok: false,
      reason: "migration-failed",
      fromVersion: 0,
    });
  });

  it("migrates on read without rewriting the stored value", () => {
    const raw = JSON.stringify({
      version: 0,
      data: { id: "profile-1" },
    });
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    const registry: MigrationRegistry = {
      [STORAGE_KEYS.profile]: {
        0: (data) => ({
          ...(data as Record<string, unknown>),
          createdAt: "2026-10-31T10:00:00.000Z",
          updatedAt: "2026-10-31T10:00:00.000Z",
        }),
      },
    };

    expect(readStorage(STORAGE_KEYS.profile, registry)).toEqual({
      status: "ok",
      data: {
        id: "profile-1",
        createdAt: "2026-10-31T10:00:00.000Z",
        updatedAt: "2026-10-31T10:00:00.000Z",
      },
      version: profileVersion,
    });
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBe(raw);
  });
});
