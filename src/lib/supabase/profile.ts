import type { SupabaseClient } from "@supabase/supabase-js";

export async function provisionCurrentProfile(
  supabase: SupabaseClient,
): Promise<"ok" | "unauthenticated" | "database-error"> {
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string" || userId.length === 0) {
    return "unauthenticated";
  }

  const { error } = await supabase.from("profiles").upsert(
    { user_id: userId },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  return error ? "database-error" : "ok";
}
