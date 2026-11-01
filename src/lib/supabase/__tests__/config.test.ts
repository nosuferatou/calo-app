import { describe, expect, it } from "vitest";
import { getSupabaseConfig } from "@/lib/supabase/config";

describe("getSupabaseConfig", () => {
  it("reports missing environment variable names without exposing values", () => {
    expect(() => getSupabaseConfig({})).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  });

  it("rejects non-HTTP(S) URLs", () => {
    expect(() =>
      getSupabaseConfig({
        url: "ftp://supabase.example",
        publishableKey: "test-publishable-key",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
  });

  it("returns trimmed configuration values", () => {
    expect(
      getSupabaseConfig({
        url: " https://supabase.example ",
        publishableKey: " test-publishable-key ",
      }),
    ).toEqual({
      url: "https://supabase.example",
      publishableKey: "test-publishable-key",
    });
  });
});
