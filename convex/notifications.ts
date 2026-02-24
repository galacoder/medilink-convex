/**
 * Convex queries and mutations for the notifications system.
 *
 * WHY: Real-time in-app notifications keep users informed of service request
 * updates, quote submissions, and system events without polling. Convex
 * reactive queries ensure instant delivery when new notifications arrive.
 *
 * vi: "Truy vấn và thay đổi Convex cho hệ thống thông báo" / en: "Notification queries and mutations"
 */

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

/**
 * Lists all notifications for a user, ordered newest-first.
 *
 * WHY: Used by the notification center to show the user's notification feed.
 * Reactive via useQuery — updates automatically when new notifications arrive.
 *
 * vi: "Lấy danh sách thông báo của người dùng" / en: "List notifications for a user"
 */
export const listForUser = query({
  args: {
    /** vi: "ID người dùng" / en: "User ID (string from Better Auth session)" */
    userId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    // Find the Convex user by matching userId string against the users table
    // WHY: Better Auth session userId is a string; Convex users table uses typed Id
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id" as "_id"), args.userId))
      .take(1);

    if (users.length === 0) return [];

    const convexUserId = users[0]!._id;

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", convexUserId))
      .order("desc")
      .collect();
  },
});

/**
 * Marks a single notification as read.
 *
 * vi: "Đánh dấu thông báo đã đọc" / en: "Mark notification as read"
 */
export const markRead = mutation({
  args: {
    /** vi: "ID thông báo" / en: "Notification ID to mark as read" */
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return null;

    await ctx.db.patch(args.notificationId, {
      read: true,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Marks all of a user's notifications as read.
 *
 * vi: "Đánh dấu tất cả thông báo đã đọc" / en: "Mark all notifications as read"
 */
export const markAllRead = mutation({
  args: {
    /** vi: "ID người dùng" / en: "User ID (string from Better Auth session)" */
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find the Convex user by matching userId string
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id" as "_id"), args.userId))
      .take(1);

    if (users.length === 0) return null;

    const convexUserId = users[0]!._id;
    const now = Date.now();

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", convexUserId).eq("read", false),
      )
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { read: true, updatedAt: now })),
    );

    return null;
  },
});

/**
 * Gets the notification preferences for a user.
 *
 * Returns null if no preferences document exists yet (all types default to enabled).
 *
 * vi: "Lấy tùy chọn thông báo" / en: "Get notification preferences"
 */
export const getPreferences = query({
  args: {
    /** vi: "ID người dùng" / en: "User ID (string from Better Auth session)" */
    userId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    // Find the Convex user by matching userId string
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id" as "_id"), args.userId))
      .take(1);

    if (users.length === 0) return null;

    const convexUserId = users[0]!._id;

    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", convexUserId))
      .first();

    return prefs ?? null;
  },
});

/**
 * Updates notification preferences for a user.
 *
 * Creates the preferences document if it doesn't exist (upsert pattern).
 *
 * vi: "Cập nhật tùy chọn thông báo" / en: "Update notification preferences"
 */
export const updatePreferences = mutation({
  args: {
    /** vi: "ID người dùng" / en: "User ID (string from Better Auth session)" */
    userId: v.string(),
    /** vi: "Tùy chọn thông báo" / en: "Map of notification type to enabled boolean" */
    preferences: v.record(v.string(), v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find the Convex user by matching userId string
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id" as "_id"), args.userId))
      .take(1);

    if (users.length === 0) return null;

    const convexUserId = users[0]!._id;
    const now = Date.now();

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", convexUserId))
      .first();

    if (existing) {
      // Patch with provided preferences (only supported keys)
      await ctx.db.patch(existing._id, {
        ...args.preferences,
        updatedAt: now,
      });
    } else {
      // Create new preferences document
      await ctx.db.insert("notificationPreferences", {
        userId: convexUserId,
        ...args.preferences,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});
