/**
 * Integration tests for support ticket mutation functions.
 * Uses convex-test to exercise mutations against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các đột biến phiếu hỗ trợ" / en: "Support ticket mutation integration tests"
 */
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedOrganization(
  t: ReturnType<typeof convexTest>,
  name = "SPMET Hospital",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("organizations", {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      org_type: "hospital" as const,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedUser(
  t: ReturnType<typeof convexTest>,
  email = "staff@spmet.edu.vn",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name: "Staff User",
      email,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedSupportTicket(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  userId: string,
  status: "open" | "in_progress" | "resolved" | "closed" = "open",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("supportTicket", {
      organizationId: orgId as any,
      createdBy: userId as any,
      status,
      priority: "medium" as const,
      category: "technical" as const,
      subjectVi: "Thiết bị không hoạt động",
      subjectEn: "Equipment not working",
      descriptionVi: "Máy ECG không khởi động được",
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ===========================================================================
// support.create
// ===========================================================================
describe("support.create", () => {
  it("test_create_inserts_ticket_with_open_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const before = Date.now();
    const ticketId = await asOrg.mutation(api.support.create, {
      subjectVi: "Lỗi phần mềm quản lý",
      descriptionVi: "Hệ thống báo lỗi khi đăng nhập",
      category: "technical",
      priority: "high",
    });

    const ticket = (await t.run(async (ctx) =>
      ctx.db.get(ticketId as any),
    )) as any;
    expect(ticket).not.toBeNull();
    expect(ticket!.status).toBe("open");
    expect(ticket!.organizationId).toBe(orgId);
    expect(ticket!.createdBy).toBe(userId);
    expect(ticket!.category).toBe("technical");
    expect(ticket!.priority).toBe("high");
    expect(ticket!.createdAt).toBeGreaterThanOrEqual(before);
  });

  it("test_create_also_inserts_initial_message", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const ticketId = await asOrg.mutation(api.support.create, {
      subjectVi: "Lỗi kết nối mạng",
      descriptionVi: "Thiết bị không kết nối được mạng nội bộ",
      category: "technical",
      priority: "medium",
    });

    // Check that an initial message was created
    const messages = await t.run(async (ctx) =>
      ctx.db
        .query("supportMessage")
        .filter((q) => q.eq(q.field("ticketId"), ticketId))
        .collect(),
    );
    expect(messages.length).toBe(1);
    expect(messages[0]!.contentVi).toBe(
      "Thiết bị không kết nối được mạng nội bộ",
    );
  });

  it("test_create_creates_audit_log_entry", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.support.create, {
      subjectVi: "Yêu cầu hỗ trợ kỹ thuật",
      descriptionVi: "Cần hỗ trợ cấu hình thiết bị đo",
      category: "technical",
      priority: "low",
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "supportTicket.created"))
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it("test_create_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.support.create, {
        subjectVi: "Lỗi hệ thống",
        descriptionVi: "Hệ thống không hoạt động",
        category: "technical",
        priority: "high",
      }),
    ).rejects.toThrow();
  });

  it("test_create_throws_when_no_org", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    // Authenticated but no organizationId in identity
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.support.create, {
        subjectVi: "Lỗi hệ thống",
        descriptionVi: "Hệ thống không hoạt động",
        category: "technical",
        priority: "medium",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// support.updateStatus
// ===========================================================================
describe("support.updateStatus", () => {
  it("test_updateStatus_open_to_in_progress_is_valid", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId, "open");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.support.updateStatus, {
      ticketId: ticketId as any,
      status: "in_progress",
    });

    const ticket = (await t.run(async (ctx) =>
      ctx.db.get(ticketId as any),
    )) as any;
    expect(ticket!.status).toBe("in_progress");
  });

  it("test_updateStatus_in_progress_to_resolved_is_valid", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId, "in_progress");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.support.updateStatus, {
      ticketId: ticketId as any,
      status: "resolved",
    });

    const ticket = (await t.run(async (ctx) =>
      ctx.db.get(ticketId as any),
    )) as any;
    expect(ticket!.status).toBe("resolved");
  });

  it("test_updateStatus_invalid_transition_throws", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId, "open");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    // open -> resolved is invalid (must go through in_progress first)
    await expect(
      asOrg.mutation(api.support.updateStatus, {
        ticketId: ticketId as any,
        status: "resolved",
      }),
    ).rejects.toThrow();
  });

  it("test_updateStatus_closed_is_terminal", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId, "closed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    // closed -> anything is invalid
    await expect(
      asOrg.mutation(api.support.updateStatus, {
        ticketId: ticketId as any,
        status: "open",
      }),
    ).rejects.toThrow();
  });

  it("test_updateStatus_rejects_cross_org_access", async () => {
    // WHY: Without org verification any authenticated user from an unrelated org
    // can change the status of tickets they have no relationship to —
    // a CRITICAL cross-org write vulnerability.
    const t = convexTest(schema, modules);
    const ownerOrgId = await seedOrganization(t, "SPMET Hospital A");
    const attackerOrgId = await seedOrganization(t, "Unrelated Org B");
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, ownerOrgId, userId, "open");

    const asAttacker = t.withIdentity({
      organizationId: attackerOrgId,
      subject: userId,
    });

    await expect(
      asAttacker.mutation(api.support.updateStatus, {
        ticketId: ticketId as any,
        status: "in_progress",
      }),
    ).rejects.toThrow();
  });

  it("test_updateStatus_creates_audit_log", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId, "open");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.support.updateStatus, {
      ticketId: ticketId as any,
      status: "in_progress",
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "supportTicket.statusUpdated"))
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// support.addMessage
// ===========================================================================
describe("support.addMessage", () => {
  it("test_addMessage_inserts_message", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId, "open");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const before = Date.now();
    const msgId = await asOrg.mutation(api.support.addMessage, {
      ticketId: ticketId as any,
      contentVi: "Chúng tôi cần thêm thông tin về lỗi",
      contentEn: "We need more information about the error",
    });

    const msg = (await t.run(async (ctx) => ctx.db.get(msgId as any))) as any;
    expect(msg).not.toBeNull();
    expect(msg!.contentVi).toBe("Chúng tôi cần thêm thông tin về lỗi");
    expect(msg!.contentEn).toBe("We need more information about the error");
    expect(msg!.ticketId).toBe(ticketId);
    expect(msg!.createdAt).toBeGreaterThanOrEqual(before);
  });

  it("test_addMessage_rejects_message_on_closed_ticket", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId, "closed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.support.addMessage, {
        ticketId: ticketId as any,
        contentVi: "Tin nhắn cho ticket đã đóng",
      }),
    ).rejects.toThrow();
  });

  it("test_addMessage_throws_when_ticket_not_found", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    // Create and then delete a ticket to get a valid ID that no longer exists
    const ticketId = await seedSupportTicket(t, orgId, userId);
    await t.run(async (ctx) => ctx.db.delete(ticketId as any));

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await expect(
      asOrg.mutation(api.support.addMessage, {
        ticketId: ticketId as any,
        contentVi: "Tin nhắn",
      }),
    ).rejects.toThrow();
  });

  it("test_addMessage_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId);

    await expect(
      t.mutation(api.support.addMessage, {
        ticketId: ticketId as any,
        contentVi: "Tin nhắn",
      }),
    ).rejects.toThrow();
  });

  it("test_addMessage_rejects_cross_org_access", async () => {
    // WHY: Without org verification any authenticated user from an unrelated org
    // can inject messages into tickets they have no relationship to —
    // a CRITICAL cross-org write vulnerability.
    const t = convexTest(schema, modules);
    const ownerOrgId = await seedOrganization(t, "SPMET Hospital A");
    const attackerOrgId = await seedOrganization(t, "Unrelated Org B");
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, ownerOrgId, userId);

    const asAttacker = t.withIdentity({
      organizationId: attackerOrgId,
      subject: userId,
    });

    await expect(
      asAttacker.mutation(api.support.addMessage, {
        ticketId: ticketId as any,
        contentVi: "Tin nhắn trái phép từ tổ chức khác",
      }),
    ).rejects.toThrow();
  });

  it("test_addMessage_creates_audit_log_entry", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId);

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    await asOrg.mutation(api.support.addMessage, {
      ticketId: ticketId as any,
      contentVi: "Tin nhắn kiểm tra audit",
    });

    const auditLogs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .filter((q) => q.eq(q.field("action"), "supportTicket.messageAdded"))
        .collect(),
    );
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0]!.resourceType).toBe("supportMessage");
  });
});
