/**
 * GET /api/org/context — restore medilink-org-context routing cookie.
 *
 * WHY: The medilink-org-context cookie is set by /api/org/create during sign-up,
 * but is absent on subsequent sign-ins to existing accounts. Without it the proxy
 * (proxy.ts Branch 3) has no org context and redirects every signed-in user to
 * /sign-up. This route restores the cookie by querying Convex for the caller's
 * existing org membership.
 *
 * Called by the sign-in page after signIn.email() succeeds.
 *
 * NOTE on platformRole: The Better Auth component's Convex schema does not store
 * platformRole (its schema is fixed and doesn't support additionalFields). We read
 * platformRole from our custom `users` table via the getUserContext Convex query,
 * which has the field set by the set-platform-role HTTP endpoint.
 *
 * Response:
 *   200 { orgType, orgId }  + Set-Cookie: medilink-org-context=orgType:orgId
 *   204 (+ Set-Cookie)       user is a platform_admin — sets medilink-org-context=admin:system
 *   404                      no org membership found (new user, needs sign-up)
 *   401                      not authenticated
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
  // 1. Verify session
  const cookieHeader = request.headers.get("cookie") ?? "";
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const sessionRes = await fetch(
    new URL("/api/auth/get-session", request.url).toString(),
    { headers: { cookie: cookieHeader, origin } },
  );

  if (!sessionRes.ok) {
    return NextResponse.json(
      { error: "Bạn chưa đăng nhập (Not authenticated)" },
      { status: 401 },
    );
  }

  const sessionData = (await sessionRes.json()) as {
    user?: {
      id: string;
      email: string;
      platformRole?: string | null;
    } | null;
  } | null;

  if (!sessionData?.user) {
    return NextResponse.json(
      { error: "Bạn chưa đăng nhập (Not authenticated)" },
      { status: 401 },
    );
  }

  // 2. Query Convex for user's org context (includes platformRole from custom users table)
  // WHY: We do NOT check sessionData.user.platformRole here because the Better Auth
  // component's schema doesn't store platformRole. Our custom `users` table does,
  // and getUserContext reads it from there.
  const convexJwt = request.cookies.get("better-auth.convex_jwt")?.value;
  if (!convexJwt) {
    return NextResponse.json(
      { error: "Không tìm thấy token Convex (Missing Convex JWT cookie)" },
      { status: 401 },
    );
  }

  const convexClient = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  convexClient.setAuth(convexJwt);

  // WHY anyApi: The tsconfig paths alias resolves convex/_generated/api to a mock
  // that only has specific entries. anyApi is a Proxy that works for any function
  // path and is equivalent to the real api object at runtime.
  const context = (await convexClient.query(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    anyApi.organizations!.getUserContext as Parameters<
      typeof convexClient.query
    >[0],
    {},
  )) as UserContext;

  if (!context) {
    // User has no org — they need to complete sign-up
    return NextResponse.json(
      { error: "Chưa có tổ chức (No organization found)" },
      { status: 404 },
    );
  }

  // 3a. Platform admins — set special sentinel cookie and return 204
  // WHY: The proxy reads `medilink-org-context=admin:system` and maps orgType "admin"
  // to platformRole="platform_admin" for routing decisions. This avoids needing
  // platformRole in the Better Auth session (which the component schema can't store).
  if (
    context.platformRole === "platform_admin" ||
    context.platformRole === "platform_support"
  ) {
    const adminResponse = new NextResponse(null, { status: 204 });
    adminResponse.cookies.set(
      "medilink-org-context",
      `admin:${context.platformRole}`,
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    );
    return adminResponse;
  }

  // 3b. Regular org users — set medilink-org-context routing cookie and return
  const response = NextResponse.json({
    orgType: context.orgType,
    orgId: context.orgId,
    orgName: context.orgName,
  });

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
