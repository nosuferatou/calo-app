import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  appDataSchema,
  appSettingsSchema,
  foodDiaryDataSchema,
  storageEnvelopeSchema,
  storageSchemas,
  userProfileSchema,
} from "@/lib/validation/schemas";

const profile = {
  id: "profile-1",
  createdAt: "2026-10-31T10:00:00.000Z",
  updatedAt: "2026-10-31T10:00:00.000Z",
};

describe("validation schemas", () => {
  it("accepts a valid entity skeleton", () => {
    expect(userProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("rejects an entity without an id", () => {
    const withoutId: Record<string, unknown> = { ...profile };
    delete withoutId.id;

    expect(userProfileSchema.safeParse(withoutId).success).toBe(false);
  });

  it("rejects invalid ISO timestamps", () => {
    expect(
      userProfileSchema.safeParse({
        ...profile,
        createdAt: "yesterday",
      }).success,
    ).toBe(false);
  });

  it("preserves unknown fields for future versions", () => {
    const result = userProfileSchema.safeParse({
      ...profile,
      futureField: "kept",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toMatchObject({ futureField: "kept" });
    }
  });

  it("accepts a valid storage envelope", () => {
    expect(
      storageEnvelopeSchema.safeParse({
        version: 1,
        data: profile,
      }).success,
    ).toBe(true);
  });

  it("rejects an envelope with a missing or invalid version", () => {
    expect(
      storageEnvelopeSchema.safeParse({ data: profile }).success,
    ).toBe(false);
    expect(
      storageEnvelopeSchema.safeParse({ version: -1, data: profile })
        .success,
    ).toBe(false);
    expect(
      storageEnvelopeSchema.safeParse({ version: "1", data: profile })
        .success,
    ).toBe(false);
  });

  it("accepts valid settings and rejects unknown preferences", () => {
    expect(
      appSettingsSchema.safeParse({ theme: "system", language: "id" })
        .success,
    ).toBe(true);
    expect(
      appSettingsSchema.safeParse({ theme: "midnight", language: "id" })
        .success,
    ).toBe(false);
  });

  it("accepts an empty food diary and rejects a missing entries array", () => {
    expect(foodDiaryDataSchema.safeParse({ entries: [] }).success).toBe(
      true,
    );
    expect(foodDiaryDataSchema.safeParse({}).success).toBe(false);
  });

  it("accepts arbitrary app-level data", () => {
    expect(appDataSchema.safeParse({ future: true }).success).toBe(true);
  });

  it("has a schema for every storage key", () => {
    expect(Object.keys(storageSchemas).sort()).toEqual(
      Object.values(STORAGE_KEYS).sort(),
    );
  });
});
