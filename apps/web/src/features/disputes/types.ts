import type { Doc, Id } from "@medilink/db/dataModel";

// Dispute document type from Convex
export type Dispute = Doc<"disputes">;
export type DisputeMessage = Doc<"disputeMessages">;

// Status and type enums
export type DisputeStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "closed"
  | "escalated";

export type DisputeType = "quality" | "pricing" | "timeline" | "other";

// Filter state for dispute list
export interface DisputeFilters {
  status?: DisputeStatus;
  search?: string;
}

// Dispute enriched with service request reference (from listByHospital query)
export interface DisputeWithRef extends Dispute {
  serviceRequestRef?: {
    id: Id<"serviceRequests">;
    description: string;
  } | null;
}

// Dispute enriched with full related data (from getById query)
export interface DisputeWithDetails extends Dispute {
  serviceRequest?: {
    _id: Id<"serviceRequests">;
    descriptionVi: string;
    descriptionEn?: string;
    status: string;
    type: string;
  } | null;
  equipmentName?: string | null;
  organizationName?: string | null;
  assignedToName?: string | null;
}

// Message enriched with author name (from getMessages query)
export interface DisputeMessageWithAuthor extends DisputeMessage {
  authorName?: string | null;
}
