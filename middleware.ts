import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = [
  "/",
  "/login",
  "/join",
  "/forgot-password",
  "/verify-email",
  "/banned",
  "/restricted",
];

const authRoutes = ["/login", "/join", "/forgot-password"];

const RESTRICTED_ROUTES = [
  "/network",
  "/forum",
  "/marketplace",
  "/jobs",
  "/resume",
];

export async function middleware(request: NextRequest) {
  const { response, user, accountStatus } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/verify-email/") ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/invite/");

  const isAuthRoute = authRoutes.includes(pathname);

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin");

  const isRestrictedBlockedRoute = RESTRICTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && accountStatus === "banned") {
    if (!pathname.startsWith("/banned") && !pathname.startsWith("/api/auth/logout")) {
      return NextResponse.redirect(new URL("/banned", request.url));
    }
    return response;
  }

  if (user && accountStatus === "restricted") {
    if (isRestrictedBlockedRoute) {
      return NextResponse.redirect(new URL("/restricted", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
