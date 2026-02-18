import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isPublicPath } from "@medilink/auth/middleware";

import type { MiddlewareSessionData } from "~/lib/portal-routing";
import {
  getDefaultRedirectForPortal,
  getExpectedOrgTypeForPortal,
  getPortalFromPathname,
} from "~/lib/portal-routing";

/**
 * Next.js middleware for portal-based route protection.
 *
 * WHY: Routes users to the correct portal based on their role and organization type.
 * Without this, authenticated users would land on the generic homepage instead
 * of their role-specific dashboard. This is the security boundary that gates
 * all portal access.
 *
 * Routing state machine:
 * 1. Static/API/public paths → pass through
 * 2. No session cookie → redirect to /sign-in
 * 3. Has session → fetch session data from auth API
 *    a. Platform admin/support → /admin/* only
 *    b. No active organization → redirect to /sign-up
 *    c. Has org → allow current portal access
 */

/** Paths that bypass middleware entirely (static files, Next.js internals, API routes). */
const BYPASS_PREFIXES = [
  "/api/auth",
  "/api/trpc",
  "/api/health",
  "/_next",
  "/favicon.ico",
];

function shouldBypass(pathname: string): boolean {
  return BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getSessionCookie(request: NextRequest): string | undefined {
  return (
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value
  );
}

/**
 * Fetch session data from the Better Auth API.
 *
 * WHY: Edge middleware cannot query Convex directly. We fetch the session
 * from the Better Auth API route, which has access to the database.
 * This gives us platformRole, activeOrganizationId, and orgType for routing decisions.
 *
 * When there's an active organization, we fetch the full organization to get
 * org_type from its metadata. This enables portal-aware routing at the root path.
 */
async function getSessionData(
  request: NextRequest,
): Promise<MiddlewareSessionData | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";

  try {
    const sessionUrl = new URL("/api/auth/get-session", request.url);
    const response = await fetch(sessionUrl.toString(), {
      headers: {
        cookie: cookieHeader,
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      user?: {
        id?: string;
        platformRole?: string | null;
      } | null;
      session?: {
        id?: string;
        activeOrganizationId?: string | null;
        activeOrganization?: {
          metadata?: { org_type?: string } | null;
        } | null;
      } | null;
    } | null;

    if (!data) return null;

    const platformRole = data.user?.platformRole ?? null;
    const activeOrganizationId = data.session?.activeOrganizationId ?? null;

    // If user has an active org, fetch org details to get org_type for portal routing
    // WHY: org_type is stored in organization metadata and needed for root path redirect
    let orgType: string | null = null;
    if (activeOrganizationId) {
      try {
        const orgUrl = new URL(
          "/api/auth/organization/get-full-organization",
          request.url,
        );
        const orgResponse = await fetch(orgUrl.toString(), {
          headers: {
            cookie: cookieHeader,
          },
        });

        if (orgResponse.ok) {
          const orgData = (await orgResponse.json()) as {
            metadata?: { org_type?: string | null } | null;
          } | null;
          orgType = orgData?.metadata?.org_type ?? null;
        }
      } catch {
        // Graceful fallback: if org fetch fails, orgType stays null
        // Middleware will route to hospital portal (safe default)
      }
    }

    return {
      platformRole,
      activeOrganizationId,
      orgType,
    };
  } catch {
    // If session fetch fails, treat as no session
    return null;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Bypass: API routes, static files, Next.js internals
  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  // Bypass: Public auth paths (sign-in, sign-up, etc.)
  // WHY: isPublicPath from auth middleware handles the canonical public path list
  // NOTE: /api/health and /api/trpc are already handled by shouldBypass() above
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = getSessionCookie(request);

  // Branch 1: No session → redirect to sign-in
  // WHY: Preserving returnTo enables redirecting back after successful sign-in
  if (!sessionToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Session exists — fetch session data for role-based routing
  const sessionData = await getSessionData(request);

  if (!sessionData) {
    // Session cookie exists but is invalid/expired → redirect to sign-in
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  const currentPortal = getPortalFromPathname(pathname);

  // Branch 2: Platform admin/support → allow only /admin routes
  // WHY: Platform admins (SangLeTech staff) should never access hospital/provider portals
  if (
    sessionData.platformRole === "platform_admin" ||
    sessionData.platformRole === "platform_support"
  ) {
    if (pathname === "/" || currentPortal === "unknown") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (currentPortal !== "platform-admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Branch 3: No active organization → redirect to sign-up
  // WHY: Users without an org haven't completed the onboarding flow.
  // They need to select their org type (hospital/provider) and create an org.
  if (!sessionData.activeOrganizationId) {
    if (pathname !== "/sign-up") {
      return NextResponse.redirect(new URL("/sign-up", request.url));
    }
    return NextResponse.next();
  }

  // Branch 4: Has active org → validate portal access
  // WHY: Enforce that hospital users can only access /hospital/* and
  // provider users can only access /provider/*. A user at the root path
  // is redirected to their correct dashboard based on orgType.
  //
  // Security: if orgType is null, the org fetch failed or returned no metadata.
  // Defaulting to hospital when orgType is unknown would silently misroute all
  // provider users — a cross-portal enforcement failure. Instead, force
  // re-authentication so the user lands with a fresh session.
  if (sessionData.orgType === null) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname === "/") {
    const dashboard =
      sessionData.orgType === "provider"
        ? "/provider/dashboard"
        : "/hospital/dashboard";
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  const expectedOrgType = getExpectedOrgTypeForPortal(currentPortal);
  if (expectedOrgType !== null && sessionData.orgType !== expectedOrgType) {
    // Cross-portal attempt: redirect to the user's correct dashboard
    const correctPortal =
      sessionData.orgType === "provider" ? "provider" : "hospital";
    const correctDashboard = getDefaultRedirectForPortal(correctPortal);
    return NextResponse.redirect(new URL(correctDashboard, request.url));
  }

  return NextResponse.next();
}

/**
 * Middleware matcher configuration.
 *
 * WHY: We exclude static files, _next internals, and favicon to avoid
 * unnecessary middleware overhead on non-page requests.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
