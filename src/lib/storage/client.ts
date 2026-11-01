import type { ZodType } from "zod";
import { AppError } from "@/lib/errors";
import {
  storageEnvelopeSchema,
  storageSchemas,
} from "@/lib/validation/schemas";
import type {
  DestructiveStorageOptions,
  QuarantineRecord,
  StorageErrorCode,
  StorageFailure,
  StorageKey,
  StorageMutationResult,
  StorageResult,
  StorageStatus,
  StoredDataMap,
} from "@/types/storage";
import {
  buildQuarantineKey,
  QUARANTINE_KEY_PREFIX,
  STORAGE_KEYS,
  STORAGE_PROBE_KEY,
} from "./keys";
import { migrations, runMigrations, type MigrationRegistry } from "./migrations";
import { getSchemaVersion } from "./version";

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isStorageAvailable(): boolean {
  const storage = getBrowserStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_PROBE_KEY, "1");
    storage.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function initializeStorage(): StorageStatus {
  const available = isStorageAvailable();

  return { available, readOnly: !available };
}

function getSchema<K extends StorageKey>(
  key: K,
): ZodType<StoredDataMap[K]> {
  return storageSchemas[key] as ZodType<StoredDataMap[K]>;
}

function failure(
  code: StorageErrorCode,
  extra?: Pick<StorageFailure, "quarantineKey" | "version">,
): StorageFailure {
  return {
    status: "error",
    error: new AppError(code).toStorageError(),
    ...extra,
  };
}

function findQuarantineKey(
  storage: Storage,
  key: StorageKey,
  raw: string,
): string | null {
  const prefix = `${QUARANTINE_KEY_PREFIX}${key}:`;

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const candidate = storage.key(index);

      if (
        candidate !== null &&
        candidate.startsWith(prefix) &&
        storage.getItem(candidate) === raw
      ) {
        return candidate;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function nextQuarantineKey(storage: Storage, key: StorageKey): string {
  const base = buildQuarantineKey(key);

  if (storage.getItem(base) === null) {
    return base;
  }

  let suffix = 1;

  while (storage.getItem(`${base}-${suffix}`) !== null) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

function preserveQuarantine(
  storage: Storage,
  key: StorageKey,
  raw: string,
): string | null {
  const existing = findQuarantineKey(storage, key, raw);

  if (existing) {
    return existing;
  }

  try {
    const quarantineKey = nextQuarantineKey(storage, key);
    storage.setItem(quarantineKey, raw);
    return quarantineKey;
  } catch {
    return null;
  }
}

function quarantine(
  storage: Storage,
  key: StorageKey,
  raw: string,
  code: StorageErrorCode,
  version?: number,
): StorageFailure {
  const quarantineKey = preserveQuarantine(storage, key, raw);

  return failure(code, {
    quarantineKey: quarantineKey ?? undefined,
    version,
  });
}

function isQuotaExceeded(cause: unknown): boolean {
  if (typeof cause !== "object" || cause === null || !("name" in cause)) {
    return false;
  }

  const name = String((cause as { name: unknown }).name);
  return (
    name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
}

export function readStorage<K extends StorageKey>(
  key: K,
  registry: MigrationRegistry = migrations,
): StorageResult<StoredDataMap[K]> {
  const storage = getBrowserStorage();

  if (!storage) {
    return failure("storage-unavailable");
  }

  let raw: string | null;

  try {
    raw = storage.getItem(key);
  } catch {
    return failure("storage-read-failed");
  }

  if (raw === null) {
    return { status: "missing" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return quarantine(storage, key, raw, "invalid-json");
  }

  const envelope = storageEnvelopeSchema.safeParse(parsed);

  if (!envelope.success) {
    return quarantine(storage, key, raw, "invalid-envelope");
  }

  const { version } = envelope.data;
  const targetVersion = getSchemaVersion(key);

  if (version > targetVersion) {
    return failure("unsupported-version", { version });
  }

  const migrated = runMigrations(
    key,
    version,
    envelope.data.data,
    registry,
    targetVersion,
  );

  if (!migrated.ok) {
    const code =
      migrated.reason === "newer-version"
        ? "unsupported-version"
        : "migration-failed";

    return failure(code, { version });
  }

  const result = getSchema(key).safeParse(migrated.data);

  if (!result.success) {
    return quarantine(storage, key, raw, "validation-failed", version);
  }

  return { status: "ok", data: result.data, version: migrated.version };
}

export function writeStorage<K extends StorageKey>(
  key: K,
  data: StoredDataMap[K],
  registry: MigrationRegistry = migrations,
): StorageResult<StoredDataMap[K]> {
  const storage = getBrowserStorage();

  if (!storage || !isStorageAvailable()) {
    return failure("storage-unavailable");
  }

  const parsed = getSchema(key).safeParse(data);

  if (!parsed.success) {
    return failure("validation-failed");
  }

  const existing = readStorage(key, registry);

  if (existing.status === "error") {
    return existing;
  }

  const version = getSchemaVersion(key);
  const envelope = { version, data: parsed.data };

  try {
    storage.setItem(key, JSON.stringify(envelope));
  } catch (cause) {
    return failure(
      isQuotaExceeded(cause) ? "quota-exceeded" : "storage-write-failed",
    );
  }

  return { status: "ok", data: parsed.data, version };
}

export function removeStorage(
  key: StorageKey,
  options: DestructiveStorageOptions,
): StorageMutationResult {
  if (options?.confirmed !== true) {
    return failure("confirmation-required");
  }

  const storage = getBrowserStorage();

  if (!storage) {
    return failure("storage-unavailable");
  }

  try {
    storage.removeItem(key);
    return { status: "ok" };
  } catch {
    return failure("storage-remove-failed");
  }
}

export function recoverStorage(
  key: StorageKey,
  options: DestructiveStorageOptions,
): StorageMutationResult {
  if (options?.confirmed !== true) {
    return failure("confirmation-required");
  }

  const storage = getBrowserStorage();

  if (!storage) {
    return failure("storage-unavailable");
  }

  const readResult = readStorage(key);

  if (readResult.status === "missing") {
    return { status: "ok" };
  }

  if (readResult.status === "ok") {
    return failure("recovery-not-required");
  }

  if (readResult.error.code === "unsupported-version") {
    return failure("unsupported-version", { version: readResult.version });
  }

  if (
    readResult.error.code === "storage-unavailable" ||
    readResult.error.code === "storage-read-failed"
  ) {
    return failure(readResult.error.code);
  }

  let raw: string | null;

  try {
    raw = storage.getItem(key);
  } catch {
    return failure("storage-read-failed");
  }

  if (raw === null) {
    return { status: "ok" };
  }

  const quarantineKey = preserveQuarantine(storage, key, raw);

  if (!quarantineKey) {
    return failure("storage-write-failed");
  }

  try {
    storage.removeItem(key);
  } catch {
    return failure("storage-remove-failed");
  }

  return { status: "ok", quarantineKey };
}

export function listQuarantineRecords(): QuarantineRecord[] {
  const storage = getBrowserStorage();

  if (!storage) {
    return [];
  }

  const knownKeys = Object.values(STORAGE_KEYS);
  const records: QuarantineRecord[] = [];

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const quarantineKey = storage.key(index);

      if (
        quarantineKey === null ||
        !quarantineKey.startsWith(QUARANTINE_KEY_PREFIX)
      ) {
        continue;
      }

      const sourceKey = knownKeys.find((candidate) =>
        quarantineKey.startsWith(`${QUARANTINE_KEY_PREFIX}${candidate}:`),
      );

      if (!sourceKey) {
        continue;
      }

      const suffix = quarantineKey.slice(
        `${QUARANTINE_KEY_PREFIX}${sourceKey}:`.length,
      );
      const timestamp = Number.parseInt(suffix, 10);

      records.push({
        quarantineKey,
        sourceKey,
        timestamp: Number.isNaN(timestamp) ? 0 : timestamp,
      });
    }
  } catch {
    return records;
  }

  return records.sort((a, b) => b.timestamp - a.timestamp);
}

function isKnownStorageKey(value: string): value is StorageKey {
  return (Object.values(STORAGE_KEYS) as string[]).includes(value);
}

export function resetAllStorage(
  options: DestructiveStorageOptions,
): StorageMutationResult {
  if (options?.confirmed !== true) {
    return failure("confirmation-required");
  }

  const storage = getBrowserStorage();

  if (!storage) {
    return failure("storage-unavailable");
  }

  const keysToRemove: string[] = [];

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const storageKey = storage.key(index);

      if (storageKey === null) {
        continue;
      }

      if (
        isKnownStorageKey(storageKey) ||
        storageKey.startsWith(QUARANTINE_KEY_PREFIX) ||
        storageKey === STORAGE_PROBE_KEY
      ) {
        keysToRemove.push(storageKey);
      }
    }

    keysToRemove.forEach((storageKey) => storage.removeItem(storageKey));
    return { status: "ok" };
  } catch {
    return failure("storage-remove-failed");
  }
}
