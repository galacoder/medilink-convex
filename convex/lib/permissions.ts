/**
 * Organization permission helpers for Convex queries and mutations.
 *
 * WHY: Multi-tenant access control is enforced at the query/mutation level.
 * Every org-scoped operation must verify the caller is a member (or admin/owner)
 * before returning data or making mutations. These helpers centralize that logic.
 *
 * vi: "Tiện ích phân quyền tổ chức" / en: "Organization permission helpers"
 */

import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { DataModel, Id } from "../_generated/dataModel";

/**
 * Context type accepted by permission helpers (queries and mutations both work).
 * vi: "Loại ngữ cảnh" / en: "Generic context type"
 */
type AnyCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

/**
 * Org membership role type (mirrors schema.ts organizationMemberships.role).
 * vi: "Vai trò thành viên" / en: "Membership role"
 */
type OrgRole = "owner" | "admin" | "member";

/**
 * Verifies the caller is a member of the organization.
 * Throws a bilingual ConvexError if not.
 *
 * WHY: All org-scoped queries must call this to enforce multi-tenancy.
 * Returns the membership record so callers can inspect the role.
 *
 * vi: "Yêu cầu người dùng là thành viên tổ chức" / en: "Require org membership"
 *
 * @returns The caller's organizationMembership document
 * @throws ConvexError if not a member
 */
export async function requireOrgMember(
  ctx: AnyCtx,
  orgId: Id<"organizations">,
  userId: Id<"users">,
) {
  const membership = await ctx.db
    .query("organizationMemberships")
    .withIndex("by_org_and_user", (q) =>
      q.eq("orgId", orgId).eq("userId", userId),
    )
    .unique();

  if (!membership) {
    throw new ConvexError({
      message: "You are not a member of this organization",
      vi: "Bạn không phải là thành viên của tổ chức này",
    });
  }

  return membership;
}

/**
 * Verifies the caller is an admin or owner of the organization.
 * Throws a bilingual ConvexError if not.
 *
 * WHY: Administrative operations (settings changes, member management) require
 * elevated permissions beyond basic membership.
 *
 * vi: "Yêu cầu người dùng là quản trị viên" / en: "Require org admin or owner"
 *
 * @returns The caller's organizationMembership document
 * @throws ConvexError if not an admin or owner
 */
export async function requireOrgAdmin(
  ctx: AnyCtx,
  orgId: Id<"organizations">,
  userId: Id<"users">,
) {
  const membership = await requireOrgMember(ctx, orgId, userId);

  if (membership.role !== "admin" && membership.role !== "owner") {
    throw new ConvexError({
      message: "You must be an admin or owner to perform this action",
      vi: "Bạn phải là quản trị viên hoặc chủ sở hữu để thực hiện hành động này",
    });
  }

  return membership;
}

/**
 * Determines whether a caller can manage (change role / remove) a target member.
 *
 * WHY: Role hierarchy enforcement — higher roles can manage lower ones.
 * Owners can manage anyone. Admins can manage members and other admins
 * (but not owners). Members cannot manage others.
 * A user cannot manage themselves via this check (caller === target returns false).
 *
 * vi: "Kiểm tra quyền quản lý thành viên" / en: "Check member management permission"
 *
 * @param callerRole - The role of the user requesting the action
 * @param targetRole - The role of the user being managed
 * @param callerId - The ID of the caller
 * @param targetId - The ID of the target member
 * @returns true if the caller can manage the target
 */
export function canManageMember(
  callerRole: OrgRole,
  targetRole: OrgRole,
  callerId: Id<"users">,
  targetId: Id<"users">,
): boolean {
  // Users cannot manage themselves through this path
  if (callerId === targetId) return false;

  // Owners can manage anyone
  if (callerRole === "owner") return true;

  // Admins can manage members and other admins, but not owners
  if (callerRole === "admin") {
    return targetRole !== "owner";
  }

  // Members cannot manage others
  return false;
}

/**
 * Counts the number of owners in an organization.
 *
 * WHY: Prevents removing or demoting the last owner, which would lock
 * everyone out of the organization's administrative functions.
 *
 * vi: "Đếm số chủ sở hữu" / en: "Count organization owners"
 */
export async function countOwners(
  ctx: AnyCtx,
  orgId: Id<"organizations">,
): Promise<number> {
  const memberships = await ctx.db
    .query("organizationMemberships")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();

  return memberships.filter((m) => m.role === "owner").length;
}
