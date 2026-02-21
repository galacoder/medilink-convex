/**
 * Convex organization queries and mutations.
 *
 * WHY: Real-time organization data (name, members, stats) is served via Convex
 * reactive queries. Settings updates write audit log entries for compliance.
 *
 * All queries enforce that the caller is a member of the requested organization
 * (multi-tenancy: user in org A cannot see org B data).
 */
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import {
  canManageMember,
  countOwners,
  requireOrgAdmin,
  requireOrgMember,
} from "./lib/permissions";

// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------

/**
 * Get organization by ID.
 * Only accessible to members of the organization.
 *
 * Bilingual: vi: "Lấy thông tin tổ chức" / en: "Get organization"
 */
export const getOrganization = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Bạn chưa đăng nhập (Not authenticated)");
    }

    // Find the user record by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), authUser.email))
      .unique();

    if (!user) {
      throw new ConvexError("Không tìm thấy người dùng (User not found)");
    }

    // Verify membership (throws if not a member)
    await requireOrgMember(ctx, args.orgId, user._id);

    return ctx.db.get(args.orgId);
  },
});

/**
 * Get the current user's primary org context for routing cookie restoration.
 *
 * WHY: The medilink-org-context routing cookie is only set during sign-up.
 * On subsequent sign-ins the cookie is absent, breaking proxy routing.
 * This query lets the sign-in flow restore the cookie from the user's
 * existing membership without requiring re-signup.
 *
 * Returns the first org the caller belongs to (owner memberships preferred),
 * or null if the user has no org membership yet.
 *
 * Bilingual: vi: "Lấy ngữ cảnh tổ chức người dùng" / en: "Get user org context"
 */
export const getUserContext = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) return null;

    // Use .first() instead of .unique() in case of duplicate email records
    // (e.g., seeded user + provisioned user both with the same email)
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), authUser.email))
      .first();
    if (!user) return null;

    // For platform admins, return platformRole immediately without needing an org.
    // WHY: The Better Auth component's schema doesn't support platformRole as a
    // stored field, so we read it from our custom users table instead.
    if (
      user.platformRole === "platform_admin" ||
      user.platformRole === "platform_support"
    ) {
      return {
        orgId: null as unknown as string,
        orgType: null as unknown as string,
        orgName: null as unknown as string,
        role: null as unknown as string,
        platformRole: user.platformRole,
      };
    }

    // Prefer owner membership, fall back to any membership
    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (memberships.length === 0) return null;

    const preferred =
      memberships.find((m) => m.role === "owner") ?? memberships[0];
    if (!preferred) return null;

    const org = await ctx.db.get(preferred.orgId);
    if (!org) return null;

    return {
      orgId: org._id,
      orgType: org.org_type,
      orgName: org.name,
      role: preferred.role,
      platformRole: user.platformRole ?? null,
    };
  },
});

/**
 * Get organization by slug.
 * Only accessible to members of the organization.
 *
 * Bilingual: vi: "Lấy tổ chức theo slug" / en: "Get organization by slug"
 */
export const getOrganizationBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Bạn chưa đăng nhập (Not authenticated)");
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!org) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), authUser.email))
      .unique();

    if (!user) return null;

    // Verify membership
    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", org._id).eq("userId", user._id),
      )
      .unique();

    if (!membership) return null;

    return org;
  },
});

/**
 * List organization members with user details joined.
 * Returns members with name, email, role for display in the members table.
 *
 * Bilingual: vi: "Danh sách thành viên" / en: "Organization members list"
 */
export const listOrganizationMembers = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Bạn chưa đăng nhập (Not authenticated)");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), authUser.email))
      .unique();

    if (!user) {
      throw new ConvexError("Không tìm thấy người dùng (User not found)");
    }

    // Verify caller is a member
    const callerMembership = await requireOrgMember(ctx, args.orgId, user._id);

    // Fetch all memberships for this org
    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

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
          createdAt: membership.createdAt,
        };
      }),
    );

    return {
      members,
      callerRole: callerMembership.role,
      totalCount: members.length,
    };
  },
});

/**
 * Get organization stats: member count, owner count.
 *
 * Bilingual: vi: "Thống kê tổ chức" / en: "Organization stats"
 */
export const getOrganizationStats = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Bạn chưa đăng nhập (Not authenticated)");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), authUser.email))
      .unique();

    if (!user) {
      throw new ConvexError("Không tìm thấy người dùng (User not found)");
    }

    await requireOrgMember(ctx, args.orgId, user._id);

    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return {
      totalMembers: memberships.length,
      ownerCount: memberships.filter((m) => m.role === "owner").length,
      adminCount: memberships.filter((m) => m.role === "admin").length,
      memberCount: memberships.filter((m) => m.role === "member").length,
    };
  },
});

// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------

/**
 * Update organization settings (name, slug, contact info).
 * Requires admin or owner role.
 * Writes audit log entry for compliance (Vietnamese medical device regulations).
 *
 * Bilingual: vi: "Cập nhật cài đặt tổ chức" / en: "Update organization settings"
 */
export const updateOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Bạn chưa đăng nhập (Not authenticated)");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), authUser.email))
      .unique();

    if (!user) {
      throw new ConvexError("Không tìm thấy người dùng (User not found)");
    }

    // Require admin or owner
    await requireOrgAdmin(ctx, args.orgId, user._id);

    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new ConvexError("Không tìm thấy tổ chức (Organization not found)");
    }

    // Check slug uniqueness if slug is being updated
    if (args.slug && args.slug !== org.slug) {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .unique();
      if (existing) {
        throw new ConvexError(
          "Slug đã được sử dụng bởi tổ chức khác (Slug is already taken by another organization)",
        );
      }
    }

    const now = Date.now();
    const previousValues = {
      name: org.name,
      slug: org.slug,
    };

    // Build update object with only provided fields
    const updates: Partial<{
      name: string;
      slug: string;
      updatedAt: number;
    }> = { updatedAt: now };

    if (args.name !== undefined) updates.name = args.name;
    if (args.slug !== undefined) updates.slug = args.slug;

    await ctx.db.patch(args.orgId, updates);

    // Write audit log for compliance
    await ctx.db.insert("auditLog", {
      organizationId: args.orgId,
      actorId: user._id,
      action: "organization.settings_updated",
      resourceType: "organization",
      resourceId: args.orgId,
      previousValues,
      newValues: { name: args.name, slug: args.slug },
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Update member role within an organization.
 * Requires appropriate permissions (see canManageMember).
 * Cannot demote the last owner.
 *
 * Bilingual: vi: "Thay đổi vai trò thành viên" / en: "Update member role"
 */
export const updateMemberRole = mutation({
  args: {
    orgId: v.id("organizations"),
    targetUserId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Bạn chưa đăng nhập (Not authenticated)");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), authUser.email))
      .unique();

    if (!user) {
      throw new ConvexError("Không tìm thấy người dùng (User not found)");
    }

    // Require at least member (throws if not in org)
    const callerMembership = await requireOrgMember(ctx, args.orgId, user._id);

    // Find target membership
    const targetMembership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.targetUserId),
      )
      .unique();

    if (!targetMembership) {
      throw new ConvexError(
        "Thành viên không thuộc tổ chức này (Member not found in this organization)",
      );
    }

    // Check if caller can manage this target
    if (
      !canManageMember(
        callerMembership.role,
        targetMembership.role,
        user._id,
        args.targetUserId,
      )
    ) {
      throw new ConvexError(
        "Bạn không có quyền thay đổi vai trò của thành viên này (You do not have permission to change this member's role)",
      );
    }

    // Prevent demoting the last owner
    if (targetMembership.role === "owner" && args.role !== "owner") {
      const ownerCount = await countOwners(ctx, args.orgId);
      if (ownerCount <= 1) {
        throw new ConvexError(
          "Không thể thay đổi vai trò của chủ sở hữu cuối cùng (Cannot change the role of the last owner)",
        );
      }
    }

    const now = Date.now();
    const previousRole = targetMembership.role;

    await ctx.db.patch(targetMembership._id, {
      role: args.role,
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("auditLog", {
      organizationId: args.orgId,
      actorId: user._id,
      action: "organization.member_role_changed",
      resourceType: "organizationMembership",
      resourceId: targetMembership._id,
      previousValues: { role: previousRole },
      newValues: { role: args.role },
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Remove a member from the organization.
 * Cannot remove the last owner.
 * Requires admin or owner role.
 *
 * Bilingual: vi: "Xóa thành viên khỏi tổ chức" / en: "Remove member from organization"
 */
export const removeMember = mutation({
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
      .filter((q) => q.eq(q.field("email"), authUser.email))
      .unique();

    if (!user) {
      throw new ConvexError("Không tìm thấy người dùng (User not found)");
    }

    // Require admin or owner to remove members
    const callerMembership = await requireOrgAdmin(ctx, args.orgId, user._id);

    const targetMembership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.targetUserId),
      )
      .unique();

    if (!targetMembership) {
      throw new ConvexError(
        "Thành viên không thuộc tổ chức này (Member not found in this organization)",
      );
    }

    // Check if caller can manage this target
    if (
      !canManageMember(
        callerMembership.role,
        targetMembership.role,
        user._id,
        args.targetUserId,
      )
    ) {
      throw new ConvexError(
        "Bạn không có quyền xóa thành viên này (You do not have permission to remove this member)",
      );
    }

    // Prevent removing the last owner
    if (targetMembership.role === "owner") {
      const ownerCount = await countOwners(ctx, args.orgId);
      if (ownerCount <= 1) {
        throw new ConvexError(
          "Không thể xóa chủ sở hữu cuối cùng (Cannot remove the last owner)",
        );
      }
    }

    const now = Date.now();

    await ctx.db.delete(targetMembership._id);

    // Write audit log
    await ctx.db.insert("auditLog", {
      organizationId: args.orgId,
      actorId: user._id,
      action: "organization.member_removed",
      resourceType: "organizationMembership",
      resourceId: targetMembership._id,
      previousValues: {
        userId: args.targetUserId,
        role: targetMembership.role,
      },
      newValues: null,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});
