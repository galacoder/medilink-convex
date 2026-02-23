/**
 * Integration tests for notification query functions.
 * Uses convex-test to exercise queries against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các truy vấn thông báo" / en: "Notification query integration tests"
 */
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedUser(
  t: ReturnType<typeof convexTest>,
  email = "staff@spmet.edu.vn",
  name = "Staff User",
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("users", {
      name,
      email,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedNotification(
  t: ReturnType<typeof convexTest>,
  userId: string,
  overrides: Partial<{
    type: string;
    titleVi: string;
    titleEn: string;
    bodyVi: string;
    bodyEn: string;
    read: boolean;
    createdAt: number;
  }> = {},
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("notifications", {
      userId: userId as any,
      type: overrides.type ?? "service_request_new_quote",
      titleVi: overrides.titleVi ?? "Tiêu đề thông báo",
      titleEn: overrides.titleEn ?? "Notification title",
      bodyVi: overrides.bodyVi ?? "Nội dung thông báo.",
      bodyEn: overrides.bodyEn ?? "Notification body.",
      read: overrides.read ?? false,
      createdAt: overrides.createdAt ?? now,
      updatedAt: now,
    } as any);
  });
}

// ---------------------------------------------------------------------------
// notifications.listForUser
// ---------------------------------------------------------------------------
describe("notifications.listForUser", () => {
  it("test_listForUser_returns_empty_array_for_new_user", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    const result = await t.query(api.notifications.listForUser, {
      userId: userId as string,
    });

    expect(result).toEqual([]);
  });

  it("test_listForUser_returns_all_user_notifications", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    await seedNotification(t, userId as string, {
      type: "service_request_new_quote",
      titleEn: "New quote",
    });
    await seedNotification(t, userId as string, {
      type: "equipment_maintenance_due",
      titleEn: "Maintenance due",
    });

    const result = await t.query(api.notifications.listForUser, {
      userId: userId as string,
    });

    expect(result.length).toBe(2);
  });

  it("test_listForUser_only_returns_own_notifications", async () => {
    const t = convexTest(schema, modules);
    const userId1 = await seedUser(t, "user1@spmet.edu.vn", "User 1");
    const userId2 = await seedUser(t, "user2@spmet.edu.vn", "User 2");

    await seedNotification(t, userId1 as string);
    await seedNotification(t, userId2 as string);
    await seedNotification(t, userId2 as string);

    const result1 = await t.query(api.notifications.listForUser, {
      userId: userId1 as string,
    });
    const result2 = await t.query(api.notifications.listForUser, {
      userId: userId2 as string,
    });

    expect(result1.length).toBe(1);
    expect(result2.length).toBe(2);
  });

  it("test_listForUser_returns_notifications_ordered_newest_first", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const now = Date.now();

    await seedNotification(t, userId as string, {
      titleEn: "Old notification",
      createdAt: now - 10000,
    });
    await seedNotification(t, userId as string, {
      titleEn: "New notification",
      createdAt: now,
    });

    const result = await t.query(api.notifications.listForUser, {
      userId: userId as string,
    });

    // Newest first
    expect(result[0]?.titleEn).toBe("New notification");
    expect(result[1]?.titleEn).toBe("Old notification");
  });

  it("test_listForUser_returns_unread_count", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    await seedNotification(t, userId as string, { read: false });
    await seedNotification(t, userId as string, { read: false });
    await seedNotification(t, userId as string, { read: true });

    const result = await t.query(api.notifications.listForUser, {
      userId: userId as string,
    });

    const unreadCount = result.filter((n) => !n.read).length;
    expect(unreadCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// notifications.getPreferences
// ---------------------------------------------------------------------------
describe("notifications.getPreferences", () => {
  it("test_getPreferences_returns_null_when_no_preferences_set", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    const result = await t.query(api.notifications.getPreferences, {
      userId: userId as string,
    });

    expect(result).toBeNull();
  });

  it("test_getPreferences_returns_preferences_after_update", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    // Set preferences via mutation
    await t.mutation(api.notifications.updatePreferences, {
      userId: userId as string,
      preferences: {
        service_request_new_quote: true,
        dispute_resolved: false,
      },
    });

    const result = await t.query(api.notifications.getPreferences, {
      userId: userId as string,
    });

    expect(result).not.toBeNull();
    expect(result?.service_request_new_quote).toBe(true);
    expect(result?.dispute_resolved).toBe(false);
  });
});
