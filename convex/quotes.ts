/**
 * Convex mutations and queries for the quote workflow.
 *
 * Quote lifecycle:
 *   providers submit quotes for pending/quoted service requests
 *   hospitals accept or reject quotes
 *   accepting a quote assigns the provider and transitions the service request
 *
 * Access control:
 *   - Provider org members can submit and view their own quotes
 *   - Hospital org members can accept/reject quotes for their own service requests
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { QuoteStatus } from "./lib/workflowStateMachine";
import { mutation, query } from "./_generated/server";
import { createAuditEntry } from "./lib/auditLog";
import { requireOrgAuth } from "./lib/auth";
import { canTransitionQuote } from "./lib/workflowStateMachine";

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Provider submits a price quote for a service request.
 *
 * Only provider org members can submit quotes.
 * The service request must be in "pending" or "quoted" status.
 * If this is the first quote on a "pending" request, transitions it to "quoted".
 */
export const submit = mutation({
  args: {
    serviceRequestId: v.id("serviceRequests"),
    // Price amount
    amount: v.number(),
    // Currency code (default "VND")
    currency: v.optional(v.string()),
    // Optional provider-facing notes
    notes: v.optional(v.string()),
    // How many days until this quote expires
    validUntilDays: v.optional(v.number()),
    // vi: "Số ngày ước tính để hoàn thành" / en: "Estimated days to complete the job"
    estimatedDurationDays: v.optional(v.number()),
    // vi: "Ngày bắt đầu sớm nhất (epoch ms)" / en: "Earliest available start date (epoch ms)"
    availableStartDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await requireOrgAuth(ctx);

    // 2. Verify the caller's org is a provider
    const callerOrg = await ctx.db.get(
      auth.organizationId as Id<"organizations">,
    );
    if (!callerOrg || callerOrg.org_type !== "provider") {
      throw new ConvexError({
        message:
          "Chỉ tổ chức nhà cung cấp mới có thể gửi báo giá. (Only provider organizations can submit quotes.)",
        code: "FORBIDDEN_ORG_TYPE",
      });
    }

    // 3. Load the service request
    const serviceRequest = await ctx.db.get(args.serviceRequestId);
    if (!serviceRequest) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 4. Verify the service request is open for quoting
    if (
      serviceRequest.status !== "pending" &&
      serviceRequest.status !== "quoted"
    ) {
      throw new ConvexError({
        message: `Yêu cầu dịch vụ không ở trạng thái có thể báo giá (đang ở "${serviceRequest.status}"). (Service request is not open for quoting — current status: "${serviceRequest.status}".)`,
        code: "INVALID_SERVICE_REQUEST_STATUS",
        currentStatus: serviceRequest.status,
      });
    }

    // 5. Find the provider record for this org
    const providerRecord = await ctx.db
      .query("providers")
      .withIndex("by_org", (q) =>
        q.eq("organizationId", auth.organizationId as Id<"organizations">),
      )
      .first();

    if (!providerRecord) {
      throw new ConvexError({
        message:
          "Không tìm thấy hồ sơ nhà cung cấp cho tổ chức này. (No provider profile found for this organization.)",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    // 6. Calculate validUntil timestamp
    const now = Date.now();
    const validUntilDays = args.validUntilDays ?? 7;
    const validUntil = now + validUntilDays * 24 * 60 * 60 * 1000;

    // 7. Insert the quote
    const quoteId = await ctx.db.insert("quotes", {
      serviceRequestId: args.serviceRequestId,
      providerId: providerRecord._id,
      status: "pending",
      amount: args.amount,
      currency: args.currency ?? "VND",
      notes: args.notes,
      validUntil,
      estimatedDurationDays: args.estimatedDurationDays,
      availableStartDate: args.availableStartDate,
      createdAt: now,
      updatedAt: now,
    });

    // 8. If the service request is still "pending", transition it to "quoted"
    //    (this happens on the first quote submission)
    if (serviceRequest.status === "pending") {
      await ctx.db.patch(args.serviceRequestId, {
        status: "quoted",
        updatedAt: now,
      });

      // Audit the service request status change
      await createAuditEntry(ctx, {
        organizationId: serviceRequest.organizationId,
        actorId: auth.userId as Id<"users">,
        action: "serviceRequest.statusUpdated",
        resourceType: "serviceRequests",
        resourceId: args.serviceRequestId,
        previousValues: { status: "pending" },
        newValues: { status: "quoted" },
      });
    }

    // 9. Audit the quote creation
    await createAuditEntry(ctx, {
      organizationId: serviceRequest.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "quote.submitted",
      resourceType: "quotes",
      resourceId: quoteId,
      newValues: {
        serviceRequestId: args.serviceRequestId,
        providerId: providerRecord._id,
        amount: args.amount,
        currency: args.currency ?? "VND",
      },
    });

    return quoteId;
  },
});

/**
 * Hospital accepts a quote for their service request.
 *
 * Accepting a quote:
 *   1. Sets the accepted quote to "accepted"
 *   2. Rejects all other pending quotes for the same request
 *   3. Transitions the service request to "accepted"
 *   4. Sets the assignedProviderId on the service request
 */
export const accept = mutation({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await requireOrgAuth(ctx);

    // 2. Load the quote
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new ConvexError({
        message: "Không tìm thấy báo giá. (Quote not found.)",
        code: "QUOTE_NOT_FOUND",
      });
    }

    // 3. Verify the quote is in "pending" status
    if (quote.status !== "pending") {
      throw new ConvexError({
        message: `Không thể chấp nhận báo giá đang ở trạng thái "${quote.status}". (Cannot accept a quote in status "${quote.status}".)`,
        code: "INVALID_QUOTE_STATUS",
        currentStatus: quote.status,
      });
    }

    // 4. Load the service request
    const serviceRequest = await ctx.db.get(quote.serviceRequestId);
    if (!serviceRequest) {
      throw new ConvexError({
        message:
          "Không tìm thấy yêu cầu dịch vụ liên quan. (Associated service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 5. Verify the caller's org owns this service request (hospital side)
    if (serviceRequest.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Bạn không có quyền chấp nhận báo giá này. (You do not have permission to accept this quote.)",
        code: "FORBIDDEN",
      });
    }

    // 6. Verify the quote transition is valid
    const currentQuoteStatus = quote.status as QuoteStatus;
    if (!canTransitionQuote(currentQuoteStatus, "accepted")) {
      throw new ConvexError({
        message: `Không thể chấp nhận báo giá từ trạng thái "${currentQuoteStatus}". (Cannot accept quote from status "${currentQuoteStatus}".)`,
        code: "INVALID_TRANSITION",
      });
    }

    const now = Date.now();

    // 7. Accept this quote
    await ctx.db.patch(args.quoteId, {
      status: "accepted",
      updatedAt: now,
    });

    // 8. Reject all other pending quotes for the same service request
    const otherQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_service_request", (q) =>
        q.eq("serviceRequestId", quote.serviceRequestId),
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), args.quoteId),
          q.eq(q.field("status"), "pending"),
        ),
      )
      .collect();

    await Promise.all(
      otherQuotes.map(async (otherQuote) => {
        await ctx.db.patch(otherQuote._id, {
          status: "rejected",
          updatedAt: now,
        });
        await createAuditEntry(ctx, {
          organizationId: serviceRequest.organizationId,
          actorId: auth.userId as Id<"users">,
          action: "quote.rejectedOnAccept",
          resourceType: "quotes",
          resourceId: otherQuote._id,
          previousValues: { status: "pending" },
          newValues: { status: "rejected" },
        });
      }),
    );

    // 9. Transition the service request to "accepted" and assign the provider
    await ctx.db.patch(quote.serviceRequestId, {
      status: "accepted",
      assignedProviderId: quote.providerId,
      updatedAt: now,
    });

    // 10. Audit entries
    await createAuditEntry(ctx, {
      organizationId: serviceRequest.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "quote.accepted",
      resourceType: "quotes",
      resourceId: args.quoteId,
      previousValues: { status: "pending" },
      newValues: { status: "accepted" },
    });

    await createAuditEntry(ctx, {
      organizationId: serviceRequest.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRequest.statusUpdated",
      resourceType: "serviceRequests",
      resourceId: quote.serviceRequestId,
      previousValues: {
        status: serviceRequest.status,
        assignedProviderId: null,
      },
      newValues: { status: "accepted", assignedProviderId: quote.providerId },
    });

    return args.quoteId;
  },
});

/**
 * Hospital rejects a specific quote.
 *
 * Only the hospital that owns the service request can reject quotes.
 * Rejecting a quote does NOT change the service request status.
 */
export const reject = mutation({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await requireOrgAuth(ctx);

    // 2. Load the quote
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new ConvexError({
        message: "Không tìm thấy báo giá. (Quote not found.)",
        code: "QUOTE_NOT_FOUND",
      });
    }

    // 3. Verify the quote is in "pending" status
    if (quote.status !== "pending") {
      throw new ConvexError({
        message: `Không thể từ chối báo giá đang ở trạng thái "${quote.status}". (Cannot reject a quote in status "${quote.status}".)`,
        code: "INVALID_QUOTE_STATUS",
        currentStatus: quote.status,
      });
    }

    // 4. Load the service request to verify ownership
    const serviceRequest = await ctx.db.get(quote.serviceRequestId);
    if (!serviceRequest) {
      throw new ConvexError({
        message:
          "Không tìm thấy yêu cầu dịch vụ liên quan. (Associated service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 5. Verify the caller's org owns this service request (hospital side)
    if (serviceRequest.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Bạn không có quyền từ chối báo giá này. (You do not have permission to reject this quote.)",
        code: "FORBIDDEN",
      });
    }

    // 6. Validate transition
    const currentQuoteStatus = quote.status as QuoteStatus;
    if (!canTransitionQuote(currentQuoteStatus, "rejected")) {
      throw new ConvexError({
        message: `Không thể từ chối báo giá từ trạng thái "${currentQuoteStatus}". (Cannot reject quote from status "${currentQuoteStatus}".)`,
        code: "INVALID_TRANSITION",
      });
    }

    // 7. Reject the quote (service request status is NOT changed)
    const now = Date.now();
    await ctx.db.patch(args.quoteId, {
      status: "rejected",
      updatedAt: now,
    });

    // 8. Audit log
    await createAuditEntry(ctx, {
      organizationId: serviceRequest.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "quote.rejected",
      resourceType: "quotes",
      resourceId: args.quoteId,
      previousValues: { status: "pending" },
      newValues: { status: "rejected" },
    });

    return args.quoteId;
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists all quotes for a specific service request.
 *
 * Accessible by:
 *   - The hospital that owns the service request
 *   - Providers who have submitted a quote for this request
 */
export const listByServiceRequest = query({
  args: {
    serviceRequestId: v.id("serviceRequests"),
  },
  handler: async (ctx, args) => {
    const auth = await requireOrgAuth(ctx);

    // Load the service request
    const serviceRequest = await ctx.db.get(args.serviceRequestId);
    if (!serviceRequest) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    const orgId = auth.organizationId as Id<"organizations">;
    const isHospitalOwner = serviceRequest.organizationId === orgId;

    // Fetch all quotes for this request
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_service_request", (q) =>
        q.eq("serviceRequestId", args.serviceRequestId),
      )
      .collect();

    // If hospital owner, they can see all quotes
    // If provider, they can only see their own quote
    let filteredQuotes = quotes;
    if (!isHospitalOwner) {
      // Find the provider record for this org
      const providerRecord = await ctx.db
        .query("providers")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .first();

      if (!providerRecord) {
        return [];
      }

      filteredQuotes = quotes.filter(
        (q) => q.providerId === providerRecord._id,
      );
    }

    // Enrich with provider names
    const enriched = await Promise.all(
      filteredQuotes.map(async (quote) => {
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

    return enriched;
  },
});

/**
 * Lists quotes submitted by the authenticated user's provider organization.
 * Supports optional status filtering.
 * Returns quotes with service request summary joined.
 */
export const listByProvider = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("expired"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const auth = await requireOrgAuth(ctx);

    // Verify the caller's org is a provider
    const callerOrg = await ctx.db.get(
      auth.organizationId as Id<"organizations">,
    );
    if (!callerOrg || callerOrg.org_type !== "provider") {
      throw new ConvexError({
        message:
          "Chỉ tổ chức nhà cung cấp mới có thể xem danh sách báo giá theo nhà cung cấp. (Only provider organizations can list quotes by provider.)",
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

    // Get all quotes for this provider
    let quotes = await ctx.db
      .query("quotes")
      .withIndex("by_provider", (q) => q.eq("providerId", providerRecord._id))
      .collect();

    // Apply optional status filter
    if (args.status) {
      quotes = quotes.filter((q) => q.status === args.status);
    }

    // Join service request summaries
    const enriched = await Promise.all(
      quotes.map(async (quote) => {
        const serviceRequest = await ctx.db.get(quote.serviceRequestId);
        const equipment = serviceRequest
          ? await ctx.db.get(serviceRequest.equipmentId)
          : null;
        const hospitalOrg = serviceRequest
          ? await ctx.db.get(serviceRequest.organizationId)
          : null;
        return {
          ...quote,
          serviceRequest: serviceRequest
            ? {
                _id: serviceRequest._id,
                status: serviceRequest.status,
                type: serviceRequest.type,
                priority: serviceRequest.priority,
                descriptionVi: serviceRequest.descriptionVi,
                descriptionEn: serviceRequest.descriptionEn,
                equipmentNameVi: equipment?.nameVi ?? null,
                equipmentNameEn: equipment?.nameEn ?? null,
                hospitalOrgName: hospitalOrg?.name ?? null,
              }
            : null,
        };
      }),
    );

    return enriched;
  },
});
