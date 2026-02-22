/**
 * Convex file storage for consumable photos.
 *
 * WHY: Consumables need photo documentation for inventory management.
 * The consumables table is append-only, so photos are tracked in a separate
 * consumablePhotos table, mapping Convex storage IDs to consumable IDs.
 *
 * Flow:
 *   1. Client calls generateUploadUrl to get a pre-signed URL
 *   2. Client uploads file directly to Convex storage
 *   3. Client calls savePhoto to link storageId to the consumable
 *   4. Client calls listPhotos to display the photo gallery
 *   5. Admin calls deletePhoto to remove a photo
 *
 * vi: "Ảnh vật tư tiêu hao" / en: "Consumable photos"
 */

import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// ---------------------------------------------------------------------------

/**
 * Gets the authenticated user identity and extracts userId.
 * Throws a bilingual ConvexError if not authenticated.
 *
 * vi: "Xác thực người dùng" / en: "Authenticate user"
 */
async function localRequireAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<{ userId: string; organizationId: Id<"organizations"> | null }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }
  return {
    userId: identity.subject as string,
    organizationId: (identity.organizationId as Id<"organizations"> | null) ?? null,
  };
}

/**
 * Like localRequireAuth but also asserts an active organization session.
 *
 * vi: "Xác thực tổ chức" / en: "Require organization auth"
 */
async function localRequireOrgAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
}): Promise<{ userId: string; organizationId: Id<"organizations"> }> {
  const auth = await localRequireAuth(ctx);
  if (!auth.organizationId) {
    throw new ConvexError({
      message:
        "Không tìm thấy tổ chức. Vui lòng chọn tổ chức trước khi thực hiện thao tác này. (Organization not found. Please select an organization before performing this action.)",
      code: "NO_ACTIVE_ORGANIZATION",
    });
  }
  return auth as { userId: string; organizationId: Id<"organizations"> };
}

// ---------------------------------------------------------------------------
// Actions (file storage operations require action context)
// ---------------------------------------------------------------------------

/**
 * Generates a pre-signed URL for direct file upload to Convex storage.
 *
 * WHY: Convex file storage requires a pre-signed URL generated server-side.
 * The client uses this URL to upload the file directly, then calls savePhoto
 * to associate the uploaded file with a consumable record.
 *
 * vi: "Tạo URL tải lên ảnh" / en: "Generate photo upload URL"
 */
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message:
          "Xác thực thất bại. Vui lòng đăng nhập lại. (Authentication required. Please sign in.)",
        code: "UNAUTHENTICATED",
      });
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Saves a photo record linking a Convex storage ID to a consumable.
 *
 * Call this AFTER uploading the file using the URL from generateUploadUrl.
 * Returns the photo record ID and the public URL for the uploaded file.
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
    // 1. Authenticate with org context
    const auth = await localRequireOrgAuth(ctx);

    // 2. Verify the consumable belongs to the org
    // WHY: Without this check any org member can attach photos to consumables
    // from other organizations — a CRITICAL cross-org write vulnerability.
    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable) {
      throw new ConvexError({
        message: "Không tìm thấy vật tư. (Consumable not found.)",
        code: "CONSUMABLE_NOT_FOUND",
      });
    }

    if (consumable.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Không có quyền thêm ảnh vào vật tư này. (You do not have access to add photos to this consumable.)",
        code: "FORBIDDEN",
      });
    }

    // 3. Insert the photo record
    const now = Date.now();
    const photoId = await ctx.db.insert("consumablePhotos", {
      consumableId: args.consumableId,
      organizationId: auth.organizationId,
      storageId: args.storageId,
      fileName: args.fileName,
      uploadedBy: auth.userId as Id<"users">,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Get the public URL for immediate display
    const url = await ctx.storage.getUrl(args.storageId);

    return { photoId, url };
  },
});

/**
 * Deletes a consumable photo record and removes the file from storage.
 *
 * vi: "Xóa ảnh vật tư" / en: "Delete consumable photo"
 */
export const deletePhoto = mutation({
  args: {
    photoId: v.id("consumablePhotos"),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate with org context
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the photo record
    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new ConvexError({
        message: "Không tìm thấy ảnh. (Photo not found.)",
        code: "PHOTO_NOT_FOUND",
      });
    }

    // 3. Verify org ownership
    // WHY: Without this check any org member can delete photos from other orgs.
    if (photo.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Không có quyền xóa ảnh này. (You do not have access to delete this photo.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Delete the storage file
    await ctx.storage.delete(photo.storageId);

    // 5. Delete the photo record
    await ctx.db.delete(args.photoId);

    return args.photoId;
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists all photos for a consumable item, enriched with public URLs.
 *
 * vi: "Danh sách ảnh vật tư" / en: "List consumable photos"
 */
export const listPhotos = query({
  args: {
    consumableId: v.id("consumables"),
  },
  handler: async (ctx, args) => {
    // Authenticate with org context (required for ownership check)
    const auth = await localRequireOrgAuth(ctx);

    // Verify the consumable belongs to the org
    const consumable = await ctx.db.get(args.consumableId);
    if (!consumable) {
      return [];
    }

    if (consumable.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Không có quyền xem ảnh của vật tư này. (You do not have access to photos for this consumable.)",
        code: "FORBIDDEN",
      });
    }

    // Get photos ordered by upload time
    const photos = await ctx.db
      .query("consumablePhotos")
      .withIndex("by_consumable", (q) => q.eq("consumableId", args.consumableId))
      .order("asc")
      .collect();

    // Enrich with public URLs
    const enriched = await Promise.all(
      photos.map(async (photo) => {
        const url = await ctx.storage.getUrl(photo.storageId);
        return {
          ...photo,
          url,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Gets the public URL for a single storage file.
 *
 * WHY: Used when a storageId is known but the full photo record is not needed.
 *
 * vi: "Lấy URL ảnh từ ID lưu trữ" / en: "Get photo URL from storage ID"
 */
export const getPhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
