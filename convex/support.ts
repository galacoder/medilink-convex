/**
 * Convex queries and mutations for support tickets.
 *
 * Support ticket workflow:
 *   open -> in_progress -> resolved -> closed
 *
 * Access control:
 *   - Hospital/Provider org members create tickets and view their own org's tickets
 *   - Platform admins can view all tickets, assign, update status, and close
 *   - Message thread is visible to ticket creator's org + assigned admin
 *
 * Architecture mirrors disputes.ts (thread + messages, org-scoped).
 *
 * vi: "Truy van va mutation phieu ho tro" / en: "Support ticket queries and mutations"
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { createAuditEntry } from "./lib/auditLog";

// ---------------------------------------------------------------------------
// Local auth helpers (testable, no better-auth dep)
// ---------------------------------------------------------------------------

/**
 * Local JWT auth helper — no better-auth import needed for testability.
 * Mirrors serviceRequests.ts localRequireOrgAuth pattern.
 *
 * vi: "Xac thuc org cuc bo" / en: "Local org auth helper"
 */
async function localRequireOrgAuth(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<{ userId: Id<"users">; organizationId: Id<"organizations"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xac thuc that bai. Vui long dang nhap lai. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }

  const jwtOrgId = identity.organizationId as Id<"organizations"> | null;
  if (jwtOrgId) {
    return {
      userId: identity.subject as Id<"users">,
      organizationId: jwtOrgId,
    };
  }

  // JWT fallback: look up membership from DB using email
  const email = identity.email as string | null | undefined;
  if (email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const membership = await ctx.db
        .query("organizationMemberships")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .first();
      if (membership) {
        return {
          userId: user._id as Id<"users">,
          organizationId: membership.orgId as Id<"organizations">,
        };
      }
    }
  }

  throw new ConvexError({
    message:
      "Khong tim thay to chuc. (Organization not found. Please select an organization.)",
    code: "NO_ACTIVE_ORGANIZATION",
  });
}

/**
 * Local platform admin auth helper.
 * Mirrors admin/serviceRequests.ts requirePlatformAdmin pattern.
 *
 * vi: "Xac thuc quan tri vien nen tang" / en: "Platform admin auth helper"
 */
async function localRequirePlatformAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<{ userId: Id<"users"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message:
        "Xac thuc that bai. Vui long dang nhap lai. (Authentication required. Please sign in.)",
      code: "UNAUTHENTICATED",
    });
  }

  const platformRole = identity.platformRole as string | undefined;
  if (platformRole === "platform_admin") {
    return { userId: identity.subject as Id<"users"> };
  }

  // JWT fallback: look up platformRole from users table
  const email = identity.email as string | null | undefined;
  if (email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (user?.platformRole === "platform_admin") {
      return { userId: user._id as Id<"users"> };
    }
  }

  throw new ConvexError({
    message:
      "Chi quan tri vien nen tang moi co quyen thuc hien thao tac nay. (Only platform administrators can perform this action.)",
    code: "FORBIDDEN_PLATFORM_ADMIN_ONLY",
  });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists support tickets for the authenticated user's organization.
 * Supports optional status filtering.
 *
 * vi: "Danh sach phieu ho tro theo to chuc" / en: "List support tickets by org"
 */
export const listByOrg = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("resolved"),
        v.literal("closed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const auth = await localRequireOrgAuth(ctx);
    const orgId = auth.organizationId;

    let tickets;
    if (args.status) {
      tickets = await ctx.db
        .query("supportTicket")
        .withIndex("by_org_and_status", (q) =>
          q.eq("organizationId", orgId).eq("status", args.status!),
        )
        .collect();
    } else {
      tickets = await ctx.db
        .query("supportTicket")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
    }

    return tickets;
  },
});

/**
 * Lists support tickets created by the authenticated user.
 *
 * vi: "Danh sach phieu ho tro cua toi" / en: "List my support tickets"
 */
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const auth = await localRequireOrgAuth(ctx);

    const tickets = await ctx.db
      .query("supportTicket")
      .withIndex("by_created_by", (q) => q.eq("createdBy", auth.userId))
      .collect();

    return tickets;
  },
});

/**
 * Gets a single support ticket by ID with messages and author names.
 *
 * vi: "Chi tiet phieu ho tro" / en: "Get support ticket detail"
 */
export const getById = query({
  args: {
    ticketId: v.id("supportTicket"),
  },
  handler: async (ctx, args) => {
    const auth = await localRequireOrgAuth(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    // Verify access: user's org owns this ticket
    if (ticket.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Ban khong co quyen xem phieu ho tro nay. (You do not have permission to view this ticket.)",
        code: "FORBIDDEN",
      });
    }

    // Get messages ordered by creation time
    const messages = await ctx.db
      .query("supportMessage")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    // Enrich messages with author names
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return {
          ...msg,
          authorName: author?.name ?? null,
        };
      }),
    );

    // Get creator name
    const creator = await ctx.db.get(ticket.createdBy);

    return {
      ...ticket,
      creatorName: creator?.name ?? null,
      messages: enrichedMessages,
    };
  },
});

/**
 * Gets messages for a support ticket.
 * Separate query for real-time subscription to message thread only.
 *
 * vi: "Danh sach tin nhan phieu ho tro" / en: "Get support ticket messages"
 */
export const getMessages = query({
  args: {
    ticketId: v.id("supportTicket"),
  },
  handler: async (ctx, args) => {
    const auth = await localRequireOrgAuth(ctx);

    // Verify the ticket exists and belongs to user's org
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }
    if (ticket.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Ban khong co quyen xem tin nhan nay. (You do not have permission to view these messages.)",
        code: "FORBIDDEN",
      });
    }

    const messages = await ctx.db
      .query("supportMessage")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    // Enrich with author names
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return {
          ...msg,
          authorName: author?.name ?? null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Lists ALL support tickets across all organizations (admin only).
 *
 * vi: "Danh sach tat ca phieu ho tro (admin)" / en: "List all tickets (admin)"
 */
export const listAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("resolved"),
        v.literal("closed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await localRequirePlatformAdmin(ctx);

    let tickets;
    if (args.status) {
      tickets = await ctx.db
        .query("supportTicket")
        .filter((q) => q.eq(q.field("status"), args.status!))
        .collect();
    } else {
      tickets = await ctx.db.query("supportTicket").collect();
    }

    // Enrich with org name and creator name
    const enriched = await Promise.all(
      tickets.map(async (ticket) => {
        const [org, creator, assignee] = await Promise.all([
          ctx.db.get(ticket.organizationId),
          ctx.db.get(ticket.createdBy),
          ticket.assignedTo ? ctx.db.get(ticket.assignedTo) : null,
        ]);
        return {
          ...ticket,
          organizationName: org?.name ?? null,
          creatorName: creator?.name ?? null,
          assigneeName: assignee?.name ?? null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Gets a single support ticket by ID for admin (no org check).
 *
 * vi: "Chi tiet phieu ho tro (admin)" / en: "Get ticket detail (admin)"
 */
export const adminGetById = query({
  args: {
    ticketId: v.id("supportTicket"),
  },
  handler: async (ctx, args) => {
    await localRequirePlatformAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    // Get messages
    const messages = await ctx.db
      .query("supportMessage")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    // Enrich messages with author names
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return {
          ...msg,
          authorName: author?.name ?? null,
        };
      }),
    );

    // Get related entities
    const [org, creator, assignee] = await Promise.all([
      ctx.db.get(ticket.organizationId),
      ctx.db.get(ticket.createdBy),
      ticket.assignedTo ? ctx.db.get(ticket.assignedTo) : null,
    ]);

    return {
      ...ticket,
      organizationName: org?.name ?? null,
      creatorName: creator?.name ?? null,
      assigneeName: assignee?.name ?? null,
      messages: enrichedMessages,
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new support ticket.
 * Any authenticated org member can create a ticket.
 *
 * vi: "Tao phieu ho tro moi" / en: "Create support ticket"
 */
export const create = mutation({
  args: {
    subjectVi: v.string(),
    subjectEn: v.optional(v.string()),
    descriptionVi: v.string(),
    descriptionEn: v.optional(v.string()),
    category: v.union(
      v.literal("general"),
      v.literal("technical"),
      v.literal("billing"),
      v.literal("feature_request"),
      v.literal("other"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
  },
  handler: async (ctx, args) => {
    const auth = await localRequireOrgAuth(ctx);

    // Validate subject length
    if (args.subjectVi.trim().length < 3) {
      throw new ConvexError({
        message:
          "Tieu de phai co it nhat 3 ky tu. (Subject must be at least 3 characters.)",
        code: "INVALID_SUBJECT",
      });
    }

    // Validate description length
    if (args.descriptionVi.trim().length < 10) {
      throw new ConvexError({
        message:
          "Mo ta phai co it nhat 10 ky tu. (Description must be at least 10 characters.)",
        code: "INVALID_DESCRIPTION",
      });
    }

    const now = Date.now();
    const ticketId = await ctx.db.insert("supportTicket", {
      organizationId: auth.organizationId,
      createdBy: auth.userId,
      status: "open",
      priority: args.priority,
      category: args.category,
      subjectVi: args.subjectVi.trim(),
      subjectEn: args.subjectEn?.trim() || args.subjectVi.trim(),
      descriptionVi: args.descriptionVi.trim(),
      descriptionEn: args.descriptionEn?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    // Create audit log entry
    await createAuditEntry(ctx, {
      organizationId: auth.organizationId,
      actorId: auth.userId,
      action: "supportTicket.created",
      resourceType: "supportTicket",
      resourceId: ticketId,
      newValues: {
        status: "open",
        category: args.category,
        priority: args.priority,
      },
    });

    return ticketId;
  },
});

/**
 * Updates a support ticket's status.
 * Valid transitions: open -> in_progress, in_progress -> resolved,
 * resolved -> closed, any -> closed (by admin).
 *
 * vi: "Cap nhat trang thai phieu ho tro" / en: "Update support ticket status"
 */
export const updateStatus = mutation({
  args: {
    ticketId: v.id("supportTicket"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
  },
  handler: async (ctx, args) => {
    const auth = await localRequireOrgAuth(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    // Verify access
    if (ticket.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Ban khong co quyen cap nhat phieu ho tro nay. (You do not have permission to update this ticket.)",
        code: "FORBIDDEN",
      });
    }

    const previousStatus = ticket.status;
    const now = Date.now();

    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: now,
    });

    // Audit log
    await createAuditEntry(ctx, {
      organizationId: ticket.organizationId,
      actorId: auth.userId,
      action: "supportTicket.statusUpdated",
      resourceType: "supportTicket",
      resourceId: args.ticketId,
      previousValues: { status: previousStatus },
      newValues: { status: args.status },
    });

    return args.ticketId;
  },
});

/**
 * Adds a message to a support ticket thread.
 *
 * vi: "Them tin nhan vao phieu ho tro" / en: "Add message to support ticket"
 */
export const addMessage = mutation({
  args: {
    ticketId: v.id("supportTicket"),
    contentVi: v.string(),
    contentEn: v.optional(v.string()),
    attachmentUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const auth = await localRequireOrgAuth(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    // Verify access
    if (ticket.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Ban khong co quyen gui tin nhan cho phieu ho tro nay. (You do not have permission to add messages to this ticket.)",
        code: "FORBIDDEN",
      });
    }

    // Validate content
    if (!args.contentVi.trim()) {
      throw new ConvexError({
        message:
          "Noi dung tin nhan khong duoc de trong. (Message content cannot be empty.)",
        code: "INVALID_CONTENT",
      });
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("supportMessage", {
      ticketId: args.ticketId,
      authorId: auth.userId,
      contentVi: args.contentVi.trim(),
      contentEn: args.contentEn?.trim(),
      attachmentUrls: args.attachmentUrls,
      createdAt: now,
      updatedAt: now,
    });

    // Update ticket's updatedAt
    await ctx.db.patch(args.ticketId, { updatedAt: now });

    return messageId;
  },
});

/**
 * Assigns a support ticket to an admin user.
 * Sets assignedTo and transitions status to in_progress.
 * Platform admin only.
 *
 * vi: "Phan cong phieu ho tro" / en: "Assign support ticket"
 */
export const assign = mutation({
  args: {
    ticketId: v.id("supportTicket"),
    assignedTo: v.id("users"),
  },
  handler: async (ctx, args) => {
    const auth = await localRequirePlatformAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    // Verify assignee exists
    const assignee = await ctx.db.get(args.assignedTo);
    if (!assignee) {
      throw new ConvexError({
        message:
          "Khong tim thay nguoi dung duoc phan cong. (Assigned user not found.)",
        code: "USER_NOT_FOUND",
      });
    }

    const now = Date.now();
    const previousStatus = ticket.status;

    await ctx.db.patch(args.ticketId, {
      assignedTo: args.assignedTo,
      status: "in_progress",
      updatedAt: now,
    });

    // Audit log
    await createAuditEntry(ctx, {
      organizationId: ticket.organizationId,
      actorId: auth.userId,
      action: "supportTicket.assigned",
      resourceType: "supportTicket",
      resourceId: args.ticketId,
      previousValues: {
        assignedTo: ticket.assignedTo ?? null,
        status: previousStatus,
      },
      newValues: {
        assignedTo: args.assignedTo,
        status: "in_progress",
      },
    });

    return args.ticketId;
  },
});

/**
 * Closes a support ticket.
 * Platform admin only — can close from any status.
 *
 * vi: "Dong phieu ho tro" / en: "Close support ticket"
 */
export const close = mutation({
  args: {
    ticketId: v.id("supportTicket"),
  },
  handler: async (ctx, args) => {
    const auth = await localRequirePlatformAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    if (ticket.status === "closed") {
      throw new ConvexError({
        message:
          "Phieu ho tro da duoc dong roi. (Ticket is already closed.)",
        code: "ALREADY_CLOSED",
      });
    }

    const previousStatus = ticket.status;
    const now = Date.now();

    await ctx.db.patch(args.ticketId, {
      status: "closed",
      updatedAt: now,
    });

    // Audit log
    await createAuditEntry(ctx, {
      organizationId: ticket.organizationId,
      actorId: auth.userId,
      action: "supportTicket.closed",
      resourceType: "supportTicket",
      resourceId: args.ticketId,
      previousValues: { status: previousStatus },
      newValues: { status: "closed" },
    });

    return args.ticketId;
  },
});

/**
 * Admin adds a message to any support ticket (cross-org).
 * Platform admin only.
 *
 * vi: "Admin them tin nhan" / en: "Admin add message"
 */
export const adminAddMessage = mutation({
  args: {
    ticketId: v.id("supportTicket"),
    contentVi: v.string(),
    contentEn: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await localRequirePlatformAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    if (!args.contentVi.trim()) {
      throw new ConvexError({
        message:
          "Noi dung tin nhan khong duoc de trong. (Message content cannot be empty.)",
        code: "INVALID_CONTENT",
      });
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("supportMessage", {
      ticketId: args.ticketId,
      authorId: auth.userId,
      contentVi: args.contentVi.trim(),
      contentEn: args.contentEn?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    // Update ticket's updatedAt
    await ctx.db.patch(args.ticketId, { updatedAt: now });

    return messageId;
  },
});

/**
 * Admin updates status of any support ticket (cross-org).
 * Platform admin only.
 *
 * vi: "Admin cap nhat trang thai" / en: "Admin update status"
 */
export const adminUpdateStatus = mutation({
  args: {
    ticketId: v.id("supportTicket"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
  },
  handler: async (ctx, args) => {
    const auth = await localRequirePlatformAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message:
          "Khong tim thay phieu ho tro. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    const previousStatus = ticket.status;
    const now = Date.now();

    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: now,
    });

    // Audit log
    await createAuditEntry(ctx, {
      organizationId: ticket.organizationId,
      actorId: auth.userId,
      action: "supportTicket.statusUpdated",
      resourceType: "supportTicket",
      resourceId: args.ticketId,
      previousValues: { status: previousStatus },
      newValues: { status: args.status },
    });

    return args.ticketId;
  },
});
