/**
 * Types for the admin-disputes feature module.
 * Used by platform admin dispute arbitration pages.
 *
 * vi: "Kiểu dữ liệu cho quản trị tranh chấp" / en: "Admin dispute arbitration types"
 */
import type { Doc, Id } from "@medilink/db/dataModel";

// Base document types
export type Dispute = Doc<"disputes">;
export type ServiceRequest = Doc<"serviceRequests">;
export type Organization = Doc<"organizations">;
export type Provider = Doc<"providers">;

// Resolution types for arbitration
export type ArbitrationResolution =
  | "refund"
  | "partial_refund"
  | "dismiss"
  | "re_assign";

// Enriched service request with hospital + provider info + bottleneck flag
export interface AdminServiceRequest extends ServiceRequest {
  hospitalName: string | null;
  providerName: string | null;
  isBottleneck: boolean;
}

// Enriched escalated dispute with hospital + provider names
export interface EscalatedDispute extends Dispute {
  hospitalName: string | null;
  providerName: string | null;
  serviceRequestDescription: string | null;
}

// Full dispute detail for arbitration panel
export interface DisputeArbitrationDetail {
  dispute: Dispute;
  hospitalOrganization: Organization | null;
  providerOrganization: Organization | null;
  provider: Provider | null;
  serviceRequest: ServiceRequest | null;
  equipment: Doc<"equipment"> | null;
  messages: (Doc<"disputeMessages"> & {
    authorName: string | null;
  })[];
  arbitrationHistory: Doc<"auditLog">[];
}

// Filter state for the cross-tenant service request list
export interface AdminServiceRequestFilters {
  status?: ServiceRequest["status"];
  hospitalId?: Id<"organizations">;
  providerId?: Id<"providers">;
  fromDate?: number;
  toDate?: number;
  showBottlenecksOnly?: boolean;
}

// Arbitration ruling form state
export interface ArbitrationRulingForm {
  resolution: ArbitrationResolution;
  reasonVi: string;
  reasonEn?: string;
  refundAmount?: number;
}
