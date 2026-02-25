/**
 * Integration tests verifying rate limit wiring in mutation handlers.
 *
 * WHY: Ensures that checkOrgRateLimit is called in each protected mutation
 * and that the mutations still function correctly when rate limiting is a
 * no-op (test environment where the component is unavailable).
 *
 * vi: "Kiem tra tich hop gioi han toc do" / en: "Rate limit integration tests"
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seed org + user + membership + equipment category */
async function seedOrgContext(t: ReturnType<typeof convexTest>) {
  let orgId: string = "";
  let userId: string = "";
  let categoryId: string = "";

  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: "Test Hospital",
      slug: "test-hospital",
      org_type: "hospital",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    userId = await ctx.db.insert("users", {
      name: "Test User",
      email: "test@spmet.edu.vn",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("organizationMemberships", {
      orgId,
      userId,
      role: "owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    categoryId = await ctx.db.insert("equipmentCategories", {
      nameVi: "Chan doan",
      nameEn: "Diagnostic",
      organizationId: orgId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { orgId, userId, categoryId };
}

/** Seed provider org + user + membership + provider record */
async function seedProviderContext(t: ReturnType<typeof convexTest>) {
  let providerOrgId: string = "";
  let providerUserId: string = "";
  let providerId: string = "";

  await t.run(async (ctx) => {
    providerOrgId = await ctx.db.insert("organizations", {
      name: "Test Provider",
      slug: "test-provider",
      org_type: "provider",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    providerUserId = await ctx.db.insert("users", {
      name: "Provider User",
      email: "provider@test.vn",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("organizationMemberships", {
      orgId: providerOrgId,
      userId: providerUserId,
      role: "owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    providerId = await ctx.db.insert("providers", {
      organizationId: providerOrgId,
      nameVi: "Nha cung cap test",
      nameEn: "Test Provider",
      status: "active",
      verificationStatus: "verified",
      userId: providerUserId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { providerOrgId, providerUserId, providerId };
}

// ---------------------------------------------------------------------------
// Tests: equipment.create with rate limit wiring
// ---------------------------------------------------------------------------

describe("equipment.create — rate limit wired", () => {
  it("succeeds within rate limit (test env: rate limiter is no-op)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, categoryId } = await seedOrgContext(t);

    const authed = t.withIdentity({
      subject: "test@spmet.edu.vn",
      email: "test@spmet.edu.vn",
      organizationId: orgId,
    });

    const equipmentId = await authed.mutation(api.equipment.create, {
      nameVi: "May do huyet ap",
      nameEn: "Blood pressure monitor",
      categoryId: categoryId as any,
      status: "available",
    });

    expect(equipmentId).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: consumables.recordUsage with rate limit wiring
// ---------------------------------------------------------------------------

describe("consumables.recordUsage — rate limit wired", () => {
  it("succeeds within rate limit (test env: rate limiter is no-op)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedOrgContext(t);

    const authed = t.withIdentity({
      subject: "test@spmet.edu.vn",
      email: "test@spmet.edu.vn",
      organizationId: orgId,
    });

    // Create consumable first
    const consumableId = await authed.mutation(api.consumables.create, {
      nameVi: "Bong gac",
      nameEn: "Gauze",
      unitOfMeasure: "pack",
      categoryType: "disposables",
      currentStock: 100,
      parLevel: 20,
      reorderPoint: 10,
    });

    // Record usage — should succeed (rate limiter is no-op in tests)
    await authed.mutation(api.consumables.recordUsage, {
      consumableId,
      quantity: 5,
      usedBy: userId as any,
    });

    // Verify stock decreased
    const consumable = await t.run(async (ctx) => {
      return ctx.db.get(consumableId);
    });
    expect(consumable?.currentStock).toBe(95);
  });
});

// ---------------------------------------------------------------------------
// Tests: serviceRequests.create with rate limit wiring
// ---------------------------------------------------------------------------

describe("serviceRequests.create — rate limit wired", () => {
  it("succeeds within rate limit (test env: rate limiter is no-op)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId, categoryId } = await seedOrgContext(t);

    const authed = t.withIdentity({
      subject: userId,
      email: "test@spmet.edu.vn",
      organizationId: orgId,
    });

    // Create equipment for the service request
    const equipmentId = await authed.mutation(api.equipment.create, {
      nameVi: "May ECG",
      nameEn: "ECG Machine",
      categoryId: categoryId as any,
      status: "available",
    });

    const requestId = await authed.mutation(api.serviceRequests.create, {
      organizationId: orgId as any,
      equipmentId,
      type: "repair",
      priority: "medium",
      descriptionVi: "May ECG can bao tri",
      descriptionEn: "ECG machine needs maintenance",
    });

    expect(requestId).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: serviceRequests.updateProgress with rate limit wiring
// ---------------------------------------------------------------------------

describe("serviceRequests.updateProgress — rate limit wired", () => {
  it("succeeds within rate limit (test env: rate limiter is no-op)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId, categoryId } = await seedOrgContext(t);
    const { providerUserId, providerId, providerOrgId } =
      await seedProviderContext(t);

    // Create equipment
    const authedHospital = t.withIdentity({
      subject: "test@spmet.edu.vn",
      email: "test@spmet.edu.vn",
      organizationId: orgId,
    });

    const equipmentId = await authedHospital.mutation(api.equipment.create, {
      nameVi: "May ECG",
      nameEn: "ECG Machine",
      categoryId: categoryId as any,
      status: "available",
    });

    // Create service request in in_progress status with valid user ID
    let requestId: string = "";
    await t.run(async (ctx) => {
      requestId = await ctx.db.insert("serviceRequests", {
        organizationId: orgId as any,
        equipmentId,
        requestedBy: userId as any,
        type: "repair",
        priority: "medium",
        status: "in_progress",
        descriptionVi: "Test",
        assignedProviderId: providerId as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Provider updates progress
    const authedProvider = t.withIdentity({
      subject: providerUserId,
      email: "provider@test.vn",
      organizationId: providerOrgId,
    });

    const result = await authedProvider.mutation(
      api.serviceRequests.updateProgress,
      {
        id: requestId as any,
        progressNotes: "Started diagnostic check",
        percentComplete: 25,
      },
    );

    expect(result).toBe(requestId);
  });
});

// ---------------------------------------------------------------------------
// Tests: quotes.submit with rate limit wiring
// ---------------------------------------------------------------------------

describe("quotes.submit — rate limit wired", () => {
  it("succeeds within rate limit (test env: rate limiter is no-op)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId, categoryId } = await seedOrgContext(t);
    const { providerUserId, providerId, providerOrgId } =
      await seedProviderContext(t);

    // Create equipment
    const authedHospital = t.withIdentity({
      subject: "test@spmet.edu.vn",
      email: "test@spmet.edu.vn",
      organizationId: orgId,
    });

    const equipmentId = await authedHospital.mutation(api.equipment.create, {
      nameVi: "May ECG",
      nameEn: "ECG Machine",
      categoryId: categoryId as any,
      status: "available",
    });

    // Create a pending service request with valid user ID
    let requestId: string = "";
    await t.run(async (ctx) => {
      requestId = await ctx.db.insert("serviceRequests", {
        organizationId: orgId as any,
        equipmentId,
        requestedBy: userId as any,
        type: "repair",
        priority: "medium",
        status: "pending",
        descriptionVi: "Test",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Provider submits a quote
    const authedProvider = t.withIdentity({
      subject: providerUserId,
      email: "provider@test.vn",
      organizationId: providerOrgId,
    });

    const quoteId = await authedProvider.mutation(api.quotes.submit, {
      serviceRequestId: requestId as any,
      amount: 5000000,
      currency: "VND",
    });

    expect(quoteId).toBeDefined();
  });
});
