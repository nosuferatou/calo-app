import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  initializeStorage,
  isStorageAvailable,
  listQuarantineRecords,
  readStorage,
  recoverStorage,
  removeStorage,
  resetAllStorage,
  writeStorage,
} from "@/lib/storage/client";
import { QUARANTINE_KEY_PREFIX, STORAGE_KEYS } from "@/lib/storage/keys";
import { getSchemaVersion } from "@/lib/storage/version";
import type { UserProfile } from "@/types/domain";

const profile: UserProfile = {
  id: "profile-1",
  createdAt: "2026-10-31T10:00:00.000Z",
  updatedAt: "2026-10-31T10:00:00.000Z",
};

const profileVersion = getSchemaVersion(STORAGE_KEYS.profile);

type ErrorResult = {
  status: "error";
  error: { code: string };
  quarantineKey?: string;
  version?: number;
};

function expectError(
  result: {
    status: string;
    error?: { code: string };
    quarantineKey?: string;
    version?: number;
  },
  code: string,
): ErrorResult {
  expect(result.status).toBe("error");

  if (result.status !== "error" || !result.error) {
    throw new Error("Expected a storage error");
  }

  expect(result.error.code).toBe(code);
  return result as ErrorResult;
}

describe("storage client", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is safe during server rendering", () => {
    vi.stubGlobal("window", undefined);

    expect(isStorageAvailable()).toBe(false);
    expect(initializeStorage()).toEqual({
      available: false,
      readOnly: true,
    });
    expectError(readStorage(STORAGE_KEYS.profile), "storage-unavailable");
    expectError(
      writeStorage(STORAGE_KEYS.profile, profile),
      "storage-unavailable",
    );
  });

  it("initializes without writing user data", () => {
    expect(initializeStorage()).toEqual({
      available: true,
      readOnly: false,
    });
    expect(localStorage.length).toBe(0);
  });

  it("returns missing for keys that do not exist", () => {
    expect(readStorage(STORAGE_KEYS.profile)).toEqual({ status: "missing" });
  });

  it("writes and reads a versioned envelope", () => {
    const writeResult = writeStorage(STORAGE_KEYS.profile, profile);

    expect(writeResult).toEqual({
      status: "ok",
      data: profile,
      version: profileVersion,
    });

    const raw = localStorage.getItem(STORAGE_KEYS.profile);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "")).toEqual({
      version: profileVersion,
      data: profile,
    });

    expect(readStorage(STORAGE_KEYS.profile)).toEqual({
      status: "ok",
      data: profile,
      version: profileVersion,
    });
  });

  it("rejects invalid data before writing", () => {
    const result = writeStorage(STORAGE_KEYS.profile, {
      ...profile,
      id: "",
    });

    expectError(result, "validation-failed");
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });

  it("binds each key to its own schema", () => {
    const settings = { theme: "light", language: "en" } as const;

    expectError(
      writeStorage(
        STORAGE_KEYS.profile,
        settings as unknown as UserProfile,
      ),
      "validation-failed",
    );
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();

    expect(writeStorage(STORAGE_KEYS.settings, settings).status).toBe("ok");
  });

  it("quarantines malformed JSON and keeps the original value", () => {
    const raw = "{not-json";
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    const result = expectError(
      readStorage(STORAGE_KEYS.profile),
      "invalid-json",
    );

    expect(result.quarantineKey).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBe(raw);
    expect(localStorage.getItem(result.quarantineKey ?? "")).toBe(raw);
  });

  it("quarantines an invalid envelope", () => {
    const raw = JSON.stringify({ data: profile });
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    const result = expectError(
      readStorage(STORAGE_KEYS.profile),
      "invalid-envelope",
    );

    expect(result.quarantineKey).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBe(raw);
  });

  it("quarantines data that fails schema validation", () => {
    const raw = JSON.stringify({
      version: profileVersion,
      data: { ...profile, id: "" },
    });
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    const result = expectError(
      readStorage(STORAGE_KEYS.profile),
      "validation-failed",
    );

    expect(result.quarantineKey).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBe(raw);
  });

  it("refuses to overwrite a newer schema version", () => {
    const raw = JSON.stringify({
      version: profileVersion + 1,
      data: profile,
    });
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    const readResult = expectError(
      readStorage(STORAGE_KEYS.profile),
      "unsupported-version",
    );
    expect(readResult.version).toBe(profileVersion + 1);
    expect(readResult.quarantineKey).toBeUndefined();

    expectError(
      writeStorage(STORAGE_KEYS.profile, profile),
      "unsupported-version",
    );
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBe(raw);
  });

  it("refuses to overwrite corrupted data", () => {
    const raw = "{still-broken";
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    const result = expectError(
      writeStorage(STORAGE_KEYS.profile, profile),
      "invalid-json",
    );

    expect(result.quarantineKey).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBe(raw);
  });

  it("deduplicates repeated quarantine copies", () => {
    const raw = "{duplicate";
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    const first = expectError(readStorage(STORAGE_KEYS.profile), "invalid-json");
    const second = expectError(
      readStorage(STORAGE_KEYS.profile),
      "invalid-json",
    );

    expect(second.quarantineKey).toBe(first.quarantineKey);
    expect(listQuarantineRecords()).toHaveLength(1);
  });

  it("enumerates quarantine records with their source key", () => {
    localStorage.setItem(`${QUARANTINE_KEY_PREFIX}${STORAGE_KEYS.profile}:100`, "a");
    localStorage.setItem(`${QUARANTINE_KEY_PREFIX}${STORAGE_KEYS.settings}:200`, "b");
    localStorage.setItem("unrelated", "c");

    const records = listQuarantineRecords();

    expect(records).toEqual([
      {
        quarantineKey: `${QUARANTINE_KEY_PREFIX}${STORAGE_KEYS.settings}:200`,
        sourceKey: STORAGE_KEYS.settings,
        timestamp: 200,
      },
      {
        quarantineKey: `${QUARANTINE_KEY_PREFIX}${STORAGE_KEYS.profile}:100`,
        sourceKey: STORAGE_KEYS.profile,
        timestamp: 100,
      },
    ]);
  });

  it("requires confirmation before removing a key", () => {
    writeStorage(STORAGE_KEYS.profile, profile);

    expectError(
      removeStorage(STORAGE_KEYS.profile, {
        confirmed: false as unknown as true,
      }),
      "confirmation-required",
    );
    expect(localStorage.getItem(STORAGE_KEYS.profile)).not.toBeNull();

    expect(removeStorage(STORAGE_KEYS.profile, { confirmed: true })).toEqual({
      status: "ok",
    });
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });

  it("requires confirmation before recovering a domain", () => {
    localStorage.setItem(STORAGE_KEYS.profile, "{broken");

    expectError(
      recoverStorage(STORAGE_KEYS.profile, {
        confirmed: false as unknown as true,
      }),
      "confirmation-required",
    );
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBe("{broken");
  });

  it("does not recover data that is already valid", () => {
    writeStorage(STORAGE_KEYS.profile, profile);

    expectError(
      recoverStorage(STORAGE_KEYS.profile, { confirmed: true }),
      "recovery-not-required",
    );
    expect(localStorage.getItem(STORAGE_KEYS.profile)).not.toBeNull();
  });

  it("quarantines corrupted data before recovering the domain", () => {
    const raw = "{broken";
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    const result = recoverStorage(STORAGE_KEYS.profile, { confirmed: true });

    expect(result.status).toBe("ok");
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
    expect(listQuarantineRecords()).toHaveLength(1);

    if (result.status === "ok") {
      expect(localStorage.getItem(result.quarantineKey ?? "")).toBe(raw);
    }
  });

  it("never deletes data from a newer schema version", () => {
    const raw = JSON.stringify({
      version: profileVersion + 1,
      data: profile,
    });
    localStorage.setItem(STORAGE_KEYS.profile, raw);

    expectError(
      recoverStorage(STORAGE_KEYS.profile, { confirmed: true }),
      "unsupported-version",
    );
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBe(raw);
  });

  it("requires confirmation before resetting all data", () => {
    writeStorage(STORAGE_KEYS.profile, profile);

    expectError(
      resetAllStorage({ confirmed: false as unknown as true }),
      "confirmation-required",
    );
    expect(localStorage.getItem(STORAGE_KEYS.profile)).not.toBeNull();
  });

  it("resets only CALO keys and leaves unrelated data alone", () => {
    writeStorage(STORAGE_KEYS.profile, profile);
    localStorage.setItem(`${QUARANTINE_KEY_PREFIX}${STORAGE_KEYS.profile}:1`, "x");
    localStorage.setItem("unrelated-app", "keep-me");

    expect(resetAllStorage({ confirmed: true })).toEqual({ status: "ok" });
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
    expect(listQuarantineRecords()).toHaveLength(0);
    expect(localStorage.getItem("unrelated-app")).toBe("keep-me");
  });

  it("refuses to write when the storage probe fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    expectError(
      writeStorage(STORAGE_KEYS.profile, profile),
      "storage-unavailable",
    );
    expect(localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });

  it("reports unavailable storage when the probe fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    expect(isStorageAvailable()).toBe(false);
    expect(initializeStorage()).toEqual({
      available: false,
      readOnly: true,
    });
  });
});
