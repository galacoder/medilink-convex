/**
 * Main seed orchestrator
 * vi: "Bộ điều phối seed chính" / en: "Main seed orchestrator"
 *
 * Exports a default action (entry point: npx convex run seed:default) that
 * calls internal mutations in strict dependency order:
 *   1. seedBaseEntities  — users, orgs, memberships
 *   2. seedEquipmentData — categories, equipment, QR codes
 *   3. seedProviderData  — provider profile, offerings, certifications, coverage
 *   4. seedConsumablesData — consumables
 *   5. seedServiceRequestData — service requests, quotes, maintenance record
 *
 * All internal mutations are idempotent: they skip insertion if the record
 * already exists (using helpers from seedHelpers.ts).
 */

import { v } from "convex/values";

import { components, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery } from "./_generated/server";
import {
  ALL_SEED_CONSUMABLES,
  ALL_SEED_EQUIPMENT,
  CATEGORY_DIAGNOSTIC,
  CATEGORY_MEDICAL_IT,
  CATEGORY_PATIENT_MONITORING,
  CATEGORY_SURGICAL,
} from "./seedData/equipment";
import { SPMET_HOSPITAL, TECHMED_PROVIDER } from "./seedData/organizations";
import {
  ALL_SEED_CERTIFICATIONS,
  ALL_SEED_COVERAGE_AREAS,
  ALL_SEED_OFFERINGS,
  ALL_SEED_QUOTES,
  ALL_SEED_SERVICE_REQUESTS,
  TECHMED_PROFILE,
} from "./seedData/serviceRequests";
// Seed data constants
import {
  HOSPITAL_OWNER,
  HOSPITAL_STAFF_1,
  HOSPITAL_STAFF_2,
  PLATFORM_ADMIN,
  PROVIDER_OWNER,
  PROVIDER_TECHNICIAN,
} from "./seedData/users";
// Idempotency helpers
import {
  findCategoryByName,
  findConsumableByName,
  findEquipmentBySerial,
  findMembership,
  findOrgBySlug,
  findProviderByOrg,
  findQrByCode,
  findUserByEmail,
} from "./seedHelpers";

// ---------------------------------------------------------------------------
// Return types for cross-mutation ID passing
// ---------------------------------------------------------------------------

interface BaseEntityIds {
  adminUserId: Id<"users">;
  hospitalOwnerUserId: Id<"users">;
  hospitalStaff1UserId: Id<"users">;
  hospitalStaff2UserId: Id<"users">;
  providerOwnerUserId: Id<"users">;
  providerTechUserId: Id<"users">;
  hospitalOrgId: Id<"organizations">;
  providerOrgId: Id<"organizations">;
}

interface EquipmentDataIds {
  categoryIdDiagnostic: Id<"equipmentCategories">;
  categoryIdPatientMonitoring: Id<"equipmentCategories">;
  categoryIdSurgical: Id<"equipmentCategories">;
  categoryIdMedicalIt: Id<"equipmentCategories">;
  equipmentIds: Id<"equipment">[];
  maintenanceEquipmentId: Id<"equipment">; // XRAY — will get overdue maintenance record
}

interface ProviderDataIds {
  providerId: Id<"providers">;
}

// ---------------------------------------------------------------------------
// Step 1: seedBaseEntities
// Creates: 6 users, 2 orgs, 5 memberships
// ---------------------------------------------------------------------------

export const seedBaseEntities = internalMutation({
  args: {},
  returns: v.object({
    adminUserId: v.id("users"),
    hospitalOwnerUserId: v.id("users"),
    hospitalStaff1UserId: v.id("users"),
    hospitalStaff2UserId: v.id("users"),
    providerOwnerUserId: v.id("users"),
    providerTechUserId: v.id("users"),
    hospitalOrgId: v.id("organizations"),
    providerOrgId: v.id("organizations"),
  }),
  handler: async (ctx): Promise<BaseEntityIds> => {
    const now = Date.now();

    // --- Platform admin user ---
    let adminUserId = await findUserByEmail(ctx, PLATFORM_ADMIN.email);
    if (adminUserId === null) {
      adminUserId = await ctx.db.insert("users", {
        name: PLATFORM_ADMIN.name,
        email: PLATFORM_ADMIN.email,
        platformRole: PLATFORM_ADMIN.platformRole,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created platform admin: ${PLATFORM_ADMIN.email}`);
    } else {
      console.log(
        `Skipping platform admin: already exists (${PLATFORM_ADMIN.email})`,
      );
    }

    // --- Hospital org ---
    let hospitalOrgId = await findOrgBySlug(ctx, SPMET_HOSPITAL.slug);
    if (hospitalOrgId === null) {
      hospitalOrgId = await ctx.db.insert("organizations", {
        name: SPMET_HOSPITAL.name,
        slug: SPMET_HOSPITAL.slug,
        org_type: SPMET_HOSPITAL.org_type,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created hospital org: ${SPMET_HOSPITAL.slug}`);
    } else {
      console.log(
        `Skipping hospital org: already exists (${SPMET_HOSPITAL.slug})`,
      );
    }

    // --- Provider org ---
    let providerOrgId = await findOrgBySlug(ctx, TECHMED_PROVIDER.slug);
    if (providerOrgId === null) {
      providerOrgId = await ctx.db.insert("organizations", {
        name: TECHMED_PROVIDER.name,
        slug: TECHMED_PROVIDER.slug,
        org_type: TECHMED_PROVIDER.org_type,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created provider org: ${TECHMED_PROVIDER.slug}`);
    } else {
      console.log(
        `Skipping provider org: already exists (${TECHMED_PROVIDER.slug})`,
      );
    }

    // --- Hospital owner ---
    let hospitalOwnerUserId = await findUserByEmail(ctx, HOSPITAL_OWNER.email);
    if (hospitalOwnerUserId === null) {
      hospitalOwnerUserId = await ctx.db.insert("users", {
        name: HOSPITAL_OWNER.name,
        email: HOSPITAL_OWNER.email,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created hospital owner: ${HOSPITAL_OWNER.email}`);
    } else {
      console.log(
        `Skipping hospital owner: already exists (${HOSPITAL_OWNER.email})`,
      );
    }
    // Hospital owner membership
    const hospitalOwnerMembership = await findMembership(
      ctx,
      hospitalOrgId,
      hospitalOwnerUserId,
    );
    if (hospitalOwnerMembership === null) {
      await ctx.db.insert("organizationMemberships", {
        orgId: hospitalOrgId,
        userId: hospitalOwnerUserId,
        role: "owner",
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created hospital owner membership: ${HOSPITAL_OWNER.email}`);
    } else {
      console.log(`Skipping hospital owner membership: already exists`);
    }

    // --- Hospital staff 1 ---
    let hospitalStaff1UserId = await findUserByEmail(
      ctx,
      HOSPITAL_STAFF_1.email,
    );
    if (hospitalStaff1UserId === null) {
      hospitalStaff1UserId = await ctx.db.insert("users", {
        name: HOSPITAL_STAFF_1.name,
        email: HOSPITAL_STAFF_1.email,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created hospital staff 1: ${HOSPITAL_STAFF_1.email}`);
    } else {
      console.log(
        `Skipping hospital staff 1: already exists (${HOSPITAL_STAFF_1.email})`,
      );
    }
    const staff1Membership = await findMembership(
      ctx,
      hospitalOrgId,
      hospitalStaff1UserId,
    );
    if (staff1Membership === null) {
      await ctx.db.insert("organizationMemberships", {
        orgId: hospitalOrgId,
        userId: hospitalStaff1UserId,
        role: "member",
        createdAt: now,
        updatedAt: now,
      });
      console.log(
        `Created hospital staff 1 membership: ${HOSPITAL_STAFF_1.email}`,
      );
    } else {
      console.log(`Skipping hospital staff 1 membership: already exists`);
    }

    // --- Hospital staff 2 ---
    let hospitalStaff2UserId = await findUserByEmail(
      ctx,
      HOSPITAL_STAFF_2.email,
    );
    if (hospitalStaff2UserId === null) {
      hospitalStaff2UserId = await ctx.db.insert("users", {
        name: HOSPITAL_STAFF_2.name,
        email: HOSPITAL_STAFF_2.email,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created hospital staff 2: ${HOSPITAL_STAFF_2.email}`);
    } else {
      console.log(
        `Skipping hospital staff 2: already exists (${HOSPITAL_STAFF_2.email})`,
      );
    }
    const staff2Membership = await findMembership(
      ctx,
      hospitalOrgId,
      hospitalStaff2UserId,
    );
    if (staff2Membership === null) {
      await ctx.db.insert("organizationMemberships", {
        orgId: hospitalOrgId,
        userId: hospitalStaff2UserId,
        role: "member",
        createdAt: now,
        updatedAt: now,
      });
      console.log(
        `Created hospital staff 2 membership: ${HOSPITAL_STAFF_2.email}`,
      );
    } else {
      console.log(`Skipping hospital staff 2 membership: already exists`);
    }

    // --- Provider owner ---
    let providerOwnerUserId = await findUserByEmail(ctx, PROVIDER_OWNER.email);
    if (providerOwnerUserId === null) {
      providerOwnerUserId = await ctx.db.insert("users", {
        name: PROVIDER_OWNER.name,
        email: PROVIDER_OWNER.email,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created provider owner: ${PROVIDER_OWNER.email}`);
    } else {
      console.log(
        `Skipping provider owner: already exists (${PROVIDER_OWNER.email})`,
      );
    }
    const providerOwnerMembership = await findMembership(
      ctx,
      providerOrgId,
      providerOwnerUserId,
    );
    if (providerOwnerMembership === null) {
      await ctx.db.insert("organizationMemberships", {
        orgId: providerOrgId,
        userId: providerOwnerUserId,
        role: "owner",
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created provider owner membership: ${PROVIDER_OWNER.email}`);
    } else {
      console.log(`Skipping provider owner membership: already exists`);
    }

    // --- Provider technician ---
    let providerTechUserId = await findUserByEmail(
      ctx,
      PROVIDER_TECHNICIAN.email,
    );
    if (providerTechUserId === null) {
      providerTechUserId = await ctx.db.insert("users", {
        name: PROVIDER_TECHNICIAN.name,
        email: PROVIDER_TECHNICIAN.email,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created provider technician: ${PROVIDER_TECHNICIAN.email}`);
    } else {
      console.log(
        `Skipping provider technician: already exists (${PROVIDER_TECHNICIAN.email})`,
      );
    }
    const providerTechMembership = await findMembership(
      ctx,
      providerOrgId,
      providerTechUserId,
    );
    if (providerTechMembership === null) {
      await ctx.db.insert("organizationMemberships", {
        orgId: providerOrgId,
        userId: providerTechUserId,
        role: "member",
        createdAt: now,
        updatedAt: now,
      });
      console.log(
        `Created provider technician membership: ${PROVIDER_TECHNICIAN.email}`,
      );
    } else {
      console.log(`Skipping provider technician membership: already exists`);
    }

    return {
      adminUserId,
      hospitalOwnerUserId,
      hospitalStaff1UserId,
      hospitalStaff2UserId,
      providerOwnerUserId,
      providerTechUserId,
      hospitalOrgId,
      providerOrgId,
    };
  },
});

// ---------------------------------------------------------------------------
// Step 2: seedEquipmentData
// Creates: 4 categories, 12 equipment, 12 QR codes, 1 maintenance record
// ---------------------------------------------------------------------------

export const seedEquipmentData = internalMutation({
  args: {
    hospitalOrgId: v.id("organizations"),
    adminUserId: v.id("users"),
    hospitalOwnerUserId: v.id("users"),
  },
  returns: v.object({
    categoryIdDiagnostic: v.id("equipmentCategories"),
    categoryIdPatientMonitoring: v.id("equipmentCategories"),
    categoryIdSurgical: v.id("equipmentCategories"),
    categoryIdMedicalIt: v.id("equipmentCategories"),
    equipmentIds: v.array(v.id("equipment")),
    maintenanceEquipmentId: v.id("equipment"),
  }),
  handler: async (
    ctx,
    { hospitalOrgId, adminUserId, hospitalOwnerUserId },
  ): Promise<{
    categoryIdDiagnostic: Id<"equipmentCategories">;
    categoryIdPatientMonitoring: Id<"equipmentCategories">;
    categoryIdSurgical: Id<"equipmentCategories">;
    categoryIdMedicalIt: Id<"equipmentCategories">;
    equipmentIds: Id<"equipment">[];
    maintenanceEquipmentId: Id<"equipment">;
  }> => {
    const now = Date.now();

    // --- Categories ---
    const seedCategories = [
      { key: "diagnostic" as const, data: CATEGORY_DIAGNOSTIC },
      { key: "patient_monitoring" as const, data: CATEGORY_PATIENT_MONITORING },
      { key: "surgical" as const, data: CATEGORY_SURGICAL },
      { key: "medical_it" as const, data: CATEGORY_MEDICAL_IT },
    ];

    const categoryIdMap = new Map<string, Id<"equipmentCategories">>();

    for (const { key, data } of seedCategories) {
      let catId = await findCategoryByName(ctx, hospitalOrgId, data.nameEn);
      if (catId === null) {
        catId = await ctx.db.insert("equipmentCategories", {
          nameVi: data.nameVi,
          nameEn: data.nameEn,
          descriptionVi: data.descriptionVi,
          descriptionEn: data.descriptionEn,
          organizationId: hospitalOrgId,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`Created category: ${data.nameEn}`);
      } else {
        console.log(`Skipping category: already exists (${data.nameEn})`);
      }
      categoryIdMap.set(key, catId);
    }

    const categoryIdDiagnostic = categoryIdMap.get("diagnostic")!;
    const categoryIdPatientMonitoring =
      categoryIdMap.get("patient_monitoring")!;
    const categoryIdSurgical = categoryIdMap.get("surgical")!;
    const categoryIdMedicalIt = categoryIdMap.get("medical_it")!;

    // --- Equipment items ---
    const equipmentIds: Id<"equipment">[] = [];
    let maintenanceEquipmentId: Id<"equipment"> | null = null;

    for (const equip of ALL_SEED_EQUIPMENT) {
      // Resolve category
      const catId = categoryIdMap.get(equip.categoryKey)!;

      let equipId = await findEquipmentBySerial(
        ctx,
        hospitalOrgId,
        equip.serialNumber,
      );
      if (equipId === null) {
        equipId = await ctx.db.insert("equipment", {
          nameVi: equip.nameVi,
          nameEn: equip.nameEn,
          descriptionVi: equip.descriptionVi,
          descriptionEn: equip.descriptionEn,
          categoryId: catId,
          organizationId: hospitalOrgId,
          status: equip.status,
          condition: equip.condition,
          criticality: equip.criticality,
          serialNumber: equip.serialNumber,
          model: equip.model,
          manufacturer: equip.manufacturer,
          location: equip.location,
          purchaseDate: equip.purchaseDate,
          warrantyExpiryDate: equip.warrantyExpiryDate,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`Created equipment: ${equip.nameEn} (${equip.status})`);
      } else {
        console.log(
          `Skipping equipment: already exists (${equip.serialNumber})`,
        );
      }

      equipmentIds.push(equipId);

      // Track the X-Ray machine for the overdue maintenance record
      if (equip.serialNumber === "SN-XR-001") {
        maintenanceEquipmentId = equipId;
      }

      // --- QR code for this equipment ---
      const qrCode = `MEDILINK-${equip.serialNumber}`;
      const existingQr = await findQrByCode(ctx, qrCode);
      if (existingQr === null) {
        await ctx.db.insert("qrCodes", {
          equipmentId: equipId,
          organizationId: hospitalOrgId,
          code: qrCode,
          isActive: equip.status !== "retired",
          createdBy: adminUserId,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`Created QR code: ${qrCode}`);
      } else {
        console.log(`Skipping QR code: already exists (${qrCode})`);
      }
    }

    // --- Overdue maintenance record for X-Ray machine ---
    // WHY: Demonstrates equipment in maintenance status with an overdue record,
    // covering the edge case of maintenance workflows that have gone past due date.
    if (maintenanceEquipmentId !== null) {
      // Check if this equipment already has a maintenance record to maintain idempotency
      const existingMaintenance = await ctx.db
        .query("maintenanceRecords")
        .withIndex("by_equipment", (q) =>
          q.eq("equipmentId", maintenanceEquipmentId!),
        )
        .filter((q) => q.eq(q.field("status"), "overdue"))
        .first();

      if (existingMaintenance === null) {
        const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
        await ctx.db.insert("maintenanceRecords", {
          equipmentId: maintenanceEquipmentId,
          type: "preventive",
          status: "overdue",
          recurringPattern: "monthly",
          scheduledAt: twoWeeksAgo,
          technicianId: hospitalOwnerUserId,
          technicianNotes:
            "Kiểm tra và bảo trì định kỳ máy X-quang — Đã quá hạn / Scheduled X-ray machine maintenance — Overdue",
          createdAt: twoWeeksAgo,
          updatedAt: now,
        });
        console.log(`Created overdue maintenance record for X-Ray machine`);
      } else {
        console.log(`Skipping overdue maintenance record: already exists`);
      }
    }

    // Use categoryIdMedicalIt to avoid unused variable lint error
    // (it's included in return for future use)
    void categoryIdMedicalIt;

    return {
      categoryIdDiagnostic,
      categoryIdPatientMonitoring,
      categoryIdSurgical,
      categoryIdMedicalIt,
      equipmentIds,
      maintenanceEquipmentId: maintenanceEquipmentId!,
    };
  },
});

// ---------------------------------------------------------------------------
// Step 3: seedProviderData
// Creates: provider record, 3 offerings, 2 certifications, 2 coverage areas
// ---------------------------------------------------------------------------

export const seedProviderData = internalMutation({
  args: {
    providerOrgId: v.id("organizations"),
    providerOwnerUserId: v.id("users"),
  },
  returns: v.object({
    providerId: v.id("providers"),
  }),
  handler: async (
    ctx,
    { providerOrgId, providerOwnerUserId },
  ): Promise<ProviderDataIds> => {
    const now = Date.now();

    // --- Provider profile ---
    let providerId = await findProviderByOrg(ctx, providerOrgId);
    if (providerId === null) {
      providerId = await ctx.db.insert("providers", {
        organizationId: providerOrgId,
        nameVi: TECHMED_PROFILE.nameVi,
        nameEn: TECHMED_PROFILE.nameEn,
        companyName: TECHMED_PROFILE.companyName,
        descriptionVi: TECHMED_PROFILE.descriptionVi,
        descriptionEn: TECHMED_PROFILE.descriptionEn,
        status: TECHMED_PROFILE.status,
        verificationStatus: TECHMED_PROFILE.verificationStatus,
        contactEmail: TECHMED_PROFILE.contactEmail,
        contactPhone: TECHMED_PROFILE.contactPhone,
        address: TECHMED_PROFILE.address,
        averageRating: TECHMED_PROFILE.averageRating,
        totalRatings: TECHMED_PROFILE.totalRatings,
        completedServices: TECHMED_PROFILE.completedServices,
        userId: providerOwnerUserId,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created provider profile: ${TECHMED_PROFILE.nameEn}`);
    } else {
      console.log(
        `Skipping provider profile: already exists (${TECHMED_PROFILE.nameEn})`,
      );
    }

    // --- Service offerings ---
    for (const offering of ALL_SEED_OFFERINGS) {
      // Check by specialty within this provider
      const existingOffering = await ctx.db
        .query("serviceOfferings")
        .withIndex("by_provider", (q) => q.eq("providerId", providerId!))
        .filter((q) => q.eq(q.field("specialty"), offering.specialty))
        .first();

      if (existingOffering === null) {
        await ctx.db.insert("serviceOfferings", {
          providerId: providerId!,
          specialty: offering.specialty,
          descriptionVi: offering.descriptionVi,
          descriptionEn: offering.descriptionEn,
          priceEstimate: offering.priceEstimate,
          turnaroundDays: offering.turnaroundDays,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`Created service offering: ${offering.specialty}`);
      } else {
        console.log(
          `Skipping service offering: already exists (${offering.specialty})`,
        );
      }
    }

    // --- Certifications ---
    for (const cert of ALL_SEED_CERTIFICATIONS) {
      const existingCert = await ctx.db
        .query("certifications")
        .withIndex("by_provider", (q) => q.eq("providerId", providerId!))
        .filter((q) => q.eq(q.field("nameEn"), cert.nameEn))
        .first();

      if (existingCert === null) {
        await ctx.db.insert("certifications", {
          providerId: providerId!,
          nameVi: cert.nameVi,
          nameEn: cert.nameEn,
          issuingBody: cert.issuingBody,
          issuedAt: cert.issuedAt,
          expiresAt: cert.expiresAt,
          documentUrl: cert.documentUrl,
          createdAt: now,
          updatedAt: now,
        });
        const expiredLabel =
          cert.expiresAt && cert.expiresAt < now ? " (EXPIRED)" : " (valid)";
        console.log(`Created certification: ${cert.nameEn}${expiredLabel}`);
      } else {
        console.log(`Skipping certification: already exists (${cert.nameEn})`);
      }
    }

    // --- Coverage areas ---
    for (const area of ALL_SEED_COVERAGE_AREAS) {
      const existingArea = await ctx.db
        .query("coverageAreas")
        .withIndex("by_provider", (q) => q.eq("providerId", providerId!))
        .filter((q) => q.eq(q.field("region"), area.region))
        .first();

      if (existingArea === null) {
        await ctx.db.insert("coverageAreas", {
          providerId: providerId!,
          region: area.region,
          district: area.district,
          isActive: area.isActive,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`Created coverage area: ${area.region}`);
      } else {
        console.log(`Skipping coverage area: already exists (${area.region})`);
      }
    }

    return { providerId: providerId! };
  },
});

// ---------------------------------------------------------------------------
// Step 4: seedConsumablesData
// Creates: 3 consumables with stock levels
// ---------------------------------------------------------------------------

export const seedConsumablesData = internalMutation({
  args: {
    hospitalOrgId: v.id("organizations"),
  },
  returns: v.object({
    consumableIds: v.array(v.id("consumables")),
  }),
  handler: async (
    ctx,
    { hospitalOrgId },
  ): Promise<{ consumableIds: Id<"consumables">[] }> => {
    const now = Date.now();
    const consumableIds: Id<"consumables">[] = [];

    for (const consumable of ALL_SEED_CONSUMABLES) {
      let consumableId = await findConsumableByName(
        ctx,
        hospitalOrgId,
        consumable.nameEn,
      );
      if (consumableId === null) {
        consumableId = await ctx.db.insert("consumables", {
          organizationId: hospitalOrgId,
          nameVi: consumable.nameVi,
          nameEn: consumable.nameEn,
          descriptionVi: consumable.descriptionVi,
          descriptionEn: consumable.descriptionEn,
          sku: consumable.sku,
          manufacturer: consumable.manufacturer,
          unitOfMeasure: consumable.unitOfMeasure,
          categoryType: consumable.categoryType,
          currentStock: consumable.currentStock,
          parLevel: consumable.parLevel,
          maxLevel: consumable.maxLevel,
          reorderPoint: consumable.reorderPoint,
          unitCost: consumable.unitCost,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`Created consumable: ${consumable.nameEn}`);
      } else {
        console.log(
          `Skipping consumable: already exists (${consumable.nameEn})`,
        );
      }
      consumableIds.push(consumableId);
    }

    return { consumableIds };
  },
});

// ---------------------------------------------------------------------------
// Step 5: seedServiceRequestData
// Creates: 6 service requests, 4 quotes, 1 dispute
// ---------------------------------------------------------------------------

export const seedServiceRequestData = internalMutation({
  args: {
    hospitalOrgId: v.id("organizations"),
    hospitalOwnerUserId: v.id("users"),
    hospitalStaff1UserId: v.id("users"),
    hospitalStaff2UserId: v.id("users"),
    providerId: v.id("providers"),
    equipmentIds: v.array(v.id("equipment")),
  },
  returns: v.object({
    requestIds: v.array(v.id("serviceRequests")),
    quoteIds: v.array(v.id("quotes")),
  }),
  handler: async (
    ctx,
    {
      hospitalOrgId,
      hospitalOwnerUserId,
      hospitalStaff1UserId,
      hospitalStaff2UserId,
      providerId,
      equipmentIds,
    },
  ): Promise<{
    requestIds: Id<"serviceRequests">[];
    quoteIds: Id<"quotes">[];
  }> => {
    const now = Date.now();

    // Map user keys to actual IDs
    const userKeyMap: Record<string, Id<"users">> = {
      hospital_owner: hospitalOwnerUserId,
      hospital_staff_1: hospitalStaff1UserId,
      hospital_staff_2: hospitalStaff2UserId,
    };

    // Map equipment keys to IDs by position in ALL_SEED_EQUIPMENT
    // Equipment order matches ALL_SEED_EQUIPMENT array in equipment.ts
    const equipmentKeyToIndex: Record<string, number> = {
      EQUIPMENT_ULTRASOUND: 0,
      EQUIPMENT_ECG: 1,
      EQUIPMENT_PULSE_OXIMETER: 2,
      EQUIPMENT_PATIENT_MONITOR: 3,
      EQUIPMENT_DEFIBRILLATOR: 4,
      EQUIPMENT_SURGICAL_LIGHT: 5,
      EQUIPMENT_INFUSION_PUMP: 6,
      EQUIPMENT_ENDOSCOPE: 7,
      EQUIPMENT_XRAY: 8,
      EQUIPMENT_AUTOCLAVE: 9,
      EQUIPMENT_VENTILATOR: 10,
      EQUIPMENT_OLD_ECG: 11,
    };

    const requestIds: Id<"serviceRequests">[] = [];
    const quoteIds: Id<"quotes">[] = [];

    // Insert service requests
    for (const request of ALL_SEED_SERVICE_REQUESTS) {
      const equipmentId =
        equipmentIds[equipmentKeyToIndex[request.equipmentKey]];
      const requestedBy = userKeyMap[request.requestedByKey];

      // Idempotency: check by equipment + org + status combination
      const existing = await ctx.db
        .query("serviceRequests")
        .withIndex("by_equipment", (q) => q.eq("equipmentId", equipmentId))
        .filter((q) =>
          q.and(
            q.eq(q.field("organizationId"), hospitalOrgId),
            q.eq(q.field("status"), request.status),
          ),
        )
        .first();

      if (existing === null) {
        const requestId = await ctx.db.insert("serviceRequests", {
          organizationId: hospitalOrgId,
          equipmentId,
          requestedBy,
          assignedProviderId: request.hasProvider ? providerId : undefined,
          type: request.type,
          status: request.status,
          priority: request.priority,
          descriptionVi: request.descriptionVi,
          descriptionEn: request.descriptionEn,
          scheduledAt: request.scheduledAt,
          completedAt: request.completedAt,
          createdAt: now - 30 * 24 * 60 * 60 * 1000, // Stagger creation times
          updatedAt: now,
        });
        console.log(
          `Created service request: ${request.status} — ${request.type} for ${request.equipmentKey}`,
        );
        requestIds.push(requestId);
      } else {
        console.log(
          `Skipping service request: already exists (${request.status}/${request.type})`,
        );
        requestIds.push(existing._id);
      }
    }

    // --- Disputed service request: create dispute record ---
    // WHY: The disputed request needs a corresponding dispute entry in the disputes table
    const disputedRequest = ALL_SEED_SERVICE_REQUESTS.find(
      (r) => r.status === "disputed",
    );
    if (disputedRequest !== null && disputedRequest !== undefined) {
      const disputedEquipmentId =
        equipmentIds[equipmentKeyToIndex[disputedRequest.equipmentKey]];
      const disputedRequestRecord = await ctx.db
        .query("serviceRequests")
        .withIndex("by_equipment", (q) =>
          q.eq("equipmentId", disputedEquipmentId),
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("organizationId"), hospitalOrgId),
            q.eq(q.field("status"), "disputed"),
          ),
        )
        .first();

      if (disputedRequestRecord !== null) {
        const existingDispute = await ctx.db
          .query("disputes")
          .withIndex("by_service_request", (q) =>
            q.eq("serviceRequestId", disputedRequestRecord._id),
          )
          .first();

        if (existingDispute === null) {
          await ctx.db.insert("disputes", {
            organizationId: hospitalOrgId,
            serviceRequestId: disputedRequestRecord._id,
            raisedBy: hospitalOwnerUserId,
            status: "open",
            type: "quality",
            descriptionVi:
              "Tranh chấp về chất lượng sửa chữa — Monitor theo dõi bệnh nhân vẫn gặp sự cố sau khi đã sửa chữa",
            descriptionEn:
              "Quality dispute — Patient monitor still malfunctions after repair was completed",
            createdAt: now - 7 * 24 * 60 * 60 * 1000,
            updatedAt: now,
          });
          console.log(`Created dispute record for disputed service request`);
        } else {
          console.log(`Skipping dispute record: already exists`);
        }
      }
    }

    // Insert quotes
    // Map quote service request keys to requestIds by position
    const requestKeyToIndex: Record<string, number> = {
      REQUEST_PENDING: 0,
      REQUEST_QUOTED: 1,
      REQUEST_ACCEPTED: 2,
      REQUEST_IN_PROGRESS: 3,
      REQUEST_COMPLETED: 4,
      REQUEST_DISPUTED: 5,
    };

    for (const quote of ALL_SEED_QUOTES) {
      const serviceRequestId =
        requestIds[requestKeyToIndex[quote.serviceRequestKey]];

      // Idempotency: check by service request + provider + status
      const existing = await ctx.db
        .query("quotes")
        .withIndex("by_service_request", (q) =>
          q.eq("serviceRequestId", serviceRequestId),
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("providerId"), providerId),
            q.eq(q.field("status"), quote.status),
          ),
        )
        .first();

      if (existing === null) {
        const quoteId = await ctx.db.insert("quotes", {
          serviceRequestId,
          providerId,
          status: quote.status,
          amount: quote.amount,
          currency: quote.currency,
          validUntil: quote.validUntil,
          notes: quote.notes,
          createdAt: now - 14 * 24 * 60 * 60 * 1000,
          updatedAt: now,
        });
        console.log(
          `Created quote: ${quote.status} for ${quote.serviceRequestKey}`,
        );
        quoteIds.push(quoteId);
      } else {
        console.log(
          `Skipping quote: already exists (${quote.status}/${quote.serviceRequestKey})`,
        );
        quoteIds.push(existing._id);
      }
    }

    return { requestIds, quoteIds };
  },
});

// ---------------------------------------------------------------------------
// seedAuthAccounts: Cleans up stale Better Auth records for all seeded users.
// Entry point: npx convex run seed:seedAuthAccounts
//
// WHY: Run this BEFORE the local sign-up script to remove stale BA accounts
// that would block re-registration (especially admin@medilink.vn which may have
// a leftover BA account from a previous session).
//
// STEP 1 (this action): npx convex run seed:seedAuthAccounts
// STEP 2 (local script): bash scripts/seed-auth-accounts.sh
//
// NOTE: The HTTP sign-up must run locally (not from Convex cloud) because
// Convex cloud cannot reach localhost:3002. Run the companion shell script
// from your local machine after this action completes.
// ---------------------------------------------------------------------------

export const seedAuthAccounts = action({
  args: {},
  handler: async (ctx): Promise<{ email: string; status: string }[]> => {
    const SEED_EMAILS = [
      "admin@medilink.vn",
      "lan.tran@spmet.edu.vn",
      "duc.pham@spmet.edu.vn",
      "mai.vo@spmet.edu.vn",
      "minh.le@techmed.vn",
      "anh.hoang@techmed.vn",
    ];

    const results: { email: string; status: string }[] = [];

    for (const email of SEED_EMAILS) {
      // Find and delete existing BA user record (if any) so sign-up always works.
      // WHY: admin@medilink.vn may have a stale BA account from a previous session.
      // findOne is used (not findMany) to avoid pagination complexity.
      const existingUser = (await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: "user",
          where: [{ field: "email", operator: "eq", value: email }],
        },
      )) as { _id: string } | null;

      if (existingUser !== null) {
        const baUserId = existingUser._id;
        // Delete credential account records (contain hashed password)
        await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
          input: {
            model: "account",
            where: [{ field: "userId", operator: "eq", value: baUserId }],
          },
          paginationOpts: { cursor: null, numItems: 100 },
        });
        // Delete active sessions
        await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
          input: {
            model: "session",
            where: [{ field: "userId", operator: "eq", value: baUserId }],
          },
          paginationOpts: { cursor: null, numItems: 100 },
        });
        // Delete the BA user record itself
        await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
          input: {
            model: "user",
            where: [{ field: "email", operator: "eq", value: email }],
          },
          paginationOpts: { cursor: null, numItems: 10 },
        });
        console.log(`Cleaned BA record for: ${email}`);
        results.push({ email, status: "cleaned" });
      } else {
        console.log(`No BA record found for: ${email}`);
        results.push({ email, status: "not_found" });
      }
    }

    console.log("\nNext step: run 'bash scripts/seed-auth-accounts.sh'");
    console.log("to register credentials via http://localhost:3002");
    console.log(
      "Then run: npx convex run seed:seedOrgContext to set active org on each user",
    );
    return results;
  },
});

// ---------------------------------------------------------------------------
// seedOrgContext: Sets activeOrganizationId + activeOrgType on each org user's
// Better Auth record so the Convex JWT includes org context.
//
// WHY: seed-auth-accounts.sh creates Better Auth credentials via sign-up, but
// sign-up doesn't set activeOrganizationId/activeOrgType (those fields are set
// when a user creates or joins an org via the UI). For seeded users we must
// update these fields manually after sign-up so queries that call requireOrgAuth
// receive a JWT with organizationId.
//
// Entry point: npx convex run seed:seedOrgContext
// Run AFTER: bash scripts/seed-auth-accounts.sh
// ---------------------------------------------------------------------------

export const seedOrgContext = action({
  args: {},
  handler: async (ctx): Promise<{ email: string; status: string }[]> => {
    // Resolve org IDs from organizations table
    const hospitalOrg = await ctx.runQuery(
      internal.seed.findOrgBySlugInternal,
      { slug: "spmet-hospital" },
    ) as { _id: string; org_type: string } | null;

    const providerOrg = await ctx.runQuery(
      internal.seed.findOrgBySlugInternal,
      { slug: "techmed-services" },
    ) as { _id: string; org_type: string } | null;

    if (!hospitalOrg || !providerOrg) {
      throw new Error(
        "Seed orgs not found. Run `npx convex run seed:default` first.",
      );
    }

    // Map: email → { activeOrganizationId, activeOrgType }
    const orgUserMap: Record<string, { orgId: string; orgType: string }> = {
      "lan.tran@spmet.edu.vn": {
        orgId: hospitalOrg._id,
        orgType: "hospital",
      },
      "duc.pham@spmet.edu.vn": {
        orgId: hospitalOrg._id,
        orgType: "hospital",
      },
      "mai.vo@spmet.edu.vn": { orgId: hospitalOrg._id, orgType: "hospital" },
      "minh.le@techmed.vn": { orgId: providerOrg._id, orgType: "provider" },
      "anh.hoang@techmed.vn": { orgId: providerOrg._id, orgType: "provider" },
    };

    const results: { email: string; status: string }[] = [];

    for (const [email, { orgId, orgType }] of Object.entries(orgUserMap)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ctx.runMutation(components.betterAuth.adapter.updateMany, {
          input: {
            model: "user",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            update: {
              activeOrganizationId: orgId,
              activeOrgType: orgType,
            } as any,
            where: [{ field: "email", operator: "eq", value: email }],
          },
          paginationOpts: { cursor: null, numItems: 1 },
        } as any);
        console.log(`Set org context for ${email}: orgId=${orgId} type=${orgType}`);
        results.push({ email, status: `ok (${orgType})` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Failed to set org context for ${email}: ${msg}`);
        results.push({ email, status: `error: ${msg}` });
      }
    }

    return results;
  },
});

// Internal query helper for seedOrgContext to find an org by slug.
export const findOrgBySlugInternal = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first();
  },
});

// ---------------------------------------------------------------------------
// Step 6: Default action — orchestrates all internal mutations
// Entry point: npx convex run seed:default
// ---------------------------------------------------------------------------

export default action({
  args: {},
  handler: async (ctx): Promise<void> => {
    console.log("=".repeat(60));
    console.log("MediLink Seed Script — Starting");
    console.log("vi: Bắt đầu khởi tạo dữ liệu mẫu MediLink");
    console.log("=".repeat(60));

    // Step 1: Base entities (users, orgs, memberships)
    console.log(
      "\n[1/5] Seeding base entities (users, organizations, memberships)...",
    );
    const baseIds = (await ctx.runMutation(
      internal.seed.seedBaseEntities,
      {},
    )) as BaseEntityIds;
    console.log(`  ✓ Users: 6 | Orgs: 2 | Memberships: 5`);

    // Step 2: Equipment data (categories, equipment, QR codes)
    console.log(
      "\n[2/5] Seeding equipment data (categories, equipment, QR codes)...",
    );
    const equipmentData = (await ctx.runMutation(
      internal.seed.seedEquipmentData,
      {
        hospitalOrgId: baseIds.hospitalOrgId,
        adminUserId: baseIds.adminUserId,
        hospitalOwnerUserId: baseIds.hospitalOwnerUserId,
      },
    )) as EquipmentDataIds;
    console.log(
      `  ✓ Categories: 4 | Equipment: ${equipmentData.equipmentIds.length} | QR codes: ${equipmentData.equipmentIds.length}`,
    );

    // Step 3: Provider data (profile, offerings, certifications, coverage)
    console.log(
      "\n[3/5] Seeding provider data (profile, offerings, certifications, coverage areas)...",
    );
    const providerData = (await ctx.runMutation(
      internal.seed.seedProviderData,
      {
        providerOrgId: baseIds.providerOrgId,
        providerOwnerUserId: baseIds.providerOwnerUserId,
      },
    )) as ProviderDataIds;
    console.log(
      `  ✓ Provider: 1 | Offerings: 3 | Certifications: 2 | Coverage areas: 2`,
    );

    // Step 4: Consumables
    console.log("\n[4/5] Seeding consumables...");
    await ctx.runMutation(internal.seed.seedConsumablesData, {
      hospitalOrgId: baseIds.hospitalOrgId,
    });
    console.log(`  ✓ Consumables: 3`);

    // Step 5: Service requests and quotes
    console.log("\n[5/5] Seeding service requests and quotes...");
    const serviceData = (await ctx.runMutation(
      internal.seed.seedServiceRequestData,
      {
        hospitalOrgId: baseIds.hospitalOrgId,
        hospitalOwnerUserId: baseIds.hospitalOwnerUserId,
        hospitalStaff1UserId: baseIds.hospitalStaff1UserId,
        hospitalStaff2UserId: baseIds.hospitalStaff2UserId,
        providerId: providerData.providerId,
        equipmentIds: equipmentData.equipmentIds,
      },
    )) as { requestIds: Id<"serviceRequests">[]; quoteIds: Id<"quotes">[] };
    console.log(
      `  ✓ Service requests: ${serviceData.requestIds.length} | Quotes: ${serviceData.quoteIds.length}`,
    );

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("MediLink Seed Script — Complete");
    console.log("vi: Hoàn thành khởi tạo dữ liệu mẫu MediLink");
    console.log("=".repeat(60));
    console.log("\nSeed Summary:");
    console.log("  Organizations : 2 (SPMET Hospital + TechMed Provider)");
    console.log("  Users         : 6 (1 admin + 3 hospital + 2 provider)");
    console.log(
      "  Memberships   : 5 (1 owner + 2 member + 1 owner + 1 member)",
    );
    console.log("  Categories    : 4 equipment categories");
    console.log(
      "  Equipment     : 12 items (6 available, 2 in_use, 2 maintenance, 1 damaged, 1 retired)",
    );
    console.log("  QR Codes      : 12 (1 per equipment)");
    console.log("  Maintenance   : 1 overdue record (X-Ray machine)");
    console.log("  Provider      : 1 profile (TechMed, verified)");
    console.log("  Offerings     : 3 (repair, calibration, preventive_maint)");
    console.log("  Certifications: 2 (1 valid ISO 13485 + 1 expired)");
    console.log("  Coverage areas: 2 (HCMC + Binh Duong)");
    console.log("  Consumables   : 3 (gloves, ECG electrodes, disinfectant)");
    console.log(
      "  Service reqs  : 6 (pending/quoted/accepted/in_progress/completed/disputed)",
    );
    console.log("  Quotes        : 4 (pending/accepted/rejected/expired)");
    console.log("  Dispute       : 1 (quality dispute on disputed request)");
    console.log("\nRun again safely — seed is idempotent.");
  },
});
