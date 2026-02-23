/**
 * Convex membership queries and mutations.
 *
 * WHY: Membership management is split from organizations.ts for clarity.
 * This module handles listing members and managing membership status.
 * Invite/accept flows are handled by Better Auth's organization plugin
 * via the tRPC organization router.
 *
 * All operations enforce multi-tenancy: caller must be a member of the org.
 */
import { ConvexError, v } from "convex/values";

import { query } from "./_generated/server";
import { authComponent } from "./auth";
import { requireOrgMember } from "./lib/permissions";

// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------

/**
 * List members of an organization (paginated).
 * Returns members with user details for display in the members table.
 *
 * Bilingual: vi: "Danh sách thành viên" / en: "Members list"
 */
export const listMembers = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Bạn chưa đăng nhập (Not authenticated)");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .unique();

    if (!user) {
      throw new ConvexError("Không tìm thấy người dùng (User not found)");
    }

    // Caller must be a member of this org
    const callerMembership = await requireOrgMember(ctx, args.orgId, user._id);

    const limit = args.limit ?? 50;

    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .take(limit);

    // Join with user details
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.userId);
        return {
          membershipId: membership._id,
          userId: membership.userId,
          name: memberUser?.name ?? "Không tên (Unknown)",
          email: memberUser?.email ?? "",
          role: membership.role,
          joinedAt: membership.createdAt,
        };
      }),
    );

    return {
      members,
      callerRole: callerMembership.role,
      callerId: user._id,
      total: members.length,
    };
  },
});

/**
 * Get a specific member's details within an organization.
 * Useful for role checks before showing action buttons.
 *
 * Bilingual: vi: "Thông tin thành viên" / en: "Member details"
 */
export const getMember = query({
  args: {
    orgId: v.id("organizations"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Bạn chưa đăng nhập (Not authenticated)");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .unique();

    if (!user) {
      throw new ConvexError("Không tìm thấy người dùng (User not found)");
    }

    // Caller must be a member
    await requireOrgMember(ctx, args.orgId, user._id);

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.targetUserId),
      )
      .unique();

    if (!membership) return null;

    const memberUser = await ctx.db.get(membership.userId);
    return {
      membershipId: membership._id,
      userId: membership.userId,
      name: memberUser?.name ?? "Không tên (Unknown)",
      email: memberUser?.email ?? "",
      role: membership.role,
      joinedAt: membership.createdAt,
    };
  },
});
