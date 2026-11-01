import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database";

export type RepositoryErrorCode =
  | "unauthenticated"
  | "database"
  | "invalid-input"
  | "invalid-record"
  | "partial-write";

export class RepositoryError extends Error {
  constructor(
    readonly code: RepositoryErrorCode,
    message: string,
    readonly databaseCode?: string,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export async function requireUserId(
  client: SupabaseClient<Database>,
): Promise<string> {
  const { data, error } = await client.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string" || !z.string().uuid().safeParse(userId).success) {
    throw new RepositoryError(
      "unauthenticated",
      "A verified signed-in user is required.",
    );
  }

  return userId;
}

export function throwDatabaseError(error: {
  code: string;
}): never {
  throw new RepositoryError(
    "database",
    "The database request could not be completed.",
    error.code,
  );
}

export function invalidInput(): never {
  throw new RepositoryError("invalid-input", "The repository input is invalid.");
}

export function invalidRecord(): never {
  throw new RepositoryError(
    "invalid-record",
    "A database record failed validation.",
  );
}

export function parseRecord<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) invalidRecord();
  return result.data;
}

export function validateInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) invalidInput();
  return result.data;
}
