/**
 * Tests for convex/support.ts — support ticket queries and mutations.
 *
 * Issue #180: Verifies:
 * 1. create mutation validates inputs and creates ticket with audit log
 * 2. listByOrg returns org-scoped tickets with optional status filter
 * 3. listByUser returns tickets created by the authenticated user
 * 4. getById returns ticket with messages and author names
 * 5. addMessage creates a message and updates ticket timestamp
 * 6. updateStatus changes ticket status with audit trail
 * 7. assign sets assignedTo and transitions to in_progress (admin only)
 * 8. close transitions to closed from any status (admin only)
 * 9. listAll returns all tickets (admin only)
 * 10. adminGetById returns ticket without org check (admin only)
 * 11. adminAddMessage adds message cross-org (admin only)
 *
 * vi: "Kiem tra phieu ho tro" / en: "Support ticket tests"
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

async function setupTestData(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const now = Date.now();

    // Create hospital org
    const hospitalOrgId = await ctx.db.insert("organizations", {
      name: "SPMET Hospital",
      slug: "spmet-support",
      org_type: "hospital",
      createdAt: now,
      updatedAt: now,
    });

    // Create users
    const hospitalUserId = await ctx.db.insert("users", {
      name: "Lan Tran",
      email: "lan.tran@spmet-support.edu.vn",
      createdAt: now,
      updatedAt: now,
    });

    const adminUserId = await ctx.db.insert("users", {
      name: "Admin User",
      email: "admin@medilink-support.vn",
      platformRole: "platform_admin",
      createdAt: now,
      updatedAt: now,
    });

    const otherUserId = await ctx.db.insert("users", {
      name: "Duc Pham",
      email: "duc.pham@spmet-support.edu.vn",
      createdAt: now,
      updatedAt: now,
    });

    // Memberships
    await ctx.db.insert("organizationMemberships", {
      orgId: hospitalOrgId,
      userId: hospitalUserId,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("organizationMemberships", {
      orgId: hospitalOrgId,
      userId: otherUserId,
      role: "member",
      createdAt: now,
      updatedAt: now,
    });

    // Provider org (for testing org isolation)
    const providerOrgId = await ctx.db.insert("organizations", {
      name: "TechMed Provider",
      slug: "techmed-support",
      org_type: "provider",
      createdAt: now,
      updatedAt: now,
    });

    const providerUserId = await ctx.db.insert("users", {
      name: "Minh Le",
      email: "minh.le@techmed-support.vn",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("organizationMemberships", {
      orgId: providerOrgId,
      userId: providerUserId,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    return {
      hospitalOrgId,
      hospitalUserId,
      adminUserId,
      otherUserId,
      providerOrgId,
      providerUserId,
    };
  });
}

// ---------------------------------------------------------------------------
// Tests: create mutation
// ---------------------------------------------------------------------------

describe("support.create", () => {
  it("test_create_inserts_ticket_with_open_status", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Van de ky thuat",
      descriptionVi: "Mo ta chi tiet van de ky thuat",
      category: "technical",
      priority: "medium",
    });

    expect(ticketId).toBeDefined();

    // Verify the ticket was created correctly
    const ticket = await t.run(async (ctx) => {
      return await ctx.db.get(ticketId);
    });

    expect(ticket).not.toBeNull();
    expect(ticket!.status).toBe("open");
    expect(ticket!.category).toBe("technical");
    expect(ticket!.priority).toBe("medium");
    expect(ticket!.subjectVi).toBe("Van de ky thuat");
    expect(ticket!.organizationId).toBe(data.hospitalOrgId);
    expect(ticket!.createdBy).toBe(data.hospitalUserId);
  });

  it("test_create_rejects_short_subject", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    await expect(
      asHospitalUser.mutation(api.support.create, {
        subjectVi: "AB",
        descriptionVi: "Mo ta chi tiet van de ky thuat",
        category: "technical",
        priority: "medium",
      }),
    ).rejects.toThrow();
  });

  it("test_create_rejects_short_description", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    await expect(
      asHospitalUser.mutation(api.support.create, {
        subjectVi: "Van de ky thuat",
        descriptionVi: "Ngan",
        category: "technical",
        priority: "medium",
      }),
    ).rejects.toThrow();
  });

  it("test_create_audit_log_entry", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Van de ky thuat",
      descriptionVi: "Mo ta chi tiet van de ky thuat",
      category: "technical",
      priority: "medium",
    });

    // Verify audit log was created
    const auditLogs = await t.run(async (ctx) => {
      return await ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "supportTicket.created"))
        .collect();
    });

    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]!.action).toBe("supportTicket.created");
  });

  it("test_create_requires_authentication", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.support.create, {
        subjectVi: "Van de ky thuat",
        descriptionVi: "Mo ta chi tiet van de ky thuat",
        category: "technical",
        priority: "medium",
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: listByOrg query
// ---------------------------------------------------------------------------

describe("support.listByOrg", () => {
  it("test_listByOrg_returns_org_tickets", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Ticket 1",
      descriptionVi: "Mo ta chi tiet ticket 1 day du",
      category: "technical",
      priority: "medium",
    });

    const tickets = await asHospitalUser.query(api.support.listByOrg, {});

    expect(tickets).toHaveLength(1);
    expect(tickets[0]!.subjectVi).toBe("Ticket 1");
  });

  it("test_listByOrg_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    // Create two tickets
    await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Open ticket",
      descriptionVi: "Mo ta chi tiet ticket open day du",
      category: "technical",
      priority: "medium",
    });

    const ticket2Id = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Resolved ticket",
      descriptionVi: "Mo ta chi tiet ticket resolved day du",
      category: "billing",
      priority: "low",
    });

    // Update second ticket to resolved
    await asHospitalUser.mutation(api.support.updateStatus, {
      ticketId: ticket2Id,
      status: "resolved",
    });

    // Filter by open
    const openTickets = await asHospitalUser.query(api.support.listByOrg, {
      status: "open",
    });

    expect(openTickets).toHaveLength(1);
    expect(openTickets[0]!.subjectVi).toBe("Open ticket");
  });

  it("test_listByOrg_does_not_return_other_org_tickets", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    // Create ticket in hospital org
    await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Hospital ticket",
      descriptionVi: "Mo ta chi tiet hospital ticket day du",
      category: "technical",
      priority: "medium",
    });

    // Query from provider org
    const asProviderUser = t.withIdentity({
      subject: data.providerUserId,
      email: "minh.le@techmed-support.vn",
      organizationId: data.providerOrgId,
    });

    const providerTickets = await asProviderUser.query(
      api.support.listByOrg,
      {},
    );

    expect(providerTickets).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: listByUser query
// ---------------------------------------------------------------------------

describe("support.listByUser", () => {
  it("test_listByUser_returns_user_tickets_only", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const asOtherUser = t.withIdentity({
      subject: data.otherUserId,
      email: "duc.pham@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    // Create ticket as hospitalUser
    await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Lan ticket",
      descriptionVi: "Mo ta chi tiet ticket cua Lan day du",
      category: "technical",
      priority: "medium",
    });

    // Create ticket as otherUser
    await asOtherUser.mutation(api.support.create, {
      subjectVi: "Duc ticket",
      descriptionVi: "Mo ta chi tiet ticket cua Duc day du",
      category: "billing",
      priority: "low",
    });

    // Query hospitalUser's tickets
    const lanTickets = await asHospitalUser.query(
      api.support.listByUser,
      {},
    );

    expect(lanTickets).toHaveLength(1);
    expect(lanTickets[0]!.subjectVi).toBe("Lan ticket");
  });
});

// ---------------------------------------------------------------------------
// Tests: getById query
// ---------------------------------------------------------------------------

describe("support.getById", () => {
  it("test_getById_returns_ticket_with_messages", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Test ticket",
      descriptionVi: "Mo ta chi tiet test ticket day du",
      category: "technical",
      priority: "high",
    });

    // Add a message
    await asHospitalUser.mutation(api.support.addMessage, {
      ticketId,
      contentVi: "Tin nhan dau tien",
    });

    const result = await asHospitalUser.query(api.support.getById, {
      ticketId,
    });

    expect(result).not.toBeNull();
    expect(result.subjectVi).toBe("Test ticket");
    expect(result.creatorName).toBe("Lan Tran");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.contentVi).toBe("Tin nhan dau tien");
    expect(result.messages[0]!.authorName).toBe("Lan Tran");
  });

  it("test_getById_rejects_cross_org_access", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Hospital ticket",
      descriptionVi: "Mo ta chi tiet hospital ticket day du",
      category: "technical",
      priority: "medium",
    });

    // Try to access from provider org
    const asProviderUser = t.withIdentity({
      subject: data.providerUserId,
      email: "minh.le@techmed-support.vn",
      organizationId: data.providerOrgId,
    });

    await expect(
      asProviderUser.query(api.support.getById, { ticketId }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: addMessage mutation
// ---------------------------------------------------------------------------

describe("support.addMessage", () => {
  it("test_addMessage_creates_message_and_updates_ticket", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Test ticket",
      descriptionVi: "Mo ta chi tiet test ticket day du",
      category: "technical",
      priority: "medium",
    });

    const messageId = await asHospitalUser.mutation(
      api.support.addMessage,
      {
        ticketId,
        contentVi: "Phan hoi moi",
      },
    );

    expect(messageId).toBeDefined();

    // Verify message
    const msg = await t.run(async (ctx) => {
      return await ctx.db.get(messageId);
    });

    expect(msg).not.toBeNull();
    expect(msg!.contentVi).toBe("Phan hoi moi");
    expect(msg!.authorId).toBe(data.hospitalUserId);
  });

  it("test_addMessage_rejects_empty_content", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Test ticket",
      descriptionVi: "Mo ta chi tiet test ticket day du",
      category: "technical",
      priority: "medium",
    });

    await expect(
      asHospitalUser.mutation(api.support.addMessage, {
        ticketId,
        contentVi: "   ",
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: updateStatus mutation
// ---------------------------------------------------------------------------

describe("support.updateStatus", () => {
  it("test_updateStatus_transitions_status", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Test ticket",
      descriptionVi: "Mo ta chi tiet test ticket day du",
      category: "technical",
      priority: "medium",
    });

    await asHospitalUser.mutation(api.support.updateStatus, {
      ticketId,
      status: "in_progress",
    });

    const ticket = await t.run(async (ctx) => {
      return await ctx.db.get(ticketId);
    });

    expect(ticket!.status).toBe("in_progress");
  });

  it("test_updateStatus_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Audit test",
      descriptionVi: "Mo ta chi tiet audit test day du",
      category: "technical",
      priority: "medium",
    });

    await asHospitalUser.mutation(api.support.updateStatus, {
      ticketId,
      status: "resolved",
    });

    const auditLogs = await t.run(async (ctx) => {
      return await ctx.db
        .query("auditLog")
        .filter((q) =>
          q.eq(q.field("action"), "supportTicket.statusUpdated"),
        )
        .collect();
    });

    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]!.previousValues).toEqual({ status: "open" });
    expect(auditLogs[0]!.newValues).toEqual({ status: "resolved" });
  });
});

// ---------------------------------------------------------------------------
// Tests: assign mutation (admin only)
// ---------------------------------------------------------------------------

describe("support.assign", () => {
  it("test_assign_sets_assignee_and_status", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    // Create ticket as hospital user
    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Assign test",
      descriptionVi: "Mo ta chi tiet assign test day du",
      category: "technical",
      priority: "high",
    });

    // Admin assigns the ticket
    const asAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink-support.vn",
      platformRole: "platform_admin",
    });

    await asAdmin.mutation(api.support.assign, {
      ticketId,
      assignedTo: data.adminUserId,
    });

    const ticket = await t.run(async (ctx) => {
      return await ctx.db.get(ticketId);
    });

    expect(ticket!.assignedTo).toBe(data.adminUserId);
    expect(ticket!.status).toBe("in_progress");
  });

  it("test_assign_rejects_non_admin", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Assign test",
      descriptionVi: "Mo ta chi tiet assign test day du",
      category: "technical",
      priority: "high",
    });

    await expect(
      asHospitalUser.mutation(api.support.assign, {
        ticketId,
        assignedTo: data.hospitalUserId,
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: close mutation (admin only)
// ---------------------------------------------------------------------------

describe("support.close", () => {
  it("test_close_transitions_to_closed", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Close test",
      descriptionVi: "Mo ta chi tiet close test day du",
      category: "general",
      priority: "low",
    });

    const asAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink-support.vn",
      platformRole: "platform_admin",
    });

    await asAdmin.mutation(api.support.close, { ticketId });

    const ticket = await t.run(async (ctx) => {
      return await ctx.db.get(ticketId);
    });

    expect(ticket!.status).toBe("closed");
  });

  it("test_close_rejects_already_closed", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Already closed",
      descriptionVi: "Mo ta chi tiet already closed day du",
      category: "general",
      priority: "low",
    });

    const asAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink-support.vn",
      platformRole: "platform_admin",
    });

    // Close it once
    await asAdmin.mutation(api.support.close, { ticketId });

    // Try closing again
    await expect(
      asAdmin.mutation(api.support.close, { ticketId }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: listAll query (admin only)
// ---------------------------------------------------------------------------

describe("support.listAll", () => {
  it("test_listAll_returns_all_tickets_for_admin", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    // Create tickets in different orgs
    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Hospital ticket",
      descriptionVi: "Mo ta chi tiet hospital ticket day du",
      category: "technical",
      priority: "medium",
    });

    const asProviderUser = t.withIdentity({
      subject: data.providerUserId,
      email: "minh.le@techmed-support.vn",
      organizationId: data.providerOrgId,
    });

    await asProviderUser.mutation(api.support.create, {
      subjectVi: "Provider ticket",
      descriptionVi: "Mo ta chi tiet provider ticket day du",
      category: "billing",
      priority: "high",
    });

    const asAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink-support.vn",
      platformRole: "platform_admin",
    });

    const allTickets = await asAdmin.query(api.support.listAll, {});

    expect(allTickets).toHaveLength(2);
    // Should have org names enriched
    expect(allTickets[0]!.organizationName).toBeDefined();
  });

  it("test_listAll_rejects_non_admin", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    await expect(
      asHospitalUser.query(api.support.listAll, {}),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: adminGetById query (admin only)
// ---------------------------------------------------------------------------

describe("support.adminGetById", () => {
  it("test_adminGetById_returns_ticket_with_messages", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Admin detail test",
      descriptionVi: "Mo ta chi tiet admin detail test day du",
      category: "technical",
      priority: "high",
    });

    const asAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink-support.vn",
      platformRole: "platform_admin",
    });

    const result = await asAdmin.query(api.support.adminGetById, {
      ticketId,
    });

    expect(result).not.toBeNull();
    expect(result.subjectVi).toBe("Admin detail test");
    expect(result.organizationName).toBe("SPMET Hospital");
    expect(result.creatorName).toBe("Lan Tran");
  });
});

// ---------------------------------------------------------------------------
// Tests: adminAddMessage mutation (admin only)
// ---------------------------------------------------------------------------

describe("support.adminAddMessage", () => {
  it("test_adminAddMessage_adds_message_cross_org", async () => {
    const t = convexTest(schema, modules);
    const data = await setupTestData(t);

    const asHospitalUser = t.withIdentity({
      subject: data.hospitalUserId,
      email: "lan.tran@spmet-support.edu.vn",
      organizationId: data.hospitalOrgId,
    });

    const ticketId = await asHospitalUser.mutation(api.support.create, {
      subjectVi: "Admin msg test",
      descriptionVi: "Mo ta chi tiet admin msg test day du",
      category: "technical",
      priority: "medium",
    });

    const asAdmin = t.withIdentity({
      subject: data.adminUserId,
      email: "admin@medilink-support.vn",
      platformRole: "platform_admin",
    });

    const messageId = await asAdmin.mutation(
      api.support.adminAddMessage,
      {
        ticketId,
        contentVi: "Phan hoi tu admin",
      },
    );

    expect(messageId).toBeDefined();

    const msg = await t.run(async (ctx) => {
      return await ctx.db.get(messageId);
    });

    expect(msg!.contentVi).toBe("Phan hoi tu admin");
    expect(msg!.authorId).toBe(data.adminUserId);
  });
});
