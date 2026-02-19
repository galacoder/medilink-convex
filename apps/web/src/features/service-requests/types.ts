/**
 * TypeScript interfaces for the service request feature module.
 *
 * WHY: These types mirror the Convex schema (convex/schema.ts) but are
 * frontend-specific: they include joined/enriched fields returned by
 * Convex queries (e.g., equipment names, provider names from getById).
 *
 * Using explicit interfaces (not inferred from Convex) ensures we have
 * stable types that don't break if the Convex return shape changes slightly.
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

export type QuoteStatus = "pending" | "accepted" | "rejected" | "expired";

// ---------------------------------------------------------------------------
// Core domain interfaces
// ---------------------------------------------------------------------------

/**
 * Minimal service request shape returned by listByHospital.
 * Includes joined equipment name fields from the Convex query enrichment.
 */
export interface ServiceRequest {
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
  // Joined fields (from listByHospital query enrichment)
  equipmentNameVi: string | null;
  equipmentNameEn: string | null;
}

/**
 * Quote shape returned within getById enrichment.
 */
export interface Quote {
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
  // Joined fields from getById
  providerNameVi: string | null;
  providerNameEn: string | null;
  providerOrgName: string | null;
}

/**
 * Service rating shape from serviceRatings table.
 */
export interface ServiceRating {
  _id: string;
  _creationTime: number;
  serviceRequestId: string;
  providerId: string;
  ratedBy: string;
  rating: number;
  commentVi?: string;
  commentEn?: string;
  serviceQuality?: number;
  timeliness?: number;
  professionalism?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Equipment summary returned within service request detail.
 */
export interface EquipmentRef {
  nameVi: string;
  nameEn: string;
  status: string;
  condition: string;
}

/**
 * Full detail shape returned by getById — includes equipment, quotes, rating.
 */
export interface ServiceRequestDetail extends Omit<ServiceRequest, "equipmentNameVi" | "equipmentNameEn"> {
  equipment: EquipmentRef | null;
  quotes: Quote[];
  rating: ServiceRating | null;
  hospitalOrgName: string | null;
}

// ---------------------------------------------------------------------------
// Form input type (used for create mutation args)
// ---------------------------------------------------------------------------

export interface CreateServiceRequestInput {
  organizationId: string;
  equipmentId: string;
  type: ServiceRequestType;
  priority: ServiceRequestPriority;
  descriptionVi: string;
  descriptionEn?: string;
  scheduledAt?: number;
}

// ---------------------------------------------------------------------------
// Constant arrays with bilingual labels (for select/filter rendering)
// ---------------------------------------------------------------------------

export const SERVICE_REQUEST_STATUSES: ReadonlyArray<{
  value: ServiceRequestStatus;
  label: { vi: string; en: string };
}> = [
  { value: "pending", label: { vi: "Đang chờ", en: "Pending" } },
  { value: "quoted", label: { vi: "Đã báo giá", en: "Quoted" } },
  { value: "accepted", label: { vi: "Đã chấp nhận", en: "Accepted" } },
  { value: "in_progress", label: { vi: "Đang thực hiện", en: "In Progress" } },
  { value: "completed", label: { vi: "Hoàn thành", en: "Completed" } },
  { value: "cancelled", label: { vi: "Đã hủy", en: "Cancelled" } },
  { value: "disputed", label: { vi: "Đang tranh chấp", en: "Disputed" } },
];

export const SERVICE_REQUEST_PRIORITIES: ReadonlyArray<{
  value: ServiceRequestPriority;
  label: { vi: string; en: string };
}> = [
  { value: "low", label: { vi: "Thấp", en: "Low" } },
  { value: "medium", label: { vi: "Trung bình", en: "Medium" } },
  { value: "high", label: { vi: "Cao", en: "High" } },
  { value: "critical", label: { vi: "Khẩn cấp", en: "Critical" } },
];

export const SERVICE_REQUEST_TYPES: ReadonlyArray<{
  value: ServiceRequestType;
  label: { vi: string; en: string };
}> = [
  { value: "repair", label: { vi: "Sửa chữa", en: "Repair" } },
  { value: "maintenance", label: { vi: "Bảo trì", en: "Maintenance" } },
  { value: "calibration", label: { vi: "Hiệu chỉnh", en: "Calibration" } },
  { value: "inspection", label: { vi: "Kiểm tra", en: "Inspection" } },
  { value: "installation", label: { vi: "Lắp đặt", en: "Installation" } },
  { value: "other", label: { vi: "Khác", en: "Other" } },
];

export const QUOTE_STATUSES: ReadonlyArray<{
  value: QuoteStatus;
  label: { vi: string; en: string };
}> = [
  { value: "pending", label: { vi: "Đang chờ", en: "Pending" } },
  { value: "accepted", label: { vi: "Đã chấp nhận", en: "Accepted" } },
  { value: "rejected", label: { vi: "Đã từ chối", en: "Rejected" } },
  { value: "expired", label: { vi: "Đã hết hạn", en: "Expired" } },
];
