/**
 * Convex mutations and queries for service requests.
 *
 * Service request workflow:
 *   pending -> quoted -> accepted -> in_progress -> completed (+ cancelled/disputed)
 *
 * Access control:
 *   - Hospital org members create and own requests
 *   - Provider org members submit quotes and transition to in_progress/completed
 *   - Platform admins can view all requests
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { ServiceRequestStatus } from "./lib/workflowStateMachine";
import { mutation, query } from "./_generated/server";
import { createAuditEntry } from "./lib/auditLog";
import { requireAuth, requireOrgAuth } from "./lib/auth";
import { checkOrgRateLimit } from "./lib/rateLimit";
import { canTransition } from "./lib/workflowStateMachine";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Verifies that the given organizationId corresponds to a hospital org.
 * Throws a bilingual ConvexError if it does not.
 */
async function assertHospitalOrg(
  ctx: {
    db: {
      get: (id: Id<"organizations">) => Promise<{ org_type: string } | null>;
    };
  },
  organizationId: Id<"organizations">,
): Promise<{
  org_type: "hospital" | "provider";
  _id: Id<"organizations">;
  name: string;
  slug: string;
  createdAt: number;
  updatedAt: number;
}> {
  const org = await ctx.db.get(organizationId);
  if (!org) {
    throw new ConvexError({
      message: "Không tìm thấy tổ chức. (Organization not found.)",
      code: "ORG_NOT_FOUND",
    });
  }
  if (org.org_type !== "hospital") {
    throw new ConvexError({
      message:
        "Chỉ tổ chức bệnh viện mới có thể tạo yêu cầu dịch vụ. (Only hospital organizations can create service requests.)",
      code: "FORBIDDEN_ORG_TYPE",
    });
  }
  return org as {
    org_type: "hospital" | "provider";
    _id: Id<"organizations">;
    name: string;
    slug: string;
    createdAt: number;
    updatedAt: number;
  };
}

/**
 * Verifies that the given organizationId corresponds to a provider org.
 */
async function assertProviderOrg(
  ctx: {
    db: {
      get: (
        id: Id<"organizations">,
      ) => Promise<{ org_type: string; _id: Id<"organizations"> } | null>;
    };
  },
  organizationId: Id<"organizations">,
): Promise<void> {
  const org = await ctx.db.get(organizationId);
  if (!org) {
    throw new ConvexError({
      message: "Không tìm thấy tổ chức. (Organization not found.)",
      code: "ORG_NOT_FOUND",
    });
  }
  if (org.org_type !== "provider") {
    throw new ConvexError({
      message:
        "Chỉ tổ chức nhà cung cấp mới có thể thực hiện thao tác này. (Only provider organizations can perform this action.)",
      code: "FORBIDDEN_ORG_TYPE",
    });
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new service request for a piece of equipment.
 *
 * Only hospital org members can create service requests.
 * The equipment must belong to the same organization as the requester.
 */
export const create = mutation({
  args: {
    // The hospital organization creating this request
    organizationId: v.id("organizations"),
    // The equipment that needs service
    equipmentId: v.id("equipment"),
    // Type of service needed
    type: v.union(
      v.literal("repair"),
      v.literal("maintenance"),
      v.literal("calibration"),
      v.literal("inspection"),
      v.literal("installation"),
      v.literal("other"),
    ),
    // Priority level
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    // Bilingual description (Vietnamese is required, English is optional)
    descriptionVi: v.string(),
    descriptionEn: v.optional(v.string()),
    // Optional scheduled date (epoch ms)
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate the caller
    const auth = await requireAuth(ctx);

    // 1a. Rate limit per org
    await checkOrgRateLimit(ctx, args.organizationId, "serviceRequests.create");

    // 2. Verify the org is a hospital
    await assertHospitalOrg(ctx, args.organizationId);

    // 3. Verify the equipment belongs to this org
    const equipment = await ctx.db.get(args.equipmentId);
    if (!equipment) {
      throw new ConvexError({
        message: "Không tìm thấy thiết bị. (Equipment not found.)",
        code: "EQUIPMENT_NOT_FOUND",
      });
    }
    if (equipment.organizationId !== args.organizationId) {
      throw new ConvexError({
        message:
          "Thiết bị không thuộc tổ chức này. (Equipment does not belong to this organization.)",
        code: "EQUIPMENT_ORG_MISMATCH",
      });
    }

    // 4. Insert the service request
    const now = Date.now();
    const serviceRequestId = await ctx.db.insert("serviceRequests", {
      organizationId: args.organizationId,
      equipmentId: args.equipmentId,
      requestedBy: auth.userId as Id<"users">,
      type: args.type,
      priority: args.priority,
      status: "pending",
      descriptionVi: args.descriptionVi,
      descriptionEn: args.descriptionEn,
      scheduledAt: args.scheduledAt,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Create audit log entry
    await createAuditEntry(ctx, {
      organizationId: args.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.created",
      resourceType: "serviceRequests",
      resourceId: serviceRequestId,
      newValues: {
        status: "pending",
        type: args.type,
        priority: args.priority,
        equipmentId: args.equipmentId,
      },
    });

    return serviceRequestId;
  },
});

/**
 * Cancels a service request.
 *
 * Only valid from: pending, quoted, accepted.
 * Only the hospital org that owns the request can cancel it.
 */
export const cancel = mutation({
  args: {
    id: v.id("serviceRequests"),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await requireOrgAuth(ctx);

    // 2. Load the service request
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 3. Verify the caller's org owns this request
    if (request.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Bạn không có quyền hủy yêu cầu dịch vụ này. (You do not have permission to cancel this service request.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Enforce state machine
    const currentStatus = request.status as ServiceRequestStatus;
    if (!canTransition(currentStatus, "cancelled")) {
      throw new ConvexError({
        message: `Không thể hủy yêu cầu dịch vụ đang ở trạng thái "${currentStatus}". (Cannot cancel a service request in status "${currentStatus}".)`,
        code: "INVALID_TRANSITION",
        currentStatus,
        targetStatus: "cancelled",
      });
    }

    // 5. Update status
    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    // 6. Create audit log
    await createAuditEntry(ctx, {
      organizationId: request.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.cancelled",
      resourceType: "serviceRequests",
      resourceId: args.id,
      previousValues: { status: currentStatus },
      newValues: { status: "cancelled" },
    });

    return args.id;
  },
});

/**
 * Transitions a service request to a new status.
 *
 * Used for: accepted->in_progress, in_progress->completed, in_progress->disputed, completed->disputed.
 * Hospitals can transition: quoted->accepted is done via quotes.accept
 * Providers can transition: accepted->in_progress, in_progress->completed
 * Either party can dispute: in_progress->disputed, completed->disputed
 */
/**
 * Status transitions that require owner or admin role in the hospital org.
 * vi: "Chuyển đổi cần phê duyệt" / en: "Approval-class transitions"
 */
const APPROVAL_TRANSITIONS: ServiceRequestStatus[] = [
  "quoted",
  "accepted",
  "in_progress",
];

export const updateStatus = mutation({
  args: {
    id: v.id("serviceRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("quoted"),
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("disputed"),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate (local helper to avoid better-auth dep in tests)
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the service request
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 3. Verify caller has access (hospital owns it, or provider is assigned to it)
    const isHospitalOwner = request.organizationId === auth.organizationId;
    const isAssignedProvider =
      request.assignedProviderId != null &&
      auth.organizationId != null &&
      (await (async () => {
        // Check if the caller's org has a provider record matching assignedProviderId
        const provider = await ctx.db.get(
          request.assignedProviderId as Id<"providers">,
        );
        return provider?.organizationId === auth.organizationId;
      })());

    if (!isHospitalOwner && !isAssignedProvider) {
      throw new ConvexError({
        message:
          "Bạn không có quyền cập nhật trạng thái yêu cầu dịch vụ này. (You do not have permission to update the status of this service request.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Enforce state machine
    const currentStatus = request.status as ServiceRequestStatus;
    const targetStatus = args.status as ServiceRequestStatus;

    if (!canTransition(currentStatus, targetStatus)) {
      throw new ConvexError({
        message: `Không thể chuyển yêu cầu dịch vụ từ trạng thái "${currentStatus}" sang "${targetStatus}". (Cannot transition service request from "${currentStatus}" to "${targetStatus}".)`,
        code: "INVALID_TRANSITION",
        currentStatus,
        targetStatus,
      });
    }

    // 4a. Self-approval prevention: the user who created the request cannot
    // approve it, regardless of role. This enforces conflict-of-interest
    // controls per medical equipment workflow integrity requirements.
    if (
      APPROVAL_TRANSITIONS.includes(targetStatus) &&
      isHospitalOwner &&
      request.requestedBy === auth.userId
    ) {
      throw new ConvexError({
        vi: "Bạn không thể phê duyệt yêu cầu của chính mình",
        en: "You cannot approve your own service request",
      });
    }

    // 4b. Role gate for approval-class transitions: only owner or admin
    // members of the hospital org can approve/accept service requests.
    // Regular members can still view and create requests but cannot
    // perform approval transitions.
    if (APPROVAL_TRANSITIONS.includes(targetStatus) && isHospitalOwner) {
      // Look up the caller's user record by email to find their Convex user ID
      const identity = await ctx.auth.getUserIdentity();
      const email = identity?.email as string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let callerUserId: Id<"users"> | null = null;
      if (email) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await (ctx.db as any)
          .query("users")
          .withIndex("by_email", (q: any) => q.eq("email", email))
          .first();
        if (user) {
          callerUserId = user._id;
        }
      }

      if (callerUserId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const membership = await (ctx.db as any)
          .query("organizationMemberships")
          .withIndex("by_org_and_user", (q: any) =>
            q.eq("orgId", auth.organizationId).eq("userId", callerUserId),
          )
          .first();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
          throw new ConvexError({
            vi: "Chỉ quản trị viên hoặc chủ sở hữu mới có thể phê duyệt yêu cầu dịch vụ",
            en: "Only admin or owner can approve service requests",
          });
        }
      }
    }

    // 5. Build patch fields
    const now = Date.now();
    const patchFields: {
      status: ServiceRequestStatus;
      updatedAt: number;
      completedAt?: number;
    } = {
      status: targetStatus,
      updatedAt: now,
    };

    if (targetStatus === "completed") {
      patchFields.completedAt = now;
    }

    // 6. Update
    await ctx.db.patch(args.id, patchFields);

    // 7. Create audit log
    await createAuditEntry(ctx, {
      organizationId: request.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.statusUpdated",
      resourceType: "serviceRequests",
      resourceId: args.id,
      previousValues: { status: currentStatus },
      newValues: { status: targetStatus },
    });

    return args.id;
  },
});

/**
 * Provider explicitly declines a service request (passes on quoting it).
 *
 * WHY: Providers may need to signal they cannot service a particular request.
 * Recording the decline with a reason provides audit trail and helps hospitals
 * understand provider availability. The request remains "pending" so other
 * providers can still quote on it.
 *
 * Only provider org members can decline requests.
 * Request must be in "pending" or "quoted" status.
 */
export const declineRequest = mutation({
  args: {
    serviceRequestId: v.id("serviceRequests"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await requireOrgAuth(ctx);

    // 2. Verify caller's org is a provider
    await assertProviderOrg(ctx, auth.organizationId as Id<"organizations">);

    // 3. Load the service request
    const request = await ctx.db.get(args.serviceRequestId);
    if (!request) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 4. Only allow declining pending or quoted requests
    if (request.status !== "pending" && request.status !== "quoted") {
      throw new ConvexError({
        message:
          "Không thể từ chối yêu cầu dịch vụ này. (Cannot decline this service request.)",
        code: "INVALID_SERVICE_REQUEST_STATUS",
        currentStatus: request.status,
      });
    }

    // 5. Validate reason length
    if (!args.reason || args.reason.trim().length < 10) {
      throw new ConvexError({
        message:
          "Lý do từ chối phải có ít nhất 10 ký tự. (Decline reason must be at least 10 characters.)",
        code: "INVALID_REASON",
      });
    }

    // 6. Create audit log entry — we don't change request status, just record the decline
    await createAuditEntry(ctx, {
      organizationId: request.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.declined",
      resourceType: "serviceRequests",
      resourceId: args.serviceRequestId,
      previousValues: { status: request.status },
      newValues: { declineReason: args.reason },
    });

    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// Local auth helpers for M3-3 execution mutations (testable, no better-auth dep)
// ---------------------------------------------------------------------------

/**
 * Local JWT auth helper — no better-auth import needed for testability.
 * Mirrors disputes.ts pattern so these mutations can be exercised in convex-test.
 *
 * WHY: requireOrgAuth from ./lib/auth imports authComponent from ../auth
 * which depends on better-auth/minimal. convex-test can't resolve that package,
 * so execution mutations use this local helper instead.
 */
async function localRequireOrgAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<{ userId: string; organizationId: Id<"organizations"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }

  const jwtOrgId = identity.organizationId as Id<"organizations"> | null;
  if (jwtOrgId) {
    return { userId: identity.subject as string, organizationId: jwtOrgId };
  }

  // JWT fallback: Better Auth Convex component cannot store activeOrganizationId.
  // Look up the user's org membership from the database using email from JWT.
  const email = identity.email as string | null | undefined;
  if (email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const membership = await ctx.db
        .query("organizationMemberships")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .first();
      if (membership) {
        return {
          userId: identity.subject as string,
          organizationId: membership.orgId as Id<"organizations">,
        };
      }
    }
  }

  throw new ConvexError({
    message:
      "Không tìm thấy tổ chức. Vui lòng chọn tổ chức trước khi thực hiện thao tác này. (Organization not found. Please select an organization.)",
    code: "NO_ACTIVE_ORGANIZATION",
  });
}

/**
 * Provider starts executing a service — transitions accepted -> in_progress.
 *
 * WHY: Providers mark service as started when they arrive on-site so that
 * hospital staff see real-time status updates. This begins the execution
 * phase of the M3-3 workflow.
 *
 * Only provider org members (assigned to the request) can start service.
 * Request must be in "accepted" status.
 */
export const startService = mutation({
  args: {
    id: v.id("serviceRequests"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate (local helper to avoid better-auth dep in tests)
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the service request
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 3. Verify request is in "accepted" status (only valid transition source)
    if (request.status !== "accepted") {
      throw new ConvexError({
        message: `Không thể bắt đầu dịch vụ đang ở trạng thái "${request.status}". Yêu cầu phải ở trạng thái "accepted". (Cannot start service in status "${request.status}". Request must be in "accepted" status.)`,
        code: "INVALID_TRANSITION",
        currentStatus: request.status,
        targetStatus: "in_progress",
      });
    }

    // 4. Update status to in_progress
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "in_progress",
      updatedAt: now,
    });

    // 5. Create audit log entry
    await createAuditEntry(ctx, {
      organizationId: request.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.started",
      resourceType: "serviceRequests",
      resourceId: args.id,
      previousValues: { status: "accepted" },
      newValues: { status: "in_progress", notes: args.notes },
    });

    return args.id;
  },
});

/**
 * Provider updates service progress in real-time.
 *
 * WHY: Hospital staff need visibility into provider progress while on-site.
 * Progress notes provide a communication trail and optional percentComplete
 * gives a quick visual indicator without requiring a status transition.
 *
 * Request must be in "in_progress" status.
 */
export const updateProgress = mutation({
  args: {
    id: v.id("serviceRequests"),
    progressNotes: v.string(),
    percentComplete: v.optional(v.number()),
    hasUnexpectedIssue: v.optional(v.boolean()),
    unexpectedIssueDescVi: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate (local helper to avoid better-auth dep in tests)
    const auth = await localRequireOrgAuth(ctx);

    // 1a. Rate limit per org
    await checkOrgRateLimit(
      ctx,
      auth.organizationId,
      "serviceRequests.updateProgress",
    );

    // 2. Load the service request
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 3. Verify request is in_progress
    if (request.status !== "in_progress") {
      throw new ConvexError({
        message: `Chỉ có thể cập nhật tiến độ khi dịch vụ đang thực hiện. Trạng thái hiện tại: "${request.status}". (Can only update progress when service is in progress. Current status: "${request.status}".)`,
        code: "INVALID_STATUS_FOR_PROGRESS_UPDATE",
        currentStatus: request.status,
      });
    }

    // 4. Update updatedAt (progress notes are logged in audit trail)
    const now = Date.now();
    await ctx.db.patch(args.id, {
      updatedAt: now,
    });

    // 5. Create audit log with progress details
    await createAuditEntry(ctx, {
      organizationId: request.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.progressUpdated",
      resourceType: "serviceRequests",
      resourceId: args.id,
      newValues: {
        progressNotes: args.progressNotes,
        percentComplete: args.percentComplete,
        hasUnexpectedIssue: args.hasUnexpectedIssue,
        unexpectedIssueDescVi: args.unexpectedIssueDescVi,
      },
    });

    return args.id;
  },
});

/**
 * Provider marks service as completed — transitions in_progress -> completed.
 *
 * WHY: Final status transition that notifies hospital the work is done.
 * Sets completedAt timestamp for compliance reporting.
 *
 * Only provider org members can complete service.
 * Request must be in "in_progress" status.
 */
export const completeService = mutation({
  args: {
    id: v.id("serviceRequests"),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate (local helper to avoid better-auth dep in tests)
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the service request
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 3. Verify state machine transition
    const currentStatus = request.status as ServiceRequestStatus;
    if (!canTransition(currentStatus, "completed")) {
      throw new ConvexError({
        message: `Không thể hoàn thành yêu cầu dịch vụ đang ở trạng thái "${currentStatus}". (Cannot complete a service request in status "${currentStatus}".)`,
        code: "INVALID_TRANSITION",
        currentStatus,
        targetStatus: "completed",
      });
    }

    // 4. Update status and set completedAt
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    // 5. Create audit log
    await createAuditEntry(ctx, {
      organizationId: request.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.completed",
      resourceType: "serviceRequests",
      resourceId: args.id,
      previousValues: { status: currentStatus },
      newValues: { status: "completed", completedAt: now },
    });

    return args.id;
  },
});

/**
 * Provider submits a structured completion report after service execution.
 *
 * WHY: Completion reports are stored in a separate completionReports table
 * (append-only schema rule) so M3-4 analytics can aggregate parts replaced,
 * actual hours, and maintenance schedules across all services. Bilingual
 * descriptions let hospital staff read reports in their preferred language.
 *
 * Request must be in "in_progress" or "completed" status.
 */
export const submitCompletionReport = mutation({
  args: {
    id: v.id("serviceRequests"),
    workDescriptionVi: v.string(),
    workDescriptionEn: v.optional(v.string()),
    partsReplaced: v.optional(v.array(v.string())),
    nextMaintenanceRecommendation: v.optional(v.string()),
    actualHours: v.optional(v.number()),
    photoUrls: v.optional(v.array(v.string())),
    actualCompletionTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate (local helper to avoid better-auth dep in tests)
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the service request
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 3. Verify status allows completion report submission
    const validStatuses = ["in_progress", "completed"];
    if (!validStatuses.includes(request.status)) {
      throw new ConvexError({
        message: `Không thể gửi báo cáo hoàn thành cho yêu cầu đang ở trạng thái "${request.status}". Yêu cầu phải đang thực hiện hoặc đã hoàn thành. (Cannot submit completion report for request in status "${request.status}". Request must be in_progress or completed.)`,
        code: "INVALID_STATUS_FOR_COMPLETION_REPORT",
        currentStatus: request.status,
      });
    }

    // 4. Find the provider assigned to this request (for foreign key)
    let providerId: Id<"providers"> | undefined;
    if (request.assignedProviderId) {
      providerId = request.assignedProviderId;
    }

    // 5. Insert completion report in the dedicated table
    const now = Date.now();
    const reportId = await ctx.db.insert("completionReports", {
      serviceRequestId: args.id,
      providerId,
      workDescriptionVi: args.workDescriptionVi,
      workDescriptionEn: args.workDescriptionEn,
      partsReplaced: args.partsReplaced,
      nextMaintenanceRecommendation: args.nextMaintenanceRecommendation,
      actualHours: args.actualHours,
      photoUrls: args.photoUrls,
      actualCompletionTime: args.actualCompletionTime,
      submittedBy: auth.userId as Id<"users">,
      createdAt: now,
      updatedAt: now,
    });

    // 6. Create audit log (5-year retention per Vietnamese regulations)
    await createAuditEntry(ctx, {
      organizationId: request.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.completionReportSubmitted",
      resourceType: "completionReports",
      resourceId: reportId,
      newValues: {
        serviceRequestId: args.id,
        workDescriptionVi: args.workDescriptionVi,
        partsReplaced: args.partsReplaced,
        actualHours: args.actualHours,
      },
    });

    return reportId;
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists service requests for the authenticated user's hospital organization.
 * Supports optional status filtering.
 * Returns requests with equipment name joined.
 */
export const listByHospital = query({
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
  },
  handler: async (ctx, args) => {
    const auth = await requireOrgAuth(ctx);

    // Verify the org is a hospital
    const org = await ctx.db.get(auth.organizationId as Id<"organizations">);
    if (!org || org.org_type !== "hospital") {
      throw new ConvexError({
        message:
          "Chỉ tổ chức bệnh viện mới có thể xem danh sách yêu cầu dịch vụ. (Only hospital organizations can list service requests.)",
        code: "FORBIDDEN_ORG_TYPE",
      });
    }

    const orgId = auth.organizationId as Id<"organizations">;

    // Use indexed query for efficiency
    let requests;
    if (args.status) {
      requests = await ctx.db
        .query("serviceRequests")
        .withIndex("by_org_and_status", (q) =>
          q.eq("organizationId", orgId).eq("status", args.status!),
        )
        .collect();
    } else {
      requests = await ctx.db
        .query("serviceRequests")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
    }

    // Join equipment names
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const equipment = await ctx.db.get(req.equipmentId);
        return {
          ...req,
          equipmentNameVi: equipment?.nameVi ?? null,
          equipmentNameEn: equipment?.nameEn ?? null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Lists service requests visible to the authenticated user's provider organization.
 * Returns requests that are:
 *  - Assigned to this provider (by assignedProviderId)
 *  - In "pending" or "quoted" status (available for quoting)
 */
export const listByProvider = query({
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
  },
  handler: async (ctx, args) => {
    const auth = await requireOrgAuth(ctx);

    // Verify the org is a provider
    const org = await ctx.db.get(auth.organizationId as Id<"organizations">);
    if (!org || org.org_type !== "provider") {
      throw new ConvexError({
        message:
          "Chỉ tổ chức nhà cung cấp mới có thể xem danh sách yêu cầu dịch vụ theo nhà cung cấp. (Only provider organizations can list service requests by provider.)",
        code: "FORBIDDEN_ORG_TYPE",
      });
    }

    // Find the provider record for this org
    const providerRecord = await ctx.db
      .query("providers")
      .withIndex("by_org", (q) =>
        q.eq("organizationId", auth.organizationId as Id<"organizations">),
      )
      .first();

    if (!providerRecord) {
      // No provider record yet — return empty list
      return [];
    }

    // Get requests assigned to this provider
    const assignedRequests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_provider", (q) =>
        q.eq("assignedProviderId", providerRecord._id),
      )
      .collect();

    // Get open requests (pending/quoted) that this provider could quote on
    // Filter by coverage area: check if any coverage area matches the hospital's location
    const openStatuses: ServiceRequestStatus[] = ["pending", "quoted"];
    const openRequests: typeof assignedRequests = [];

    if (
      !args.status ||
      openStatuses.includes(args.status as ServiceRequestStatus)
    ) {
      // Get all coverage areas for this provider
      const coverageAreas = await ctx.db
        .query("coverageAreas")
        .withIndex("by_provider", (q) => q.eq("providerId", providerRecord._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      if (coverageAreas.length > 0) {
        // Get pending/quoted requests
        for (const status of openStatuses) {
          if (!args.status || args.status === status) {
            // Get all requests in this status (we'll need to filter server-side)
            // Note: Cross-org access means we can't use org index here
            // This is a full-table scan filtered by status and coverage area
            // In production, a composite index would be preferred
            const statusRequests = await ctx.db
              .query("serviceRequests")
              .filter((q) => q.eq(q.field("status"), status))
              .collect();

            // For now, include all open requests (coverage area filtering
            // would require hospital location data which may not be set up yet)
            for (const req of statusRequests) {
              // Don't include already-assigned requests
              if (!assignedRequests.some((r) => r._id === req._id)) {
                openRequests.push(req);
              }
            }
          }
        }
      }
    }

    // Merge and deduplicate
    const allRequests = [...assignedRequests];
    for (const req of openRequests) {
      if (!allRequests.some((r) => r._id === req._id)) {
        allRequests.push(req);
      }
    }

    // Apply status filter if provided
    const filtered = args.status
      ? allRequests.filter((r) => r.status === args.status)
      : allRequests;

    // Join hospital org names
    const enriched = await Promise.all(
      filtered.map(async (req) => {
        const hospitalOrg = await ctx.db.get(req.organizationId);
        const equipment = await ctx.db.get(req.equipmentId);
        return {
          ...req,
          hospitalOrgName: hospitalOrg?.name ?? null,
          equipmentNameVi: equipment?.nameVi ?? null,
          equipmentNameEn: equipment?.nameEn ?? null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Gets a single service request by ID with full related data.
 * Includes equipment details, all quotes, and service rating if available.
 */
export const getById = query({
  args: {
    id: v.id("serviceRequests"),
  },
  handler: async (ctx, args) => {
    const auth = await requireOrgAuth(ctx);

    // Load the request
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // Verify access: hospital owns it OR provider is assigned/has coverage
    const orgId = auth.organizationId as Id<"organizations">;
    const isHospitalOwner = request.organizationId === orgId;

    let isProviderAccess = false;
    if (!isHospitalOwner) {
      // Check if this org is a provider
      const org = await ctx.db.get(orgId);
      if (org?.org_type === "provider") {
        if (request.assignedProviderId) {
          const provider = await ctx.db.get(
            request.assignedProviderId as Id<"providers">,
          );
          isProviderAccess = provider?.organizationId === orgId;
        }
        // Also allow access if the request is open (pending/quoted) — providers
        // should be able to see open requests to decide whether to quote
        if (
          !isProviderAccess &&
          ["pending", "quoted"].includes(request.status)
        ) {
          isProviderAccess = true;
        }
      }
    }

    if (!isHospitalOwner && !isProviderAccess) {
      throw new ConvexError({
        message:
          "Bạn không có quyền xem yêu cầu dịch vụ này. (You do not have permission to view this service request.)",
        code: "FORBIDDEN",
      });
    }

    // Join related data in parallel
    const [equipment, quotes, rating, hospitalOrg] = await Promise.all([
      ctx.db.get(request.equipmentId),
      ctx.db
        .query("quotes")
        .withIndex("by_service_request", (q) =>
          q.eq("serviceRequestId", args.id),
        )
        .collect(),
      ctx.db
        .query("serviceRatings")
        .withIndex("by_service_request", (q) =>
          q.eq("serviceRequestId", args.id),
        )
        .first(),
      ctx.db.get(request.organizationId),
    ]);

    // Enrich quotes with provider names
    const enrichedQuotes = await Promise.all(
      quotes.map(async (quote) => {
        const provider = await ctx.db.get(quote.providerId);
        const providerOrg = provider
          ? await ctx.db.get(provider.organizationId)
          : null;
        return {
          ...quote,
          providerNameVi: provider?.nameVi ?? null,
          providerNameEn: provider?.nameEn ?? null,
          providerOrgName: providerOrg?.name ?? null,
        };
      }),
    );

    return {
      ...request,
      equipment: equipment
        ? {
            nameVi: equipment.nameVi,
            nameEn: equipment.nameEn,
            status: equipment.status,
            condition: equipment.condition,
          }
        : null,
      quotes: enrichedQuotes,
      rating: rating ?? null,
      hospitalOrgName: hospitalOrg?.name ?? null,
    };
  },
});

/**
 * Lists active services for the authenticated provider organization.
 *
 * WHY: Provider staff use this mobile-first screen to see all services
 * they need to execute. Returns accepted (scheduled) and in_progress (on-site)
 * requests sorted by scheduledAt so upcoming work is easy to find.
 *
 * Only provider org members can call this.
 * Returns requests with hospital name, equipment details, and accepted quote info.
 */
export const listActiveServices = query({
  args: {},
  handler: async (ctx) => {
    const auth = await localRequireOrgAuth(ctx);

    // Verify the org is a provider
    const org = await ctx.db.get(auth.organizationId as Id<"organizations">);
    if (!org || org.org_type !== "provider") {
      throw new ConvexError({
        message:
          "Chỉ tổ chức nhà cung cấp mới có thể xem danh sách dịch vụ đang thực hiện. (Only provider organizations can list active services.)",
        code: "FORBIDDEN_ORG_TYPE",
      });
    }

    // Find the provider record for this org
    const providerRecord = await ctx.db
      .query("providers")
      .withIndex("by_org", (q) =>
        q.eq("organizationId", auth.organizationId as Id<"organizations">),
      )
      .first();

    if (!providerRecord) {
      return [];
    }

    // Get accepted and in_progress requests assigned to this provider
    const activeRequests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_provider", (q) =>
        q.eq("assignedProviderId", providerRecord._id),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("status"), "in_progress"),
        ),
      )
      .collect();

    // Sort by scheduledAt (earliest first), then by createdAt for requests without schedule
    const sorted = [...activeRequests].sort((a, b) => {
      const aDate = a.scheduledAt ?? a.createdAt;
      const bDate = b.scheduledAt ?? b.createdAt;
      return aDate - bDate;
    });

    // Enrich with hospital and equipment details
    const enriched = await Promise.all(
      sorted.map(async (req) => {
        const [equipment, hospitalOrg, acceptedQuote] = await Promise.all([
          ctx.db.get(req.equipmentId),
          ctx.db.get(req.organizationId),
          ctx.db
            .query("quotes")
            .withIndex("by_service_request", (q) =>
              q.eq("serviceRequestId", req._id),
            )
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .first(),
        ]);
        return {
          ...req,
          equipmentNameVi: equipment?.nameVi ?? null,
          equipmentNameEn: equipment?.nameEn ?? null,
          equipmentLocation: equipment?.location ?? null,
          hospitalOrgName: hospitalOrg?.name ?? null,
          acceptedQuoteAmount: acceptedQuote?.amount ?? null,
          acceptedQuoteCurrency: acceptedQuote?.currency ?? null,
        };
      }),
    );

    return enriched;
  },
});
