/**
 * Convex functions for consumable photo management.
 *
 * WHY: Photos are stored separately from the consumables table following the
 * append-only convention. Each photo maps a Convex storage ID to a consumable,
 * enabling gallery display and deletion without modifying the consumables schema.
 *
 * Upload flow: client calls generateUploadUrl → uploads to URL → calls savePhoto with storageId
 * Delete flow: deletePhoto removes the DB record and calls storage.delete(storageId)
 *
 * vi: "Chức năng ảnh vật tư tiêu hao" / en: "Consumable photo functions"
 */
import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// Helper: extract authenticated organizationId from JWT identity
// vi: "Lấy ID tổ chức từ phiên đăng nhập" / en: "Get organizationId from session"
// ---------------------------------------------------------------------------

async function requireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<{ subject: string; organizationId: Id<"organizations">; userId: Id<"users"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError(
      "Không có quyền truy cập (Not authenticated)",
    );
  }

  const jwtOrgId = identity.organizationId as Id<"organizations"> | null;

  // Resolve userId from email — needed for uploadedBy field
  const email = identity.email as string | null | undefined;
  const tokenIdentifier = identity.tokenIdentifier as string | null | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null;

  if (tokenIdentifier) {
    user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();
  }

  if (!user && email) {
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    // Backfill tokenIdentifier for next time (mutation ctx only).
    if (user && tokenIdentifier && "patch" in ctx.db) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (ctx.db as any).patch(user._id, { tokenIdentifier });
    }
  }

  if (!user) {
    throw new ConvexError(
      "Không tìm thấy người dùng (User not found)",
    );
  }

  // Resolve organizationId
  let resolvedOrgId = jwtOrgId;
  if (!resolvedOrgId) {
    const membership = await ctx.db
      .query("organizationMemberships")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (membership) {
      resolvedOrgId = membership.orgId as Id<"organizations">;
    }
  }

  if (!resolvedOrgId) {
    throw new ConvexError(
      "Không tìm thấy tổ chức trong phiên đăng nhập (No active organization in session)",
    );
  }

  return {
    subject: identity.subject as string,
    organizationId: resolvedOrgId,
    userId: user._id as Id<"users">,
  };
}

// ===========================================================================
// MUTATIONS
// vi: "Đột biến (ghi)" / en: "Mutations (write)"
// ===========================================================================

/**
 * Generates a pre-signed upload URL for Convex file storage.
 *
 * WHY: The client needs a URL to upload the file directly to Convex storage
 * before creating the photo record. This two-step upload pattern is the
 * standard Convex file storage workflow.
 *
 * vi: "Tạo URL tải lên" / en: "Generate upload URL"
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Require authentication — only org members can upload
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Saves a photo record linking a Convex storage ID to a consumable.
 * Validates that the consumable belongs to the caller's organization.
 *
 * vi: "Lưu ảnh vật tư" / en: "Save consumable photo"
 */
export const savePhoto = mutation({
  args: {
    consumableId: v.id("consumables"),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const { organizationId, userId } = await requireAuth(ctx);

    // Verify consumable belongs to caller's org
    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable || consumable.organizationId !== organizationId) {
      throw new ConvexError(
        "Vật tư không tồn tại hoặc không thuộc tổ chức này (Consumable not found or does not belong to this organization)",
      );
    }

    const now = Date.now();
    const photoId = await ctx.db.insert("consumablePhotos", {
      consumableId: args.consumableId,
      organizationId,
      storageId: args.storageId,
      fileName: args.fileName,
      uploadedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Get the URL for the newly uploaded photo
    const url = await ctx.storage.getUrl(args.storageId);

    return { photoId, url };
  },
});

/**
 * Deletes a photo record and its associated storage file.
 * Validates that the photo belongs to the caller's organization.
 *
 * vi: "Xóa ảnh vật tư" / en: "Delete consumable photo"
 */
export const deletePhoto = mutation({
  args: {
    photoId: v.id("consumablePhotos"),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new ConvexError(
        "Ảnh không tồn tại (Photo not found)",
      );
    }

    if (photo.organizationId !== organizationId) {
      throw new ConvexError(
        "Ảnh không thuộc tổ chức này (Photo does not belong to this organization)",
      );
    }

    // Delete the storage file
    await ctx.storage.delete(photo.storageId);

    // Delete the DB record
    await ctx.db.delete(args.photoId);
  },
});

// ===========================================================================
// QUERIES (Read-only)
// vi: "Truy vấn (chỉ đọc)" / en: "Queries (read-only)"
// ===========================================================================

/**
 * Lists all photos for a consumable, with resolved storage URLs.
 * Returns empty array if the consumable doesn't belong to the caller's org.
 *
 * vi: "Danh sách ảnh vật tư" / en: "List consumable photos"
 */
export const listPhotos = query({
  args: {
    consumableId: v.id("consumables"),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireAuth(ctx);

    // Verify the consumable belongs to the caller's org
    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable || consumable.organizationId !== organizationId) {
      return [];
    }

    const photos = await ctx.db
      .query("consumablePhotos")
      .withIndex("by_consumable", (q) => q.eq("consumableId", args.consumableId))
      .collect();

    // Resolve storage URLs for each photo
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const url = await ctx.storage.getUrl(photo.storageId);
        return { ...photo, url };
      }),
    );

    return photosWithUrls;
  },
});
