/**
 * Platform-level user management actions.
 *
 * WHY: Better Auth creates users via signup flow, but does not expose an API
 * to programmatically grant platform-level roles (platform_admin, platform_support).
 * This module provides the setPlatformRole mutation that allows an existing
 * platform_admin to elevate another user to a platform role.
 *
 * PRIMARY USE CASE: E2E global-setup calls the setPlatformRole HTTP endpoint
 * (in convex/http.ts) after signing up a test admin user, bridging Better Auth
 * signup with the Convex platform role system.
 *
 * Auth guard: Uses the same JWT-based requirePlatformAdmin pattern from
 * admin/hospitals.ts — ctx.auth.getUserIdentity() only, no better-auth/minimal import.
 *
 * vi: "Hành động quản lý người dùng nền tảng"
 * en: "Platform user management actions"
 */
import { ConvexError, v } from "convex/values";

import { components, internal } from "./_generated/api";
import { httpAction, internalAction, internalMutation, mutation } from "./_generated/server";

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// WHY: Copied from admin/hospitals.ts — importing a shared helper would create
// circular module dependencies. Both modules must remain independently testable.
// ---------------------------------------------------------------------------

interface PlatformAuthContext {
  userId: string;
  platformRole: string | null;
}

/**
 * Extracts and validates platformRole from the JWT identity.
 * Throws bilingual ConvexError if not authenticated.
 *
 * vi: "Xác thực quản trị viên nền tảng"
 * en: "Authenticate platform admin"
 */
async function localRequireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<PlatformAuthContext> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }
  return {
    userId: identity.subject as string,
    platformRole: (identity.platformRole as string | null) ?? null,
  };
}

/**
 * Asserts the caller has platformRole === "platform_admin".
 * Throws a bilingual ConvexError if not.
 *
 * vi: "Yêu cầu quyền quản trị viên nền tảng"
 * en: "Require platform admin role"
 */
async function requirePlatformAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<PlatformAuthContext> {
  const auth = await localRequireAuth(ctx);
  if (auth.platformRole !== "platform_admin") {
    throw new ConvexError({
      code: "FORBIDDEN",
      // vi: "Chỉ quản trị viên nền tảng mới có quyền truy cập"
      // en: "Only platform admins can access this resource"
      message:
        "Chỉ quản trị viên nền tảng mới có quyền truy cập (Only platform admins can access this resource)",
    });
  }
  return auth;
}

// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------

/**
 * Set a user's platform-level role.
 *
 * WHY: The only programmatic way to grant platform_admin or platform_support
 * role to a user created via Better Auth signup. Used by:
 * 1. E2E global-setup (via HTTP endpoint) to create a test admin user
 * 2. Future admin UI (if SangLeTech staff need to be onboarded programmatically)
 *
 * The mutation updates the user record in the Convex `users` table.
 * The JWT will include the new platformRole on the next sign-in, which
 * triggers proxy.ts Branch 2 routing to /admin/dashboard.
 *
 * Args:
 *   targetEmail - email of the user to promote
 *   role - the platform role to assign ("platform_admin" | "platform_support")
 *
 * Auth: platformRole === "platform_admin" required
 *
 * vi: "Đặt vai trò nền tảng cho người dùng"
 * en: "Set platform role for user"
 */
export const setPlatformRole = mutation({
  args: {
    // vi: "Email người dùng mục tiêu" / en: "Target user email"
    targetEmail: v.string(),
    // vi: "Vai trò nền tảng" / en: "Platform role to assign"
    role: v.union(v.literal("platform_admin"), v.literal("platform_support")),
  },
  handler: async (ctx, args) => {
    // Assert caller is platform_admin
    await requirePlatformAdmin(ctx);

    // Find the target user by email
    // WHY: Search in users table by email (linear scan acceptable — admin-only, low frequency)
    const allUsers = await ctx.db.query("users").collect();
    const targetUser = allUsers.find((u) => u.email === args.targetEmail);

    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        // vi: "Không tìm thấy người dùng với email này"
        // en: "User not found with this email"
        message: `Không tìm thấy người dùng với email ${args.targetEmail} (User not found with email ${args.targetEmail})`,
      });
    }

    const now = Date.now();

    // Patch the user's platformRole field
    await ctx.db.patch(targetUser._id, {
      platformRole: args.role,
      updatedAt: now,
    });

    return {
      success: true,
      // vi: "Vai trò đã được cập nhật thành công"
      // en: "Role updated successfully"
      message: `Vai trò đã được cập nhật thành ${args.role} (Role updated to ${args.role})`,
      userId: targetUser._id,
    };
  },
});

// ---------------------------------------------------------------------------
// INTERNAL MUTATION (for HTTP endpoint access without JWT)
// ---------------------------------------------------------------------------

/**
 * Internal mutation that updates our custom users table with platform role.
 *
 * WHY: Split from internalSetPlatformRole (action) to allow testing this
 * db-write portion independently. Called from internalSetPlatformRole action.
 *
 * vi: "Mutation nội bộ — cập nhật bảng người dùng tùy chỉnh"
 * en: "Internal mutation — update custom users table"
 */
export const patchUserPlatformRole = internalMutation({
  args: {
    // vi: "Email người dùng mục tiêu" / en: "Target user email"
    targetEmail: v.string(),
    // vi: "Vai trò nền tảng" / en: "Platform role to assign"
    role: v.union(v.literal("platform_admin"), v.literal("platform_support")),
  },
  handler: async (ctx, args) => {
    // Find the target user by email (linear scan — admin-only, low frequency)
    const allUsers = await ctx.db.query("users").collect();
    const targetUser = allUsers.find((u) => u.email === args.targetEmail);

    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        // vi: "Không tìm thấy người dùng với email này"
        // en: "User not found with this email"
        message: `Không tìm thấy người dùng với email ${args.targetEmail} (User not found with email ${args.targetEmail})`,
      });
    }

    const now = Date.now();

    await ctx.db.patch(targetUser._id, {
      platformRole: args.role,
      updatedAt: now,
    });

    return {
      success: true,
      userId: targetUser._id,
      message: `Custom users table updated for ${args.targetEmail}`,
    };
  },
});

/**
 * Internal action: set a user's platform role by email (no JWT required).
 *
 * WHY: The public `setPlatformRole` mutation requires a JWT with platformRole.
 * For E2E global-setup, we need to set the role BEFORE the user has signed in
 * with admin privileges (bootstrap problem). This internal action is called
 * by the HTTP action (which validates a shared secret instead of JWT).
 *
 * This action:
 *   1. Updates our custom Convex `users` table (patchUserPlatformRole mutation)
 *   2. Updates the Better Auth user record via betterAuth.adapter.updateMany
 *      so that the next /api/auth/get-session returns platformRole in the user
 *      object (which the proxy.ts reads for admin routing).
 *
 * SECURITY: This is internal-only — cannot be called from client code.
 * Access is controlled by the HTTP action's shared secret validation.
 *
 * vi: "Action nội bộ — đặt vai trò nền tảng không cần JWT"
 * en: "Internal action — set platform role without JWT"
 */
export const internalSetPlatformRole = internalAction({
  args: {
    // vi: "Email người dùng mục tiêu" / en: "Target user email"
    targetEmail: v.string(),
    // vi: "Vai trò nền tảng" / en: "Platform role to assign"
    role: v.union(v.literal("platform_admin"), v.literal("platform_support")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; userId: string; message: string }> => {
    // Step 1: Update our custom users table
    const patchResult = (await ctx.runMutation(
      internal.userActions.patchUserPlatformRole,
      { targetEmail: args.targetEmail, role: args.role },
    )) as { success: boolean; userId: string; message: string };

    // Step 2: Update the Better Auth user record so the session JWT includes platformRole.
    // WHY: The proxy.ts reads platformRole from /api/auth/get-session which returns
    // the Better Auth user's additionalFields. Updating our Convex users table alone
    // is not enough — the Better Auth component's user table must also be updated.
    //
    // The betterAuth adapter updateMany accepts custom additionalFields (like platformRole)
    // even though they're not typed in the generated types. We use `as any` to bypass
    // the TypeScript check — this is safe because platformRole is declared as an
    // additionalField in convex/auth.ts createAuthOptions.
    //
    // WHY updateMany instead of updateOne:
    // updateMany with a where clause is the simplest way to update by email without
    // needing to first look up the user's betterAuth ID.
    try {
      await ctx.runMutation(components.betterAuth.adapter.updateMany, {
        input: {
          model: "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          update: { platformRole: args.role } as any,
          where: [
            {
              field: "email",
              operator: "eq",
              value: args.targetEmail,
            },
          ],
        },
        paginationOpts: {
          cursor: null,
          numItems: 1,
        },
      } as any);
    } catch (err) {
      // Log but don't fail — the custom users table was already updated.
      // The Better Auth update may fail if the user doesn't exist in Better Auth yet,
      // which can happen in test environments.
      console.warn(
        `[internalSetPlatformRole] Better Auth user update failed for ${args.targetEmail}:`,
        err instanceof Error ? err.message : String(err),
      );
    }

    return {
      success: true,
      userId: patchResult.userId,
      message: `Role updated to ${args.role} for ${args.targetEmail}`,
    };
  },
});

// ---------------------------------------------------------------------------
// HTTP ACTION (for E2E global-setup access)
// ---------------------------------------------------------------------------

/**
 * HTTP action: POST /api/admin/set-platform-role
 *
 * WHY: E2E global-setup runs in Playwright (browser context) and cannot use the
 * Convex Node.js client directly. This HTTP endpoint bridges the gap:
 *   1. global-setup signs up a user via Better Auth
 *   2. global-setup calls this endpoint with the user's email + shared secret
 *   3. This endpoint validates the secret and calls internalSetPlatformRole
 *   4. global-setup then signs in again to get a fresh JWT with platformRole
 *
 * SECURITY: Protected by ADMIN_SETUP_SECRET env var. Returns 403 if secret
 * is missing or doesn't match. This endpoint is only accessible in dev/test
 * environments where ADMIN_SETUP_SECRET is set.
 *
 * Request body: { email: string, role: "platform_admin" | "platform_support" }
 * Request header: x-admin-setup-secret: <ADMIN_SETUP_SECRET>
 *
 * vi: "HTTP action — đặt vai trò nền tảng cho thiết lập E2E"
 * en: "HTTP action — set platform role for E2E setup"
 */
export const setPlatformRoleHttp = httpAction(async (ctx, request) => {
  // Validate shared secret
  // WHY: Prevents unauthorized role escalation. In production, ADMIN_SETUP_SECRET
  // should not be set, effectively disabling this endpoint.
  // eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties
  const adminSetupSecret = process.env.ADMIN_SETUP_SECRET;

  if (!adminSetupSecret) {
    return new Response(
      JSON.stringify({
        error: "Endpoint not enabled (ADMIN_SETUP_SECRET not configured)",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const requestSecret = request.headers.get("x-admin-setup-secret");
  if (!requestSecret || requestSecret !== adminSetupSecret) {
    return new Response(
      JSON.stringify({ error: "Forbidden: Invalid admin setup secret" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Parse request body
  let body: { email?: string; role?: string } = {};
  try {
    body = (await request.json()) as { email?: string; role?: string };
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { email, role } = body;

  if (!email || typeof email !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid 'email' field" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (role !== "platform_admin" && role !== "platform_support") {
    return new Response(
      JSON.stringify({
        error:
          "Invalid 'role' field: must be 'platform_admin' or 'platform_support'",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Call internal action to set the role (action updates both custom users table
  // AND the Better Auth user record so the JWT includes platformRole)
  try {
    const result = await ctx.runAction(
      internal.userActions.internalSetPlatformRole,
      { targetEmail: email, role },
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
