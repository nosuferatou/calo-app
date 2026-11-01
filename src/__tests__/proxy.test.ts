import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getClaims: vi.fn(),
  refreshCookies: false,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "local-publishable-key");
  mocks.refreshCookies = false;
  mocks.getClaims.mockResolvedValue({
    data: { claims: null },
    error: null,
  });
  mocks.createServerClient.mockImplementation(
    (
      _url: string,
      _key: string,
      options: {
        cookies: {
          setAll: (
            cookies: Array<{
              name: string;
              value: string;
              options: { path: string };
            }>,
            headers: Record<string, string>,
          ) => void;
        };
      },
    ) => {
      if (mocks.refreshCookies) {
        options.cookies.setAll(
          [{ name: "sb-local-auth-token", value: "refreshed", options: { path: "/" } }],
          { "Cache-Control": "private, no-store" },
        );
      }

      return { auth: { getClaims: mocks.getClaims } };
    },
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authentication proxy", () => {
  it("keeps local-first settings public for anonymous users", async () => {
    const response = await proxy(
      new NextRequest("http://127.0.0.1:3000/settings"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects anonymous requests to private auth completion", async () => {
    const response = await proxy(
      new NextRequest(
        "http://127.0.0.1:3000/auth/complete?next=%2Fsettings",
      ),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe(
      "/auth/complete?next=%2Fsettings",
    );
  });

  it("redirects verified users away from login to safe destinations", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: "verified-user" } },
      error: null,
    });

    const response = await proxy(
      new NextRequest("http://127.0.0.1:3000/login?next=%2Fsettings"),
    );

    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/settings",
    );
  });

  it("preserves refreshed cookies and cache headers on auth redirects", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: "verified-user" } },
      error: null,
    });
    mocks.refreshCookies = true;

    const response = await proxy(
      new NextRequest("http://127.0.0.1:3000/signup"),
    );

    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.cookies.get("sb-local-auth-token")?.value).toBe(
      "refreshed",
    );
  });
});
