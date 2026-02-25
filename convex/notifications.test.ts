import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedUserForPrefs(t: ReturnType<typeof convexTest>) {
  let userId: string = "";

  await t.run(async (ctx) => {
    userId = await ctx.db.insert("users", {
      name: "Test User",
      email: "test@medilink.vn",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return userId;
}

// ---------------------------------------------------------------------------
// getPreferences
// ---------------------------------------------------------------------------

describe("notifications.getPreferences", () => {
  it("returns null when no preferences record exists", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUserForPrefs(t);

    const result = await t.query(api.notifications.getPreferences, { userId });
    expect(result).toBeNull();
  });

  it("returns preferences when record exists", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUserForPrefs(t);

    // Insert preferences directly
    await t.run(async (ctx) => {
      await ctx.db.insert("notificationPreferences", {
        userId: userId as ReturnType<typeof ctx.db.insert>,
        service_request_new_quote: true,
        service_request_quote_approved: false,
        service_request_quote_rejected: true,
        service_request_started: true,
        service_request_completed: true,
        equipment_maintenance_due: true,
        equipment_status_broken: true,
        consumable_stock_low: false,
        dispute_new_message: true,
        dispute_resolved: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const result = await t.query(api.notifications.getPreferences, { userId });
    expect(result).not.toBeNull();
    expect(result?.service_request_quote_approved).toBe(false);
    expect(result?.consumable_stock_low).toBe(false);
    expect(result?.service_request_new_quote).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updatePreferences
// ---------------------------------------------------------------------------

describe("notifications.updatePreferences", () => {
  it("creates preferences record if none exists (upsert)", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUserForPrefs(t);

    // Verify no prefs exist
    const before = await t.query(api.notifications.getPreferences, { userId });
    expect(before).toBeNull();

    // Update (should create)
    await t.mutation(api.notifications.updatePreferences, {
      userId,
      preferences: { service_request_new_quote: false },
    });

    const after = await t.query(api.notifications.getPreferences, { userId });
    expect(after).not.toBeNull();
    expect(after?.service_request_new_quote).toBe(false);
  });

  it("patches existing preferences record", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUserForPrefs(t);

    // Create initial preferences
    await t.mutation(api.notifications.updatePreferences, {
      userId,
      preferences: {
        service_request_new_quote: true,
        dispute_resolved: true,
      },
    });

    // Update one field
    await t.mutation(api.notifications.updatePreferences, {
      userId,
      preferences: { dispute_resolved: false },
    });

    const result = await t.query(api.notifications.getPreferences, { userId });
    expect(result?.dispute_resolved).toBe(false);
    // Original field should still be there
    expect(result?.service_request_new_quote).toBe(true);
  });
});
