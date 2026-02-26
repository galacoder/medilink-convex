import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Identity with a valid organizationId claim */
const TEST_IDENTITY = {
  subject: "user-1",
  email: "test@spmet.edu.vn",
  organizationId: "placeholder", // replaced per-test after org insert
};

/** Seed an org + user + membership so requireAuth resolves */
async function seedOrgContext(t: ReturnType<typeof convexTest>) {
  let orgId: string = "";
  let userId: string = "";

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
  });

  return { orgId, userId };
}

/** Base valid args for create mutation */
function validCreateArgs(overrides: Record<string, unknown> = {}) {
  return {
    nameVi: "Bong gac",
    nameEn: "Gauze",
    unitOfMeasure: "pack",
    categoryType: "disposables" as const,
    currentStock: 100,
    parLevel: 20,
    reorderPoint: 10,
    ...overrides,
  };
}

/**
 * Helper to extract bilingual error data from ConvexError.
 * convex-test wraps errors — this safely extracts the data payload.
 */
async function expectBilingualError(
  promise: Promise<unknown>,
  viSubstring: string,
  enSubstring: string,
) {
  try {
    await promise;
    expect.fail("Expected mutation to throw ConvexError");
  } catch (e: unknown) {
    expect(e).toBeInstanceOf(ConvexError);
    const convexErr = e as ConvexError<unknown>;
    // convex-test serializes ConvexError.data as a JSON string
    const raw = convexErr.data;
    const data =
      typeof raw === "string"
        ? (JSON.parse(raw) as { vi: string; en: string })
        : (raw as { vi: string; en: string });
    expect(data.vi).toContain(viSubstring);
    expect(data.en).toContain(enSubstring);
  }
}

// ---------------------------------------------------------------------------
// Tests: create mutation -- bounds validation
// ---------------------------------------------------------------------------

describe("consumables.create bounds validation", () => {
  it("rejects currentStock: -1 with bilingual error", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    await expectBilingualError(
      authed.mutation(api.consumables.create, validCreateArgs({ currentStock: -1 })),
      "không thể âm",
      "cannot be negative",
    );
  });

  it("rejects unitCost: -0.01 with bilingual error", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    await expectBilingualError(
      authed.mutation(api.consumables.create, validCreateArgs({ unitCost: -0.01 })),
      "không thể âm",
      "cannot be negative",
    );
  });

  it("rejects reorderPoint: -5 with bilingual error", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    await expectBilingualError(
      authed.mutation(api.consumables.create, validCreateArgs({ reorderPoint: -5 })),
      "không thể âm",
      "cannot be negative",
    );
  });

  it("rejects parLevel < reorderPoint with bilingual error", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    await expectBilingualError(
      authed.mutation(
        api.consumables.create,
        validCreateArgs({ parLevel: 5, reorderPoint: 10 }),
      ),
      "par",
      "Par level",
    );
  });

  it("rejects maxLevel < parLevel with bilingual error", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    await expectBilingualError(
      authed.mutation(
        api.consumables.create,
        validCreateArgs({ maxLevel: 5, parLevel: 20, reorderPoint: 10 }),
      ),
      "tối đa",
      "Max level",
    );
  });

  it("succeeds with valid inputs (all non-negative, correct ordering)", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const id = await authed.mutation(
      api.consumables.create,
      validCreateArgs({
        currentStock: 50,
        reorderPoint: 10,
        parLevel: 20,
        maxLevel: 100,
        unitCost: 5.5,
      }),
    );
    expect(id).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: update mutation -- bounds validation
// ---------------------------------------------------------------------------

describe("consumables.update bounds validation", () => {
  it("rejects negative reorderPoint in update", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await authed.mutation(
      api.consumables.create,
      validCreateArgs(),
    );

    await expectBilingualError(
      authed.mutation(api.consumables.update, {
        id: consumableId,
        reorderPoint: -1,
      }),
      "không thể âm",
      "cannot be negative",
    );
  });

  it("rejects negative unitCost in update", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await authed.mutation(
      api.consumables.create,
      validCreateArgs(),
    );

    await expectBilingualError(
      authed.mutation(api.consumables.update, {
        id: consumableId,
        unitCost: -0.5,
      }),
      "không thể âm",
      "cannot be negative",
    );
  });

  it("rejects parLevel < reorderPoint in update", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await authed.mutation(
      api.consumables.create,
      validCreateArgs({ reorderPoint: 10, parLevel: 20 }),
    );

    await expectBilingualError(
      authed.mutation(api.consumables.update, {
        id: consumableId,
        parLevel: 5,
        reorderPoint: 10,
      }),
      "par",
      "Par level",
    );
  });

  it("rejects maxLevel < parLevel in update", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await authed.mutation(
      api.consumables.create,
      validCreateArgs({ parLevel: 20, reorderPoint: 10 }),
    );

    await expectBilingualError(
      authed.mutation(api.consumables.update, {
        id: consumableId,
        maxLevel: 10,
        parLevel: 20,
      }),
      "tối đa",
      "Max level",
    );
  });

  it("succeeds when updating valid fields", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await authed.mutation(
      api.consumables.create,
      validCreateArgs(),
    );

    const result = await authed.mutation(api.consumables.update, {
      id: consumableId,
      reorderPoint: 15,
      parLevel: 25,
      maxLevel: 200,
      unitCost: 10,
    });
    expect(result).toBe(consumableId);
  });
});
