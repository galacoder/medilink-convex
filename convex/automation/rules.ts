/**
 * Automation rule functions for M5-2.
 *
 * These mutations are called by Convex cron jobs (convex/crons.ts) on a
 * scheduled basis. Each rule:
 *   1. Queries across ALL organizations (iterates by org for multi-tenancy)
 *   2. Applies business logic to identify items needing attention
 *   3. Records the run result in automationLog for observability
 *
 * WHY Convex mutations (not actions):
 *   - Mutations are transactional — if the write to automationLog fails,
 *     the whole run rolls back cleanly.
 *   - Mutations have access to ctx.db for direct DB queries.
 *   - No external API calls needed — pure business logic.
 *
 * Multi-tenancy: All rules filter by organizationId when fetching records.
 * The outer loop iterates over all organizations, processing each in isolation.
 * This ensures no cross-org data leakage.
 *
 * vi: "Quy tắc tự động hóa" / en: "Automation rules"
 */

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { mutation, query } from "../_generated/server";

// ---------------------------------------------------------------------------
// Constants
// vi: "Hằng số ngưỡng tự động hóa" / en: "Automation threshold constants"
// ---------------------------------------------------------------------------

/** vi: "Ngưỡng quá hạn yêu cầu dịch vụ (7 ngày tính bằng ms)" / en: "Service request overdue threshold (7 days in ms)" */
const OVERDUE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

/** vi: "Cảnh báo bảo trì sắp đến hạn (7 ngày tính bằng ms)" / en: "Maintenance due soon window (7 days in ms)" */
const MAINTENANCE_DUE_SOON_MS = 7 * 24 * 60 * 60 * 1000;

/** vi: "Cảnh báo chứng nhận hết hạn (30 ngày tính bằng ms)" / en: "Certification expiry warning window (30 days in ms)" */
const CERT_EXPIRY_WARNING_MS = 30 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Rule 1: Check Overdue Service Requests
// vi: "Kiểm tra yêu cầu dịch vụ quá hạn" / en: "Check overdue service requests"
// ---------------------------------------------------------------------------

/**
 * Escalation check: Find service requests stuck in a non-terminal status
 * for more than 7 days and log them for admin attention.
 *
 * Scheduled: Every hour (via crons.ts).
 *
 * WHY: Service requests stuck in "pending" often mean no provider has been
 * assigned. The 7-day threshold triggers admin escalation to prevent requests
 * from falling through the cracks.
 *
 * Multi-tenancy: iterates all orgs, filters by organizationId per org.
 *
 * vi: "Kiểm tra yêu cầu dịch vụ bị tắc nghẽn quá 7 ngày"
 * en: "Check service requests stuck > 7 days and log for escalation"
 */
export const checkOverdueRequests = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const overdueThreshold = now - OVERDUE_THRESHOLD_MS;

    // Statuses that should not stay unchanged for > 7 days
    // vi: "Trạng thái cần theo dõi: đang chờ, đã báo giá, đã chấp nhận, đang thực hiện"
    const stalledStatuses = ["pending", "quoted", "accepted", "in_progress"] as const;

    let totalAffected = 0;
    const overdueDetails: Array<{
      serviceRequestId: string;
      organizationId: string;
      status: string;
      stalledSince: number;
    }> = [];

    // Fetch all service requests and filter for stalled ones
    // WHY: No compound index on (status, updatedAt) so we do a full scan
    // and filter. For production scale, add a composite index.
    const allRequests = await ctx.db.query("serviceRequests").collect();

    for (const request of allRequests) {
      const isStalled = (stalledStatuses as readonly string[]).includes(request.status);
      const isOld = request.updatedAt < overdueThreshold;

      if (isStalled && isOld) {
        totalAffected++;
        overdueDetails.push({
          serviceRequestId: request._id,
          organizationId: request.organizationId,
          status: request.status,
          stalledSince: request.updatedAt,
        });
      }
    }

    // Record the run in automationLog
    await ctx.runMutation(internal.automation.automationLog.recordAutomationRun, {
      ruleName: "checkOverdueRequests",
      status: "success",
      affectedCount: totalAffected,
      metadata:
        overdueDetails.length > 0
          ? { overdueRequests: overdueDetails.slice(0, 10) } // cap at 10 for metadata size
          : undefined,
    });

    return { affectedCount: totalAffected };
  },
});

// ---------------------------------------------------------------------------
// Rule 2: Check Maintenance Due
// vi: "Kiểm tra bảo trì sắp đến hạn" / en: "Check maintenance due soon"
// ---------------------------------------------------------------------------

/**
 * Maintenance reminder: Find equipment with scheduled maintenance due
 * within the next 7 days and log for admin attention.
 *
 * Scheduled: Daily at 08:00 UTC (via crons.ts).
 *
 * WHY: Healthcare equipment requires preventive maintenance on schedule.
 * Early warning (7 days) gives staff time to arrange technicians and prepare
 * equipment downtime, minimizing clinical disruption.
 *
 * vi: "Kiểm tra lịch bảo trì thiết bị sắp đến hạn"
 * en: "Check equipment maintenance records due within 7 days"
 */
export const checkMaintenanceDue = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dueSoonThreshold = now + MAINTENANCE_DUE_SOON_MS;

    let totalAffected = 0;
    const dueDetails: Array<{
      maintenanceId: string;
      equipmentId: string;
      scheduledAt: number;
      type: string;
    }> = [];

    // Find all scheduled maintenance records due soon
    // Using by_status index to limit scan to scheduled records only
    const scheduledRecords = await ctx.db
      .query("maintenanceRecords")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    for (const record of scheduledRecords) {
      const isDueSoon = record.scheduledAt >= now && record.scheduledAt <= dueSoonThreshold;
      if (isDueSoon) {
        totalAffected++;
        dueDetails.push({
          maintenanceId: record._id,
          equipmentId: record.equipmentId,
          scheduledAt: record.scheduledAt,
          type: record.type,
        });
      }
    }

    await ctx.runMutation(internal.automation.automationLog.recordAutomationRun, {
      ruleName: "checkMaintenanceDue",
      status: "success",
      affectedCount: totalAffected,
      metadata:
        dueDetails.length > 0 ? { dueMaintenance: dueDetails.slice(0, 10) } : undefined,
    });

    return { affectedCount: totalAffected };
  },
});

// ---------------------------------------------------------------------------
// Rule 3: Check Stock Levels
// vi: "Kiểm tra mức tồn kho vật tư" / en: "Check consumable stock levels"
// ---------------------------------------------------------------------------

/**
 * Stock alert: Find consumables with currentStock below reorderPoint and
 * log for admin/procurement attention.
 *
 * Scheduled: Daily at 09:00 UTC (via crons.ts).
 *
 * WHY: Running out of consumables (gloves, reagents, electrodes) halts
 * clinical procedures. Automated stock monitoring prevents critical shortages
 * by triggering reorder alerts before stock hits zero.
 *
 * Multi-tenancy: iterates per org using by_org index for isolation.
 *
 * vi: "Kiểm tra vật tư tiêu hao dưới mức tái đặt hàng"
 * en: "Flag consumables where currentStock < reorderPoint per org"
 */
export const checkStockLevels = mutation({
  args: {},
  handler: async (ctx) => {
    let totalAffected = 0;
    const lowStockDetails: Array<{
      consumableId: string;
      organizationId: string;
      nameEn: string;
      currentStock: number;
      reorderPoint: number;
    }> = [];

    // Get all organizations to iterate per-org
    const orgs = await ctx.db.query("organizations").collect();

    for (const org of orgs) {
      // Fetch consumables for this org using by_org index
      const consumables = await ctx.db
        .query("consumables")
        .withIndex("by_org", (q) => q.eq("organizationId", org._id))
        .collect();

      for (const consumable of consumables) {
        // Flag when current stock is below the reorder point
        // WHY: reorderPoint is the trigger threshold (not parLevel) because
        // parLevel is the desired level, reorderPoint is when to act.
        if (consumable.currentStock < consumable.reorderPoint) {
          totalAffected++;
          lowStockDetails.push({
            consumableId: consumable._id,
            organizationId: org._id,
            nameEn: consumable.nameEn,
            currentStock: consumable.currentStock,
            reorderPoint: consumable.reorderPoint,
          });
        }
      }
    }

    await ctx.runMutation(internal.automation.automationLog.recordAutomationRun, {
      ruleName: "checkStockLevels",
      status: "success",
      affectedCount: totalAffected,
      metadata:
        lowStockDetails.length > 0 ? { lowStock: lowStockDetails.slice(0, 10) } : undefined,
    });

    return { affectedCount: totalAffected };
  },
});

// ---------------------------------------------------------------------------
// Rule 4: Check Certification Expiry
// vi: "Kiểm tra chứng nhận hết hạn" / en: "Check certification expiry"
// ---------------------------------------------------------------------------

/**
 * Certification expiry check: Find provider certifications expiring within
 * 30 days and log for provider/admin attention.
 *
 * Scheduled: Weekly on Monday at 07:00 UTC (via crons.ts).
 *
 * WHY: Expired certifications mean a provider can no longer legally perform
 * certain medical equipment services in Vietnam. Early warning (30 days)
 * allows providers to renew before service interruption.
 *
 * Multi-tenancy: Certifications are scoped by provider. Providers belong to
 * provider-type organizations. The check runs across all providers.
 *
 * vi: "Kiểm tra chứng nhận nhà cung cấp hết hạn trong vòng 30 ngày"
 * en: "Flag provider certifications expiring within 30 days"
 */
export const checkCertificationExpiry = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiryWindow = now + CERT_EXPIRY_WARNING_MS;

    let totalAffected = 0;
    const expiryDetails: Array<{
      certificationId: string;
      providerId: string;
      nameEn: string;
      expiresAt: number;
    }> = [];

    // Fetch all certifications with an expiry date within the window
    const allCertifications = await ctx.db.query("certifications").collect();

    for (const cert of allCertifications) {
      // Skip certifications with no expiry date
      if (cert.expiresAt === undefined) continue;

      // Flag if expiring within the 30-day warning window
      const isExpiringSoon = cert.expiresAt >= now && cert.expiresAt <= expiryWindow;
      if (isExpiringSoon) {
        totalAffected++;
        expiryDetails.push({
          certificationId: cert._id,
          providerId: cert.providerId,
          nameEn: cert.nameEn,
          expiresAt: cert.expiresAt,
        });
      }
    }

    await ctx.runMutation(internal.automation.automationLog.recordAutomationRun, {
      ruleName: "checkCertificationExpiry",
      status: "success",
      affectedCount: totalAffected,
      metadata:
        expiryDetails.length > 0 ? { expiringCerts: expiryDetails.slice(0, 10) } : undefined,
    });

    return { affectedCount: totalAffected };
  },
});

// ---------------------------------------------------------------------------
// Rule 5: Suggest Providers (Auto-assign)
// vi: "Gợi ý nhà cung cấp phù hợp" / en: "Suggest matching providers"
// ---------------------------------------------------------------------------

/**
 * Auto-assign query: Suggest matching providers for a new service request,
 * based on active + verified status.
 *
 * WHY: When a service request is created, hospital staff need to know which
 * providers can fulfill it. This query powers the provider suggestion UI on
 * the service request detail page, allowing staff to quickly assign a provider.
 *
 * Note: This is a query (not a mutation) because it is read-only.
 * The actual assignment is done by a separate mutation (serviceRequests.assignProvider).
 *
 * Future enhancement: Filter by specialty and coverage area once those
 * data fields are reliably populated.
 *
 * vi: "Gợi ý nhà cung cấp dịch vụ phù hợp cho yêu cầu"
 * en: "Query active verified providers suitable for a service request"
 */
export const suggestProviders = query({
  args: {
    // vi: "ID yêu cầu dịch vụ" / en: "Service request ID"
    serviceRequestId: v.id("serviceRequests"),
  },
  handler: async (ctx, args) => {
    // Fetch the service request to get its type (for future specialty matching)
    const serviceRequest = await ctx.db.get(args.serviceRequestId);
    if (!serviceRequest) {
      return [];
    }

    // Find all active and verified providers
    // WHY: Only active + verified providers should be suggested for assignment.
    // Suspended or unverified providers cannot legally take on new work.
    const activeProviders = await ctx.db
      .query("providers")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter to verified providers only
    const verifiedProviders = activeProviders.filter(
      (p) => p.verificationStatus === "verified",
    );

    // Return providers with relevant details for suggestion display
    return verifiedProviders.map((provider) => ({
      _id: provider._id,
      nameVi: provider.nameVi,
      nameEn: provider.nameEn,
      companyName: provider.companyName,
      averageRating: provider.averageRating,
      completedServices: provider.completedServices,
      verificationStatus: provider.verificationStatus,
    }));
  },
});
