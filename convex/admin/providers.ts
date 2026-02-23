/**
 * Platform admin queries and mutations for provider organization management.
 *
 * Access control:
 *   - All functions require platformRole === "platform_admin" in the JWT.
 *   - Platform admins have cross-tenant access: no organizationId filter is applied.
 *   - Regular hospital/provider users CANNOT access these endpoints.
 *
 * Approval state machine:
 *   pending_verification → (admin approves) → active / verified
 *   pending_verification → (admin rejects)  → inactive / rejected
 *   active              → (admin suspends)  → suspended
 *   suspended           → (admin reactivates) → active
 *
 * vi: "Quản lý nhà cung cấp bởi quản trị viên nền tảng"
 * en: "Provider management by platform admin"
 */

import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { createAuditLogEntry } from "../lib/auditLog";

// ---------------------------------------------------------------------------
// Auth helpers (JWT-based, platform admin check)
// ---------------------------------------------------------------------------

/**
 * Require the caller to be an authenticated platform_admin.
 *
 * WHY: Platform admins operate across all tenants (no org scope). Using
 * JWT-based auth (not component-based) mirrors the pattern in disputes.ts and
 * service requests, which avoids the Better Auth component import that
 * complicates testability.
 *
 * vi: "Yêu cầu quyền quản trị nền tảng" / en: "Require platform admin role"
 *
 * @throws ConvexError UNAUTHENTICATED if no session
 * @throws ConvexError FORBIDDEN if caller is not platform_admin
 */
async function requirePlatformAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<{ userId: string }> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      message:
        "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }

  const platformRole = identity.platformRole as string | null | undefined;

  if (platformRole === "platform_admin") {
    return { userId: identity.subject as string };
  }

  // JWT fallback: Better Auth Convex component cannot store platformRole.
  // Look it up from the custom `users` table using email from the JWT.
  const email = identity.email as string | null | undefined;
  if (email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (user?.platformRole === "platform_admin") {
      return { userId: identity.subject as string };
    }
  }

  throw new ConvexError({
    message:
      "Chỉ quản trị viên nền tảng mới có quyền thực hiện thao tác này. (Only platform administrators can perform this action.)",
    code: "FORBIDDEN",
  });
}

// ---------------------------------------------------------------------------
// Queries (read-only, cross-tenant)
// ---------------------------------------------------------------------------

/**
 * List all provider organizations with optional status filter.
 *
 * WHY: Platform admins need to review the full provider registry, including
 * providers pending approval. No organizationId filter is applied — this is
 * intentional cross-tenant access for admin oversight.
 *
 * vi: "Danh sách tất cả nhà cung cấp" / en: "List all providers"
 */
export const listProviders = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("suspended"),
        v.literal("pending_verification"),
      ),
    ),
    verificationStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_review"),
        v.literal("verified"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Auth: platform admin only
    await requirePlatformAdmin(ctx);

    // Fetch providers — use status index if filter provided, else full scan
    let providers;
    if (args.status) {
      providers = await ctx.db
        .query("providers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      providers = await ctx.db.query("providers").collect();
    }

    // Apply additional verificationStatus filter if provided
    if (args.verificationStatus) {
      providers = providers.filter(
        (p) => p.verificationStatus === args.verificationStatus,
      );
    }

    // Enrich with organization name
    const enriched = await Promise.all(
      providers.map(async (provider) => {
        const org = await ctx.db.get(provider.organizationId);
        return {
          ...provider,
          organizationName: org?.name ?? null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Get detailed information for a single provider.
 *
 * Returns full org info, service offerings, certifications, coverage areas.
 * Returns null if the provider is not found (not an error — caller decides UI).
 *
 * WHY: Admin detail view needs richer data than the list view. Joining in the
 * query avoids N+1 round-trips from the client.
 *
 * vi: "Chi tiết nhà cung cấp" / en: "Provider detail"
 */
export const getProviderDetail = query({
  args: {
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    // Auth: platform admin only
    await requirePlatformAdmin(ctx);

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      return null;
    }

    // Load related data in parallel
    const [org, serviceOfferings, certifications, coverageAreas] =
      await Promise.all([
        ctx.db.get(provider.organizationId),
        ctx.db
          .query("serviceOfferings")
          .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
          .collect(),
        ctx.db
          .query("certifications")
          .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
          .collect(),
        ctx.db
          .query("coverageAreas")
          .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect(),
      ]);

    return {
      ...provider,
      organization: org
        ? { _id: org._id, name: org.name, slug: org.slug, org_type: org.org_type }
        : null,
      serviceOfferings,
      certifications,
      coverageAreas,
    };
  },
});

/**
 * Get performance metrics for a provider.
 *
 * Returns: completion rate, average rating, dispute count, completed/total services.
 *
 * WHY: Admins need objective performance data to evaluate providers for
 * suspension, reactivation, or quality intervention. Computed on-demand
 * from service requests and ratings tables — no denormalized counter needed.
 *
 * vi: "Hiệu suất nhà cung cấp" / en: "Provider performance metrics"
 */
export const getProviderPerformance = query({
  args: {
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    // Auth: platform admin only
    await requirePlatformAdmin(ctx);

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      return null;
    }

    // Get all service requests assigned to this provider
    const allServiceRequests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_provider", (q) => q.eq("assignedProviderId", provider._id))
      .collect();

    const totalServices = allServiceRequests.length;
    const completedServices = allServiceRequests.filter(
      (sr) => sr.status === "completed",
    ).length;
    const completionRate =
      totalServices > 0 ? completedServices / totalServices : 0;

    // Get dispute count for this provider (via service requests)
    const serviceRequestIds = allServiceRequests.map((sr) => sr._id);
    let disputeCount = 0;
    if (serviceRequestIds.length > 0) {
      const disputes = await Promise.all(
        serviceRequestIds.map((srId) =>
          ctx.db
            .query("disputes")
            .withIndex("by_service_request", (q) =>
              q.eq("serviceRequestId", srId),
            )
            .collect(),
        ),
      );
      disputeCount = disputes.flat().length;
    }

    // Get ratings
    const ratings = await ctx.db
      .query("serviceRatings")
      .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
      .collect();

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : null;

    return {
      providerId: provider._id,
      totalServices,
      completedServices,
      completionRate,
      averageRating,
      totalRatings: ratings.length,
      disputeCount,
      // Cached fields from provider record
      cachedAverageRating: provider.averageRating ?? null,
      cachedTotalRatings: provider.totalRatings ?? 0,
      cachedCompletedServices: provider.completedServices ?? 0,
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations (write operations, platform admin only)
// ---------------------------------------------------------------------------

/**
 * Approve a provider registration.
 *
 * Transitions:
 *   status: pending_verification → active
 *   verificationStatus: pending | in_review → verified
 *
 * WHY: New providers submit registration documents and wait for admin review.
 * Approval marks them as active and verified so hospitals can discover them.
 *
 * vi: "Phê duyệt nhà cung cấp" / en: "Approve provider"
 */
export const approveProvider = mutation({
  args: {
    providerId: v.id("providers"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePlatformAdmin(ctx);

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new ConvexError({
        message:
          "Không tìm thấy nhà cung cấp. (Provider not found.)",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    const now = Date.now();
    const previousValues = {
      status: provider.status,
      verificationStatus: provider.verificationStatus,
    };

    await ctx.db.patch(args.providerId, {
      status: "active",
      verificationStatus: "verified",
      updatedAt: now,
    });

    // Audit log — use provider's own organizationId as the scope
    await createAuditLogEntry(ctx, {
      organizationId: provider.organizationId,
      actorId: userId as any,
      action: "admin.provider.approved",
      resourceType: "providers",
      resourceId: args.providerId,
      previousValues,
      newValues: {
        status: "active",
        verificationStatus: "verified",
        notes: args.notes,
      },
    });

    return args.providerId;
  },
});

/**
 * Reject a provider registration.
 *
 * Transitions:
 *   verificationStatus: pending | in_review → rejected
 *
 * A rejection reason is required — it is stored in the audit log so the
 * provider can understand why their application was declined.
 *
 * WHY: Rejection without a reason leaves providers with no recourse.
 * Requiring a reason enforces accountability for admin decisions.
 *
 * vi: "Từ chối nhà cung cấp" / en: "Reject provider"
 */
export const rejectProvider = mutation({
  args: {
    providerId: v.id("providers"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePlatformAdmin(ctx);

    // Reason must not be empty
    if (!args.reason.trim()) {
      throw new ConvexError({
        message:
          "Lý do từ chối không được để trống. (Rejection reason is required.)",
        code: "REASON_REQUIRED",
      });
    }

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new ConvexError({
        message:
          "Không tìm thấy nhà cung cấp. (Provider not found.)",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    const now = Date.now();
    const previousValues = {
      status: provider.status,
      verificationStatus: provider.verificationStatus,
    };

    await ctx.db.patch(args.providerId, {
      verificationStatus: "rejected",
      updatedAt: now,
    });

    await createAuditLogEntry(ctx, {
      organizationId: provider.organizationId,
      actorId: userId as any,
      action: "admin.provider.rejected",
      resourceType: "providers",
      resourceId: args.providerId,
      previousValues,
      newValues: {
        verificationStatus: "rejected",
        reason: args.reason,
      },
    });

    return args.providerId;
  },
});

/**
 * Suspend or reactivate a provider.
 *
 * When reactivate === false (default): active → suspended
 * When reactivate === true:            suspended → active
 *
 * A reason is always required for audit compliance — both for suspensions
 * (what they violated) and reactivations (what was resolved).
 *
 * WHY: Suspension must be reversible. Using a single mutation with a toggle
 * keeps the admin UI simple and the audit trail complete for both directions.
 *
 * vi: "Đình chỉ / Khôi phục nhà cung cấp" / en: "Suspend / Reactivate provider"
 */
export const suspendProvider = mutation({
  args: {
    providerId: v.id("providers"),
    reason: v.string(),
    reactivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePlatformAdmin(ctx);

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new ConvexError({
        message:
          "Không tìm thấy nhà cung cấp. (Provider not found.)",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    const isReactivating = args.reactivate === true;
    const newStatus = isReactivating ? "active" : "suspended";
    const action = isReactivating
      ? "admin.provider.reactivated"
      : "admin.provider.suspended";

    const now = Date.now();
    const previousStatus = provider.status;

    await ctx.db.patch(args.providerId, {
      status: newStatus,
      updatedAt: now,
    });

    await createAuditLogEntry(ctx, {
      organizationId: provider.organizationId,
      actorId: userId as any,
      action,
      resourceType: "providers",
      resourceId: args.providerId,
      previousValues: { status: previousStatus },
      newValues: { status: newStatus, reason: args.reason },
    });

    return args.providerId;
  },
});

/**
 * Mark a certification as verified or unverified and optionally update expiry.
 *
 * WHY: Platform admins review certification documents (uploaded by providers)
 * and mark them as verified to confirm the provider's qualifications. Expiry
 * date tracking ensures stale certifications are flagged for renewal.
 *
 * The verification state is stored in the audit log rather than as a separate
 * column — the certifications table tracks document data; admins track
 * verification outcomes via the audit trail.
 *
 * vi: "Xác minh chứng nhận" / en: "Verify certification"
 */
export const verifyCertification = mutation({
  args: {
    certificationId: v.id("certifications"),
    isVerified: v.boolean(),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePlatformAdmin(ctx);

    const cert = await ctx.db.get(args.certificationId);
    if (!cert) {
      throw new ConvexError({
        message:
          "Không tìm thấy chứng nhận. (Certification not found.)",
        code: "CERTIFICATION_NOT_FOUND",
      });
    }

    // Load the parent provider to get organizationId for audit log scope
    const provider = await ctx.db.get(cert.providerId);
    if (!provider) {
      throw new ConvexError({
        message:
          "Không tìm thấy nhà cung cấp liên quan đến chứng nhận này. (Provider for this certification not found.)",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    const now = Date.now();

    // Patch expiry if provided
    const patch: { updatedAt: number; expiresAt?: number } = {
      updatedAt: now,
    };
    if (args.expiresAt !== undefined) {
      patch.expiresAt = args.expiresAt;
    }

    await ctx.db.patch(args.certificationId, patch);

    await createAuditLogEntry(ctx, {
      organizationId: provider.organizationId,
      actorId: userId as any,
      action: "admin.provider.certification_verified",
      resourceType: "certifications",
      resourceId: args.certificationId,
      previousValues: { expiresAt: cert.expiresAt },
      newValues: {
        isVerified: args.isVerified,
        expiresAt: args.expiresAt,
        notes: args.notes,
      },
    });

    return args.certificationId;
  },
});
