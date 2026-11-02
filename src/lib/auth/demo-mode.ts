export const DEMO_COOKIE_NAME = "calo-demo-mode";
export const DEMO_COOKIE_VALUE = "1";
export const DEMO_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Records the visitor's explicit choice to use demo mode. This is a UX gate the
 * proxy reads to let anonymous users into the application shell — it is not a
 * security boundary and grants no access to cloud data, which stays behind
 * claims-verified repositories and RLS.
 */
export function optInToDemoMode(): void {
  document.cookie = `${DEMO_COOKIE_NAME}=${DEMO_COOKIE_VALUE}; path=/; max-age=${DEMO_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearDemoModeOptIn(): void {
  document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0`;
}

/**
 * Sets the opt-in cookie and performs a full document navigation. The proxy's
 * allow/deny decision depends on the cookie written moments earlier, so an SPA
 * navigation would risk replaying the cached anonymous redirect.
 */
export function enterDemoMode(returnPath: string): void {
  optInToDemoMode();
  window.location.assign(returnPath);
}

/**
 * Leaves demo mode for the login gate. Only the opt-in cookie is removed, so the
 * demo data in this browser stays intact and is still there when the visitor
 * returns. Full-document navigation because the proxy decides between the login
 * gate and the app shell from that cookie.
 */
export function exitDemoMode(loginPath: string): void {
  clearDemoModeOptIn();
  window.location.assign(loginPath);
}
