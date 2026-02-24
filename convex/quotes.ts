/**
 * Convex queries and mutations for provider quotes.
 *
 * WHY: Providers submit price quotes in response to hospital service requests.
 * This module handles quote creation, updates, and listing — the core of the
 * provider-side marketplace experience.
 *
 * vi: "Truy vấn và thay đổi Convex cho báo giá nhà cung cấp" / en: "Provider quote queries and mutations"
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

/**
 * Submits a new quote for a service request.
 *
 * WHY: Providers respond to pending service requests by submitting a price
 * quote with amount, estimated duration, and optional notes. The hospital
 * then accepts or rejects the quote.
 *
 * vi: "Gửi báo giá mới" / en: "Submit a new quote for a service request"
 */
export const submit = mutation({
  args: {
    /** vi: "ID yêu cầu dịch vụ" / en: "Service request ID to quote for" */
    serviceRequestId: v.id("serviceRequests"),
    /** vi: "Số tiền báo giá" / en: "Quote amount in the specified currency" */
    amount: v.number(),
    /** vi: "Đơn vị tiền tệ" / en: "Currency code (e.g., 'VND', 'USD')" */
    currency: v.optional(v.string()),
    /** vi: "Ghi chú" / en: "Optional notes for the hospital" */
    notes: v.optional(v.string()),
    /** vi: "Số ngày hiệu lực" / en: "Days until the quote expires" */
    validUntilDays: v.optional(v.number()),
    /** vi: "Số ngày ước tính" / en: "Estimated days to complete the work" */
    estimatedDurationDays: v.optional(v.number()),
    /** vi: "Ngày bắt đầu sớm nhất (epoch ms)" / en: "Earliest available start date in epoch ms" */
    availableStartDate: v.optional(v.number()),
  },
  returns: v.id("quotes"),
  handler: async (ctx, args): Promise<Id<"quotes">> => {
    const { userId } = await requireAuth(ctx);
    void userId;

    // Verify the service request exists and is in a quotable state
    const request = await ctx.db.get(args.serviceRequestId);
    if (!request) {
      throw new ConvexError({
        message: "Service request not found",
        vi: "Không tìm thấy yêu cầu dịch vụ",
      });
    }

    if (request.status !== "pending") {
      throw new ConvexError({
        message: "Service request is not accepting quotes",
        vi: "Yêu cầu dịch vụ không còn chấp nhận báo giá",
      });
    }

    const now = Date.now();
    const validUntil = args.validUntilDays
      ? now + args.validUntilDays * 24 * 60 * 60 * 1000
      : undefined;

    // Find the provider record for this user
    // WHY: Quotes are linked to providers, not users directly
    const provider = await ctx.db
      .query("providers")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!provider) {
      throw new ConvexError({
        message: "Provider profile not found",
        vi: "Không tìm thấy hồ sơ nhà cung cấp",
      });
    }

    const quoteId = await ctx.db.insert("quotes", {
      serviceRequestId: args.serviceRequestId,
      providerId: provider._id,
      status: "pending",
      amount: args.amount,
      currency: args.currency ?? "VND",
      validUntil,
      notes: args.notes,
      estimatedDurationDays: args.estimatedDurationDays,
      availableStartDate: args.availableStartDate,
      createdAt: now,
      updatedAt: now,
    });

    // Update the service request status to "quoted" when the first quote arrives
    if (request.status === "pending") {
      await ctx.db.patch(args.serviceRequestId, {
        status: "quoted",
        updatedAt: now,
      });
    }

    return quoteId;
  },
});

/**
 * Updates an existing pending quote.
 *
 * WHY: Providers sometimes need to revise quote details (amount, timeline)
 * after submission but before the hospital makes a decision. Only pending
 * quotes can be updated.
 *
 * vi: "Cập nhật báo giá đang chờ" / en: "Update a pending quote"
 */
export const update = mutation({
  args: {
    /** vi: "ID báo giá" / en: "Quote ID to update" */
    quoteId: v.id("quotes"),
    /** vi: "Số tiền mới" / en: "Updated amount (optional)" */
    amount: v.optional(v.number()),
    /** vi: "Ghi chú mới" / en: "Updated notes (optional)" */
    notes: v.optional(v.string()),
    /** vi: "Số ngày hiệu lực mới" / en: "Updated validity period in days (optional)" */
    validUntilDays: v.optional(v.number()),
    /** vi: "Số ngày ước tính mới" / en: "Updated estimated duration in days (optional)" */
    estimatedDurationDays: v.optional(v.number()),
    /** vi: "Ngày bắt đầu mới" / en: "Updated available start date (optional)" */
    availableStartDate: v.optional(v.number()),
  },
  returns: v.id("quotes"),
  handler: async (ctx, args): Promise<Id<"quotes">> => {
    const { userId } = await requireAuth(ctx);
    void userId;

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new ConvexError({
        message: "Quote not found",
        vi: "Không tìm thấy báo giá",
      });
    }

    if (quote.status !== "pending") {
      throw new ConvexError({
        message: "Only pending quotes can be updated",
        vi: "Chỉ có thể cập nhật báo giá đang chờ xử lý",
      });
    }

    const now = Date.now();
    const patches: Partial<{
      amount: number;
      notes: string;
      validUntil: number;
      estimatedDurationDays: number;
      availableStartDate: number;
      updatedAt: number;
    }> = { updatedAt: now };

    if (args.amount !== undefined) patches.amount = args.amount;
    if (args.notes !== undefined) patches.notes = args.notes;
    if (args.validUntilDays !== undefined) {
      patches.validUntil = now + args.validUntilDays * 24 * 60 * 60 * 1000;
    }
    if (args.estimatedDurationDays !== undefined) {
      patches.estimatedDurationDays = args.estimatedDurationDays;
    }
    if (args.availableStartDate !== undefined) {
      patches.availableStartDate = args.availableStartDate;
    }

    await ctx.db.patch(args.quoteId, patches);
    return args.quoteId;
  },
});

/**
 * Lists quotes submitted by the current provider organization.
 *
 * WHY: Providers need a dashboard view of all their submitted quotes to
 * track status (pending / accepted / rejected / expired). Supports optional
 * status filtering.
 *
 * vi: "Danh sách báo giá của nhà cung cấp" / en: "List quotes submitted by the current provider"
 */
export const listByProvider = query({
  args: {
    /**
     * vi: "Lọc theo trạng thái" / en: "Filter by quote status (optional)"
     * Pass undefined or omit to get all statuses.
     */
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("expired"),
      ),
    ),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);

    // Find the provider record for this user
    const provider = await ctx.db
      .query("providers")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!provider) return [];

    let quotesQuery = ctx.db
      .query("quotes")
      .withIndex("by_provider", (q) => q.eq("providerId", provider._id));

    const quotes = await quotesQuery.collect();

    const filtered =
      args.status ? quotes.filter((q) => q.status === args.status) : quotes;

    // Join with service request data for the dashboard
    const enriched = await Promise.all(
      filtered.map(async (quote) => {
        const request = await ctx.db.get(quote.serviceRequestId);
        return { ...quote, serviceRequest: request };
      }),
    );

    return enriched;
  },
});
