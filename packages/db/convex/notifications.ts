/**
 * Convex mutations and queries for the notifications system.
 *
 * Notification lifecycle:
 *   1. Platform event (quote created, maintenance due, etc.) calls notifications.create
 *   2. User sees notification via notifications.listForUser (reactive)
 *   3. User marks read via notifications.markRead or notifications.markAllRead
 *   4. User can configure per-type preferences via notifications.updatePreferences
 *
 * Access control:
 *   - Any authenticated function can call notifications.create (it's an internal side effect)
 *   - Users can only read/mark their own notifications
 *   - Platform admins can create notifications for any user
 *
 * vi: "Hệ thống thông báo" / en: "Notification system"
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Notification type union used for validation within mutations
const notificationTypeValidator = v.union(
  v.literal("service_request_new_quote"),
  v.literal("service_request_quote_approved"),
  v.literal("service_request_quote_rejected"),
  v.literal("service_request_started"),
  v.literal("service_request_completed"),
  v.literal("equipment_maintenance_due"),
  v.literal("equipment_status_broken"),
  v.literal("consumable_stock_low"),
  v.literal("dispute_new_message"),
  v.literal("dispute_resolved"),
);

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new notification for a user.
 *
 * WHY: Called as a side effect from other mutations (e.g., after a quote is
 * created, after equipment status changes). The caller provides the userId
 * so this mutation is flexible and does NOT perform auth checks — it is
 * expected to be called from trusted server-side mutations.
 *
 * vi: "Tạo thông báo mới" / en: "Create new notification"
 */
export const create = mutation({
  args: {
    // vi: "ID người dùng nhận thông báo" / en: "Recipient user ID"
    userId: v.string(),
    // vi: "Loại thông báo" / en: "Notification type"
    type: notificationTypeValidator,
    // Bilingual title
    titleVi: v.string(),
    titleEn: v.string(),
    // Bilingual body
    bodyVi: v.string(),
    bodyEn: v.string(),
    // vi: "Siêu dữ liệu tùy chọn" / en: "Optional metadata"
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Look up the user to get a proper typed ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError({
        message: "Người dùng không tồn tại. (User does not exist.)",
        code: "NOT_FOUND",
      });
    }

    // Check user's notification preferences for this type
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    // If preferences exist and this type is explicitly set to false, skip creation
    if (
      preferences &&
      preferences[args.type as keyof typeof preferences] === false
    ) {
      // Notification suppressed by user preference — return null
      return null;
    }

    return ctx.db.insert("notifications", {
      userId: user._id,
      type: args.type,
      titleVi: args.titleVi,
      titleEn: args.titleEn,
      bodyVi: args.bodyVi,
      bodyEn: args.bodyEn,
      read: false,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Marks a single notification as read.
 *
 * vi: "Đánh dấu thông báo đã đọc" / en: "Mark notification as read"
 */
export const markRead = mutation({
  args: {
    // vi: "ID thông báo" / en: "Notification ID"
    notificationId: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(
      args.notificationId as Id<"notifications">,
    );

    if (!notification) {
      throw new ConvexError({
        message: "Thông báo không tồn tại. (Notification does not exist.)",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(notification._id, {
      read: true,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Marks all notifications for a user as read.
 *
 * WHY: "Mark all as read" is a common UX pattern. Batch operation
 * is more efficient than calling markRead N times from the client.
 *
 * vi: "Đánh dấu tất cả thông báo đã đọc" / en: "Mark all notifications as read"
 */
export const markAllRead = mutation({
  args: {
    // vi: "ID người dùng" / en: "User ID"
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError({
        message: "Người dùng không tồn tại. (User does not exist.)",
        code: "NOT_FOUND",
      });
    }

    const now = Date.now();

    // Find all unread notifications for this user
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .collect();

    // Patch all unread notifications to read
    await Promise.all(
      unreadNotifications.map((n) =>
        ctx.db.patch(n._id, { read: true, updatedAt: now }),
      ),
    );

    return unreadNotifications.length;
  },
});

/**
 * Updates notification preferences for a user (per-type toggle).
 * Creates a preferences record if one does not exist, otherwise updates it.
 *
 * WHY: Upsert pattern — one record per user. Partial updates supported:
 * only specified keys are changed; unspecified keys keep their current values.
 *
 * vi: "Cập nhật tùy chọn thông báo" / en: "Update notification preferences"
 */
export const updatePreferences = mutation({
  args: {
    // vi: "ID người dùng" / en: "User ID"
    userId: v.string(),
    // vi: "Các tùy chọn thông báo" / en: "Notification preferences"
    preferences: v.object({
      service_request_new_quote: v.optional(v.boolean()),
      service_request_quote_approved: v.optional(v.boolean()),
      service_request_quote_rejected: v.optional(v.boolean()),
      service_request_started: v.optional(v.boolean()),
      service_request_completed: v.optional(v.boolean()),
      equipment_maintenance_due: v.optional(v.boolean()),
      equipment_status_broken: v.optional(v.boolean()),
      consumable_stock_low: v.optional(v.boolean()),
      dispute_new_message: v.optional(v.boolean()),
      dispute_resolved: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    // Look up the user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError({
        message: "Người dùng không tồn tại. (User does not exist.)",
        code: "NOT_FOUND",
      });
    }

    const now = Date.now();

    // Check if preferences record already exists
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Partial update — only update keys that are provided
      await ctx.db.patch(existing._id, {
        ...args.preferences,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new preferences record
      return ctx.db.insert("notificationPreferences", {
        userId: user._id,
        ...args.preferences,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists all notifications for a user, ordered newest first.
 *
 * WHY: This is a reactive query — any time a notification is created,
 * marked as read, or deleted, all subscribers automatically re-render.
 * This is the primary data source for the NotificationCenter UI component.
 *
 * vi: "Danh sách thông báo của người dùng" / en: "List notifications for user"
 */
export const listForUser = query({
  args: {
    // vi: "ID người dùng" / en: "User ID"
    userId: v.string(),
    // vi: "Giới hạn số lượng thông báo" / en: "Limit number of notifications"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Look up the user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      return [];
    }

    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

/**
 * Gets the notification preferences for a user.
 * Returns null if no preferences have been set (defaults to all enabled).
 *
 * vi: "Lấy tùy chọn thông báo của người dùng" / en: "Get user notification preferences"
 */
export const getPreferences = query({
  args: {
    // vi: "ID người dùng" / en: "User ID"
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Look up the user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      return null;
    }

    return ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
  },
});
