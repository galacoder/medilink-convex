/**
 * Tests for serviceRequests.updateStatus role gate and self-approval prevention.
 *
 * Issue #153: Verifies that:
 * 1. Only owner/admin roles can perform approval-class transitions
 * 2. The user who created the request cannot approve it
 * 3. Non-approval transitions are unaffected by role gate
 * 4. All violations produce bilingual ConvexError messages
 */
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Creates a test environment with the required org, users, memberships,
 * equipment, provider, and a pending service request.
 *
 * Returns IDs for: hospitalOrg, equipment, adminUser, memberUser,
 * ownerUser, providerOrg, provider, serviceRequest
 */
async function setupTestData(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const now = Date.now();

    // Create hospital org
    const hospitalOrgId = await ctx.db.insert("organizations", {
      name: "SPMET Hospital",
      slug: "spmet",
      org_type: "hospital",
      createdAt: now,
      updatedAt: now,
    });

    // Create users: owner, admin, member, and a separate approver
    const ownerUserId = await ctx.db.insert("users", {
      name: "Owner User",
      email: "owner@spmet.edu.vn",
      createdAt: now,
      updatedAt: now,
    });
    const adminUserId = await ctx.db.insert("users", {
      name: "Admin User",
      email: "admin@spmet.edu.vn",
      createdAt: now,
      updatedAt: now,
    });
    const memberUserId = await ctx.db.insert("users", {
      name: "Member User",
      email: "member@spmet.edu.vn",
      createdAt: now,
      updatedAt: now,
    });

    // Create memberships
    await ctx.db.insert("organizationMemberships", {
      orgId: hospitalOrgId,
      userId: ownerUserId,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("organizationMemberships", {
      orgId: hospitalOrgId,
      userId: adminUserId,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("organizationMemberships", {
      orgId: hospitalOrgId,
      userId: memberUserId,
      role: "member",
      createdAt: now,
      updatedAt: now,
    });

    // Create equipment category (required FK for equipment)
    const categoryId = await ctx.db.insert("equipmentCategories", {
      nameVi: "Thiết bị chẩn đoán",
      nameEn: "Diagnostic Equipment",
      organizationId: hospitalOrgId,
      createdAt: now,
      updatedAt: now,
    });

    // Create equipment
    const equipmentId = await ctx.db.insert("equipment", {
      organizationId: hospitalOrgId,
      categoryId,
      nameVi: "Máy siêu âm",
      nameEn: "Ultrasound Machine",
      status: "available",
      condition: "good",
      criticality: "B",
      createdAt: now,
      updatedAt: now,
    });

    // Create provider org + provider record
    const providerOrgId = await ctx.db.insert("organizations", {
      name: "TechMed Provider",
      slug: "techmed",
      org_type: "provider",
      createdAt: now,
      updatedAt: now,
    });
    const providerId = await ctx.db.insert("providers", {
      organizationId: providerOrgId,
      nameVi: "TechMed Việt Nam",
      nameEn: "TechMed Vietnam",
      status: "active",
      verificationStatus: "verified",
      createdAt: now,
      updatedAt: now,
    });

    // Create service request (requested by memberUser)
    const serviceRequestId = await ctx.db.insert("serviceRequests", {
      organizationId: hospitalOrgId,
      equipmentId,
      requestedBy: memberUserId,
      type: "repair",
      priority: "medium",
      status: "pending",
      descriptionVi: "Máy siêu âm bị hỏng",
      createdAt: now,
      updatedAt: now,
    });

    return {
      hospitalOrgId,
      providerOrgId,
      providerId,
      equipmentId,
      ownerUserId,
      adminUserId,
      memberUserId,
      serviceRequestId,
    };
  });
}

// ---------------------------------------------------------------------------
// Helper: create a second member who did NOT create the service request
// (so the role gate fires, not the self-approval check)
// ---------------------------------------------------------------------------
const NON_REQUESTER_EMAIL = "non-requester@spmet.edu.vn";

async function createNonRequesterMember(
  t: ReturnType<typeof convexTest>,
  hospitalOrgId: string,
) {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: "Non-Requester Member",
      email: NON_REQUESTER_EMAIL,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("organizationMemberships", {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orgId: hospitalOrgId as any,
      userId,
      role: "member",
      createdAt: now,
      updatedAt: now,
    });
    return userId;
  });
}

// ---------------------------------------------------------------------------
// AC1: member role cannot transition pending->quoted or quoted->accepted
// ---------------------------------------------------------------------------
describe("updateStatus role gate", () => {
  it("member cannot transition pending -> quoted (approval-class)", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);
    const nonRequesterMemberId = await createNonRequesterMember(
      t,
      data.hospitalOrgId,
    );

    const asHospitalMember = t.withIdentity({
      subject: nonRequesterMemberId,
      email: NON_REQUESTER_EMAIL,
      organizationId: data.hospitalOrgId,
    });

    await expect(
      asHospitalMember.mutation(api.serviceRequests.updateStatus, {
        id: data.serviceRequestId,
        status: "quoted",
      }),
    ).rejects.toThrow(ConvexError);
  });

  it("member cannot transition quoted -> accepted (approval-class)", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);
    const nonRequesterMemberId = await createNonRequesterMember(
      t,
      data.hospitalOrgId,
    );

    // Move to quoted status first
    await t.run(async (ctx) => {
      await ctx.db.patch(data.serviceRequestId, { status: "quoted" });
    });

    const asHospitalMember = t.withIdentity({
      subject: nonRequesterMemberId,
      email: NON_REQUESTER_EMAIL,
      organizationId: data.hospitalOrgId,
    });

    await expect(
      asHospitalMember.mutation(api.serviceRequests.updateStatus, {
        id: data.serviceRequestId,
        status: "accepted",
      }),
    ).rejects.toThrow(ConvexError);
  });

  it("member cannot transition accepted -> in_progress (approval-class)", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);
    const nonRequesterMemberId = await createNonRequesterMember(
      t,
      data.hospitalOrgId,
    );

    // Move to accepted status first
    await t.run(async (ctx) => {
      await ctx.db.patch(data.serviceRequestId, {
        status: "accepted",
        assignedProviderId: data.providerId,
      });
    });

    const asHospitalMember = t.withIdentity({
      subject: nonRequesterMemberId,
      email: NON_REQUESTER_EMAIL,
      organizationId: data.hospitalOrgId,
    });

    await expect(
      asHospitalMember.mutation(api.serviceRequests.updateStatus, {
        id: data.serviceRequestId,
        status: "in_progress",
      }),
    ).rejects.toThrow(ConvexError);
  });

  // ---------------------------------------------------------------------------
  // AC2: owner/admin can perform all approval transitions
  // ---------------------------------------------------------------------------
  it("owner can transition pending -> quoted", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalOwner = t.withIdentity({
      subject: data.ownerUserId,
      email: "owner@spmet.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const result = await asHospitalOwner.mutation(
      api.serviceRequests.updateStatus,
      {
        id: data.serviceRequestId,
        status: "quoted",
      },
    );

    expect(result).toBe(data.serviceRequestId);
  });

  it("admin can transition quoted -> accepted", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    // Move to quoted status
    await t.run(async (ctx) => {
      await ctx.db.patch(data.serviceRequestId, { status: "quoted" });
    });

    const asHospitalAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@spmet.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const result = await asHospitalAdmin.mutation(
      api.serviceRequests.updateStatus,
      {
        id: data.serviceRequestId,
        status: "accepted",
      },
    );

    expect(result).toBe(data.serviceRequestId);
  });

  // ---------------------------------------------------------------------------
  // AC4: Non-approval transitions unaffected
  // ---------------------------------------------------------------------------
  it("non-approval transitions (in_progress -> completed) unaffected by role gate", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    // Create a provider user with member role in the provider org
    const providerUserId = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Provider User",
        email: "provider@techmed.vn",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("organizationMemberships", {
        orgId: data.providerOrgId,
        userId,
        role: "member",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      // Set the request to in_progress with assigned provider
      await ctx.db.patch(data.serviceRequestId, {
        status: "in_progress",
        assignedProviderId: data.providerId,
      });
      return userId;
    });

    const asProvider = t.withIdentity({
      subject: providerUserId,
      email: "provider@techmed.vn",
      organizationId: data.providerOrgId,
    });

    const result = await asProvider.mutation(api.serviceRequests.updateStatus, {
      id: data.serviceRequestId,
      status: "completed",
    });

    expect(result).toBe(data.serviceRequestId);
  });
});

// ---------------------------------------------------------------------------
// AC3: Self-approval prevention
// ---------------------------------------------------------------------------
describe("updateStatus self-approval prevention", () => {
  it("requester cannot approve their own request", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    // Give the member user an admin role so they pass the role gate
    await t.run(async (ctx) => {
      const membership = await ctx.db
        .query("organizationMemberships")
        .withIndex("by_org_and_user", (q) =>
          q.eq("orgId", data.hospitalOrgId).eq("userId", data.memberUserId),
        )
        .first();
      if (membership) {
        await ctx.db.patch(membership._id, { role: "admin" });
      }
    });

    // memberUser created the request, so they should be blocked from approving
    const asMemberAdmin = t.withIdentity({
      subject: data.memberUserId,
      email: "member@spmet.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    await expect(
      asMemberAdmin.mutation(api.serviceRequests.updateStatus, {
        id: data.serviceRequestId,
        status: "quoted",
      }),
    ).rejects.toThrow(ConvexError);
  });

  it("self-approval error message is bilingual", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    // Give the member user admin role
    await t.run(async (ctx) => {
      const membership = await ctx.db
        .query("organizationMemberships")
        .withIndex("by_org_and_user", (q) =>
          q.eq("orgId", data.hospitalOrgId).eq("userId", data.memberUserId),
        )
        .first();
      if (membership) {
        await ctx.db.patch(membership._id, { role: "admin" });
      }
    });

    const asMemberAdmin = t.withIdentity({
      subject: data.memberUserId,
      email: "member@spmet.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    try {
      await asMemberAdmin.mutation(api.serviceRequests.updateStatus, {
        id: data.serviceRequestId,
        status: "quoted",
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const convexError = error as ConvexError<Record<string, unknown>>;
      const errorStr = JSON.stringify(convexError.data);
      expect(errorStr).toContain("không thể phê duyệt yêu cầu của chính mình");
      expect(errorStr).toContain("cannot approve your own service request");
    }
  });
});

// ---------------------------------------------------------------------------
// AC5: Bilingual error messages for role gate violations
// ---------------------------------------------------------------------------
describe("updateStatus bilingual error messages", () => {
  it("role gate violation produces bilingual error", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    // Create a second member user who did NOT create the request
    // (avoids triggering self-approval check instead of role gate)
    const otherMemberId = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Other Member",
        email: "other-member@spmet.edu.vn",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("organizationMemberships", {
        orgId: data.hospitalOrgId,
        userId,
        role: "member",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return userId;
    });

    const asOtherMember = t.withIdentity({
      subject: otherMemberId,
      email: "other-member@spmet.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    try {
      await asOtherMember.mutation(api.serviceRequests.updateStatus, {
        id: data.serviceRequestId,
        status: "quoted",
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const convexError = error as ConvexError<Record<string, unknown>>;
      const errorStr = JSON.stringify(convexError.data);
      // Should contain both Vietnamese and English error text
      expect(errorStr).toContain("quản trị viên");
      expect(errorStr).toContain("admin or owner");
    }
  });
});
