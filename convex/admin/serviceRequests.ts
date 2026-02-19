/**
 * Platform admin Convex queries and mutations for cross-tenant service request
 * management and dispute arbitration.
 *
 * Cross-tenant: No `organizationId` filter — platform admin sees ALL organizations.
 * All arbitration decisions written to auditLog for compliance trail.
 *
 * Access control: All functions require platformRole === "platform_admin".
 *
 * vi: "Quản trị nền tảng: yêu cầu dịch vụ & trọng tài tranh chấp"
 * en: "Platform admin: service requests & dispute arbitration"
 */

import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { createAuditEntry } from "../lib/auditLog";

// ---------------------------------------------------------------------------
// BOTTLENECK THRESHOLD
// Service requests stuck in the same status for over 7 days are flagged.
// vi: "Ngưỡng phát hiện tắc nghẽn (7 ngày)" / en: "Bottleneck detection threshold (7 days)"
// ---------------------------------------------------------------------------
const BOTTLENECK_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Verifies the caller is an authenticated platform admin.
 * Throws a bilingual ConvexError if not authenticated or not platform_admin.
 *
 * WHY: Platform admin functions bypass org-level isolation (cross-tenant).
 * Without this guard, any authenticated user could read all orgs' data —
 * a CRITICAL cross-tenant data leak.
 *
 * vi: "Xác thực quản trị viên nền tảng" / en: "Require platform admin auth"
 */
async function requirePlatformAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<{ userId: Id<"users"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }

  // Platform admins have platformRole in their JWT claims
  const platformRole = identity.platformRole as string | undefined;
  if (platformRole !== "platform_admin") {
    throw new ConvexError({
      message:
        "Chỉ quản trị viên nền tảng mới có quyền thực hiện thao tác này. (Only platform administrators can perform this action.)",
      code: "FORBIDDEN_PLATFORM_ADMIN_ONLY",
    });
  }

  return { userId: identity.subject as Id<"users"> };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists ALL service requests across all organizations (cross-tenant view).
 * Enriches each request with hospital name, provider name, and bottleneck flag.
 *
 * Bottleneck detection: requests stuck in same status for >7 days are flagged.
 *
 * Filters supported: status, organizationId (hospitalId), providerId, date range.
 *
 * vi: "Danh sách tất cả yêu cầu dịch vụ (xem toàn nền tảng)"
 * en: "List all service requests (platform-wide view)"
 */
export const listAllServiceRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("quoted"),
        v.literal("accepted"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("disputed"),
      ),
    ),
    hospitalId: v.optional(v.id("organizations")),
    providerId: v.optional(v.id("providers")),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guard: platform admin only
    await requirePlatformAdmin(ctx);

    // Load all service requests (no org filter — cross-tenant)
    let serviceRequests;
    if (args.hospitalId) {
      serviceRequests = args.status
        ? await ctx.db
            .query("serviceRequests")
            .withIndex("by_org_and_status", (q) =>
              q
                .eq("organizationId", args.hospitalId!)
                .eq("status", args.status!),
            )
            .collect()
        : await ctx.db
            .query("serviceRequests")
            .withIndex("by_org", (q) => q.eq("organizationId", args.hospitalId!))
            .collect();
    } else if (args.status) {
      // Full-scan with status filter — acceptable for admin views
      serviceRequests = await ctx.db
        .query("serviceRequests")
        .filter((q) => q.eq(q.field("status"), args.status))
        .collect();
    } else {
      serviceRequests = await ctx.db.query("serviceRequests").collect();
    }

    // Apply date range filter
    if (args.fromDate !== undefined) {
      serviceRequests = serviceRequests.filter(
        (sr) => sr.createdAt >= args.fromDate!,
      );
    }
    if (args.toDate !== undefined) {
      serviceRequests = serviceRequests.filter(
        (sr) => sr.createdAt <= args.toDate!,
      );
    }

    // Apply provider filter
    if (args.providerId !== undefined) {
      serviceRequests = serviceRequests.filter(
        (sr) => sr.assignedProviderId === args.providerId,
      );
    }

    const now = Date.now();

    // Enrich with hospital name, provider name, bottleneck flag
    const enriched = await Promise.all(
      serviceRequests.map(async (sr) => {
        const [hospital, provider] = await Promise.all([
          ctx.db.get(sr.organizationId),
          sr.assignedProviderId ? ctx.db.get(sr.assignedProviderId) : null,
        ]);

        // Bottleneck: stuck in current status for > BOTTLENECK_THRESHOLD_MS
        const isBottleneck =
          !["completed", "cancelled"].includes(sr.status) &&
          now - sr.updatedAt > BOTTLENECK_THRESHOLD_MS;

        return {
          ...sr,
          hospitalName: hospital?.name ?? null,
          providerName: provider?.nameVi ?? null,
          isBottleneck,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Lists all disputes that have been escalated to the platform for arbitration.
 * Returns cross-tenant — all orgs included.
 * Enriches each dispute with hospital name and service request description.
 *
 * vi: "Danh sách tranh chấp đã leo thang" / en: "List escalated disputes"
 */
export const listEscalatedDisputes = query({
  args: {
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guard: platform admin only
    await requirePlatformAdmin(ctx);

    // Filter by escalated status — full table scan acceptable for admin
    let disputes = await ctx.db
      .query("disputes")
      .filter((q) => q.eq(q.field("status"), "escalated"))
      .collect();

    // Apply date range filters
    if (args.fromDate !== undefined) {
      disputes = disputes.filter((d) => d.createdAt >= args.fromDate!);
    }
    if (args.toDate !== undefined) {
      disputes = disputes.filter((d) => d.createdAt <= args.toDate!);
    }

    // Enrich with hospital org name + service request description
    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const [hospital, serviceRequest] = await Promise.all([
          ctx.db.get(dispute.organizationId),
          ctx.db.get(dispute.serviceRequestId),
        ]);

        // Get provider info via service request
        let providerName: string | null = null;
        if (serviceRequest?.assignedProviderId) {
          const provider = await ctx.db.get(serviceRequest.assignedProviderId);
          providerName = provider?.nameVi ?? null;
        }

        return {
          ...dispute,
          hospitalName: hospital?.name ?? null,
          providerName,
          serviceRequestDescription: serviceRequest?.descriptionVi ?? null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Gets full dispute detail for arbitration review.
 * Includes both hospital and provider perspectives.
 * Returns null if the dispute is not found.
 *
 * vi: "Lấy chi tiết tranh chấp để trọng tài" / en: "Get dispute detail for arbitration"
 */
export const getDisputeDetail = query({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    // Guard: platform admin only
    await requirePlatformAdmin(ctx);

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      return null;
    }

    // Load all related data in parallel for both perspectives
    const [hospitalOrganization, serviceRequest] = await Promise.all([
      ctx.db.get(dispute.organizationId),
      ctx.db.get(dispute.serviceRequestId),
    ]);

    // Load provider org info
    let providerOrganization = null;
    let provider = null;
    if (serviceRequest?.assignedProviderId) {
      provider = await ctx.db.get(serviceRequest.assignedProviderId);
      if (provider?.organizationId) {
        providerOrganization = await ctx.db.get(provider.organizationId);
      }
    }

    // Load equipment info
    let equipment = null;
    if (serviceRequest?.equipmentId) {
      equipment = await ctx.db.get(serviceRequest.equipmentId);
    }

    // Load dispute messages for evidence review
    const messages = await ctx.db
      .query("disputeMessages")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .order("asc")
      .collect();

    // Enrich messages with author names
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return {
          ...msg,
          authorName: author?.name ?? null,
        };
      }),
    );

    // Load arbitration history (past audit entries for this dispute)
    const arbitrationHistory = await ctx.db
      .query("auditLog")
      .filter((q) =>
        q.eq(q.field("resourceId"), dispute._id),
      )
      .collect();

    return {
      dispute,
      hospitalOrganization,
      providerOrganization,
      provider,
      serviceRequest,
      equipment,
      messages: enrichedMessages,
      arbitrationHistory,
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Platform admin resolves a dispute with an arbitration ruling.
 *
 * Resolution actions:
 *   - refund: Full refund to hospital
 *   - partial_refund: Partial refund (refundAmount required)
 *   - dismiss: Dispute dismissed in provider's favor
 *   - re_assign: Re-assign to different provider (use reassignProvider separately)
 *
 * Writes to auditLog for compliance trail.
 * Transitions dispute to "resolved" status.
 *
 * vi: "Giải quyết tranh chấp bởi quản trị viên nền tảng"
 * en: "Resolve dispute by platform admin arbitration"
 */
export const resolveDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    resolution: v.union(
      v.literal("refund"),
      v.literal("partial_refund"),
      v.literal("dismiss"),
      v.literal("re_assign"),
    ),
    reasonVi: v.string(),
    reasonEn: v.optional(v.string()),
    refundAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guard: platform admin only
    const { userId } = await requirePlatformAdmin(ctx);

    // Load the dispute
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new ConvexError({
        message: "Không tìm thấy tranh chấp. (Dispute not found.)",
        code: "DISPUTE_NOT_FOUND",
      });
    }

    // Build resolution notes with resolution type and reason
    const resolutionNotes = [
      `[resolution:${args.resolution}]`,
      args.reasonVi,
      args.reasonEn ? `(${args.reasonEn})` : "",
      args.refundAmount
        ? `Refund amount: ${args.refundAmount.toLocaleString("vi-VN")} VND`
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    // Update dispute to resolved
    const now = Date.now();
    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      resolvedAt: now,
      resolutionNotes,
      updatedAt: now,
    });

    // Write audit log entry for compliance trail
    // WHY: Vietnamese Decree 36/2016 requires 5-year retention of all medical
    // device service records. Arbitration decisions are critical compliance events.
    await createAuditEntry(ctx, {
      organizationId: dispute.organizationId,
      actorId: userId,
      action: "admin.dispute.arbitrated",
      resourceType: "disputes",
      resourceId: args.disputeId,
      previousValues: { status: dispute.status },
      newValues: {
        status: "resolved",
        resolution: args.resolution,
        reasonVi: args.reasonVi,
        reasonEn: args.reasonEn,
        refundAmount: args.refundAmount,
      },
    });

    return args.disputeId;
  },
});

/**
 * Platform admin re-assigns a service request to a different provider.
 *
 * Used when the original provider cannot/will not fulfill the request after
 * a dispute escalation. Updates the assignedProviderId on the service request.
 *
 * Writes to auditLog for compliance trail.
 *
 * vi: "Phân công lại nhà cung cấp bởi quản trị viên nền tảng"
 * en: "Reassign provider by platform admin"
 */
export const reassignProvider = mutation({
  args: {
    serviceRequestId: v.id("serviceRequests"),
    newProviderId: v.id("providers"),
    reasonVi: v.string(),
    reasonEn: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Guard: platform admin only
    const { userId } = await requirePlatformAdmin(ctx);

    // Load the service request
    const serviceRequest = await ctx.db.get(args.serviceRequestId);
    if (!serviceRequest) {
      throw new ConvexError({
        message:
          "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // Load new provider to verify it exists
    const newProvider = await ctx.db.get(args.newProviderId);
    if (!newProvider) {
      throw new ConvexError({
        message: "Không tìm thấy nhà cung cấp mới. (New provider not found.)",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    const previousProviderId = serviceRequest.assignedProviderId;

    // Update service request with new provider
    const now = Date.now();
    await ctx.db.patch(args.serviceRequestId, {
      assignedProviderId: args.newProviderId,
      updatedAt: now,
    });

    // Write audit log entry
    // WHY: Provider reassignment is a critical administrative action that must
    // be traceable for dispute resolution and compliance audits.
    await createAuditEntry(ctx, {
      organizationId: serviceRequest.organizationId,
      actorId: userId,
      action: "admin.serviceRequest.providerReassigned",
      resourceType: "serviceRequests",
      resourceId: args.serviceRequestId,
      previousValues: {
        assignedProviderId: previousProviderId,
      },
      newValues: {
        newProviderId: args.newProviderId,
        reasonVi: args.reasonVi,
        reasonEn: args.reasonEn,
      },
    });

    return args.serviceRequestId;
  },
});
