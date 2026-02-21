/**
 * GET /api/auth/init — server-side session init + portal redirect.
 *
 * WHY: After sign-in, the medilink-org-context routing cookie may be absent
 * (new browser, cleared cookies, or simplified sign-in flow). The proxy's
 * Branch 1.5 redirects here when a session exists but the routing cookie is
 * missing. This route queries Convex, sets the cookie, and redirects to the
 * correct portal — one atomic server-side operation replacing the fragile
 * 3-step client-side chain in the sign-in page.
 *
 * NOTE: /api/auth is in proxy's BYPASS_PREFIXES → no infinite redirect loop.
 *
 * Query params:
 *   returnTo  - safe relative path to redirect to after init (optional)
 *
 * Redirect responses:
 *   → /admin/dashboard    platform admin/support
 *   → returnTo or portal  regular org user (hospital/provider)
 *   → /sign-up            no org membership found (new user)
 *   → /sign-in            not authenticated or missing Convex JWT
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

import { env } from "~/env";

type UserContext = {
  orgId: string | null;
  orgType: string | null;
  orgName: string | null;
  role: string | null;
  platformRole: string | null;
} | null;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo");

  // Security: only allow safe relative paths to prevent open redirect attacks.
  // Reject protocol-relative URLs (//evil.com) and absolute URLs (https://evil.com).
  const safeReturnTo =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : null;

  // 1. Read Convex JWT (set by Better Auth's convex plugin after sign-in)
  const convexJwt = request.cookies.get("better-auth.convex_jwt")?.value;
  if (!convexJwt) {
    // No JWT → not authenticated or session expired
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // 2. Query Convex for the user's org context (platformRole, orgType, orgId)
  // WHY: getUserContext reads from our custom `users` + `organizationMemberships`
  // tables which include platformRole — not available in Better Auth's fixed schema.
  const convexClient = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  convexClient.setAuth(convexJwt);

  let context: UserContext = null;

  try {
    context = (await convexClient.query(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      anyApi.organizations!.getUserContext as Parameters<
        typeof convexClient.query
      >[0],
      {},
    )) as UserContext;
  } catch {
    // Convex query failed (expired JWT, network error) → force re-authentication
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (!context) {
    // No org membership → user hasn't completed onboarding
    return NextResponse.redirect(new URL("/sign-up", request.url));
  }

  // 3a. Platform admin/support — set admin sentinel cookie + redirect to admin portal
  // WHY: The proxy reads `medilink-org-context=admin:platform_admin` and maps
  // orgType "admin" to platformRole="platform_admin" for routing decisions.
  if (
    context.platformRole === "platform_admin" ||
    context.platformRole === "platform_support"
  ) {
    const response = NextResponse.redirect(
      new URL("/admin/dashboard", request.url),
    );
    response.cookies.set(
      "medilink-org-context",
      `admin:${context.platformRole}`,
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    );
    return response;
  }

  // 3b. Regular org user — set routing cookie + redirect to correct portal
  if (!context.orgType || !context.orgId) {
    // Context record exists but is missing required org fields → force sign-up
    return NextResponse.redirect(new URL("/sign-up", request.url));
  }

  const portalDefault =
    context.orgType === "provider"
      ? "/provider/dashboard"
      : "/hospital/dashboard";

  const destination = safeReturnTo ?? portalDefault;
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(
    "medilink-org-context",
    `${context.orgType}:${context.orgId}`,
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days — matches session lifetime
    },
  );
  return response;
}
