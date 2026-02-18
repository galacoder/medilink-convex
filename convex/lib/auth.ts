/**
 * Auth helper utilities for Convex queries and mutations.
 *
 * WHY: Centralizes authentication and authorization checks so every query/mutation
 * follows the same pattern. This is the first Convex auth helper in the project,
 * establishing patterns for all future milestones.
 *
 * vi: "Tiện ích xác thực" / en: "Auth helper utilities"
 */

import { ConvexError } from "convex/values";
import type {
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";

import { authComponent } from "../auth";
import type { DataModel } from "../_generated/dataModel";

/**
 * Context type that works for both queries and mutations.
 * vi: "Loại ngữ cảnh" / en: "Context type"
 */
export type AnyCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

/**
 * Org membership role enum.
 * vi: "Vai trò thành viên tổ chức" / en: "Org membership role"
 */
export type OrgRole = "owner" | "admin" | "member";

/**
 * The authenticated user document from Better Auth.
 * WHY: Provides a named type for clarity across helper functions.
 */
export type AuthUser = Awaited<ReturnType<typeof authComponent.getAuthUser>>;

/**
 * Get the currently authenticated user, or throw a ConvexError if unauthenticated.
 *
 * WHY: All provider management operations require authentication.
 * Using getAuthUser (not safeGetAuthUser) ensures callers get a typed user doc
 * and don't have to handle null themselves.
 *
 * vi: "Lấy người dùng đã xác thực" / en: "Get authenticated user"
 *
 * @throws ConvexError with "Unauthenticated" if no active session exists
 */
export async function getAuthenticatedUser(ctx: AnyCtx): Promise<AuthUser> {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      // vi: "Bạn phải đăng nhập để thực hiện thao tác này"
      // en: "You must be signed in to perform this action"
      message: "Unauthenticated",
    });
  }
}

/**
 * Verify that the authenticated user has a membership in the given organization
 * with one of the required roles. Throws a ConvexError if the check fails.
 *
 * WHY: Provider mutations must be scoped to the provider's org. This helper
 * enforces RBAC in a single, reusable place rather than duplicating role checks.
 *
 * vi: "Yêu cầu quyền thành viên tổ chức" / en: "Require org membership"
 *
 * @param ctx - Convex context
 * @param orgId - The organization ID to check membership for
 * @param requiredRoles - Roles that are allowed (default: all roles)
 * @returns The membership document
 * @throws ConvexError if user is not a member or lacks the required role
 */
export async function requireOrgMembership(
  ctx: AnyCtx,
  orgId: string,
  requiredRoles: OrgRole[] = ["owner", "admin", "member"],
) {
  const user = await getAuthenticatedUser(ctx);

  // Look up the user in our users table via email match
  // WHY: authComponent.getAuthUser returns the Better Auth user with email.
  // We query our users table to get the Convex ID.
  const convexUser = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("email"), user.email))
    .first();

  if (!convexUser) {
    throw new ConvexError({
      code: "USER_NOT_FOUND",
      // vi: "Không tìm thấy người dùng trong hệ thống"
      // en: "User not found in the system"
      message: "User not found",
    });
  }

  const membership = await ctx.db
    .query("organizationMemberships")
    .withIndex("by_org_and_user", (q) =>
      q.eq("orgId", orgId as any).eq("userId", convexUser._id),
    )
    .first();

  if (!membership) {
    throw new ConvexError({
      code: "NOT_ORG_MEMBER",
      // vi: "Bạn không phải thành viên của tổ chức này"
      // en: "You are not a member of this organization"
      message: "Not a member of this organization",
    });
  }

  if (!requiredRoles.includes(membership.role as OrgRole)) {
    throw new ConvexError({
      code: "INSUFFICIENT_ROLE",
      // vi: "Bạn không có quyền thực hiện thao tác này"
      // en: "You do not have permission to perform this action"
      message: `Insufficient role. Required: ${requiredRoles.join(" or ")}, got: ${membership.role}`,
    });
  }

  return { membership, convexUser };
}

/**
 * Verify that the given organization has org_type === "provider".
 *
 * WHY: Provider mutations should only operate on provider-type orgs, not hospitals.
 * This guard prevents hospital orgs from accidentally calling provider endpoints.
 *
 * vi: "Yêu cầu tổ chức là nhà cung cấp" / en: "Require provider org"
 *
 * @throws ConvexError if the org does not exist or is not a provider org
 */
export async function requireProviderOrg(ctx: AnyCtx, orgId: string) {
  const org = await ctx.db.get(orgId as any);

  if (!org) {
    throw new ConvexError({
      code: "ORG_NOT_FOUND",
      // vi: "Không tìm thấy tổ chức"
      // en: "Organization not found"
      message: "Organization not found",
    });
  }

  if ((org as any).org_type !== "provider") {
    throw new ConvexError({
      code: "NOT_PROVIDER_ORG",
      // vi: "Tổ chức này không phải nhà cung cấp dịch vụ"
      // en: "This organization is not a service provider"
      message: "Organization is not a provider",
    });
  }

  return org;
}

/**
 * Get the provider record for a given organization, or null if not found.
 *
 * WHY: Many queries and mutations need the provider doc linked to an org.
 * Centralizing this avoids repeating the by_org index lookup.
 *
 * vi: "Lấy nhà cung cấp theo tổ chức" / en: "Get provider for org"
 */
export async function getProviderForOrg(ctx: AnyCtx, orgId: string) {
  return await ctx.db
    .query("providers")
    .withIndex("by_org", (q) => q.eq("organizationId", orgId as any))
    .first();
}
