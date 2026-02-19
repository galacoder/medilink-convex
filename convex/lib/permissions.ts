/**
 * Permission helper utilities for Convex organization functions.
 *
 * WHY: Centralizing permission checks prevents inconsistent authorization
 * across mutations and makes security auditing straightforward.
 * All org-scoped mutations must call one of these helpers before performing
 * any data modification.
 *
 * Permission matrix:
 *   owner > admin > member
 *   - owner:  full control (update settings, change any role, remove any member)
 *   - admin:  can update settings, invite, remove members (not owners)
 *   - member: read-only
 */
import { ConvexError } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type OrgRole = "owner" | "admin" | "member";

export interface MembershipRecord {
  _id: Id<"organizationMemberships">;
  orgId: Id<"organizations">;
  userId: Id<"users">;
  role: OrgRole;
  createdAt: number;
  updatedAt: number;
}

/**
 * Finds the caller's membership in the organization.
 * Returns null if the user is not a member (not throwing — caller decides).
 *
 * WHY: Used by all permission helpers to avoid duplicate index lookups.
 */
async function getCallerMembership(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  callerUserId: Id<"users">,
): Promise<MembershipRecord | null> {
  return ctx.db
    .query("organizationMemberships")
    .withIndex("by_org_and_user", (q) =>
      q.eq("orgId", orgId).eq("userId", callerUserId),
    )
    .unique() as Promise<MembershipRecord | null>;
}

/**
 * Requires the caller to be a member (any role) of the organization.
 * Throws ConvexError if not authenticated or not a member.
 *
 * Bilingual error: vi: "Bạn không có quyền truy cập tổ chức này"
 *                  en: "You do not have access to this organization"
 */
export async function requireOrgMember(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  callerUserId: Id<"users">,
): Promise<MembershipRecord> {
  const membership = await getCallerMembership(ctx, orgId, callerUserId);
  if (!membership) {
    throw new ConvexError(
      "Bạn không có quyền truy cập tổ chức này (You do not have access to this organization)",
    );
  }
  return membership;
}

/**
 * Requires the caller to be an admin or owner of the organization.
 * Throws ConvexError if the caller is only a member.
 *
 * Bilingual error: vi: "Bạn cần quyền quản trị viên để thực hiện hành động này"
 *                  en: "You need admin permissions to perform this action"
 */
export async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  callerUserId: Id<"users">,
): Promise<MembershipRecord> {
  const membership = await requireOrgMember(ctx, orgId, callerUserId);
  if (membership.role === "member") {
    throw new ConvexError(
      "Bạn cần quyền quản trị viên để thực hiện hành động này (You need admin permissions to perform this action)",
    );
  }
  return membership;
}

/**
 * Requires the caller to be the owner of the organization.
 * Throws ConvexError if the caller is admin or member.
 *
 * Bilingual error: vi: "Chỉ chủ sở hữu mới có thể thực hiện hành động này"
 *                  en: "Only the organization owner can perform this action"
 */
export async function requireOrgOwner(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  callerUserId: Id<"users">,
): Promise<MembershipRecord> {
  const membership = await requireOrgMember(ctx, orgId, callerUserId);
  if (membership.role !== "owner") {
    throw new ConvexError(
      "Chỉ chủ sở hữu mới có thể thực hiện hành động này (Only the organization owner can perform this action)",
    );
  }
  return membership;
}

/**
 * Determines if the caller can manage (change role or remove) the target member.
 *
 * Rules:
 * - Owner can manage anyone except themselves (last-owner guard is separate)
 * - Admin can manage members only (not other admins or owners)
 * - Member cannot manage anyone
 *
 * WHY: Separating this logic from the actual mutation prevents the same
 * permission matrix from being duplicated across updateMemberRole and removeMember.
 */
export function canManageMember(
  callerRole: OrgRole,
  targetRole: OrgRole,
  callerId: Id<"users">,
  targetId: Id<"users">,
): boolean {
  // Cannot manage yourself
  if (callerId === targetId) return false;

  if (callerRole === "owner") {
    // Owner can manage anyone (except self, handled above)
    return true;
  }
  if (callerRole === "admin") {
    // Admin can only manage members
    return targetRole === "member";
  }
  // Member cannot manage anyone
  return false;
}

/**
 * Counts the number of owners in an organization.
 * Used to prevent removing or demoting the last owner.
 */
export async function countOwners(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
): Promise<number> {
  const memberships = await ctx.db
    .query("organizationMemberships")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();

  return memberships.filter((m) => m.role === "owner").length;
}
