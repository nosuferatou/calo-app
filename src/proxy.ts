import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeReturnPath } from "@/lib/auth/paths";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const PRIVATE_PATHS = ["/auth/complete"];
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

  if (matchesPath(pathname, PRIVATE_PATHS) && !claims?.sub) {
    const requestedPath = `${pathname}${request.nextUrl.search}`;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      getSafeReturnPath(requestedPath, "/"),
    );
    return redirectWithAuthState(
      request,
      supabaseResponse,
      `${loginUrl.pathname}${loginUrl.search}`,
    );
  }

  if (
    matchesPath(pathname, AUTH_ENTRY_PATHS) &&
    claims?.sub &&
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
