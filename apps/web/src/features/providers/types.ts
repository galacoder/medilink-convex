/**
 * TypeScript interfaces for the providers feature module.
 *
 * WHY: These types mirror the Convex schema (convex/schema.ts) but are
 * frontend-specific: they include joined/enriched fields returned by
 * Convex queries. Using explicit interfaces ensures stable types that
 * don't break if the Convex return shape changes slightly.
 */

// ---------------------------------------------------------------------------
// Literal union types (mirror Convex schema enums)
// ---------------------------------------------------------------------------

export type Specialty =
  | "general_repair"
  | "calibration"
  | "installation"
  | "preventive_maint"
  | "electrical"
  | "software"
  | "diagnostics"
  | "training"
  | "other";

// ---------------------------------------------------------------------------
// Core domain interfaces
// ---------------------------------------------------------------------------

/**
 * Service offering shape returned by listServiceOfferings.
 * vi: "Dịch vụ cung cấp" / en: "Service offering"
 */
export interface ServiceOffering {
  _id: string;
  _creationTime: number;
  providerId: string;
  specialty: Specialty;
  descriptionVi?: string;
  descriptionEn?: string;
  priceEstimate?: number;
  turnaroundDays?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Certification shape returned by getCertifications.
 * vi: "Chứng nhận" / en: "Certification"
 */
export interface Certification {
  _id: string;
  _creationTime: number;
  providerId: string;
  nameVi: string;
  nameEn: string;
  issuingBody?: string;
  /** epoch ms — when the certification was issued */
  issuedAt?: number;
  /** epoch ms — when the certification expires */
  expiresAt?: number;
  documentUrl?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Coverage area shape from coverageAreas table.
 * vi: "Khu vực phủ sóng" / en: "Coverage area"
 */
export interface CoverageArea {
  _id: string;
  _creationTime: number;
  providerId: string;
  region: string;
  district?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Provider profile shape returned by getProfile (with enriched org).
 * vi: "Hồ sơ nhà cung cấp" / en: "Provider profile"
 */
export interface ProviderProfile {
  _id: string;
  _creationTime: number;
  organizationId: string;
  companyName?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  verificationStatus: "pending" | "in_review" | "verified" | "rejected";
  createdAt: number;
  updatedAt: number;
  organization: {
    _id: string;
    name: string;
    slug: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Constant arrays with bilingual labels (for select/filter rendering)
// ---------------------------------------------------------------------------

/**
 * SPECIALTY_OPTIONS — array for select/dropdown rendering.
 * vi: "Tùy chọn chuyên ngành" / en: "Specialty options"
 */
export const SPECIALTY_OPTIONS: readonly {
  value: Specialty;
  labelVi: string;
  labelEn: string;
}[] = [
  {
    value: "general_repair",
    labelVi: "Sửa chữa tổng quát",
    labelEn: "General Repair",
  },
  {
    value: "calibration",
    labelVi: "Hiệu chỉnh",
    labelEn: "Calibration",
  },
  {
    value: "installation",
    labelVi: "Lắp đặt",
    labelEn: "Installation",
  },
  {
    value: "preventive_maint",
    labelVi: "Bảo trì phòng ngừa",
    labelEn: "Preventive Maintenance",
  },
  {
    value: "electrical",
    labelVi: "Điện",
    labelEn: "Electrical",
  },
  {
    value: "software",
    labelVi: "Phần mềm",
    labelEn: "Software",
  },
  {
    value: "diagnostics",
    labelVi: "Chẩn đoán",
    labelEn: "Diagnostics",
  },
  {
    value: "training",
    labelVi: "Đào tạo",
    labelEn: "Training",
  },
  {
    value: "other",
    labelVi: "Khác",
    labelEn: "Other",
  },
];

/**
 * SPECIALTY_LABELS — object lookup by specialty value.
 * vi: "Nhãn chuyên ngành" / en: "Specialty labels"
 */
export const SPECIALTY_LABELS: Record<Specialty, { vi: string; en: string }> =
  {
    general_repair: { vi: "Sửa chữa tổng quát", en: "General Repair" },
    calibration: { vi: "Hiệu chỉnh", en: "Calibration" },
    installation: { vi: "Lắp đặt", en: "Installation" },
    preventive_maint: {
      vi: "Bảo trì phòng ngừa",
      en: "Preventive Maintenance",
    },
    electrical: { vi: "Điện", en: "Electrical" },
    software: { vi: "Phần mềm", en: "Software" },
    diagnostics: { vi: "Chẩn đoán", en: "Diagnostics" },
    training: { vi: "Đào tạo", en: "Training" },
    other: { vi: "Khác", en: "Other" },
  };
