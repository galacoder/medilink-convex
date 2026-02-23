/**
 * Integration tests for support ticket query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các truy vấn phiếu hỗ trợ" / en: "Support ticket query integration tests"
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
// support.listByOrg
// ===========================================================================
describe("support.listByOrg", () => {
  it("test_listByOrg_returns_all_org_tickets", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    // Seed 3 tickets for the org
    await seedSupportTicket(t, orgId, userId, "open");
    await seedSupportTicket(t, orgId, userId, "in_progress");
    await seedSupportTicket(t, orgId, userId, "resolved");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const tickets = await asOrg.query(api.support.listByOrg, {});
    expect(tickets.length).toBe(3);
  });

  it("test_listByOrg_filters_by_status", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);

    await seedSupportTicket(t, orgId, userId, "open");
    await seedSupportTicket(t, orgId, userId, "open");
    await seedSupportTicket(t, orgId, userId, "closed");

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const openTickets = await asOrg.query(api.support.listByOrg, {
      status: "open",
    });
    expect(openTickets.length).toBe(2);
    for (const ticket of openTickets) {
      expect((ticket as any).status).toBe("open");
    }
  });

  it("test_listByOrg_excludes_other_org_tickets", async () => {
    const t = convexTest(schema, modules);
    const orgA = await seedOrganization(t, "Hospital A");
    const orgB = await seedOrganization(t, "Hospital B");
    const userId = await seedUser(t);

    // Seed tickets for both orgs
    await seedSupportTicket(t, orgA, userId, "open");
    await seedSupportTicket(t, orgB, userId, "open");
    await seedSupportTicket(t, orgB, userId, "open");

    const asOrgA = t.withIdentity({ organizationId: orgA, subject: userId });

    const tickets = await asOrgA.query(api.support.listByOrg, {});
    // Should only return OrgA's ticket
    expect(tickets.length).toBe(1);
  });

  it("test_listByOrg_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(t.query(api.support.listByOrg, {})).rejects.toThrow();
  });
});

// ===========================================================================
// support.getById
// ===========================================================================
describe("support.getById", () => {
  it("test_getById_returns_ticket_with_messages", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, orgId, userId, "open");

    // Add a message
    await t.run(async (ctx) => {
      const now = Date.now();
      return ctx.db.insert("supportMessage", {
        ticketId: ticketId as any,
        authorId: userId as any,
        contentVi: "Mô tả vấn đề chi tiết",
        createdAt: now,
        updatedAt: now,
      });
    });

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const result = (await asOrg.query(api.support.getById, {
      ticketId: ticketId as any,
    })) as any;

    expect(result).not.toBeNull();
    expect(result!.status).toBe("open");
    expect(result!.messages).toBeDefined();
    expect(result!.messages.length).toBe(1);
    expect(result!.messages[0].contentVi).toBe("Mô tả vấn đề chi tiết");
  });

  it("test_getById_returns_null_for_nonexistent_ticket", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userId = await seedUser(t);
    // Create and delete to get a valid ID that no longer exists
    const ticketId = await seedSupportTicket(t, orgId, userId);
    await t.run(async (ctx) => ctx.db.delete(ticketId as any));

    const asOrg = t.withIdentity({ organizationId: orgId, subject: userId });

    const result = await asOrg.query(api.support.getById, {
      ticketId: ticketId as any,
    });
    expect(result).toBeNull();
  });

  it("test_getById_rejects_cross_org_access", async () => {
    // WHY: Without org verification any authenticated user can read tickets from
    // any organization by guessing IDs — a CRITICAL cross-org data leak.
    const t = convexTest(schema, modules);
    const ownerOrgId = await seedOrganization(t, "Hospital A");
    const attackerOrgId = await seedOrganization(t, "Unrelated Org B");
    const userId = await seedUser(t);
    const ticketId = await seedSupportTicket(t, ownerOrgId, userId, "open");

    const asAttacker = t.withIdentity({
      organizationId: attackerOrgId,
      subject: userId,
    });

    await expect(
      asAttacker.query(api.support.getById, {
        ticketId: ticketId as any,
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// support.listByUser
// ===========================================================================
describe("support.listByUser", () => {
  it("test_listByUser_returns_users_own_tickets", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrganization(t);
    const userA = await seedUser(t, "usera@spmet.edu.vn");
    const userB = await seedUser(t, "userb@spmet.edu.vn");

    // Seed tickets for both users
    await seedSupportTicket(t, orgId, userA, "open");
    await seedSupportTicket(t, orgId, userA, "closed");
    await seedSupportTicket(t, orgId, userB, "open");

    const asUserA = t.withIdentity({ organizationId: orgId, subject: userA });

    const tickets = await asUserA.query(api.support.listByUser, {});
    // Should only return UserA's 2 tickets
    expect(tickets.length).toBe(2);
    for (const ticket of tickets) {
      expect((ticket as any).createdBy).toBe(userA);
    }
  });

  it("test_listByUser_throws_when_unauthenticated", async () => {
    const t = convexTest(schema, modules);

    await expect(t.query(api.support.listByUser, {})).rejects.toThrow();
  });
});
