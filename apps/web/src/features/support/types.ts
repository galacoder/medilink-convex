/**
 * Type definitions for the support feature module.
 *
 * WHY: Types are defined locally rather than imported from Convex generated
 * types so the feature module works in tests without a live Convex deployment.
 * The types mirror the convex/schema.ts supportTicket and supportMessage tables.
 *
 * vi: "Kieu du lieu ho tro" / en: "Support types"
 */

// Support ticket status enum
export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

// Support ticket priority enum
export type SupportTicketPriority = "low" | "medium" | "high" | "critical";

// Support ticket category enum
export type SupportTicketCategory =
  | "general"
  | "technical"
  | "billing"
  | "feature_request"
  | "other";

// Support ticket document shape (mirrors convex/schema.ts)
export interface SupportTicket {
  _id: string;
  _creationTime: number;
  organizationId: string;
  createdBy: string;
  assignedTo?: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: SupportTicketCategory;
  subjectVi: string;
  subjectEn?: string;
  descriptionVi: string;
  descriptionEn?: string;
  createdAt: number;
  updatedAt: number;
}

// Support ticket enriched with creator name (from getById query)
export interface SupportTicketWithDetails extends SupportTicket {
  creatorName?: string | null;
  messages: SupportMessageWithAuthor[];
}

// Support message document shape (mirrors convex/schema.ts)
export interface SupportMessage {
  _id: string;
  _creationTime: number;
  ticketId: string;
  authorId: string;
  contentVi: string;
  contentEn?: string;
  attachmentUrls?: string[];
  createdAt: number;
  updatedAt: number;
}

// Support message enriched with author name (from getById query)
export interface SupportMessageWithAuthor extends SupportMessage {
  authorName?: string | null;
}

// Filter state for ticket list
export interface SupportTicketFilters {
  status?: SupportTicketStatus;
}
