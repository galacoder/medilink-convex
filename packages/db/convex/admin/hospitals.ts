/**
 * Platform admin hospital management functions.
 *
 * WHY: Platform admins (SangLeTech staff) need cross-tenant visibility into all
 * hospital organizations without being members of any individual org. These
 * functions bypass the standard org-membership check and instead require
 * platformRole === "platform_admin" from the JWT identity token.
 *
 * All functions in this module:
 *   1. Extract auth context via localRequireAuth() (JWT-based, no better-auth dep)
 *   2. Assert platformRole === "platform_admin" (throws if not)
 *   3. Operate on all orgs (no organizationId filter — cross-tenant access)
 *
 * WHY local auth helper: convex/lib/auth.ts imports better-auth/minimal which
 * causes module resolution issues in the convex-test environment. Following the
 * pattern in disputes.ts, we use ctx.auth.getUserIdentity() directly.
 *
 * Bilingual: vi: "Quản lý bệnh viện — Quản trị viên nền tảng"
 *            en: "Hospital Management — Platform Admin"
 */
import { ConvexError, v } from "convex/values";

import { mutation, query } from "../_generated/server";

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// ---------------------------------------------------------------------------

interface PlatformAuthContext {
  userId: string;
  platformRole: string | null;
}

/**
 * Extracts and validates platformRole from the JWT identity.
 * Throws bilingual ConvexError if not authenticated.
 *
 * WHY: Using ctx.auth.getUserIdentity() directly avoids importing
 * the full better-auth stack which causes module resolution issues in tests.
 *
 * vi: "Xác thực quản trị viên nền tảng" / en: "Authenticate platform admin"
 */
async function localRequireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<PlatformAuthContext & { email: string | null }> {
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
    email: (identity.email as string | null) ?? null,
    platformRole: (identity.platformRole as string | null) ?? null,
  };
}

/**
 * Asserts the caller has platformRole === "platform_admin".
 * Falls back to the custom `users` table when JWT lacks platformRole
 * (Better Auth Convex component cannot store custom additionalFields).
 *
 * WHY: All platformAdmin.* functions share the same authorization guard.
 * Centralizing it here ensures consistent error messages.
 *
 * vi: "Yêu cầu quyền quản trị viên nền tảng" / en: "Require platform admin role"
 */
async function requirePlatformAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<PlatformAuthContext> {
  const auth = await localRequireAuth(ctx);

  if (auth.platformRole === "platform_admin") {
    return auth;
  }

  // JWT fallback: Better Auth Convex component cannot store platformRole.
  // Look it up from the custom `users` table using email from the JWT.
  if (auth.email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", auth.email))
      .first();
    if (user?.platformRole === "platform_admin") {
      return { userId: auth.userId, platformRole: "platform_admin" };
    }
  }

  throw new ConvexError({
    code: "FORBIDDEN",
    // vi: "Chỉ quản trị viên nền tảng mới có quyền truy cập"
    // en: "Only platform admins can access this resource"
    message:
      "Chỉ quản trị viên nền tảng mới có quyền truy cập (Only platform admins can access this resource)",
  });
}

// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------

/**
 * List all hospital organizations with name, status, member count, and
 * equipment count. Supports search by name and filter by status.
 * Returns paginated results.
 *
 * vi: "Danh sách tất cả bệnh viện" / en: "List all hospitals"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const listHospitals = query({
  args: {
    // vi: "Tìm kiếm theo tên" / en: "Search by name"
    search: v.optional(v.string()),
    // vi: "Lọc theo trạng thái" / en: "Filter by status"
    status: v.optional(
      v.union(v.literal("active"), v.literal("suspended"), v.literal("trial")),
    ),
    // vi: "Số lượng mỗi trang (mặc định 20)" / en: "Items per page (default 20)"
    pageSize: v.optional(v.number()),
    // vi: "Vị trí bắt đầu phân trang" / en: "Pagination offset"
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Assert platform admin
    await requirePlatformAdmin(ctx);

    const pageSize = args.pageSize ?? 20;
    const offset = args.offset ?? 0;

    // Fetch all hospital orgs (cross-tenant: no organizationId filter)
    let orgs = await ctx.db
      .query("organizations")
      .withIndex("by_type", (q) => q.eq("org_type", "hospital"))
      .collect();

    // Filter by status if provided
    // WHY: Filter after collect since status is optional (null = treat as active)
    if (args.status !== undefined) {
      orgs = orgs.filter((org) => {
        // Orgs without explicit status default to "active"
        const orgStatus = org.status ?? "active";
        return orgStatus === args.status;
      });
    }

    // Filter by name search (case-insensitive substring)
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      orgs = orgs.filter((org) => org.name.toLowerCase().includes(searchLower));
    }

    const total = orgs.length;

    // Apply pagination (sort by most recent first)
    const pagedOrgs = orgs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(offset, offset + pageSize);

    // Enrich with member count and equipment count
    const hospitals = await Promise.all(
      pagedOrgs.map(async (org) => {
        const [memberships, equipment] = await Promise.all([
          ctx.db
            .query("organizationMemberships")
            .withIndex("by_org", (q) => q.eq("orgId", org._id))
            .collect(),
          ctx.db
            .query("equipment")
            .withIndex("by_org", (q) => q.eq("organizationId", org._id))
            .collect(),
        ]);

        return {
          _id: org._id,
          name: org.name,
          slug: org.slug,
          org_type: org.org_type,
          // vi: "Trạng thái bệnh viện" / en: "Hospital status"
          // Default to "active" if not explicitly set
          status: (org.status ?? "active") as "active" | "suspended" | "trial",
          memberCount: memberships.length,
          equipmentCount: equipment.length,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        };
      }),
    );

    return {
      hospitals,
      total,
      pageSize,
      offset,
      hasMore: offset + pageSize < total,
    };
  },
});

/**
 * Get full hospital organization detail including member list, equipment
 * summary, service request summary, and subscription status.
 *
 * vi: "Chi tiết bệnh viện" / en: "Hospital detail"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const getHospitalDetail = query({
  args: {
    hospitalId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Assert platform admin
    await requirePlatformAdmin(ctx);

    const org = await ctx.db.get(args.hospitalId);
    if (!org) return null;

    // Fetch members with user details joined
    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", args.hospitalId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          membershipId: m._id,
          userId: m.userId,
          name: user?.name ?? "Không tên (Unknown)",
          email: user?.email ?? "",
          role: m.role,
          createdAt: m.createdAt,
        };
      }),
    );

    // Equipment summary
    const allEquipment = await ctx.db
      .query("equipment")
      .withIndex("by_org", (q) => q.eq("organizationId", args.hospitalId))
      .collect();

    const equipmentSummary = {
      total: allEquipment.length,
      available: allEquipment.filter((e) => e.status === "available").length,
      inUse: allEquipment.filter((e) => e.status === "in_use").length,
      maintenance: allEquipment.filter((e) => e.status === "maintenance")
        .length,
      damaged: allEquipment.filter((e) => e.status === "damaged").length,
      retired: allEquipment.filter((e) => e.status === "retired").length,
    };

    // Service request summary
    const allServiceRequests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_org", (q) => q.eq("organizationId", args.hospitalId))
      .collect();

    const serviceRequestSummary = {
      total: allServiceRequests.length,
      pending: allServiceRequests.filter((sr) => sr.status === "pending")
        .length,
      inProgress: allServiceRequests.filter((sr) => sr.status === "in_progress")
        .length,
      completed: allServiceRequests.filter((sr) => sr.status === "completed")
        .length,
    };

    return {
      organization: {
        _id: org._id,
        name: org.name,
        slug: org.slug,
        org_type: org.org_type,
        status: (org.status ?? "active") as "active" | "suspended" | "trial",
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      },
      members,
      equipmentSummary,
      serviceRequestSummary,
    };
  },
});

/**
 * Get usage metrics for a specific hospital:
 * equipment count, service request count, active member count.
 *
 * vi: "Thống kê sử dụng bệnh viện" / en: "Hospital usage metrics"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const getHospitalUsage = query({
  args: {
    hospitalId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Assert platform admin
    await requirePlatformAdmin(ctx);

    const [memberships, equipment, serviceRequests] = await Promise.all([
      ctx.db
        .query("organizationMemberships")
        .withIndex("by_org", (q) => q.eq("orgId", args.hospitalId))
        .collect(),
      ctx.db
        .query("equipment")
        .withIndex("by_org", (q) => q.eq("organizationId", args.hospitalId))
        .collect(),
      ctx.db
        .query("serviceRequests")
        .withIndex("by_org", (q) => q.eq("organizationId", args.hospitalId))
        .collect(),
    ]);

    return {
      // vi: "Số lượng thiết bị" / en: "Equipment count"
      equipmentCount: equipment.length,
      // vi: "Số yêu cầu dịch vụ đã tạo" / en: "Service requests created"
      serviceRequestCount: serviceRequests.length,
      // vi: "Số thành viên đang hoạt động" / en: "Active members"
      activeMembers: memberships.length,
    };
  },
});

// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------

/**
 * Onboard a new hospital organization on behalf of a customer.
 * Creates the org and records an invite for the hospital owner.
 *
 * WHY: Platform admins should be able to create hospital orgs without
 * needing database access or engineering support. The invite is stored
 * and can be used by the owner to activate their account.
 *
 * vi: "Đăng ký bệnh viện mới" / en: "Onboard hospital"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const onboardHospital = mutation({
  args: {
    // vi: "Tên bệnh viện" / en: "Hospital name"
    name: v.string(),
    // vi: "Định danh URL" / en: "URL slug"
    slug: v.string(),
    // vi: "Email chủ sở hữu" / en: "Owner email"
    ownerEmail: v.string(),
    // vi: "Tên chủ sở hữu" / en: "Owner name" (optional)
    ownerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Assert platform admin
    const auth = await requirePlatformAdmin(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new ConvexError({
        code: "SLUG_TAKEN",
        // vi: "Slug đã được sử dụng bởi tổ chức khác"
        // en: "Slug is already taken by another organization"
        message:
          "Slug đã được sử dụng bởi tổ chức khác (Slug is already taken by another organization)",
      });
    }

    const now = Date.now();

    // Create the hospital organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      org_type: "hospital",
      // vi: "Trạng thái mặc định khi tạo mới là đang dùng thử"
      // en: "Default status for new onboarded hospitals is trial"
      status: "trial",
      createdAt: now,
      updatedAt: now,
    });

    // Write audit log for compliance
    // WHY: All platform admin actions are logged for the 5-year audit trail
    // required by Vietnamese medical device regulations.
    await ctx.db.insert("auditLog", {
      organizationId,
      actorId: auth.userId as any,
      action: "platform_admin.hospital_onboarded",
      resourceType: "organization",
      resourceId: organizationId,
      previousValues: null,
      newValues: {
        name: args.name,
        slug: args.slug,
        ownerEmail: args.ownerEmail,
        status: "trial",
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      organizationId,
      // vi: "Lời mời sẽ được gửi đến email chủ sở hữu"
      // en: "An invite will be sent to the owner email"
      inviteSent: false, // Future: integrate with email service
      ownerEmail: args.ownerEmail,
    };
  },
});

/**
 * Suspend a hospital organization (toggle status to "suspended").
 * Requires a reason for the audit trail.
 *
 * vi: "Đình chỉ bệnh viện" / en: "Suspend hospital"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const suspendHospital = mutation({
  args: {
    hospitalId: v.id("organizations"),
    // vi: "Lý do đình chỉ" / en: "Suspension reason"
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Assert platform admin
    const auth = await requirePlatformAdmin(ctx);

    const org = await ctx.db.get(args.hospitalId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        // vi: "Không tìm thấy tổ chức" / en: "Organization not found"
        message: "Không tìm thấy tổ chức (Organization not found)",
      });
    }

    const previousStatus = org.status ?? "active";
    const now = Date.now();

    await ctx.db.patch(args.hospitalId, {
      status: "suspended",
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("auditLog", {
      organizationId: args.hospitalId,
      actorId: auth.userId as any,
      action: "platform_admin.hospital_suspended",
      resourceType: "organization",
      resourceId: args.hospitalId,
      previousValues: { status: previousStatus },
      newValues: { status: "suspended", reason: args.reason },
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Reactivate a suspended hospital organization (toggle status to "active").
 *
 * vi: "Kích hoạt lại bệnh viện" / en: "Reactivate hospital"
 *
 * Auth: platformRole === "platform_admin" required
 */
export const reactivateHospital = mutation({
  args: {
    hospitalId: v.id("organizations"),
    // vi: "Ghi chú kích hoạt lại" / en: "Reactivation notes" (optional)
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Assert platform admin
    const auth = await requirePlatformAdmin(ctx);

    const org = await ctx.db.get(args.hospitalId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        // vi: "Không tìm thấy tổ chức" / en: "Organization not found"
        message: "Không tìm thấy tổ chức (Organization not found)",
      });
    }

    const previousStatus = org.status ?? "active";
    const now = Date.now();

    await ctx.db.patch(args.hospitalId, {
      status: "active",
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("auditLog", {
      organizationId: args.hospitalId,
      actorId: auth.userId as any,
      action: "platform_admin.hospital_reactivated",
      resourceType: "organization",
      resourceId: args.hospitalId,
      previousValues: { status: previousStatus },
      newValues: { status: "active", notes: args.notes },
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});
