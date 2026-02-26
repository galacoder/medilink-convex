import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
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
      nameVi: "Chẩn đoán",
      nameEn: "Diagnostic",
      organizationId: orgId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { orgId, userId, categoryId };
}

/** Create equipment in "available" status */
async function createEquipment(
  authed: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
  categoryId: string,
) {
  return authed.mutation(api.equipment.create, {
    nameVi: "Máy đo huyết áp",
    nameEn: "Blood pressure monitor",
    categoryId: categoryId as any,
    status: "available",
  });
}

// ---------------------------------------------------------------------------
// Tests: updateStatus — performer not found (Issue #157)
// ---------------------------------------------------------------------------

describe("equipment.updateStatus — performer lookup", () => {
  it("throws bilingual ConvexError when performer user not found", async () => {
    const t = convexTest(schema, modules);
    const { orgId, categoryId } = await seedOrgContext(t);

    // Identity whose subject does NOT match any user email in the DB.
    // requireAuth resolves via JWT orgId path (returns subject as-is),
    // then updateStatus queries by_email with subject — will not find a user.
    const noMatchIdentity = {
      subject: "no-match-subject",
      email: "test@spmet.edu.vn",
      organizationId: orgId,
    };

    const authedOwner = t.withIdentity({
      subject: "test@spmet.edu.vn",
      email: "test@spmet.edu.vn",
      organizationId: orgId,
    });
    const equipmentId = await createEquipment(authedOwner, categoryId);

    const authedNoMatch = t.withIdentity(noMatchIdentity);

    try {
      await authedNoMatch.mutation(api.equipment.updateStatus, {
        id: equipmentId,
        newStatus: "in_use",
      });
      expect.fail("Expected mutation to throw ConvexError");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(ConvexError);
      const convexErr = e as ConvexError<unknown>;
      const raw = convexErr.data;
      const data =
        typeof raw === "string"
          ? (JSON.parse(raw) as { vi: string; en: string })
          : (raw as { vi: string; en: string });
      expect(data.vi).toContain("Không tìm thấy người thực hiện");
      expect(data.en).toContain("Performer user not found");
    }

    // Verify equipment status was NOT changed (Convex rolled back the mutation)
    const equipment = await t.run(async (ctx) => {
      return ctx.db.get(equipmentId);
    });
    expect(equipment?.status).toBe("available");

    // Verify no history entry was created
    const history = await t.run(async (ctx) => {
      return ctx.db
        .query("equipmentHistory")
        .withIndex("by_equipment", (q) => q.eq("equipmentId", equipmentId))
        .collect();
    });
    expect(history).toHaveLength(0);
  });

  it("creates history entry when performer user is found (normal path)", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId, categoryId } = await seedOrgContext(t);

    // subject matches the seeded user's email so by_email lookup succeeds
    const authed = t.withIdentity({
      subject: "test@spmet.edu.vn",
      email: "test@spmet.edu.vn",
      organizationId: orgId,
    });

    const equipmentId = await createEquipment(authed, categoryId);

    await authed.mutation(api.equipment.updateStatus, {
      id: equipmentId,
      newStatus: "in_use",
      notes: "Assigned to student for training",
    });

    // Verify status was updated
    const equipment = await t.run(async (ctx) => {
      return ctx.db.get(equipmentId);
    });
    expect(equipment?.status).toBe("in_use");

    // Verify history entry was created
    const history = await t.run(async (ctx) => {
      return ctx.db
        .query("equipmentHistory")
        .withIndex("by_equipment", (q) => q.eq("equipmentId", equipmentId))
        .collect();
    });
    expect(history).toHaveLength(1);
    expect(history[0]?.actionType).toBe("status_change");
    expect(history[0]?.previousStatus).toBe("available");
    expect(history[0]?.newStatus).toBe("in_use");
    expect(history[0]?.performedBy).toBe(userId);
    expect(history[0]?.notes).toBe("Assigned to student for training");
  });
});
