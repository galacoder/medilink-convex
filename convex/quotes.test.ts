/**
 * Unit tests for the quotes.accept mutation.
 *
 * Tests cover all acceptance criteria from issue #154:
 * - Successful accept flow (quote accepted, others rejected, service request updated)
 * - Role gate: only owner/admin can accept
 * - Self-approval prevention: requestedBy !== acceptor
 * - Double-accept guard: only pending quotes can be accepted
 * - Wrong-org authorization check
 * - Audit log entry creation
 *
 * vi: "Kiểm tra đơn vị cho đột biến quotes.accept"
 * en: "Unit tests for the quotes.accept mutation"
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/**
 * Sets up test data: orgs, users, memberships, equipment, providers,
 * service request, and two pending quotes.
 */
async function setupTestData(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const now = Date.now();

    // Hospital organization
    const orgId = await ctx.db.insert("organizations", {
      name: "Test Hospital",
      org_type: "hospital",
      slug: "test-hospital",
      createdAt: now,
      updatedAt: now,
    });

    // Provider organization
    const providerOrgId = await ctx.db.insert("organizations", {
      name: "Test Provider Co",
      org_type: "provider",
      slug: "test-provider",
      createdAt: now,
      updatedAt: now,
    });

    // Other organization (for wrong-org test)
    const otherOrgId = await ctx.db.insert("organizations", {
      name: "Other Hospital",
      org_type: "hospital",
      slug: "other-hospital",
      createdAt: now,
      updatedAt: now,
    });

    // Users
    const adminUserId = await ctx.db.insert("users", {
      name: "Admin User",
      email: "admin@hospital.test",
      createdAt: now,
      updatedAt: now,
    });

    const memberUserId = await ctx.db.insert("users", {
      name: "Member User",
      email: "member@hospital.test",
      createdAt: now,
      updatedAt: now,
    });

    const requesterUserId = await ctx.db.insert("users", {
      name: "Requester User",
      email: "requester@hospital.test",
      createdAt: now,
      updatedAt: now,
    });

    const outsiderUserId = await ctx.db.insert("users", {
      name: "Outsider User",
      email: "outsider@other.test",
      createdAt: now,
      updatedAt: now,
    });

    // Memberships
    await ctx.db.insert("organizationMemberships", {
      orgId,
      userId: adminUserId,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("organizationMemberships", {
      orgId,
      userId: memberUserId,
      role: "member",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("organizationMemberships", {
      orgId,
      userId: requesterUserId,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("organizationMemberships", {
      orgId: otherOrgId,
      userId: outsiderUserId,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    // Equipment category (required by equipment)
    const categoryId = await ctx.db.insert("equipmentCategories", {
      nameVi: "Thiet bi chan doan",
      nameEn: "Diagnostic devices",
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    });

    // Equipment
    const equipmentId = await ctx.db.insert("equipment", {
      nameVi: "May ECG",
      nameEn: "ECG Machine",
      categoryId,
      organizationId: orgId,
      status: "maintenance",
      condition: "good",
      criticality: "B",
      createdAt: now,
      updatedAt: now,
    });

    // Providers
    const providerId = await ctx.db.insert("providers", {
      organizationId: providerOrgId,
      nameVi: "Nha cung cap 1",
      nameEn: "Provider 1",
      status: "active",
      verificationStatus: "verified",
      createdAt: now,
      updatedAt: now,
    });

    const provider2Id = await ctx.db.insert("providers", {
      organizationId: otherOrgId,
      nameVi: "Nha cung cap 2",
      nameEn: "Provider 2",
      status: "active",
      verificationStatus: "verified",
      createdAt: now,
      updatedAt: now,
    });

    // Service request (in "quoted" status)
    const serviceRequestId = await ctx.db.insert("serviceRequests", {
      organizationId: orgId,
      equipmentId,
      requestedBy: requesterUserId,
      type: "repair",
      priority: "medium",
      status: "quoted",
      descriptionVi: "May ECG can bao tri",
      descriptionEn: "ECG machine needs maintenance",
      createdAt: now,
      updatedAt: now,
    });

    // Two pending quotes
    const quote1Id = await ctx.db.insert("quotes", {
      serviceRequestId,
      providerId,
      status: "pending",
      amount: 5000000,
      currency: "VND",
      createdAt: now,
      updatedAt: now,
    });

    const quote2Id = await ctx.db.insert("quotes", {
      serviceRequestId,
      providerId: provider2Id,
      status: "pending",
      amount: 7000000,
      currency: "VND",
      createdAt: now,
      updatedAt: now,
    });

    return {
      orgId,
      providerOrgId,
      otherOrgId,
      adminUserId,
      memberUserId,
      requesterUserId,
      outsiderUserId,
      equipmentId,
      providerId,
      provider2Id,
      serviceRequestId,
      quote1Id,
      quote2Id,
    };
  });
}

describe("quotes.accept", () => {
  it("should accept a quote, reject others, transition service request, and log audit", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@hospital.test",
      tokenIdentifier: "test|admin",
    });

    const result = await asAdmin.mutation(api.quotes.accept, {
      quoteId: data.quote1Id,
    });

    expect(result.quoteId).toBe(data.quote1Id);
    expect(result.serviceRequestId).toBe(data.serviceRequestId);

    await t.run(async (ctx) => {
      // Accepted quote has correct fields
      const accepted = await ctx.db.get(data.quote1Id);
      expect(accepted!.status).toBe("accepted");
      expect(accepted!.acceptedBy).toBe(data.adminUserId);
      expect(accepted!.acceptedAt).toBeTypeOf("number");

      // Other pending quote is rejected
      const rejected = await ctx.db.get(data.quote2Id);
      expect(rejected!.status).toBe("rejected");

      // Service request transitioned to "accepted" with assigned provider
      const request = await ctx.db.get(data.serviceRequestId);
      expect(request!.status).toBe("accepted");
      expect(request!.assignedProviderId).toBe(data.providerId);

      // Audit log entry created
      const auditEntries = await ctx.db.query("auditLog").collect();
      const entry = auditEntries.find((e) => e.action === "quote_accepted");
      expect(entry).toBeDefined();
      expect(entry!.resourceType).toBe("quotes");
      expect(entry!.resourceId).toBe(data.quote1Id);
      expect(entry!.actorId).toBe(data.adminUserId);
    });
  });

  it("should throw when quote is already accepted (double-accept guard)", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    await t.run(async (ctx) => {
      await ctx.db.patch(data.quote1Id, { status: "accepted" });
    });

    const asAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@hospital.test",
      tokenIdentifier: "test|admin",
    });

    await expect(
      asAdmin.mutation(api.quotes.accept, { quoteId: data.quote1Id }),
    ).rejects.toThrow(/Only pending quotes can be accepted/);
  });

  it("should throw when user is from a different organization (wrong-org)", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asOutsider = t.withIdentity({
      subject: data.outsiderUserId,
      email: "outsider@other.test",
      tokenIdentifier: "test|outsider",
    });

    await expect(
      asOutsider.mutation(api.quotes.accept, { quoteId: data.quote1Id }),
    ).rejects.toThrow(/Not authorized/);
  });

  it("should throw when requester tries to accept their own request (self-approval)", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asRequester = t.withIdentity({
      subject: data.requesterUserId,
      email: "requester@hospital.test",
      tokenIdentifier: "test|requester",
    });

    await expect(
      asRequester.mutation(api.quotes.accept, { quoteId: data.quote1Id }),
    ).rejects.toThrow(/cannot accept a quote for your own/);
  });

  it("should throw when member (not owner/admin) tries to accept", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asMember = t.withIdentity({
      subject: data.memberUserId,
      email: "member@hospital.test",
      tokenIdentifier: "test|member",
    });

    await expect(
      asMember.mutation(api.quotes.accept, { quoteId: data.quote1Id }),
    ).rejects.toThrow(/do not have permission/);
  });
});
