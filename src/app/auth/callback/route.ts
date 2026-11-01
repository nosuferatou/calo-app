import { NextResponse, type NextRequest } from "next/server";
import { getSafeReturnPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";
import { provisionCurrentProfile } from "@/lib/supabase/profile";

function loginRedirect(request: NextRequest, error: "callback" | "oauth" | "profile") {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const callbackError = request.nextUrl.searchParams.get("error");
  if (callbackError) {
    return loginRedirect(request, "oauth");
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return loginRedirect(request, "callback");
  }

  const nextPath = getSafeReturnPath(
    request.nextUrl.searchParams.get("next"),
    "/",
  );

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return loginRedirect(request, "callback");
    }

    const profileResult = await provisionCurrentProfile(supabase);
    if (profileResult === "unauthenticated") {
      return loginRedirect(request, "callback");
    }
    if (profileResult === "database-error") {
      return loginRedirect(request, "profile");
    }

    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch {
    return loginRedirect(request, "callback");
  }
}
