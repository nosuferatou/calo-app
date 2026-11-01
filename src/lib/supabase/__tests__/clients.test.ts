import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Supabase clients", () => {
  it("initializes browser and request-scoped server clients", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const browserClient = createBrowserClient();
    const serverClient = await createServerClient();

    expect(typeof browserClient.auth.getClaims).toBe("function");
    expect(typeof serverClient.auth.getClaims).toBe("function");
  });
});
