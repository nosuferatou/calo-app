import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as callbackGet } from "@/app/auth/callback/route";
import { GET as completeGet } from "@/app/auth/complete/route";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getClaims: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

function request(path: string) {
  return new NextRequest(`http://127.0.0.1:3000${path}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.getClaims.mockResolvedValue({
    data: { claims: { sub: "verified-user-id" } },
    error: null,
  });
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.from.mockReturnValue({ upsert: mocks.upsert });
  mocks.createClient.mockResolvedValue({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getClaims: mocks.getClaims,
    },
    from: mocks.from,
  });
});

describe("OAuth and email callback", () => {
  it("exchanges PKCE codes, provisions the verified user, and rejects external destinations", async () => {
    const response = await callbackGet(
      request("/auth/callback?code=local-code&next=https%3A%2F%2Fevil.example"),
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("local-code");
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.upsert).toHaveBeenCalledWith(
      { user_id: "verified-user-id" },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/");
  });

  it("handles OAuth cancellation without reflecting provider error text", async () => {
    const response = await callbackGet(
      request("/auth/callback?error=access_denied&error_description=private+detail"),
    );

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("oauth");
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(location.search).not.toContain("private");
  });

  it("returns a safe error when PKCE exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "provider response detail" },
    });

    const response = await callbackGet(
      request("/auth/callback?code=invalid"),
    );

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("callback");
    expect(mocks.getClaims).not.toHaveBeenCalled();
  });
});

describe("authenticated completion and profile provisioning", () => {
  it("creates only the current authenticated user's missing profile row", async () => {
    const response = await completeGet(
      request("/auth/complete?next=%2Fonboarding"),
    );

    expect(mocks.upsert).toHaveBeenCalledWith(
      { user_id: "verified-user-id" },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/onboarding",
    );
  });

  it("rejects completion without verified claims", async () => {
    mocks.getClaims.mockResolvedValue({
      data: null,
      error: { message: "no session" },
    });

    const response = await completeGet(
      request("/auth/complete?next=%2Fsettings"),
    );

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("session");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("reports profile provisioning failure without exposing database details", async () => {
    mocks.upsert.mockResolvedValue({
      error: { message: "private database detail" },
    });

    const response = await completeGet(request("/auth/complete"));
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("profile");
    expect(location.search).not.toContain("private");
  });

  it("requests idempotent profile provisioning without replacing existing rows", async () => {
    await completeGet(request("/auth/complete"));

    expect(mocks.upsert).toHaveBeenCalledWith(
      { user_id: "verified-user-id" },
      expect.objectContaining({ ignoreDuplicates: true }),
    );
  });
});
