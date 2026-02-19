/**
 * TypeScript interfaces for the provider-side quotes feature module.
 *
 * WHY: These types mirror the Convex schema but are frontend-specific,
 * including enriched/joined fields returned by listByProvider queries.
 * Using explicit interfaces (not inferred from Convex) ensures stable
 * types that don't break if Convex return shapes change slightly.
 */

// ---------------------------------------------------------------------------
// Literal union types (mirror Convex schema enums)
// ---------------------------------------------------------------------------

export type QuoteStatus = "pending" | "accepted" | "rejected" | "expired";

export type ServiceRequestStatus =
  | "pending"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type ServiceRequestPriority = "low" | "medium" | "high" | "critical";

export type ServiceRequestType =
  | "repair"
  | "maintenance"
  | "calibration"
  | "inspection"
  | "installation"
  | "other";

// ---------------------------------------------------------------------------
// Core domain interfaces
// ---------------------------------------------------------------------------

/**
 * Service request as seen by a provider — includes hospital name and equipment name.
 * Returned by api.serviceRequests.listByProvider (enriched query).
 */
export interface IncomingServiceRequest {
  _id: string;
  _creationTime: number;
  organizationId: string;
  equipmentId: string;
  requestedBy: string;
  assignedProviderId?: string;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  descriptionVi: string;
  descriptionEn?: string;
  scheduledAt?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  // Joined fields from listByProvider enrichment
  hospitalOrgName: string | null;
  equipmentNameVi: string | null;
  equipmentNameEn: string | null;
}

/**
 * Service request summary joined within a ProviderQuote.
 * Returned as nested object by api.quotes.listByProvider.
 */
export interface ServiceRequestSummary {
  _id: string;
  status: ServiceRequestStatus;
  type: ServiceRequestType;
  priority: ServiceRequestPriority;
  descriptionVi: string;
  descriptionEn?: string;
  equipmentNameVi: string | null;
  equipmentNameEn: string | null;
  hospitalOrgName: string | null;
}

/**
 * Quote as seen by the provider who submitted it.
 * Returned by api.quotes.listByProvider (enriched query).
 */
export interface ProviderQuote {
  _id: string;
  _creationTime: number;
  serviceRequestId: string;
  providerId: string;
  status: QuoteStatus;
  amount: number;
  currency: string;
  validUntil?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  // Joined field from listByProvider enrichment
  serviceRequest: ServiceRequestSummary | null;
}

/**
 * Form input for provider submitting a quote.
 * Matches submitQuoteFormSchema from @medilink/validators.
 */
export interface QuoteFormInput {
  serviceRequestId: string;
  amount: number;
  currency: "VND" | "USD";
  estimatedDurationDays: number;
  availableStartDate: number;
  notes?: string;
  terms?: string;
}

/**
 * Input for provider declining a service request.
 * Matches declineRequestSchema from @medilink/validators.
 */
export interface DeclineInput {
  serviceRequestId: string;
  reason: string;
}

/**
 * Aggregated stats for the provider quotes dashboard.
 * Calculated client-side from the list of ProviderQuote items.
 */
export interface QuoteDashboardStats {
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  totalCount: number;
  /** Win rate as a percentage (0-100), -1 if no quotes yet */
  winRate: number;
}
