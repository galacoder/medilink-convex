/**
 * TypeScript interfaces for the admin-providers feature module.
 *
 * WHY: These types represent the enriched shapes returned by platform admin
 * Convex queries. They extend the base schema types with joined fields.
 *
 * vi: "Kiểu dữ liệu quản lý nhà cung cấp (quản trị viên)"
 * en: "Admin provider management types"
 */

// ---------------------------------------------------------------------------
// Literal union types (mirror Convex schema enums)
// ---------------------------------------------------------------------------

/** vi: "Trạng thái nhà cung cấp" / en: "Provider status" */
export type ProviderStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending_verification";

/** vi: "Trạng thái xác minh" / en: "Verification status" */
export type VerificationStatus =
  | "pending"
  | "in_review"
  | "verified"
  | "rejected";

// ---------------------------------------------------------------------------
// Provider list item (enriched with organization name)
// ---------------------------------------------------------------------------

/**
 * Provider with organization name — returned by listProviders query.
 * vi: "Nhà cung cấp trong danh sách" / en: "Provider list item"
 */
export interface AdminProviderListItem {
  _id: string;
  _creationTime: number;
  organizationId: string;
  nameVi: string;
  nameEn: string;
  companyName?: string;
  status: ProviderStatus;
  verificationStatus: VerificationStatus;
  contactEmail?: string;
  averageRating?: number;
  totalRatings?: number;
  completedServices?: number;
  createdAt: number;
  updatedAt: number;
  /** Enriched: from linked organizations table */
  organizationName: string | null;
}

// ---------------------------------------------------------------------------
// Provider detail (full info with related data)
// ---------------------------------------------------------------------------

/** vi: "Dịch vụ cung cấp" / en: "Service offering" */
export interface AdminServiceOffering {
  _id: string;
  providerId: string;
  specialty: string;
  descriptionVi?: string;
  descriptionEn?: string;
  priceEstimate?: number;
  turnaroundDays?: number;
}

/** vi: "Chứng nhận nhà cung cấp" / en: "Provider certification" */
export interface AdminCertification {
  _id: string;
  providerId: string;
  nameVi: string;
  nameEn: string;
  issuingBody?: string;
  issuedAt?: number;
  expiresAt?: number;
  documentUrl?: string;
  createdAt: number;
  updatedAt: number;
}

/** vi: "Khu vực phủ sóng" / en: "Coverage area" */
export interface AdminCoverageArea {
  _id: string;
  providerId: string;
  region: string;
  district?: string;
  isActive: boolean;
}

/**
 * Full provider detail — returned by getProviderDetail query.
 * vi: "Chi tiết nhà cung cấp đầy đủ" / en: "Full provider detail"
 */
export interface AdminProviderDetail {
  _id: string;
  _creationTime: number;
  organizationId: string;
  nameVi: string;
  nameEn: string;
  companyName?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  status: ProviderStatus;
  verificationStatus: VerificationStatus;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  averageRating?: number;
  totalRatings?: number;
  completedServices?: number;
  createdAt: number;
  updatedAt: number;
  /** Enriched: linked organization */
  organization: {
    _id: string;
    name: string;
    slug: string;
    org_type: string;
  } | null;
  /** Enriched: all service offerings */
  serviceOfferings: AdminServiceOffering[];
  /** Enriched: all certifications */
  certifications: AdminCertification[];
  /** Enriched: active coverage areas */
  coverageAreas: AdminCoverageArea[];
}

// ---------------------------------------------------------------------------
// Performance metrics
// ---------------------------------------------------------------------------

/**
 * Provider performance metrics — returned by getProviderPerformance query.
 * vi: "Số liệu hiệu suất nhà cung cấp" / en: "Provider performance metrics"
 */
export interface ProviderPerformanceMetrics {
  providerId: string;
  totalServices: number;
  completedServices: number;
  /** 0.0 – 1.0 */
  completionRate: number;
  /** null if no ratings yet */
  averageRating: number | null;
  totalRatings: number;
  disputeCount: number;
  cachedAverageRating: number | null;
  cachedTotalRatings: number;
  cachedCompletedServices: number;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

/**
 * Filter state for the admin provider list.
 * vi: "Trạng thái bộ lọc" / en: "Filter state"
 */
export interface AdminProviderFilters {
  status?: ProviderStatus;
  verificationStatus?: VerificationStatus;
  search?: string;
}
