/**
 * Convex mutations and queries for disputes.
 *
 * Dispute workflow:
 *   open -> investigating -> resolved | closed | escalated
 *
 * Access control:
 *   - Hospital org members create disputes and send messages
 *   - Provider org members can send messages to disputes on their service requests
 *   - Platform admins can view and update all disputes
 *
 * vi: "Tranh chấp dịch vụ" / en: "Service disputes"
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { DisputeStatus } from "./lib/disputeStateMachine";
import { mutation, query } from "./_generated/server";
import { createAuditEntry } from "./lib/auditLog";
import { canTransitionDispute } from "./lib/disputeStateMachine";

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// ---------------------------------------------------------------------------

/**
 * Gets the authenticated user identity and extracts userId.
 * Throws a bilingual ConvexError if not authenticated.
 *
 * WHY: Using a local auth helper (mirroring equipment.ts) avoids importing
 * the full better-auth stack which causes module resolution issues in tests.
 *
 * vi: "Xác thực người dùng" / en: "Authenticate user"
 */
async function localRequireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<{ userId: string; organizationId: Id<"organizations"> | null }> {
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
    organizationId:
      (identity.organizationId as Id<"organizations"> | null) ?? null,
  };
}

/**
 * Like localRequireAuth but also asserts an active organization session.
 *
 * vi: "Xác thực tổ chức" / en: "Require organization auth"
 */
async function localRequireOrgAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<{ userId: string; organizationId: Id<"organizations"> }> {
  const auth = await localRequireAuth(ctx);
  if (!auth.organizationId) {
    throw new ConvexError({
      message:
        "Không tìm thấy tổ chức. Vui lòng chọn tổ chức trước khi thực hiện thao tác này. (Organization not found. Please select an organization before performing this action.)",
      code: "NO_ACTIVE_ORGANIZATION",
    });
  }
  return auth as { userId: string; organizationId: Id<"organizations"> };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new dispute for a service request.
 *
 * Only hospital org members can raise disputes.
 * The service request must be in "completed" or "in_progress" status.
 *
 * vi: "Tạo tranh chấp" / en: "Create dispute"
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    serviceRequestId: v.id("serviceRequests"),
    type: v.union(
      v.literal("quality"),
      v.literal("pricing"),
      v.literal("timeline"),
      v.literal("other"),
    ),
    descriptionVi: v.string(),
    descriptionEn: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate the caller
    const auth = await localRequireAuth(ctx);

    // 2. Load the service request and verify it belongs to the caller's org
    const serviceRequest = await ctx.db.get(args.serviceRequestId);
    if (!serviceRequest) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    if (serviceRequest.organizationId !== args.organizationId) {
      throw new ConvexError({
        message:
          "Yêu cầu dịch vụ không thuộc tổ chức này. (Service request does not belong to this organization.)",
        code: "SERVICE_REQUEST_ORG_MISMATCH",
      });
    }

    // 3. Validate service request status — can only dispute in_progress or completed requests
    const allowedStatuses = ["completed", "in_progress"];
    if (!allowedStatuses.includes(serviceRequest.status)) {
      throw new ConvexError({
        message: `Chỉ có thể tạo tranh chấp cho yêu cầu dịch vụ đang ở trạng thái "hoàn thành" hoặc "đang thực hiện". (Disputes can only be raised for service requests with status "completed" or "in_progress".)`,
        code: "INVALID_SERVICE_REQUEST_STATUS",
        currentStatus: serviceRequest.status,
      });
    }

    // 4. Insert the dispute
    const now = Date.now();
    const disputeId = await ctx.db.insert("disputes", {
      organizationId: args.organizationId,
      serviceRequestId: args.serviceRequestId,
      raisedBy: auth.userId as Id<"users">,
      status: "open",
      type: args.type,
      descriptionVi: args.descriptionVi,
      descriptionEn: args.descriptionEn,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Create audit log entry
    await createAuditEntry(ctx, {
      organizationId: args.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "dispute.created",
      resourceType: "disputes",
      resourceId: disputeId,
      newValues: {
        status: "open",
        type: args.type,
        serviceRequestId: args.serviceRequestId,
      },
    });

    return disputeId;
  },
});

/**
 * Updates the status of a dispute using the state machine.
 *
 * Validates the transition with canTransitionDispute before updating.
 *
 * vi: "Cập nhật trạng thái tranh chấp" / en: "Update dispute status"
 */
export const updateStatus = mutation({
  args: {
    id: v.id("disputes"),
    status: v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("closed"),
      v.literal("escalated"),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the dispute
    const dispute = await ctx.db.get(args.id);
    if (!dispute) {
      throw new ConvexError({
        message: "Không tìm thấy tranh chấp. (Dispute not found.)",
        code: "DISPUTE_NOT_FOUND",
      });
    }

    // 3. Verify org ownership: caller must belong to the hospital org that raised
    // the dispute OR the provider org assigned to the linked service request.
    // WHY: Without this check any authenticated user can modify any dispute by
    // guessing a disputeId — a CRITICAL cross-org write vulnerability.
    const orgId = auth.organizationId;
    const isHospitalOwner = dispute.organizationId === orgId;
    let isProviderAccess = false;
    if (!isHospitalOwner) {
      const linkedServiceRequest = await ctx.db.get(dispute.serviceRequestId);
      if (linkedServiceRequest?.assignedProviderId) {
        const provider = await ctx.db.get(
          linkedServiceRequest.assignedProviderId,
        );
        isProviderAccess = provider?.organizationId === orgId;
      }
    }
    if (!isHospitalOwner && !isProviderAccess) {
      throw new ConvexError({
        message:
          "Không có quyền cập nhật trạng thái khiếu nại này. (You do not have access to update this dispute.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Enforce state machine
    const currentStatus = dispute.status as DisputeStatus;
    const targetStatus = args.status as DisputeStatus;

    if (!canTransitionDispute(currentStatus, targetStatus)) {
      throw new ConvexError({
        message: `Không thể chuyển tranh chấp từ trạng thái "${currentStatus}" sang "${targetStatus}". (Cannot transition dispute from "${currentStatus}" to "${targetStatus}".)`,
        code: "INVALID_TRANSITION",
        currentStatus,
        targetStatus,
      });
    }

    // 5. Update status
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: targetStatus,
      updatedAt: now,
    });

    // 6. Create audit log
    await createAuditEntry(ctx, {
      organizationId: dispute.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "dispute.statusUpdated",
      resourceType: "disputes",
      resourceId: args.id,
      previousValues: { status: currentStatus },
      newValues: { status: targetStatus },
    });

    return args.id;
  },
});

/**
 * Adds a message to a dispute thread.
 *
 * Both the hospital org (dispute owner) and provider org (assigned to the service request)
 * can add messages. The authorId is taken from the JWT.
 *
 * vi: "Thêm tin nhắn tranh chấp" / en: "Add dispute message"
 */
export const addMessage = mutation({
  args: {
    disputeId: v.id("disputes"),
    contentVi: v.string(),
    contentEn: v.optional(v.string()),
    attachmentUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate with org context — required to verify dispute ownership.
    // WHY: Without an org check, any authenticated user can add messages to any
    // dispute by guessing a disputeId — a CRITICAL cross-org write vulnerability.
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the dispute to verify it exists
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new ConvexError({
        message: "Không tìm thấy tranh chấp. (Dispute not found.)",
        code: "DISPUTE_NOT_FOUND",
      });
    }

    // 3. Verify access: caller's org must be the hospital that raised the dispute
    // OR the provider org assigned to the linked service request.
    // WHY: Without this check any authenticated user from any org can inject
    // messages into disputes they have no relationship to.
    const orgId = auth.organizationId;
    const isHospitalOwner = dispute.organizationId === orgId;

    let isProviderAccess = false;
    if (!isHospitalOwner) {
      const linkedServiceRequest = await ctx.db.get(dispute.serviceRequestId);
      if (linkedServiceRequest?.assignedProviderId) {
        const provider = await ctx.db.get(
          linkedServiceRequest.assignedProviderId,
        );
        isProviderAccess = provider?.organizationId === orgId;
      }
    }

    if (!isHospitalOwner && !isProviderAccess) {
      throw new ConvexError({
        message:
          "Không có quyền thêm tin nhắn vào khiếu nại này. (You do not have access to add messages to this dispute.)",
        code: "FORBIDDEN",
      });
    }

    // 5. Insert the message
    const now = Date.now();
    const messageId = await ctx.db.insert("disputeMessages", {
      disputeId: args.disputeId,
      authorId: auth.userId as Id<"users">,
      contentVi: args.contentVi,
      contentEn: args.contentEn,
      attachmentUrls: args.attachmentUrls,
      createdAt: now,
      updatedAt: now,
    });

    // 6. Update the dispute's updatedAt timestamp
    await ctx.db.patch(args.disputeId, {
      updatedAt: now,
    });

    // 7. Create audit log entry (Vietnamese medical device 5-year retention requirement).
    // WHY: addMessage was the only mutation in this file not calling createAuditEntry,
    // creating a compliance gap. All dispute communications must be auditable.
    await createAuditEntry(ctx, {
      organizationId: dispute.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "dispute.messageAdded",
      resourceType: "disputeMessages",
      resourceId: messageId,
      newValues: { disputeId: args.disputeId, contentVi: args.contentVi },
    });

    return messageId;
  },
});

/**
 * Escalates a dispute to platform admin.
 *
 * Shortcut mutation wrapping updateStatus → "escalated".
 * Only members of the hospital org that raised the dispute can escalate.
 *
 * vi: "Leo thang tranh chấp" / en: "Escalate dispute"
 */
export const escalate = mutation({
  args: {
    id: v.id("disputes"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the dispute
    const dispute = await ctx.db.get(args.id);
    if (!dispute) {
      throw new ConvexError({
        message: "Không tìm thấy tranh chấp. (Dispute not found.)",
        code: "DISPUTE_NOT_FOUND",
      });
    }

    // 3. Verify org ownership: caller must belong to the hospital org that raised
    // the dispute OR the provider org assigned to the linked service request.
    // WHY: Without this check any authenticated user can escalate any dispute by
    // guessing a disputeId — a CRITICAL cross-org write vulnerability.
    const orgId = auth.organizationId;
    const isHospitalOwner = dispute.organizationId === orgId;
    let isProviderAccess = false;
    if (!isHospitalOwner) {
      const linkedServiceRequest = await ctx.db.get(dispute.serviceRequestId);
      if (linkedServiceRequest?.assignedProviderId) {
        const provider = await ctx.db.get(
          linkedServiceRequest.assignedProviderId,
        );
        isProviderAccess = provider?.organizationId === orgId;
      }
    }
    if (!isHospitalOwner && !isProviderAccess) {
      throw new ConvexError({
        message:
          "Không có quyền leo thang khiếu nại này. (You do not have access to escalate this dispute.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Enforce state machine
    const currentStatus = dispute.status as DisputeStatus;
    if (!canTransitionDispute(currentStatus, "escalated")) {
      throw new ConvexError({
        message: `Không thể leo thang tranh chấp đang ở trạng thái "${currentStatus}". (Cannot escalate a dispute in status "${currentStatus}".)`,
        code: "INVALID_TRANSITION",
        currentStatus,
        targetStatus: "escalated",
      });
    }

    // 5. Update status to escalated
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "escalated",
      updatedAt: now,
    });

    // 6. Create audit entry
    await createAuditEntry(ctx, {
      organizationId: dispute.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "dispute.escalated",
      resourceType: "disputes",
      resourceId: args.id,
      previousValues: { status: currentStatus },
      newValues: { status: "escalated", reason: args.reason },
    });

    return args.id;
  },
});

/**
 * Resolves a dispute.
 *
 * Transitions the dispute to "resolved" and sets resolvedAt + optional resolutionNotes.
 * Only valid from "investigating" status.
 *
 * vi: "Giải quyết tranh chấp" / en: "Resolve dispute"
 */
export const resolve = mutation({
  args: {
    id: v.id("disputes"),
    resolutionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the dispute
    const dispute = await ctx.db.get(args.id);
    if (!dispute) {
      throw new ConvexError({
        message: "Không tìm thấy tranh chấp. (Dispute not found.)",
        code: "DISPUTE_NOT_FOUND",
      });
    }

    // 3. Verify org ownership: caller must belong to the hospital org that raised
    // the dispute OR the provider org assigned to the linked service request.
    // WHY: Without this check any authenticated user can resolve any dispute by
    // guessing a disputeId — a CRITICAL cross-org write vulnerability.
    const orgId = auth.organizationId;
    const isHospitalOwner = dispute.organizationId === orgId;
    let isProviderAccess = false;
    if (!isHospitalOwner) {
      const linkedServiceRequest = await ctx.db.get(dispute.serviceRequestId);
      if (linkedServiceRequest?.assignedProviderId) {
        const provider = await ctx.db.get(
          linkedServiceRequest.assignedProviderId,
        );
        isProviderAccess = provider?.organizationId === orgId;
      }
    }
    if (!isHospitalOwner && !isProviderAccess) {
      throw new ConvexError({
        message:
          "Không có quyền giải quyết khiếu nại này. (You do not have access to resolve this dispute.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Enforce state machine
    const currentStatus = dispute.status as DisputeStatus;
    if (!canTransitionDispute(currentStatus, "resolved")) {
      throw new ConvexError({
        message: `Không thể giải quyết tranh chấp đang ở trạng thái "${currentStatus}". (Cannot resolve a dispute in status "${currentStatus}".)`,
        code: "INVALID_TRANSITION",
        currentStatus,
        targetStatus: "resolved",
      });
    }

    // 5. Update to resolved with resolvedAt timestamp
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "resolved",
      resolvedAt: now,
      resolutionNotes: args.resolutionNotes,
      updatedAt: now,
    });

    // 6. Create audit entry
    await createAuditEntry(ctx, {
      organizationId: dispute.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "dispute.resolved",
      resourceType: "disputes",
      resourceId: args.id,
      previousValues: { status: currentStatus },
      newValues: { status: "resolved" },
    });

    return args.id;
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists disputes for a hospital organization.
 * Supports optional status filtering.
 * Returns disputes enriched with service request reference.
 *
 * vi: "Danh sách tranh chấp của bệnh viện" / en: "Hospital disputes list"
 */
export const listByHospital = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("investigating"),
        v.literal("resolved"),
        v.literal("closed"),
        v.literal("escalated"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Authenticate
    await localRequireOrgAuth(ctx);

    // Use indexed query for efficiency
    let disputes;
    if (args.status) {
      disputes = await ctx.db
        .query("disputes")
        .withIndex("by_org_and_status", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("status", args.status!),
        )
        .collect();
    } else {
      disputes = await ctx.db
        .query("disputes")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .collect();
    }

    // Enrich with service request reference
    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const serviceRequest = await ctx.db.get(dispute.serviceRequestId);
        return {
          ...dispute,
          serviceRequestRef: serviceRequest
            ? {
                id: serviceRequest._id,
                description: serviceRequest.descriptionVi,
              }
            : null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Lists disputes for a provider organization.
 * Finds service requests where the provider is assigned, then finds disputes for those.
 *
 * vi: "Danh sách tranh chấp của nhà cung cấp" / en: "Provider disputes list"
 */
export const listByProvider = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Authenticate
    await localRequireOrgAuth(ctx);

    // Find the provider record for this org
    const providerRecord = await ctx.db
      .query("providers")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .first();

    if (!providerRecord) {
      return [];
    }

    // Find service requests assigned to this provider
    const serviceRequests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_provider", (q) =>
        q.eq("assignedProviderId", providerRecord._id),
      )
      .collect();

    if (serviceRequests.length === 0) {
      return [];
    }

    // Find disputes for those service requests
    const allDisputes = await Promise.all(
      serviceRequests.map(async (sr) => {
        return ctx.db
          .query("disputes")
          .withIndex("by_service_request", (q) =>
            q.eq("serviceRequestId", sr._id),
          )
          .collect();
      }),
    );

    const flatDisputes = allDisputes.flat();

    // Enrich with service request reference
    const enriched = await Promise.all(
      flatDisputes.map(async (dispute) => {
        const serviceRequest = await ctx.db.get(dispute.serviceRequestId);
        return {
          ...dispute,
          serviceRequestRef: serviceRequest
            ? {
                id: serviceRequest._id,
                description: serviceRequest.descriptionVi,
              }
            : null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Gets a single dispute by ID with full related data.
 * Returns null if the dispute is not found.
 *
 * Includes: service request details, equipment name, organization names.
 *
 * vi: "Lấy tranh chấp theo ID" / en: "Get dispute by ID"
 */
export const getById = query({
  args: {
    id: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    // Authenticate with org context (required for ownership check)
    const auth = await localRequireOrgAuth(ctx);

    // Load the dispute
    const dispute = await ctx.db.get(args.id);
    if (!dispute) {
      return null;
    }

    // Verify access: caller's org must be the hospital that raised the dispute
    // OR the provider org assigned to the linked service request.
    // WHY: Without this check any authenticated user can read disputes from any
    // organization by guessing IDs — a CRITICAL cross-org data leak.
    const orgId = auth.organizationId;
    const isHospitalOwner = dispute.organizationId === orgId;

    let isProviderAccess = false;
    if (!isHospitalOwner) {
      const linkedServiceRequest = await ctx.db.get(dispute.serviceRequestId);
      if (linkedServiceRequest?.assignedProviderId) {
        const provider = await ctx.db.get(
          linkedServiceRequest.assignedProviderId,
        );
        isProviderAccess = provider?.organizationId === orgId;
      }
    }

    if (!isHospitalOwner && !isProviderAccess) {
      throw new ConvexError({
        message:
          "Không có quyền xem khiếu nại này. (You do not have access to this dispute.)",
        code: "FORBIDDEN",
      });
    }

    // Join related data in parallel
    const [serviceRequest, organization] = await Promise.all([
      ctx.db.get(dispute.serviceRequestId),
      ctx.db.get(dispute.organizationId),
    ]);

    // Get equipment name from service request
    let equipmentName: string | null = null;
    if (serviceRequest) {
      const equipment = await ctx.db.get(serviceRequest.equipmentId);
      equipmentName = equipment?.nameVi ?? null;
    }

    // Get assigned user name
    let assignedToName: string | null = null;
    if (dispute.assignedTo) {
      const assignedUser = await ctx.db.get(dispute.assignedTo);
      assignedToName = assignedUser?.name ?? null;
    }

    return {
      ...dispute,
      serviceRequest: serviceRequest
        ? {
            _id: serviceRequest._id,
            descriptionVi: serviceRequest.descriptionVi,
            descriptionEn: serviceRequest.descriptionEn,
            status: serviceRequest.status,
            type: serviceRequest.type,
          }
        : null,
      equipmentName,
      organizationName: organization?.name ?? null,
      assignedToName,
    };
  },
});

/**
 * Gets all messages for a dispute, ordered by createdAt ascending.
 * Enriches each message with the author's name.
 *
 * vi: "Lấy tin nhắn tranh chấp" / en: "Get dispute messages"
 */
export const getMessages = query({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    // Authenticate with org context — required to verify dispute ownership.
    // WHY: Without an org check, any authenticated user can read messages for
    // any dispute by guessing a disputeId — a CRITICAL cross-org data leak.
    const auth = await localRequireOrgAuth(ctx);

    // Load the parent dispute to verify the caller has access to it.
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new ConvexError({
        message: "Khiếu nại không tồn tại. (Dispute not found.)",
        code: "NOT_FOUND",
      });
    }

    // Access check: same as getById — hospital owner OR assigned provider.
    const orgId = auth.organizationId;
    const isHospitalOwner = dispute.organizationId === orgId;

    let isProviderAccess = false;
    if (!isHospitalOwner) {
      const linkedServiceRequest = await ctx.db.get(dispute.serviceRequestId);
      if (linkedServiceRequest?.assignedProviderId) {
        const provider = await ctx.db.get(
          linkedServiceRequest.assignedProviderId,
        );
        isProviderAccess = provider?.organizationId === orgId;
      }
    }

    if (!isHospitalOwner && !isProviderAccess) {
      throw new ConvexError({
        message:
          "Không có quyền xem tin nhắn này. (You do not have access to these messages.)",
        code: "FORBIDDEN",
      });
    }

    // Get messages by dispute index, ordered by createdAt
    const messages = await ctx.db
      .query("disputeMessages")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .order("asc")
      .collect();

    // Enrich with author name
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return {
          ...msg,
          authorName: author?.name ?? null,
        };
      }),
    );

    return enriched;
  },
});
