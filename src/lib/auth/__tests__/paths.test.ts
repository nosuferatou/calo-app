import { describe, expect, it } from "vitest";
import { getAuthCallbackUrl, getSafeReturnPath } from "@/lib/auth/paths";

describe("authentication return paths", () => {
  it("preserves permitted same-site destinations and their query strings", () => {
    expect(getSafeReturnPath("/settings?section=profile")).toBe(
      "/settings?section=profile",
    );
  });

  it.each([
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/missing-route",
    "/settings\u0000",
  ])("rejects unsafe or unknown destination %s", (value) => {
    expect(getSafeReturnPath(value, "/onboarding")).toBe("/onboarding");
  });

  it("builds a local callback URL with a validated return path", () => {
    expect(
      getAuthCallbackUrl("http://127.0.0.1:3000", "https://example.com"),
    ).toBe(
      "http://127.0.0.1:3000/auth/callback?next=%2F",
    );
  });
});
