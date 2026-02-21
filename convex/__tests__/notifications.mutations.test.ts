/**
 * Integration tests for notification mutation functions.
 * Uses convex-test to exercise mutations against an in-memory Convex backend.
 *
 * vi: "Kiểm tra tích hợp các đột biến thông báo" / en: "Notification mutation integration tests"
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

// ---------------------------------------------------------------------------
// notifications.create
// ---------------------------------------------------------------------------
describe("notifications.create", () => {
  it("test_create_notification_succeeds_with_valid_input", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    await t.run(async (ctx) => {
      const notifId = await ctx.db.insert("notifications", {
        userId,
        type: "service_request_new_quote",
        titleVi: "Báo giá mới nhận được",
        titleEn: "New quote received",
        bodyVi: "Bạn có một báo giá mới.",
        bodyEn: "You have a new quote.",
        read: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      expect(notifId).toBeTruthy();
    });
  });

  it("test_create_notification_via_api_mutation", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    const notifId = await t.mutation(api.notifications.create, {
      userId: userId as string,
      type: "equipment_maintenance_due",
      titleVi: "Bảo trì thiết bị đến hạn",
      titleEn: "Equipment maintenance due",
      bodyVi: "Thiết bị cần bảo trì trong 7 ngày.",
      bodyEn: "Equipment requires maintenance in 7 days.",
    });

    expect(notifId).toBeTruthy();
  });

  it("test_create_notification_with_metadata", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    const notifId = await t.mutation(api.notifications.create, {
      userId: userId as string,
      type: "consumable_stock_low",
      titleVi: "Vật tư dưới mức tối thiểu",
      titleEn: "Consumable stock low",
      bodyVi: "Găng tay y tế còn 10 hộp.",
      bodyEn: "Medical gloves: 10 boxes remaining.",
      metadata: { consumableId: "cons_123", currentStock: 10, minStock: 20 },
    });

    expect(notifId).toBeTruthy();

    // Verify metadata is stored
    const stored = await t.run(async (ctx) => ctx.db.get(notifId));
    expect(stored?.metadata).toEqual({
      consumableId: "cons_123",
      currentStock: 10,
      minStock: 20,
    });
  });

  it("test_create_notification_defaults_to_unread", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    const notifId = await t.mutation(api.notifications.create, {
      userId: userId as string,
      type: "dispute_resolved",
      titleVi: "Tranh chấp đã được giải quyết",
      titleEn: "Dispute resolved",
      bodyVi: "Tranh chấp của bạn đã được giải quyết.",
      bodyEn: "Your dispute has been resolved.",
    });

    const stored = await t.run(async (ctx) => ctx.db.get(notifId));
    expect(stored?.read).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// notifications.markRead
// ---------------------------------------------------------------------------
describe("notifications.markRead", () => {
  it("test_markRead_marks_single_notification_as_read", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    // Create a notification
    const notifId = await t.mutation(api.notifications.create, {
      userId: userId as string,
      type: "service_request_completed",
      titleVi: "Dịch vụ hoàn thành",
      titleEn: "Service completed",
      bodyVi: "Dịch vụ đã hoàn thành.",
      bodyEn: "Service has been completed.",
    });

    // Verify it's unread
    const beforeRead = await t.run(async (ctx) => ctx.db.get(notifId));
    expect(beforeRead?.read).toBe(false);

    // Mark as read
    await t.mutation(api.notifications.markRead, {
      notificationId: notifId as string,
    });

    // Verify it's now read
    const afterRead = await t.run(async (ctx) => ctx.db.get(notifId));
    expect(afterRead?.read).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// notifications.markAllRead
// ---------------------------------------------------------------------------
describe("notifications.markAllRead", () => {
  it("test_markAllRead_marks_all_user_notifications_as_read", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    // Create multiple notifications
    await t.mutation(api.notifications.create, {
      userId: userId as string,
      type: "service_request_new_quote",
      titleVi: "Báo giá 1",
      titleEn: "Quote 1",
      bodyVi: "Báo giá mới.",
      bodyEn: "New quote.",
    });
    await t.mutation(api.notifications.create, {
      userId: userId as string,
      type: "equipment_status_broken",
      titleVi: "Thiết bị hỏng",
      titleEn: "Equipment broken",
      bodyVi: "Thiết bị đã bị hỏng.",
      bodyEn: "Equipment is broken.",
    });

    // Mark all as read
    await t.mutation(api.notifications.markAllRead, {
      userId: userId as string,
    });

    // Verify all are read
    const allNotifs = await t.run(async (ctx) =>
      ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(allNotifs.length).toBe(2);
    expect(allNotifs.every((n) => n.read)).toBe(true);
  });

  it("test_markAllRead_only_affects_target_user", async () => {
    const t = convexTest(schema, modules);
    const userId1 = await seedUser(t, "user1@spmet.edu.vn", "User 1");
    const userId2 = await seedUser(t, "user2@spmet.edu.vn", "User 2");

    // Create notification for user2
    const notifId2 = await t.mutation(api.notifications.create, {
      userId: userId2 as string,
      type: "dispute_new_message",
      titleVi: "Tin nhắn tranh chấp mới",
      titleEn: "New dispute message",
      bodyVi: "Có tin nhắn mới.",
      bodyEn: "New message received.",
    });

    // Mark all read for user1 only
    await t.mutation(api.notifications.markAllRead, {
      userId: userId1 as string,
    });

    // user2's notification should still be unread
    const notif2 = await t.run(async (ctx) => ctx.db.get(notifId2));
    expect(notif2?.read).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// notifications.updatePreferences
// ---------------------------------------------------------------------------
describe("notifications.updatePreferences", () => {
  it("test_updatePreferences_creates_new_preferences_record", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    await t.mutation(api.notifications.updatePreferences, {
      userId: userId as string,
      preferences: {
        service_request_new_quote: false,
        equipment_maintenance_due: true,
      },
    });

    const prefs = await t.run(async (ctx) =>
      ctx.db
        .query("notificationPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first(),
    );

    expect(prefs).not.toBeNull();
    expect(prefs?.service_request_new_quote).toBe(false);
    expect(prefs?.equipment_maintenance_due).toBe(true);
  });

  it("test_updatePreferences_updates_existing_record", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    // First update
    await t.mutation(api.notifications.updatePreferences, {
      userId: userId as string,
      preferences: { service_request_new_quote: false },
    });

    // Second update with different preferences
    await t.mutation(api.notifications.updatePreferences, {
      userId: userId as string,
      preferences: { service_request_new_quote: true, dispute_resolved: false },
    });

    // Only one preferences record should exist
    const allPrefs = await t.run(async (ctx) =>
      ctx.db
        .query("notificationPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(allPrefs.length).toBe(1);
    expect(allPrefs[0]?.service_request_new_quote).toBe(true);
    expect(allPrefs[0]?.dispute_resolved).toBe(false);
  });
});
