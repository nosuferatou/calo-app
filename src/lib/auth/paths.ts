const RETURN_PATHS = new Set([
  "/",
  "/onboarding",
  "/diary",
  "/catalog",
  "/collection",
  "/analytics",
  "/settings",
  "/reset-password",
  "/auth/complete",
]);

export function getSafeReturnPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://calo.local");
    if (url.origin !== "http://calo.local" || !RETURN_PATHS.has(url.pathname)) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getAuthCallbackUrl(origin: string, nextPath: string): string {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", getSafeReturnPath(nextPath));
  return callbackUrl.toString();
}
