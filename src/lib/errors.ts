import type { StorageError, StorageErrorCode } from "@/types/storage";
import type { TranslationKey } from "@/lib/i18n";

export const ERROR_MESSAGES: Record<StorageErrorCode, string> = {
  "storage-unavailable":
    "Local storage is unavailable. CALO cannot save changes in this browser.",
  "storage-read-failed": "Saved data could not be read.",
  "storage-write-failed": "Changes could not be saved.",
  "storage-remove-failed": "Saved data could not be removed.",
  "invalid-json": "Saved data is not valid JSON.",
  "invalid-envelope": "Saved data has an unsupported shape.",
  "validation-failed": "Saved data failed validation.",
  "unsupported-version":
    "Saved data was created by a newer version of CALO. Reload the app or update CALO before changing it.",
  "migration-failed": "Saved data could not be upgraded.",
  "quota-exceeded": "Browser storage is full. Free some space and try again.",
  "confirmation-required": "This action needs explicit confirmation.",
  "recovery-not-required": "This data does not need recovery.",
  unexpected: "Something went wrong. Try again.",
};

export class AppError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message = ERROR_MESSAGES[code]) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }

  toStorageError(): StorageError {
    return { code: this.code, message: this.message };
  }
}

export function getErrorMessageKey(error: unknown): TranslationKey {
  const code = error instanceof AppError ? error.code : "unexpected";

  return `error.code.${code}` as TranslationKey;
}
