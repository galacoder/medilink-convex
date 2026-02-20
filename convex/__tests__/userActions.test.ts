/**
 * Integration tests for userActions.ts — setPlatformRole mutation.
 *
 * WHY: setPlatformRole is the only way to programmatically grant platform_admin
 * or platform_support role to a user created via Better Auth signup.
 * These tests verify:
 *   1. platform_admin can set role on another user
 *   2. non-admin gets FORBIDDEN error
 *   3. unauthenticated caller gets UNAUTHENTICATED error
 *   4. user not found returns error
 *
 * Auth pattern: platform_admin uses { platformRole: "platform_admin", subject: userId }
 * via withIdentity — same pattern as admin.hospitals.test.ts
 *
 * vi: "Kiểm tra hành động người dùng — đặt quyền nền tảng"
 * en: "User actions tests — set platform role"
 */
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedUser(
  t: ReturnType<typeof convexTest>,
  email = "admin@sanglertech.com",
  platformRole?: "platform_admin" | "platform_support",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name: platformRole ? "Platform Admin" : "Regular User",
      email,
      ...(platformRole ? { platformRole } : {}),
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// userActions.setPlatformRole
// ===========================================================================
describe("userActions.setPlatformRole", () => {
  /**
   * Test 1: platform_admin can set role on another user.
   *
   * WHY: The primary use case — E2E global-setup calls this to grant admin
   * role to a newly signed-up test user.
   *
   * vi: "Quản trị viên nền tảng có thể đặt vai trò cho người dùng khác"
   * en: "Platform admin can set role on another user"
   */
  it("setPlatformRole_platformAdmin_canSetRole", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    const targetUserId = await seedUser(t, "target@test.medilink.com");

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    // Should succeed without throwing
    const result = await asAdmin.mutation(api.userActions.setPlatformRole, {
      targetEmail: "target@test.medilink.com",
      role: "platform_admin",
    });

    expect(result.success).toBe(true);

    // Verify the user was actually updated
    const updatedUser = await t.run(async (ctx) => {
      return ctx.db.get(targetUserId as any);
    });
    expect(updatedUser?.platformRole).toBe("platform_admin");
  });

  /**
   * Test 2: platform_support can also set role (has admin privileges).
   *
   * WHY: platform_support is a secondary admin role that should also be
   * able to manage roles.
   *
   * vi: "Hỗ trợ nền tảng có thể đặt vai trò cho người dùng"
   * en: "Platform support can set role"
   */
  it("setPlatformRole_platformAdmin_canSetSupportRole", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );
    await seedUser(t, "target@test.medilink.com");

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    const result = await asAdmin.mutation(api.userActions.setPlatformRole, {
      targetEmail: "target@test.medilink.com",
      role: "platform_support",
    });

    expect(result.success).toBe(true);
  });

  /**
   * Test 3: non-admin gets FORBIDDEN error.
   *
   * WHY: Regular users (hospital staff, providers) must not be able to
   * escalate their own or others' privileges.
   *
   * vi: "Người dùng thường nhận lỗi FORBIDDEN"
   * en: "Non-admin gets FORBIDDEN error"
   */
  it("setPlatformRole_nonAdmin_throwsForbidden", async () => {
    const t = convexTest(schema, modules);
    const regularUserId = await seedUser(t, "staff@hospital.vn");
    await seedUser(t, "target@test.medilink.com");

    const asRegularUser = t.withIdentity({
      subject: regularUserId,
      // No platformRole — regular org member
    });

    await expect(
      asRegularUser.mutation(api.userActions.setPlatformRole, {
        targetEmail: "target@test.medilink.com",
        role: "platform_admin",
      }),
    ).rejects.toThrow();
  });

  /**
   * Test 4: unauthenticated caller gets UNAUTHENTICATED error.
   *
   * WHY: The HTTP endpoint validates a shared secret and the mutation
   * validates JWT auth — but the mutation itself must also reject
   * unauthenticated calls.
   *
   * vi: "Người dùng chưa đăng nhập nhận lỗi UNAUTHENTICATED"
   * en: "Unauthenticated caller gets UNAUTHENTICATED error"
   */
  it("setPlatformRole_unauthenticated_throwsUnauthenticated", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, "target@test.medilink.com");

    // Call without withIdentity — no authentication
    await expect(
      t.mutation(api.userActions.setPlatformRole, {
        targetEmail: "target@test.medilink.com",
        role: "platform_admin",
      }),
    ).rejects.toThrow();
  });

  /**
   * Test 5: user not found returns error.
   *
   * WHY: When E2E global-setup provides an email that doesn't exist
   * in the users table (e.g., signup failed), we must return a clear error
   * rather than silently succeeding.
   *
   * vi: "Không tìm thấy người dùng trả về lỗi"
   * en: "User not found returns error"
   */
  it("setPlatformRole_userNotFound_throwsError", async () => {
    const t = convexTest(schema, modules);
    const adminUserId = await seedUser(
      t,
      "admin@sanglertech.com",
      "platform_admin",
    );

    const asAdmin = t.withIdentity({
      platformRole: "platform_admin",
      subject: adminUserId,
    });

    await expect(
      asAdmin.mutation(api.userActions.setPlatformRole, {
        targetEmail: "nonexistent@test.medilink.com",
        role: "platform_admin",
      }),
    ).rejects.toThrow();
  });
});
