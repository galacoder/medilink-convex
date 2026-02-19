/**
 * Provider management: queries and mutations for provider profiles,
 * service offerings, certifications, coverage areas, and discovery.
 *
 * WHY: This is the first Convex functions file in the project.
 * It establishes the auth-check + audit-log pattern used by all subsequent milestones.
 *
 * vi: "Quản lý nhà cung cấp" / en: "Provider management"
 *
 * User story: As a provider_admin, I want to manage my organization's service
 * offerings, certifications, and coverage area so that hospitals can discover
 * my services and submit relevant service requests to my team.
 */

import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { createAuditLogEntry } from "./lib/auditLog";
import {
  getAuthenticatedUser,
  getProviderForOrg,
  requireOrgMembership,
  requireProviderOrg,
} from "./lib/auth";
import {
  findProvidersByRegion,
  findProvidersBySpecialty,
} from "./lib/providerSearch";

// ===========================================================================
// WAVE 1: Provider Queries (read-only)
// ===========================================================================

/**
 * Get the provider profile for the authenticated user's organization.
 *
 * WHY: Provider admins view their own profile to verify displayed information
 * before hospitals see it. Uses the by_org index for efficient lookup.
 *
 * vi: "Lấy hồ sơ nhà cung cấp" / en: "Get provider profile"
 */
export const getProfile = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Auth check: caller must be a member of this org
    await requireOrgMembership(ctx, args.organizationId);

    // Get provider by org index
    const provider = await getProviderForOrg(ctx, args.organizationId);

    if (!provider) {
      return null;
    }

    // Enrich with org data
    const org = await ctx.db.get(args.organizationId);

    return {
      ...provider,
      organization: org
        ? { _id: org._id, name: org.name, slug: org.slug }
        : null,
    };
  },
});

/**
 * List all service offerings for a given provider.
 *
 * WHY: Provider admins need to see their current offerings to add, edit,
 * or remove them. Uses the by_provider index for efficient lookup.
 *
 * vi: "Danh sách dịch vụ cung cấp" / en: "List service offerings"
 */
export const listServiceOfferings = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Auth check: caller must be a member of this org
    await requireOrgMembership(ctx, args.organizationId);

    const provider = await getProviderForOrg(ctx, args.organizationId);

    if (!provider) {
      return [];
    }

    return await ctx.db
      .query("serviceOfferings")
      .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
      .collect();
  },
});

/**
 * Get all certifications for a given provider.
 *
 * WHY: Provider admins and hospitals need to view certifications to verify
 * compliance qualifications. Uses the by_provider index for efficient lookup.
 *
 * vi: "Lấy chứng nhận nhà cung cấp" / en: "Get provider certifications"
 */
export const getCertifications = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Auth check: caller must be a member of this org
    await requireOrgMembership(ctx, args.organizationId);

    const provider = await getProviderForOrg(ctx, args.organizationId);

    if (!provider) {
      return [];
    }

    return await ctx.db
      .query("certifications")
      .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
      .collect();
  },
});

// ===========================================================================
// WAVE 2: Provider Mutations (write operations with RBAC + audit logging)
// ===========================================================================

/**
 * Update the provider profile for the authenticated user's organization.
 *
 * WHY: Provider admins need to keep their profile current so hospitals see
 * accurate contact info and descriptions. Restricted to owner/admin roles
 * to prevent members from modifying critical org-level data.
 *
 * vi: "Cập nhật hồ sơ nhà cung cấp" / en: "Update provider profile"
 */
export const updateProfile = mutation({
  args: {
    organizationId: v.id("organizations"),
    companyName: v.optional(v.string()),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId, ...profileFields } = args;

    // RBAC: only owner/admin can update the provider profile
    const { convexUser } = await requireOrgMembership(ctx, organizationId, [
      "owner",
      "admin",
    ]);

    // Verify this org is a provider org (not a hospital)
    await requireProviderOrg(ctx, organizationId);

    // Get existing provider record
    const provider = await getProviderForOrg(ctx, organizationId);

    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        // vi: "Không tìm thấy hồ sơ nhà cung cấp cho tổ chức này"
        // en: "Provider profile not found for this organization"
        message: "Provider profile not found",
      });
    }

    // Capture previous values for audit log
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(profileFields)) {
      if (value !== undefined) {
        previousValues[key] = (provider as Record<string, unknown>)[key];
        newValues[key] = value;
      }
    }

    const now = Date.now();

    // Patch only the provided fields
    await ctx.db.patch(provider._id, {
      ...profileFields,
      updatedAt: now,
    });

    // Compliance audit log
    await createAuditLogEntry(ctx, {
      organizationId,
      actorId: convexUser._id,
      action: "provider.profile_updated",
      resourceType: "providers",
      resourceId: provider._id,
      previousValues,
      newValues,
    });

    return provider._id;
  },
});

/**
 * Add a new service offering to the provider's profile.
 *
 * WHY: Providers grow their service portfolio over time. Adding offerings
 * makes them discoverable by hospitals searching for specific specialties.
 *
 * vi: "Thêm dịch vụ cung cấp" / en: "Add service offering"
 */
export const addServiceOffering = mutation({
  args: {
    organizationId: v.id("organizations"),
    specialty: v.union(
      v.literal("general_repair"),
      v.literal("calibration"),
      v.literal("installation"),
      v.literal("preventive_maint"),
      v.literal("electrical"),
      v.literal("software"),
      v.literal("diagnostics"),
      v.literal("training"),
      v.literal("other"),
    ),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    turnaroundDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizationId, ...offeringFields } = args;

    // RBAC: only owner/admin can add offerings
    const { convexUser } = await requireOrgMembership(ctx, organizationId, [
      "owner",
      "admin",
    ]);

    await requireProviderOrg(ctx, organizationId);

    const provider = await getProviderForOrg(ctx, organizationId);

    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        // vi: "Không tìm thấy hồ sơ nhà cung cấp"
        // en: "Provider profile not found"
        message: "Provider profile not found",
      });
    }

    const now = Date.now();

    const offeringId = await ctx.db.insert("serviceOfferings", {
      providerId: provider._id,
      ...offeringFields,
      createdAt: now,
      updatedAt: now,
    });

    await createAuditLogEntry(ctx, {
      organizationId,
      actorId: convexUser._id,
      action: "provider.offering_added",
      resourceType: "serviceOfferings",
      resourceId: offeringId,
      newValues: { providerId: provider._id, ...offeringFields },
    });

    return offeringId;
  },
});

/**
 * Update an existing service offering.
 *
 * WHY: Service details (pricing, description, turnaround) change over time.
 * Verifies offering ownership to prevent cross-provider data modification.
 *
 * vi: "Cập nhật dịch vụ cung cấp" / en: "Update service offering"
 */
export const updateServiceOffering = mutation({
  args: {
    organizationId: v.id("organizations"),
    offeringId: v.id("serviceOfferings"),
    specialty: v.optional(
      v.union(
        v.literal("general_repair"),
        v.literal("calibration"),
        v.literal("installation"),
        v.literal("preventive_maint"),
        v.literal("electrical"),
        v.literal("software"),
        v.literal("diagnostics"),
        v.literal("training"),
        v.literal("other"),
      ),
    ),
    descriptionVi: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    turnaroundDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizationId, offeringId, ...updateFields } = args;

    // RBAC: only owner/admin can update offerings
    const { convexUser } = await requireOrgMembership(ctx, organizationId, [
      "owner",
      "admin",
    ]);

    await requireProviderOrg(ctx, organizationId);

    // Verify offering exists
    const offering = await ctx.db.get(offeringId);

    if (!offering) {
      throw new ConvexError({
        code: "OFFERING_NOT_FOUND",
        // vi: "Không tìm thấy dịch vụ cung cấp"
        // en: "Service offering not found"
        message: "Service offering not found",
      });
    }

    // Verify ownership: offering must belong to this org's provider
    const provider = await getProviderForOrg(ctx, organizationId);

    if (!provider || offering.providerId !== provider._id) {
      throw new ConvexError({
        code: "CROSS_PROVIDER_ACCESS",
        // vi: "Bạn không có quyền chỉnh sửa dịch vụ này"
        // en: "You do not have permission to modify this service offering"
        message: "Service offering does not belong to your provider",
      });
    }

    const now = Date.now();

    // Capture previous/new values for non-undefined fields
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        previousValues[key] = (offering as Record<string, unknown>)[key];
        newValues[key] = value;
      }
    }

    await ctx.db.patch(offeringId, {
      ...updateFields,
      updatedAt: now,
    });

    await createAuditLogEntry(ctx, {
      organizationId,
      actorId: convexUser._id,
      action: "provider.offering_updated",
      resourceType: "serviceOfferings",
      resourceId: offeringId,
      previousValues,
      newValues,
    });

    return offeringId;
  },
});

/**
 * Remove a service offering from the provider's profile.
 *
 * WHY: Providers discontinue services. Removing them keeps discovery results
 * accurate so hospitals don't find providers for unavailable services.
 *
 * vi: "Xóa dịch vụ cung cấp" / en: "Remove service offering"
 */
export const removeServiceOffering = mutation({
  args: {
    organizationId: v.id("organizations"),
    offeringId: v.id("serviceOfferings"),
  },
  handler: async (ctx, args) => {
    const { organizationId, offeringId } = args;

    // RBAC: only owner/admin can remove offerings
    const { convexUser } = await requireOrgMembership(ctx, organizationId, [
      "owner",
      "admin",
    ]);

    await requireProviderOrg(ctx, organizationId);

    const offering = await ctx.db.get(offeringId);

    if (!offering) {
      throw new ConvexError({
        code: "OFFERING_NOT_FOUND",
        // vi: "Không tìm thấy dịch vụ cung cấp"
        // en: "Service offering not found"
        message: "Service offering not found",
      });
    }

    // Verify ownership
    const provider = await getProviderForOrg(ctx, organizationId);

    if (!provider || offering.providerId !== provider._id) {
      throw new ConvexError({
        code: "CROSS_PROVIDER_ACCESS",
        // vi: "Bạn không có quyền xóa dịch vụ này"
        // en: "You do not have permission to remove this service offering"
        message: "Service offering does not belong to your provider",
      });
    }

    // Log before deletion (capturing previous values)
    await createAuditLogEntry(ctx, {
      organizationId,
      actorId: convexUser._id,
      action: "provider.offering_removed",
      resourceType: "serviceOfferings",
      resourceId: offeringId,
      previousValues: {
        providerId: offering.providerId,
        specialty: offering.specialty,
        descriptionVi: offering.descriptionVi,
        descriptionEn: offering.descriptionEn,
        priceEstimate: offering.priceEstimate,
        turnaroundDays: offering.turnaroundDays,
      },
    });

    await ctx.db.delete(offeringId);

    return offeringId;
  },
});

/**
 * Add a certification to the provider's profile.
 *
 * WHY: Certifications are required for hospital trust and Vietnamese regulatory
 * compliance. Bilingual name fields ensure readability for both Vietnamese and
 * English-speaking staff.
 *
 * vi: "Thêm chứng nhận" / en: "Add certification"
 */
export const addCertification = mutation({
  args: {
    organizationId: v.id("organizations"),
    nameVi: v.string(),
    nameEn: v.string(),
    issuingBody: v.optional(v.string()),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId, ...certFields } = args;

    // RBAC: only owner/admin can add certifications
    const { convexUser } = await requireOrgMembership(ctx, organizationId, [
      "owner",
      "admin",
    ]);

    await requireProviderOrg(ctx, organizationId);

    const provider = await getProviderForOrg(ctx, organizationId);

    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        // vi: "Không tìm thấy hồ sơ nhà cung cấp"
        // en: "Provider profile not found"
        message: "Provider profile not found",
      });
    }

    const now = Date.now();

    const certId = await ctx.db.insert("certifications", {
      providerId: provider._id,
      ...certFields,
      createdAt: now,
      updatedAt: now,
    });

    await createAuditLogEntry(ctx, {
      organizationId,
      actorId: convexUser._id,
      action: "provider.certification_added",
      resourceType: "certifications",
      resourceId: certId,
      newValues: { providerId: provider._id, ...certFields },
    });

    return certId;
  },
});

/**
 * Replace the provider's coverage areas with a new set.
 *
 * WHY: Providers expand or contract their service geography. The batch replace
 * pattern (deactivate all + insert new) is simpler and safer than per-area diffs
 * because geographic data is managed as a complete set, not individual records.
 *
 * vi: "Cài đặt khu vực phủ sóng" / en: "Set coverage areas"
 */
export const setCoverageArea = mutation({
  args: {
    organizationId: v.id("organizations"),
    areas: v.array(
      v.object({
        region: v.string(),
        district: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { organizationId, areas } = args;

    // RBAC: only owner/admin can set coverage areas
    const { convexUser } = await requireOrgMembership(ctx, organizationId, [
      "owner",
      "admin",
    ]);

    await requireProviderOrg(ctx, organizationId);

    const provider = await getProviderForOrg(ctx, organizationId);

    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        // vi: "Không tìm thấy hồ sơ nhà cung cấp"
        // en: "Provider profile not found"
        message: "Provider profile not found",
      });
    }

    const now = Date.now();

    // Step 1: Deactivate all existing coverage areas
    const existingAreas = await ctx.db
      .query("coverageAreas")
      .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
      .collect();

    for (const area of existingAreas) {
      await ctx.db.patch(area._id, {
        isActive: false,
        updatedAt: now,
      });
    }

    // Step 2: Insert new active coverage areas
    const insertedIds: string[] = [];

    for (const area of areas) {
      const areaId = await ctx.db.insert("coverageAreas", {
        providerId: provider._id,
        region: area.region,
        district: area.district,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      insertedIds.push(areaId);
    }

    await createAuditLogEntry(ctx, {
      organizationId,
      actorId: convexUser._id,
      action: "provider.coverage_area_set",
      resourceType: "coverageAreas",
      resourceId: provider._id,
      previousValues: {
        deactivatedCount: existingAreas.length,
        deactivatedIds: existingAreas.map((a) => a._id),
      },
      newValues: {
        insertedCount: insertedIds.length,
        areas,
      },
    });

    return { deactivatedCount: existingAreas.length, insertedIds };
  },
});

// ===========================================================================
// WAVE 3: Hospital-Side Provider Discovery (cross-org queries)
// ===========================================================================

/**
 * Find verified providers offering a specific service specialty.
 *
 * WHY: Hospitals search for providers by the type of service needed
 * (e.g., "calibration" for calibrating diagnostic devices). Returns only
 * verified providers to ensure quality and compliance.
 *
 * Access: Any authenticated user (no org restriction — cross-org discovery).
 *
 * vi: "Tìm nhà cung cấp theo loại dịch vụ" / en: "Get providers by service type"
 */
export const getByServiceType = query({
  args: {
    specialty: v.union(
      v.literal("general_repair"),
      v.literal("calibration"),
      v.literal("installation"),
      v.literal("preventive_maint"),
      v.literal("electrical"),
      v.literal("software"),
      v.literal("diagnostics"),
      v.literal("training"),
      v.literal("other"),
    ),
  },
  handler: async (ctx, args) => {
    // Any authenticated user can search (hospitals looking for providers)
    await getAuthenticatedUser(ctx);

    return await findProvidersBySpecialty(ctx, args.specialty);
  },
});

/**
 * Find verified providers that cover a specific region/district.
 *
 * WHY: Hospitals need providers who can physically reach their location.
 * Coverage area matching enables geographic filtering for service requests.
 *
 * Access: Any authenticated user (no org restriction — cross-org discovery).
 *
 * vi: "Tìm nhà cung cấp theo khu vực" / en: "Get providers by coverage area"
 */
export const getByCoverageArea = query({
  args: {
    region: v.string(),
    district: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Any authenticated user can search (hospitals looking for providers)
    await getAuthenticatedUser(ctx);

    return await findProvidersByRegion(ctx, args.region, args.district);
  },
});
