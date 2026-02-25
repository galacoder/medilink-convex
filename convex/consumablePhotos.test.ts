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

/** Create a consumable for linking photos */
async function createConsumable(
  authed: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
) {
  return authed.mutation(api.consumables.create, {
    nameVi: "Bong gac",
    nameEn: "Gauze",
    unitOfMeasure: "pack",
    categoryType: "disposables" as const,
    currentStock: 100,
    parLevel: 20,
    reorderPoint: 10,
  });
}

// ---------------------------------------------------------------------------
// Tests: savePhoto mutation
// ---------------------------------------------------------------------------

describe("consumablePhotos.savePhoto", () => {
  it("saves a photo record with valid inputs", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await createConsumable(authed);

    // Insert a fake storage entry
    let storageId: string = "";
    await t.run(async (ctx) => {
      storageId = await ctx.storage.store(new Blob(["fake-image"]));
    });

    const result = await authed.mutation(api.consumablePhotos.savePhoto, {
      consumableId: consumableId as any,
      storageId: storageId as any,
      fileName: "test-photo.jpg",
    });

    expect(result).toHaveProperty("photoId");
    expect(result.photoId).toBeTruthy();

    // Verify the record was created
    await t.run(async (ctx) => {
      const photo = await ctx.db.get(result.photoId as any);
      expect(photo).not.toBeNull();
      expect(photo!.fileName).toBe("test-photo.jpg");
      expect(photo!.consumableId).toBe(consumableId);
      expect(photo!.organizationId).toBe(orgId);
      expect(photo!.uploadedBy).toBe(userId);
      expect(photo!.createdAt).toBeTypeOf("number");
      expect(photo!.updatedAt).toBeTypeOf("number");
    });
  });

  it("rejects unauthenticated requests", async () => {
    const t = convexTest(schema, modules);

    // Seed a consumable + storage so validator passes but auth fails
    const { orgId, userId } = await seedOrgContext(t);
    const authedForSetup = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });
    const consumableId = await createConsumable(authedForSetup);

    let storageId: string = "";
    await t.run(async (ctx) => {
      storageId = await ctx.storage.store(new Blob(["fake"]));
    });

    try {
      // Call WITHOUT identity (unauthenticated)
      await t.mutation(api.consumablePhotos.savePhoto, {
        consumableId: consumableId as any,
        storageId: storageId as any,
        fileName: "test.jpg",
      });
      expect.fail("Expected mutation to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
    }
  });

  it("rejects when consumable belongs to different org", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await createConsumable(authed);

    // Create a second org
    let org2Id: string = "";
    await t.run(async (ctx) => {
      org2Id = await ctx.db.insert("organizations", {
        name: "Other Hospital",
        slug: "other-hospital",
        org_type: "hospital",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("users", {
        name: "Other User",
        email: "other@spmet.edu.vn",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("organizationMemberships", {
        orgId: org2Id,
        userId: (
          await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", "other@spmet.edu.vn"))
            .first()
        )!._id,
        role: "owner",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const authed2 = t.withIdentity({
      subject: "user-2",
      email: "other@spmet.edu.vn",
      organizationId: org2Id,
    });

    let storageId: string = "";
    await t.run(async (ctx) => {
      storageId = await ctx.storage.store(new Blob(["fake"]));
    });

    try {
      await authed2.mutation(api.consumablePhotos.savePhoto, {
        consumableId: consumableId as any,
        storageId: storageId as any,
        fileName: "cross-org.jpg",
      });
      expect.fail("Expected mutation to throw for cross-org access");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: listPhotos query
// ---------------------------------------------------------------------------

describe("consumablePhotos.listPhotos", () => {
  it("returns photos for a consumable with URLs", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await createConsumable(authed);

    // Insert storage + photo records directly
    let storageId1: string = "";
    let storageId2: string = "";
    await t.run(async (ctx) => {
      storageId1 = await ctx.storage.store(new Blob(["img1"]));
      storageId2 = await ctx.storage.store(new Blob(["img2"]));

      const now = Date.now();
      await ctx.db.insert("consumablePhotos", {
        consumableId: consumableId as any,
        organizationId: orgId as any,
        storageId: storageId1 as any,
        fileName: "photo1.jpg",
        uploadedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("consumablePhotos", {
        consumableId: consumableId as any,
        organizationId: orgId as any,
        storageId: storageId2 as any,
        fileName: "photo2.png",
        uploadedBy: userId as any,
        createdAt: now + 1,
        updatedAt: now + 1,
      });
    });

    const photos = await authed.query(api.consumablePhotos.listPhotos, {
      consumableId: consumableId as any,
    });

    expect(photos).toHaveLength(2);
    expect(photos[0]).toHaveProperty("url");
    expect(photos[0]).toHaveProperty("fileName");
    expect(photos[0].fileName).toBe("photo1.jpg");
    expect(photos[1].fileName).toBe("photo2.png");
  });

  it("returns empty array when no photos exist", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await createConsumable(authed);

    const photos = await authed.query(api.consumablePhotos.listPhotos, {
      consumableId: consumableId as any,
    });

    expect(photos).toEqual([]);
  });

  it("does not return photos from other orgs consumables", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await createConsumable(authed);

    // Insert a photo for the consumable
    await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["img"]));
      await ctx.db.insert("consumablePhotos", {
        consumableId: consumableId as any,
        organizationId: orgId as any,
        storageId: storageId as any,
        fileName: "org1-photo.jpg",
        uploadedBy: userId as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Create second org and try to query
    let org2Id: string = "";
    await t.run(async (ctx) => {
      org2Id = await ctx.db.insert("organizations", {
        name: "Other Hospital",
        slug: "other-hospital",
        org_type: "hospital",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const user2Id = await ctx.db.insert("users", {
        name: "Other User",
        email: "other@spmet.edu.vn",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("organizationMemberships", {
        orgId: org2Id,
        userId: user2Id,
        role: "owner",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const authed2 = t.withIdentity({
      subject: "user-2",
      email: "other@spmet.edu.vn",
      organizationId: org2Id,
    });

    // Query with the consumable from org1 but identity from org2
    const photos = await authed2.query(api.consumablePhotos.listPhotos, {
      consumableId: consumableId as any,
    });

    // Should return empty because the consumable doesn't belong to org2
    expect(photos).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: deletePhoto mutation
// ---------------------------------------------------------------------------

describe("consumablePhotos.deletePhoto", () => {
  it("deletes photo record and storage", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await createConsumable(authed);

    let storageId: string = "";
    await t.run(async (ctx) => {
      storageId = await ctx.storage.store(new Blob(["img"]));
    });

    const result = await authed.mutation(api.consumablePhotos.savePhoto, {
      consumableId: consumableId as any,
      storageId: storageId as any,
      fileName: "delete-me.jpg",
    });

    // Verify photo exists
    const photosBefore = await authed.query(api.consumablePhotos.listPhotos, {
      consumableId: consumableId as any,
    });
    expect(photosBefore).toHaveLength(1);

    // Delete
    await authed.mutation(api.consumablePhotos.deletePhoto, {
      photoId: result.photoId as any,
    });

    // Verify photo is gone
    const photosAfter = await authed.query(api.consumablePhotos.listPhotos, {
      consumableId: consumableId as any,
    });
    expect(photosAfter).toHaveLength(0);
  });

  it("rejects deleting photo from different org", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const consumableId = await createConsumable(authed);

    let storageId: string = "";
    await t.run(async (ctx) => {
      storageId = await ctx.storage.store(new Blob(["img"]));
    });

    const result = await authed.mutation(api.consumablePhotos.savePhoto, {
      consumableId: consumableId as any,
      storageId: storageId as any,
      fileName: "protected.jpg",
    });

    // Create second org
    let org2Id: string = "";
    await t.run(async (ctx) => {
      org2Id = await ctx.db.insert("organizations", {
        name: "Other Hospital",
        slug: "other-hospital",
        org_type: "hospital",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const user2Id = await ctx.db.insert("users", {
        name: "Other User",
        email: "other@spmet.edu.vn",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("organizationMemberships", {
        orgId: org2Id,
        userId: user2Id,
        role: "owner",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const authed2 = t.withIdentity({
      subject: "user-2",
      email: "other@spmet.edu.vn",
      organizationId: org2Id,
    });

    try {
      await authed2.mutation(api.consumablePhotos.deletePhoto, {
        photoId: result.photoId as any,
      });
      expect.fail("Expected mutation to throw for cross-org delete");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
    }
  });

  it("rejects deleting non-existent photo", async () => {
    const t = convexTest(schema, modules);
    const { orgId, userId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    // Create then delete a photo to get a valid-format but non-existent ID
    const consumableId = await createConsumable(authed);
    let storageId: string = "";
    await t.run(async (ctx) => {
      storageId = await ctx.storage.store(new Blob(["img"]));
    });
    const result = await authed.mutation(api.consumablePhotos.savePhoto, {
      consumableId: consumableId as any,
      storageId: storageId as any,
      fileName: "temp.jpg",
    });
    // Delete it directly from DB so the ID is valid format but non-existent
    await t.run(async (ctx) => {
      await ctx.db.delete(result.photoId as any);
    });

    try {
      await authed.mutation(api.consumablePhotos.deletePhoto, {
        photoId: result.photoId as any,
      });
      expect.fail("Expected mutation to throw for non-existent photo");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: generateUploadUrl mutation
// ---------------------------------------------------------------------------

describe("consumablePhotos.generateUploadUrl", () => {
  it("returns a URL string when authenticated", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrgContext(t);
    const authed = t.withIdentity({ ...TEST_IDENTITY, organizationId: orgId });

    const url = await authed.mutation(api.consumablePhotos.generateUploadUrl, {});

    expect(url).toBeTypeOf("string");
    expect(url).toBeTruthy();
  });

  it("rejects unauthenticated requests", async () => {
    const t = convexTest(schema, modules);

    try {
      await t.mutation(api.consumablePhotos.generateUploadUrl, {});
      expect.fail("Expected mutation to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
    }
  });
});
