/**
 * Convex mutations and queries for service ratings.
 *
 * Ratings are created by hospital users after a service request is completed.
 * They provide quality feedback for providers and update provider aggregate stats.
 *
 * Access control:
 *   - Only hospital org members who own the service request can rate it
 *   - Service request must be in "completed" status
 *   - Only one rating allowed per service request
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { createAuditEntry } from "./lib/auditLog";
import { requireOrgAuth } from "./lib/auth";

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates a service rating for a completed service request.
 *
 * Side effects (atomic within this mutation):
 *   1. Inserts the rating record
 *   2. Updates the provider's averageRating, totalRatings, completedServices
 *   3. Creates an audit log entry
 */
export const create = mutation({
  args: {
    serviceRequestId: v.id("serviceRequests"),
    // Overall rating (1-5 stars)
    rating: v.number(),
    // Optional bilingual comments
    commentVi: v.optional(v.string()),
    commentEn: v.optional(v.string()),
    // Optional sub-dimension ratings (1-5 each)
    serviceQuality: v.optional(v.number()),
    timeliness: v.optional(v.number()),
    professionalism: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const auth = await requireOrgAuth(ctx);

    // 2. Validate rating value (1-5 inclusive)
    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new ConvexError({
        message:
          "Điểm đánh giá phải là số nguyên từ 1 đến 5. (Rating must be an integer between 1 and 5.)",
        code: "INVALID_RATING_VALUE",
        provided: args.rating,
      });
    }

    // Validate sub-dimension ratings if provided
    for (const [key, value] of Object.entries({
      serviceQuality: args.serviceQuality,
      timeliness: args.timeliness,
      professionalism: args.professionalism,
    })) {
      if (
        value !== undefined &&
        (value < 1 || value > 5 || !Number.isInteger(value))
      ) {
        throw new ConvexError({
          message: `Điểm "${key}" phải là số nguyên từ 1 đến 5. (Sub-rating "${key}" must be an integer between 1 and 5.)`,
          code: "INVALID_RATING_VALUE",
          field: key,
          provided: value,
        });
      }
    }

    // 3. Load the service request
    const serviceRequest = await ctx.db.get(args.serviceRequestId);
    if (!serviceRequest) {
      throw new ConvexError({
        message: "Không tìm thấy yêu cầu dịch vụ. (Service request not found.)",
        code: "SERVICE_REQUEST_NOT_FOUND",
      });
    }

    // 4. Verify the caller's org owns this service request (hospital side)
    if (serviceRequest.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Bạn không có quyền đánh giá yêu cầu dịch vụ này. (You do not have permission to rate this service request.)",
        code: "FORBIDDEN",
      });
    }

    // 5. Verify the service request is completed
    if (serviceRequest.status !== "completed") {
      throw new ConvexError({
        message: `Chỉ có thể đánh giá yêu cầu dịch vụ đã hoàn thành (đang ở "${serviceRequest.status}"). (Can only rate completed service requests — current status: "${serviceRequest.status}".)`,
        code: "SERVICE_REQUEST_NOT_COMPLETED",
        currentStatus: serviceRequest.status,
      });
    }

    // 6. Verify the service request has an assigned provider
    if (!serviceRequest.assignedProviderId) {
      throw new ConvexError({
        message:
          "Yêu cầu dịch vụ này chưa có nhà cung cấp được chỉ định. (This service request has no assigned provider.)",
        code: "NO_ASSIGNED_PROVIDER",
      });
    }

    // 7. Check for duplicate rating
    const existingRating = await ctx.db
      .query("serviceRatings")
      .withIndex("by_service_request", (q) =>
        q.eq("serviceRequestId", args.serviceRequestId),
      )
      .first();

    if (existingRating) {
      throw new ConvexError({
        message:
          "Yêu cầu dịch vụ này đã được đánh giá trước đó. (This service request has already been rated.)",
        code: "DUPLICATE_RATING",
        existingRatingId: existingRating._id,
      });
    }

    // 8. Load the current user record for ratedBy
    const now = Date.now();

    // 9. Insert the rating
    const ratingId = await ctx.db.insert("serviceRatings", {
      serviceRequestId: args.serviceRequestId,
      providerId: serviceRequest.assignedProviderId,
      ratedBy: auth.userId as Id<"users">,
      rating: args.rating,
      commentVi: args.commentVi,
      commentEn: args.commentEn,
      serviceQuality: args.serviceQuality,
      timeliness: args.timeliness,
      professionalism: args.professionalism,
      createdAt: now,
      updatedAt: now,
    });

    // 10. Atomically update provider aggregate ratings
    //     Formula: newAvg = (oldAvg * oldCount + newRating) / (oldCount + 1)
    const provider = await ctx.db.get(serviceRequest.assignedProviderId);
    if (provider) {
      const oldCount = provider.totalRatings ?? 0;
      const oldAvg = provider.averageRating ?? 0;
      const newCount = oldCount + 1;
      // Compute new average, rounded to 2 decimal places
      const newAvg =
        Math.round(((oldAvg * oldCount + args.rating) / newCount) * 100) / 100;
      const completedServices = (provider.completedServices ?? 0) + 1;

      await ctx.db.patch(serviceRequest.assignedProviderId, {
        averageRating: newAvg,
        totalRatings: newCount,
        completedServices,
        updatedAt: now,
      });
    }

    // 11. Audit log
    await createAuditEntry(ctx, {
      organizationId: serviceRequest.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "serviceRating.created",
      resourceType: "serviceRatings",
      resourceId: ratingId,
      newValues: {
        serviceRequestId: args.serviceRequestId,
        providerId: serviceRequest.assignedProviderId,
        rating: args.rating,
      },
    });

    return ratingId;
  },
});
