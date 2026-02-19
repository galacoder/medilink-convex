/**
 * TypeScript interfaces for the provider-side service execution feature module.
 *
 * WHY: These types mirror the Convex schema but are frontend-specific,
 * including enriched/joined fields returned by listActiveServices query.
 * Using explicit interfaces (not inferred from Convex) ensures stable
 * types that don't break if Convex return shapes change.
 */

// ---------------------------------------------------------------------------
// Literal union types (mirror Convex schema enums)
// ---------------------------------------------------------------------------

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
 * Active service — an accepted or in_progress service request assigned to
 * the current provider. Returned by api.serviceRequests.listActiveServices.
 * Includes hospital name, equipment details, and accepted quote info.
 */
export interface ActiveService {
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
  // Joined fields from listActiveServices enrichment
  equipmentNameVi: string | null;
  equipmentNameEn: string | null;
  equipmentLocation: string | null;
  hospitalOrgName: string | null;
  acceptedQuoteAmount: number | null;
  acceptedQuoteCurrency: string | null;
}

/**
 * Form input for starting service execution (accepted -> in_progress).
 */
export interface StartServiceInput {
  serviceRequestId: string;
  actualStartTime?: number;
  notes?: string;
}

/**
 * Form input for updating service progress.
 */
export interface UpdateProgressInput {
  serviceRequestId: string;
  progressNotes: string;
  percentComplete?: number;
  hasUnexpectedIssue?: boolean;
  unexpectedIssueDescVi?: string;
}

/**
 * Form input for completing a service (in_progress -> completed).
 */
export interface CompleteServiceInput {
  serviceRequestId: string;
}

/**
 * Form input for submitting a completion report.
 */
export interface CompletionReportInput {
  serviceRequestId: string;
  workDescriptionVi: string;
  workDescriptionEn?: string;
  partsReplaced?: string[];
  nextMaintenanceRecommendation?: string;
  actualHours?: number;
  photoUrls?: string[];
  actualCompletionTime?: number;
}

/**
 * Aggregated stats for the active services dashboard.
 */
export interface ActiveServiceStats {
  scheduledCount: number;
  onSiteCount: number;
  totalCount: number;
}
