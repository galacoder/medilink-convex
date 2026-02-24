import type { Doc, Id } from "@medilink/backend";

// Audit log document type from Convex
export type AuditLogEntry = Doc<"auditLog">;

// Enriched audit log entry (from auditLog.list query)
export interface AuditLogEntryWithDetails extends AuditLogEntry {
  actorName: string | null;
  actorEmail: string | null;
  organizationName: string | null;
}

// Filter state for the audit log viewer
export interface AuditLogFilters {
  actionType?: "create" | "update" | "delete" | "status_change";
  resourceType?: "equipment" | "service_request" | "quote" | "dispute";
  organizationId?: Id<"organizations">;
  actorId?: Id<"users">;
  dateFrom?: number;
  dateTo?: number;
  search?: string;
}

// Pagination state
export interface AuditLogPage {
  entries: AuditLogEntryWithDetails[];
  cursor: string | null;
  isDone: boolean;
  totalCount: number;
  oldestEntryAt: number | null;
}
