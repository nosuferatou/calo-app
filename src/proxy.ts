import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeReturnPath } from "@/lib/auth/paths";
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from "@/lib/auth/demo-mode";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

// Auth-flow routes that anonymous visitors must reach. Everything else that
// passes the matcher is an application route and requires a session or an
// explicit demo opt-in (UX gate only — cloud data stays behind claims + RLS).
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];
const AUTH_ENTRY_PATHS = ["/login", "/signup"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectWithAuthState(
  request: NextRequest,
  supabaseResponse: NextResponse,
  destination: string,
) {
  const response = NextResponse.redirect(new URL(destination, request.url));

  for (const cookie of supabaseResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(header);
    if (value) {
      response.headers.set(header, value);
    }
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { url, publishableKey } = getSupabaseConfig();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          supabaseResponse.headers.set(name, value);
        });
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const pathname = request.nextUrl.pathname;
  const isAuthenticated =
    typeof claims?.sub === "string" && claims.sub.length > 0;

  if (!isAuthenticated) {
    const demoOptIn =
      request.cookies.get(DEMO_COOKIE_NAME)?.value === DEMO_COOKIE_VALUE;
    if (matchesPath(pathname, PUBLIC_PATHS) || demoOptIn) {
      return supabaseResponse;
    }

    const requestedPath = `${pathname}${request.nextUrl.search}`;
    const loginUrl = new URL("/login", request.url);
    if (requestedPath !== "/") {
      loginUrl.searchParams.set(
        "next",
        getSafeReturnPath(requestedPath, "/"),
      );
    }
    return redirectWithAuthState(
      request,
      supabaseResponse,
      `${loginUrl.pathname}${loginUrl.search}`,
    );
  }

  if (
    matchesPath(pathname, AUTH_ENTRY_PATHS) &&
    !request.nextUrl.searchParams.has("error")
  ) {
    const nextPath = getSafeReturnPath(
      request.nextUrl.searchParams.get("next"),
      "/",
    );
    return redirectWithAuthState(request, supabaseResponse, nextPath);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
