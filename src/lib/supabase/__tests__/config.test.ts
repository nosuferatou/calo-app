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

  it("rejects plaintext http for a remote Supabase host", () => {
    expect(() =>
      getSupabaseConfig({
        url: "http://supabase.example",
        publishableKey: "test-publishable-key",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL must use https:// outside localhost.");
  });

  it("allows plaintext http only for local development hosts", () => {
    expect(
      getSupabaseConfig({
        url: "http://127.0.0.1:54321",
        publishableKey: "test-publishable-key",
      }).url,
    ).toBe("http://127.0.0.1:54321");
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
