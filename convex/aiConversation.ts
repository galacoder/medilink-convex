/**
 * Convex queries and mutations for AI conversation persistence (CRUD).
 *
 * Conversation CRUD is separate from AI actions (aiAssistant.ts).
 * CRUD persists history; actions process queries.
 *
 * Access control: requireOrgAuth pattern (org-scoped conversations).
 *
 * vi: "CRUD cho hội thoại AI" / en: "AI conversation CRUD"
 */

import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireOrgAuth } from "./lib/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the authenticated user's Convex user ID from auth context.
 * Uses dual lookup: by_token first, then by_email fallback.
 *
 * vi: "Tìm ID người dùng từ ngữ cảnh xác thực"
 * en: "Resolve user ID from auth context"
 */
async function resolveUserId(
  ctx: { db: any },
  auth: { tokenIdentifier: string | null; email: string | null },
): Promise<string> {
  let user = null;

  if (auth.tokenIdentifier) {
    user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", auth.tokenIdentifier),
      )
      .first();
  }

  if (!user && auth.email) {
    const emailValue = auth.email;
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", emailValue))
      .first();
  }

  if (!user) {
    throw new ConvexError({
      message: "Khong tim thay nguoi dung. (User not found.)",
      code: "USER_NOT_FOUND",
    });
  }

  return user._id;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List conversations for the current user in an organization.
 * Returns conversations ordered by most recently updated.
 *
 * vi: "Danh sach hoi thoai AI" / en: "List AI conversations"
 */
export const list = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const auth = await requireOrgAuth(ctx);
    const userId = await resolveUserId(ctx, auth);

    const conversations = await ctx.db
      .query("aiConversation")
      .withIndex("by_user_and_org", (q: any) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId),
      )
      .order("desc")
      .collect();

    return conversations;
  },
});

/**
 * Get a single conversation by ID.
 * Returns null if not found.
 *
 * vi: "Lay chi tiet hoi thoai AI" / en: "Get AI conversation detail"
 */
export const getById = query({
  args: {
    id: v.id("aiConversation"),
  },
  handler: async (ctx, args) => {
    await requireOrgAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    return conversation ?? null;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new AI conversation.
 * Initializes with empty messages and "stub" model.
 *
 * vi: "Tao hoi thoai AI moi" / en: "Create new AI conversation"
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    titleVi: v.string(),
    titleEn: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await requireOrgAuth(ctx);
    const userId = await resolveUserId(ctx, auth);

    const now = Date.now();
    const conversationId = await ctx.db.insert("aiConversation", {
      userId: userId as any,
      organizationId: args.organizationId,
      titleVi: args.titleVi,
      titleEn: args.titleEn,
      messages: [],
      model: "stub",
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

/**
 * Add a message to an existing conversation.
 * Appends to the messages array and updates the timestamp.
 *
 * vi: "Them tin nhan vao hoi thoai" / en: "Add message to conversation"
 */
export const addMessage = mutation({
  args: {
    id: v.id("aiConversation"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrgAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new ConvexError({
        message: "Khong tim thay hoi thoai. (Conversation not found.)",
        code: "CONVERSATION_NOT_FOUND",
      });
    }

    const now = Date.now();
    const newMessage = {
      role: args.role,
      content: args.content,
      timestamp: now,
    };

    await ctx.db.patch(args.id, {
      messages: [...conversation.messages, newMessage],
      updatedAt: now,
    });
  },
});

/**
 * Delete an AI conversation.
 *
 * vi: "Xoa hoi thoai AI" / en: "Delete AI conversation"
 */
export const remove = mutation({
  args: {
    id: v.id("aiConversation"),
  },
  handler: async (ctx, args) => {
    await requireOrgAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new ConvexError({
        message: "Khong tim thay hoi thoai. (Conversation not found.)",
        code: "CONVERSATION_NOT_FOUND",
      });
    }

    await ctx.db.delete(args.id);
  },
});
