import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isPublicPath } from "@medilink/auth/middleware";

/**
 * Next.js middleware for route protection.
 *
 * WHY: Protects route groups from unauthenticated access and ensures
 * users are redirected to the appropriate sign-in page. Without this,
 * any user could access protected route groups regardless of auth status.
 *
 * Route groups:
 * - (admin): Platform admin only — /admin/*
 * - (staff): Staff members — /staff/*
 * - (student): Students — /student/*
 * - (auth): Public — /sign-in, /sign-up, etc.
 * - (marketing): Public — /, /about, etc.
 * - /api/auth/*: Better Auth routes (always public)
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow all Better Auth API routes through
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Allow all tRPC API routes through (auth checked in tRPC context)
  if (pathname.startsWith("/api/trpc/")) {
    return NextResponse.next();
  }

  // Allow public paths without auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check for the Better Auth session cookie
  // Better Auth sets a cookie with the session token
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    // Redirect unauthenticated users to sign-in
    // WHY: Preserving the original URL as a returnTo param enables
    // redirecting back after successful sign-in.
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

/**
 * Middleware matcher configuration.
 *
 * WHY: We exclude static files, _next internals, and favicon to avoid
 * unnecessary middleware overhead on non-page requests. Only page routes
 * and API routes (except Convex/static) go through the middleware.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
