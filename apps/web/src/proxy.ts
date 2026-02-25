import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isPublicPath } from "@medilink/auth/middleware";

import type { MiddlewareSessionData } from "~/lib/portal-routing";
import { buildCspHeader, generateNonce } from "~/lib/csp";
import {
  getDefaultRedirectForPortal,
  getExpectedOrgTypeForPortal,
  getPortalFromPathname,
} from "~/lib/portal-routing";

/**
 * Next.js proxy for portal-based route protection.
 *
 * WHY: Routes users to the correct portal based on their role and organization type.
 * Without this, authenticated users would land on the generic homepage instead
 * of their role-specific dashboard. This is the security boundary that gates
 * all portal access.
 *
 * NOTE: Next.js 16 renamed "middleware" to "proxy". The file must be named
 * proxy.ts and export a function named "proxy" (previously "middleware").
 *
 * Routing state machine:
 * 1. Static/API/public paths → pass through
 * 2. No session cookie → redirect to /sign-in
 * 3. Has session → fetch session data from auth API
 *    a. Platform admin/support → /admin/* only
 *    b. No active organization → redirect to /sign-up
 *    c. Has org → allow current portal access
 */

/**
 * Create a NextResponse.next() with CSP and security headers.
 *
 * WHY: CSP headers block inline script execution system-wide. Even if malicious
 * HTML were stored in a Convex text field and rendered, the browser would refuse
 * to execute it. The nonce is passed via x-nonce header so layout.tsx can apply
 * it to legitimate <script> elements.
 */
function nextWithSecurityHeaders(): NextResponse {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";

  const response = NextResponse.next({
    headers: { "x-nonce": nonce },
  });

  response.headers.set("Content-Security-Policy", buildCspHeader(nonce, isDev));
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

/** Paths that bypass proxy entirely (static files, Next.js internals, API routes). */
const BYPASS_PREFIXES = [
  "/api/auth",
  "/api/org",
  "/api/health",
  "/api/admin",
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
 * Read org routing context from the medilink-org-context cookie.
 *
 * WHY: The Convex component's user table schema is fixed and doesn't support
 * custom additional fields. Instead of reading org context from Better Auth
 * user fields (which can't be stored), we use a routing cookie set by
 * /api/org/create. This cookie is used for portal routing ONLY — not for
 * authorization (Convex JWT handles that server-side).
 *
 * Cookie format: "orgType:orgId" (e.g., "hospital:ks78pdmg...")
 */
function getOrgContextCookie(request: NextRequest): {
  orgType: string;
  orgId: string;
} | null {
  const raw =
    request.cookies.get("medilink-org-context")?.value ??
    request.cookies.get("__Secure-medilink-org-context")?.value;
  if (!raw) return null;
  const colonIdx = raw.indexOf(":");
  if (colonIdx < 1) return null;
  const orgType = raw.slice(0, colonIdx);
  const orgId = raw.slice(colonIdx + 1);
  if (!orgType || !orgId) return null;
  return { orgType, orgId };
}

/**
 * Fetch session data from the Better Auth API.
 *
 * WHY: Edge proxy cannot query Convex directly. We fetch the session
 * from the Better Auth API route to validate the session and get platformRole.
 * Org context (orgType, orgId) comes from the medilink-org-context cookie,
 * not from the session, because the Convex component schema can't store
 * custom user fields.
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

    // NOTE: activeOrganizationId, activeOrgType, and platformRole come from the
    // medilink-org-context cookie, NOT from Better Auth's session or user fields.
    // The Convex component's user table schema is fixed and cannot store custom fields.
    //
    // Cookie formats:
    //   "hospital:ks78..."      → regular hospital user
    //   "provider:ks79..."      → regular provider user
    //   "admin:platform_admin"  → platform admin (set by /api/org/context for admins)
    const data = (await response.json()) as {
      user?: {
        id?: string;
        platformRole?: string | null;
        activeOrganizationId?: string | null;
        activeOrgType?: string | null;
      } | null;
      session?: {
        id?: string;
      } | null;
    } | null;

    if (!data) return null;

    // Get org context from the routing cookie (preferred)
    const orgCookie = getOrgContextCookie(request);

    // Admin sentinel: orgType "admin" means the user is a platform admin.
    // WHY: Better Auth component schema can't store platformRole, so we use
    // a special cookie value to communicate admin status to the proxy.
    if (orgCookie?.orgType === "admin") {
      return {
        platformRole: "platform_admin",
        activeOrganizationId: null,
        orgType: null,
      };
    }

    return {
      platformRole: data.user?.platformRole ?? null,
      activeOrganizationId:
        orgCookie?.orgId ?? data.user?.activeOrganizationId ?? null,
      orgType: orgCookie?.orgType ?? data.user?.activeOrgType ?? null,
    };
  } catch {
    // If session fetch fails, treat as no session
    return null;
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Bypass: API routes, static files, Next.js internals
  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  // Bypass: Public auth paths (sign-in, sign-up, etc.)
  // WHY: isPublicPath from auth middleware handles the canonical public path list
  // NOTE: /api/health is already handled by shouldBypass() above
  if (isPublicPath(pathname)) {
    return nextWithSecurityHeaders();
  }

  const sessionToken = getSessionCookie(request);

  // Branch 1: No session → redirect to sign-in
  // WHY: Preserving returnTo enables redirecting back after successful sign-in
  if (!sessionToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Branch 1.5: Valid session token but NO medilink-org-context cookie
  // WHY: After sign-in, the routing cookie may be absent (new browser, expired cookie,
  // or simplified sign-in flow). /api/auth/init restores it server-side and redirects
  // to the correct portal — avoiding the need for client-side cookie restoration.
  // NOTE: /api/auth is already in BYPASS_PREFIXES → no infinite redirect loop.
  if (!getOrgContextCookie(request)) {
    const initUrl = new URL("/api/auth/init", request.url);
    initUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(initUrl);
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
    return nextWithSecurityHeaders();
  }

  // Branch 2.5: Non-admin user attempting to access /admin routes
  // WHY: getExpectedOrgTypeForPortal returns null for platform-admin (uses platformRole,
  // not orgType), so Branch 4 doesn't catch hospital/provider users on /admin paths.
  // Explicitly redirect them to their correct portal dashboard.
  if (
    currentPortal === "platform-admin" &&
    sessionData.platformRole !== "platform_admin" &&
    sessionData.platformRole !== "platform_support"
  ) {
    const correctPortal =
      sessionData.orgType === "provider" ? "provider" : "hospital";
    const correctDashboard = getDefaultRedirectForPortal(correctPortal);
    return NextResponse.redirect(new URL(correctDashboard, request.url));
  }

  // Branch 3: No active organization → redirect to sign-up
  // WHY: Users without an org haven't completed the onboarding flow.
  // They need to select their org type (hospital/provider) and create an org.
  if (!sessionData.activeOrganizationId) {
    if (pathname !== "/sign-up") {
      return NextResponse.redirect(new URL("/sign-up", request.url));
    }
    return nextWithSecurityHeaders();
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

  return nextWithSecurityHeaders();
}

/**
 * Proxy matcher configuration.
 *
 * WHY: We exclude static files, _next internals, and favicon to avoid
 * unnecessary proxy overhead on non-page requests.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
