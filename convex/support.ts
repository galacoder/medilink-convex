/**
 * Convex mutations and queries for support tickets.
 *
 * Support ticket workflow:
 *   open -> in_progress -> resolved | closed
 *
 * Access control:
 *   - Any authenticated org member can create support tickets
 *   - Any org member can view and add messages to their org's tickets
 *   - Staff/admin can update ticket status
 *
 * vi: "Phiếu hỗ trợ" / en: "Support tickets"
 */

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { createAuditEntry } from "./lib/auditLog";

// ---------------------------------------------------------------------------
// Local auth helpers (JWT-based, no better-auth dependency for testability)
// ---------------------------------------------------------------------------

/**
 * Gets the authenticated user identity and extracts userId.
 * Throws a bilingual ConvexError if not authenticated.
 *
 * WHY: Using a local auth helper (mirroring disputes.ts) avoids importing
 * the full better-auth stack which causes module resolution issues in tests.
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
// Support ticket state machine
// ---------------------------------------------------------------------------

/**
 * Valid status transitions for support tickets.
 *
 * State machine:
 *   open -> in_progress
 *   open -> closed
 *   in_progress -> resolved
 *   in_progress -> closed
 *   resolved -> closed
 *
 * WHY: Prevents invalid state transitions (e.g., re-opening a closed ticket
 * without going through proper workflow).
 *
 * vi: "Máy trạng thái phiếu hỗ trợ" / en: "Support ticket state machine"
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ["in_progress", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

function canTransitionSupportTicket(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new support ticket.
 *
 * Any authenticated org member can open a support ticket.
 * Optionally creates an initial message if description is provided.
 *
 * vi: "Tạo phiếu hỗ trợ" / en: "Create support ticket"
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
    // 1. Authenticate with org context
    const auth = await localRequireOrgAuth(ctx);

    const now = Date.now();

    // 2. Insert the support ticket
    const ticketId = await ctx.db.insert("supportTicket", {
      organizationId: auth.organizationId,
      createdBy: auth.userId as Id<"users">,
      status: "open",
      priority: args.priority,
      category: args.category,
      subjectVi: args.subjectVi,
      subjectEn: args.subjectEn ?? args.subjectVi,
      descriptionVi: args.descriptionVi,
      descriptionEn: args.descriptionEn,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Create initial message from the description
    await ctx.db.insert("supportMessage", {
      ticketId,
      authorId: auth.userId as Id<"users">,
      contentVi: args.descriptionVi,
      contentEn: args.descriptionEn,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Create audit log entry
    await createAuditEntry(ctx, {
      organizationId: auth.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "supportTicket.created",
      resourceType: "supportTicket",
      resourceId: ticketId,
      newValues: {
        status: "open",
        category: args.category,
        priority: args.priority,
        subjectVi: args.subjectVi,
      },
    });

    return ticketId;
  },
});

/**
 * Updates the status of a support ticket using the state machine.
 *
 * Validates the transition with canTransitionSupportTicket before updating.
 *
 * vi: "Cập nhật trạng thái phiếu hỗ trợ" / en: "Update support ticket status"
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
    // 1. Authenticate
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the ticket
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message: "Không tìm thấy phiếu hỗ trợ. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    // 3. Verify org ownership: caller must belong to the org that owns the ticket.
    // WHY: Without this check any authenticated user can modify any ticket by
    // guessing a ticketId — a CRITICAL cross-org write vulnerability.
    if (ticket.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Không có quyền cập nhật trạng thái phiếu hỗ trợ này. (You do not have access to update this support ticket.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Enforce state machine
    const currentStatus = ticket.status;
    const targetStatus = args.status;

    if (!canTransitionSupportTicket(currentStatus, targetStatus)) {
      throw new ConvexError({
        message: `Không thể chuyển phiếu hỗ trợ từ trạng thái "${currentStatus}" sang "${targetStatus}". (Cannot transition support ticket from "${currentStatus}" to "${targetStatus}".)`,
        code: "INVALID_TRANSITION",
        currentStatus,
        targetStatus,
      });
    }

    // 5. Update status
    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      status: targetStatus,
      updatedAt: now,
    });

    // 6. Create audit log
    await createAuditEntry(ctx, {
      organizationId: ticket.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "supportTicket.statusUpdated",
      resourceType: "supportTicket",
      resourceId: args.ticketId,
      previousValues: { status: currentStatus },
      newValues: { status: targetStatus },
    });

    return args.ticketId;
  },
});

/**
 * Adds a message to a support ticket thread.
 *
 * Any member of the org that owns the ticket can add messages.
 * The authorId is taken from the JWT.
 *
 * vi: "Thêm tin nhắn vào phiếu hỗ trợ" / en: "Add support ticket message"
 */
export const addMessage = mutation({
  args: {
    ticketId: v.id("supportTicket"),
    contentVi: v.string(),
    contentEn: v.optional(v.string()),
    attachmentUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate with org context — required to verify ticket ownership.
    // WHY: Without an org check, any authenticated user can add messages to any
    // ticket by guessing a ticketId — a CRITICAL cross-org write vulnerability.
    const auth = await localRequireOrgAuth(ctx);

    // 2. Load the ticket to verify it exists
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError({
        message: "Không tìm thấy phiếu hỗ trợ. (Support ticket not found.)",
        code: "TICKET_NOT_FOUND",
      });
    }

    // 3. Verify access: caller's org must be the org that owns the ticket.
    // WHY: Without this check any authenticated user from any org can inject
    // messages into tickets they have no relationship to.
    if (ticket.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Không có quyền thêm tin nhắn vào phiếu hỗ trợ này. (You do not have access to add messages to this support ticket.)",
        code: "FORBIDDEN",
      });
    }

    // 4. Prevent adding messages to closed tickets
    if (ticket.status === "closed") {
      throw new ConvexError({
        message:
          "Không thể thêm tin nhắn vào phiếu hỗ trợ đã đóng. (Cannot add messages to a closed support ticket.)",
        code: "TICKET_CLOSED",
      });
    }

    // 5. Insert the message
    const now = Date.now();
    const messageId = await ctx.db.insert("supportMessage", {
      ticketId: args.ticketId,
      authorId: auth.userId as Id<"users">,
      contentVi: args.contentVi,
      contentEn: args.contentEn,
      attachmentUrls: args.attachmentUrls,
      createdAt: now,
      updatedAt: now,
    });

    // 6. Update the ticket's updatedAt timestamp
    await ctx.db.patch(args.ticketId, {
      updatedAt: now,
    });

    // 7. Create audit log entry
    await createAuditEntry(ctx, {
      organizationId: ticket.organizationId,
      actorId: auth.userId as Id<"users">,
      action: "supportTicket.messageAdded",
      resourceType: "supportMessage",
      resourceId: messageId,
      newValues: { ticketId: args.ticketId, contentVi: args.contentVi },
    });

    return messageId;
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists support tickets for an organization.
 * Supports optional status filtering.
 *
 * vi: "Danh sách phiếu hỗ trợ của tổ chức" / en: "Organization support tickets list"
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
    // Authenticate with org context
    const auth = await localRequireOrgAuth(ctx);

    // Use indexed query for efficiency
    let tickets;
    if (args.status) {
      tickets = await ctx.db
        .query("supportTicket")
        .withIndex("by_org_and_status", (q) =>
          q.eq("organizationId", auth.organizationId).eq("status", args.status!),
        )
        .collect();
    } else {
      tickets = await ctx.db
        .query("supportTicket")
        .withIndex("by_org", (q) => q.eq("organizationId", auth.organizationId))
        .collect();
    }

    return tickets;
  },
});

/**
 * Gets a single support ticket by ID with all related messages.
 * Returns null if the ticket is not found.
 *
 * Includes: ticket details + all messages enriched with author names.
 *
 * vi: "Lấy phiếu hỗ trợ theo ID" / en: "Get support ticket by ID"
 */
export const getById = query({
  args: {
    ticketId: v.id("supportTicket"),
  },
  handler: async (ctx, args) => {
    // Authenticate with org context (required for ownership check)
    const auth = await localRequireOrgAuth(ctx);

    // Load the ticket
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return null;
    }

    // Verify access: caller's org must own the ticket.
    // WHY: Without this check any authenticated user can read tickets from any
    // organization by guessing IDs — a CRITICAL cross-org data leak.
    if (ticket.organizationId !== auth.organizationId) {
      throw new ConvexError({
        message:
          "Không có quyền xem phiếu hỗ trợ này. (You do not have access to this support ticket.)",
        code: "FORBIDDEN",
      });
    }

    // Get messages ordered by createdAt ascending
    const messages = await ctx.db
      .query("supportMessage")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
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
 * Lists support tickets created by the current user.
 *
 * Returns the authenticated user's personal ticket list, sorted newest first.
 *
 * vi: "Danh sách phiếu hỗ trợ của tôi" / en: "My support tickets"
 */
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    // Authenticate (userId required, org not required for personal ticket list)
    const auth = await localRequireAuth(ctx);

    // Use index for efficient per-user lookup
    const tickets = await ctx.db
      .query("supportTicket")
      .withIndex("by_created_by", (q) =>
        q.eq("createdBy", auth.userId as Id<"users">),
      )
      .order("desc")
      .collect();

    return tickets;
  },
});
