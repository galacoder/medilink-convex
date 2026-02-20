/**
 * Custom organization creation API route.
 *
 * WHY: @convex-dev/better-auth v0.10.10 doesn't support Better Auth's
 * organization plugin (the "member" model is not in its schema). This route
 * implements org creation directly using our custom Convex tables, bypassing
 * Better Auth's org plugin entirely.
 *
 * Flow:
 *   1. Validate auth cookie via GET /api/auth/get-session
 *   2. Call Convex mutation orgActions.createOrganization
 *      → creates org + owner membership in our custom tables
 *   3. Set medilink-org-context routing cookie (orgType:orgId)
 *      → proxy.ts reads this for portal routing decisions
 *      → WHY COOKIE instead of Better Auth updateUser:
 *         @convex-dev/better-auth v0.10.10's component schema has fixed user fields;
 *         additional user fields (activeOrganizationId, activeOrgType) cannot be
 *         stored via update-user because the Convex validator rejects unknown fields.
 *         The routing cookie is a lightweight alternative — it's used for portal
 *         routing only (not authorization). Authorization is done via Convex JWT.
 *   4. Return the created org's ID and slug
 *
 * vi: "API tạo tổ chức" / en: "Organization creation API"
 */
import { ConvexHttpClient } from "convex/browser";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { api } from "convex/_generated/api";
import { env } from "~/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateOrgBody {
  name: string;
  slug: string;
  orgType: "hospital" | "provider";
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate body
    const body = (await request.json()) as Partial<CreateOrgBody>;
    const { name, slug, orgType } = body;

    if (!name || !slug || !orgType) {
      return NextResponse.json(
        { error: "Thiếu thông tin tổ chức (Missing required fields)" },
        { status: 400 },
      );
    }

    // 2. Verify authentication by forwarding cookies to get-session
    const cookieHeader = request.headers.get("cookie") ?? "";
    const origin =
      request.headers.get("origin") ?? new URL(request.url).origin;

    const sessionRes = await fetch(
      new URL("/api/auth/get-session", request.url).toString(),
      {
        headers: {
          cookie: cookieHeader,
          origin,
        },
      },
    );

    if (!sessionRes.ok) {
      return NextResponse.json(
        { error: "Bạn chưa đăng nhập (Not authenticated)" },
        { status: 401 },
      );
    }

    const sessionData = (await sessionRes.json()) as {
      user?: { id: string; email: string } | null;
      session?: { token: string } | null;
    } | null;

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: "Bạn chưa đăng nhập (Not authenticated)" },
        { status: 401 },
      );
    }

    // 3. Call Convex mutation to create org + membership in our custom tables
    //    WHY: Using fetchAuthMutation (server-side) ensures the mutation runs
    //    with the authenticated user's JWT, satisfying authComponent.getAuthUser().
    //
    //    However, fetchAuthMutation reads the token from cookies via getToken(),
    //    which works in Server Components but not in Route Handlers (no React
    //    context). We use ConvexHttpClient directly with the session token instead.
    const convexUrl = env.NEXT_PUBLIC_CONVEX_URL;
    const convexClient = new ConvexHttpClient(convexUrl);
    // Authenticate with the Convex JWT from the better-auth.convex_jwt cookie
    const convexJwt = request.cookies.get("better-auth.convex_jwt")?.value;
    if (convexJwt) {
      convexClient.setAuth(convexJwt);
    } else {
      // Fallback: use the session token as a bearer credential
      // (works if Convex is configured to accept session tokens)
      return NextResponse.json(
        {
          error:
            "Không tìm thấy token xác thực Convex (Missing Convex JWT cookie)",
        },
        { status: 401 },
      );
    }

    const orgResult = (await convexClient.mutation(
      api.orgActions.createOrganization,
      { name, slug, orgType },
    )) as { orgId: string; slug: string };

    // 4. Set routing cookie for org context.
    //    WHY: The Convex component's user table schema is fixed and doesn't support
    //    additional fields (activeOrganizationId, activeOrgType). Instead of writing
    //    to Better Auth's update-user endpoint (which fails with schema validation
    //    errors), we set a routing cookie that the proxy reads for portal routing.
    //    This cookie is used for ROUTING ONLY — not for authorization. Convex JWT
    //    handles authorization server-side.
    //    Format: "orgType:orgId" (simple, no JSON, no signing needed for routing)
    const response = NextResponse.json(orgResult, { status: 201 });
    response.cookies.set("medilink-org-context", `${orgType}:${orgResult.orgId}`, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // 7-day expiry matches session token lifetime
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error";

    // Handle Convex validation errors (e.g., slug already taken)
    if (message.includes("Slug already taken") || message.includes("đã được sử dụng")) {
      return NextResponse.json(
        { error: "Slug đã được sử dụng (Slug already taken)" },
        { status: 409 },
      );
    }

    console.error("[org/create] Error:", message);
    return NextResponse.json(
      { error: "Lỗi tạo tổ chức (Failed to create organization)" },
      { status: 500 },
    );
  }
}
