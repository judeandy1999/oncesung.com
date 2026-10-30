import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/redirect";

const PROTECTED = [
  "/account",
  "/dashboard",
  "/downloads",
  "/song-player",
  "/requests",
  "/admin",
  "/checkout/payment",
  "/order-confirmed",
  "/gift-cards/pay",
  "/gift-cards/success",
  "/gift-cards/sent",
  "/gift-cards/card",
];

function isProtected(pathname: string) {
  return PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isGuestOnly(pathname: string) {
  return pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
}

function withSessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { pathname, search } = request.nextUrl;

  const authCode = request.nextUrl.searchParams.get("code");
  if (authCode && pathname !== "/auth/callback") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/callback";
    if (!redirectUrl.searchParams.get("next")) {
      redirectUrl.searchParams.set("next", "/account");
    }
    return withSessionCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return withSessionCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  if (user && isGuestOnly(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const dest = new URL(next, request.url);
    redirectUrl.pathname = dest.pathname;
    redirectUrl.search = dest.search;
    return withSessionCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  return supabaseResponse;
}
