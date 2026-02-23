/**
 * Seed data: Provider profile, service offerings, certifications,
 *            coverage areas, service requests, and quotes
 * vi: "Dữ liệu mẫu: Nhà cung cấp và yêu cầu dịch vụ"
 * en: "Seed data: Providers and service requests"
 */

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

// ---------------------------------------------------------------------------
// Provider profile
// ---------------------------------------------------------------------------

export interface SeedProviderProfile {
  nameVi: string;
  nameEn: string;
  companyName?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  status: "active" | "inactive" | "suspended" | "pending_verification";
  verificationStatus: "pending" | "in_review" | "verified" | "rejected";
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  averageRating?: number;
  totalRatings?: number;
  completedServices?: number;
}

// vi: "Hồ sơ nhà cung cấp TechMed" / en: "TechMed provider profile"
export const TECHMED_PROFILE: SeedProviderProfile = {
  nameVi: "TechMed Dịch vụ Kỹ thuật Y tế",
  nameEn: "TechMed Medical Technical Services",
  companyName: "TechMed Services Co., Ltd.",
  descriptionVi:
    "Công ty chuyên cung cấp dịch vụ sửa chữa, bảo trì và hiệu chỉnh thiết bị y tế chuyên nghiệp tại TP. Hồ Chí Minh và các tỉnh lân cận",
  descriptionEn:
    "Professional medical equipment repair, maintenance, and calibration services in Ho Chi Minh City and surrounding provinces",
  status: "active",
  verificationStatus: "verified",
  contactEmail: "contact@techmed.vn",
  contactPhone: "+84-28-3456-7890",
  address: "123 Đường Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh",
  averageRating: 4.5,
  totalRatings: 28,
  completedServices: 45,
};

// ---------------------------------------------------------------------------
// Service offerings
// ---------------------------------------------------------------------------

export interface SeedServiceOffering {
  specialty:
    | "general_repair"
    | "calibration"
    | "installation"
    | "preventive_maint"
    | "electrical"
    | "software"
    | "diagnostics"
    | "training"
    | "other";
  descriptionVi?: string;
  descriptionEn?: string;
  priceEstimate?: number;
  turnaroundDays?: number;
}

// vi: "Dịch vụ 1: Sửa chữa chung" / en: "Offering 1: General repair"
export const OFFERING_GENERAL_REPAIR: SeedServiceOffering = {
  specialty: "general_repair",
  descriptionVi: "Sửa chữa tổng quát các loại thiết bị y tế điện tử và cơ khí",
  descriptionEn:
    "General repair of electronic and mechanical medical equipment",
  priceEstimate: 2500000, // VND
  turnaroundDays: 5,
};

// vi: "Dịch vụ 2: Hiệu chỉnh" / en: "Offering 2: Calibration"
export const OFFERING_CALIBRATION: SeedServiceOffering = {
  specialty: "calibration",
  descriptionVi:
    "Hiệu chỉnh và kiểm định thiết bị y tế theo tiêu chuẩn ISO 13485",
  descriptionEn:
    "Medical equipment calibration and verification per ISO 13485 standards",
  priceEstimate: 1800000, // VND
  turnaroundDays: 2,
};

// vi: "Dịch vụ 3: Bảo trì phòng ngừa" / en: "Offering 3: Preventive maintenance"
export const OFFERING_PREVENTIVE_MAINT: SeedServiceOffering = {
  specialty: "preventive_maint",
  descriptionVi: "Bảo trì định kỳ phòng ngừa sự cố theo lịch cho thiết bị y tế",
  descriptionEn:
    "Scheduled preventive maintenance to prevent equipment failures",
  priceEstimate: 1200000, // VND
  turnaroundDays: 1,
};

export const ALL_SEED_OFFERINGS: SeedServiceOffering[] = [
  OFFERING_GENERAL_REPAIR,
  OFFERING_CALIBRATION,
  OFFERING_PREVENTIVE_MAINT,
];

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

export interface SeedCertification {
  nameVi: string;
  nameEn: string;
  issuingBody?: string;
  issuedAt?: number;
  expiresAt?: number;
  documentUrl?: string;
}

// vi: "Chứng nhận 1: ISO 13485 (còn hiệu lực)" / en: "Cert 1: ISO 13485 (valid)"
export const CERT_ISO_13485: SeedCertification = {
  nameVi: "Chứng nhận ISO 13485 - Hệ thống quản lý chất lượng thiết bị y tế",
  nameEn: "ISO 13485 - Medical Device Quality Management System",
  issuingBody: "Bureau Veritas Vietnam",
  issuedAt: NOW - 6 * MONTH_MS,
  expiresAt: NOW + YEAR_MS, // Valid for 1 more year
  documentUrl: "https://docs.techmed.vn/certifications/iso-13485-2023.pdf",
};

// vi: "Chứng nhận 2: Hiệu chỉnh (Đã hết hạn)" / en: "Cert 2: Calibration (Expired)"
export const CERT_CALIBRATION_EXPIRED: SeedCertification = {
  nameVi: "Chứng nhận kỹ thuật hiệu chỉnh thiết bị y tế - Đã hết hạn",
  nameEn: "Medical Equipment Calibration Technical Certificate - Expired",
  issuingBody: "Viện Đo lường Việt Nam (VMI)",
  issuedAt: NOW - 18 * MONTH_MS,
  expiresAt: NOW - 6 * MONTH_MS, // Expired 6 months ago
  documentUrl:
    "https://docs.techmed.vn/certifications/calibration-vmi-2022.pdf",
};

export const ALL_SEED_CERTIFICATIONS: SeedCertification[] = [
  CERT_ISO_13485,
  CERT_CALIBRATION_EXPIRED,
];

// ---------------------------------------------------------------------------
// Coverage areas
// ---------------------------------------------------------------------------

export interface SeedCoverageArea {
  region: string;
  district?: string;
  isActive: boolean;
}

// vi: "Khu vực 1: TP. Hồ Chí Minh" / en: "Area 1: Ho Chi Minh City"
export const COVERAGE_HCMC: SeedCoverageArea = {
  region: "TP. Hồ Chí Minh",
  isActive: true,
};

// vi: "Khu vực 2: Bình Dương" / en: "Area 2: Binh Duong"
export const COVERAGE_BINH_DUONG: SeedCoverageArea = {
  region: "Bình Dương",
  isActive: true,
};

export const ALL_SEED_COVERAGE_AREAS: SeedCoverageArea[] = [
  COVERAGE_HCMC,
  COVERAGE_BINH_DUONG,
];

// ---------------------------------------------------------------------------
// Service requests (6 at different stages)
// ---------------------------------------------------------------------------

export interface SeedServiceRequest {
  // References by key names (resolved to IDs at insertion time)
  equipmentKey: string;
  requestedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  type:
    | "repair"
    | "maintenance"
    | "calibration"
    | "inspection"
    | "installation"
    | "other";
  status:
    | "pending"
    | "quoted"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "disputed";
  priority: "low" | "medium" | "high" | "critical";
  descriptionVi: string;
  descriptionEn?: string;
  scheduledAt?: number;
  completedAt?: number;
  hasProvider?: boolean; // Whether to assign the TechMed provider
}

// vi: "Yêu cầu 1: Đang chờ" / en: "Request 1: Pending"
export const REQUEST_PENDING: SeedServiceRequest = {
  equipmentKey: "EQUIPMENT_DEFIBRILLATOR",
  requestedByKey: "hospital_staff_1",
  type: "inspection",
  status: "pending",
  priority: "medium",
  descriptionVi: "Kiểm tra định kỳ máy sốc điện tim theo lịch bảo trì hàng quý",
  descriptionEn:
    "Routine inspection of defibrillator per quarterly maintenance schedule",
  scheduledAt: NOW + 2 * WEEK_MS,
};

// vi: "Yêu cầu 2: Đã báo giá" / en: "Request 2: Quoted"
export const REQUEST_QUOTED: SeedServiceRequest = {
  equipmentKey: "EQUIPMENT_XRAY",
  requestedByKey: "hospital_owner",
  type: "repair",
  status: "quoted",
  priority: "high",
  descriptionVi:
    "Sửa chữa máy X-quang gặp sự cố bộ nguồn, không khởi động được",
  descriptionEn:
    "Repair X-ray machine with power supply failure, unable to start",
  hasProvider: true,
};

// vi: "Yêu cầu 3: Đã chấp nhận" / en: "Request 3: Accepted"
export const REQUEST_ACCEPTED: SeedServiceRequest = {
  equipmentKey: "EQUIPMENT_AUTOCLAVE",
  requestedByKey: "hospital_staff_2",
  type: "maintenance",
  status: "accepted",
  priority: "medium",
  descriptionVi:
    "Bảo trì định kỳ nồi hấp tiệt trùng, kiểm tra van áp suất và nhiệt độ",
  descriptionEn:
    "Routine autoclave maintenance, inspect pressure valves and temperature sensors",
  scheduledAt: NOW + WEEK_MS,
  hasProvider: true,
};

// vi: "Yêu cầu 4: Đang thực hiện" / en: "Request 4: In progress"
export const REQUEST_IN_PROGRESS: SeedServiceRequest = {
  equipmentKey: "EQUIPMENT_ULTRASOUND",
  requestedByKey: "hospital_owner",
  type: "calibration",
  status: "in_progress",
  priority: "high",
  descriptionVi: "Hiệu chỉnh máy siêu âm sau 12 tháng sử dụng theo quy định",
  descriptionEn:
    "Calibration of ultrasound machine after 12 months of use per regulations",
  scheduledAt: NOW - 2 * DAY_MS,
  hasProvider: true,
};

// vi: "Yêu cầu 5: Hoàn thành" / en: "Request 5: Completed"
export const REQUEST_COMPLETED: SeedServiceRequest = {
  equipmentKey: "EQUIPMENT_ECG",
  requestedByKey: "hospital_staff_1",
  type: "repair",
  status: "completed",
  priority: "medium",
  descriptionVi: "Sửa chữa màn hình hiển thị máy ECG bị chập chờn",
  descriptionEn: "Repair flickering display screen on ECG machine",
  scheduledAt: NOW - 3 * WEEK_MS,
  completedAt: NOW - 2 * WEEK_MS,
  hasProvider: true,
};

// vi: "Yêu cầu 6: Đang tranh chấp" / en: "Request 6: Disputed"
export const REQUEST_DISPUTED: SeedServiceRequest = {
  equipmentKey: "EQUIPMENT_PATIENT_MONITOR",
  requestedByKey: "hospital_owner",
  type: "repair",
  status: "disputed",
  priority: "critical",
  descriptionVi:
    "Sửa chữa monitor theo dõi bệnh nhân - tranh chấp về chất lượng dịch vụ sau sửa chữa",
  descriptionEn:
    "Patient monitor repair - dispute over service quality after repair",
  scheduledAt: NOW - 6 * WEEK_MS,
  completedAt: NOW - 4 * WEEK_MS,
  hasProvider: true,
};

export const ALL_SEED_SERVICE_REQUESTS: SeedServiceRequest[] = [
  REQUEST_PENDING,
  REQUEST_QUOTED,
  REQUEST_ACCEPTED,
  REQUEST_IN_PROGRESS,
  REQUEST_COMPLETED,
  REQUEST_DISPUTED,
];

// ---------------------------------------------------------------------------
// Quotes (4: pending, accepted, rejected, expired)
// ---------------------------------------------------------------------------

export interface SeedQuote {
  /** Which service request this quote belongs to (by index in ALL_SEED_SERVICE_REQUESTS) */
  serviceRequestKey:
    | "REQUEST_PENDING"
    | "REQUEST_QUOTED"
    | "REQUEST_ACCEPTED"
    | "REQUEST_IN_PROGRESS"
    | "REQUEST_COMPLETED"
    | "REQUEST_DISPUTED";
  status: "pending" | "accepted" | "rejected" | "expired";
  amount: number;
  currency: string;
  validUntil?: number;
  notes?: string;
}

// vi: "Báo giá 1: Đang chờ" / en: "Quote 1: Pending"
export const QUOTE_PENDING: SeedQuote = {
  serviceRequestKey: "REQUEST_PENDING",
  status: "pending",
  amount: 1500000, // 1.5M VND
  currency: "VND",
  validUntil: NOW + 2 * WEEK_MS,
  notes:
    "Bao gồm linh kiện thay thế nếu cần / Includes replacement parts if needed",
};

// vi: "Báo giá 2: Đã chấp nhận" / en: "Quote 2: Accepted"
export const QUOTE_ACCEPTED: SeedQuote = {
  serviceRequestKey: "REQUEST_IN_PROGRESS",
  status: "accepted",
  amount: 3200000, // 3.2M VND
  currency: "VND",
  validUntil: NOW + MONTH_MS,
  notes:
    "Giá đã bao gồm nhân công và hiệu chỉnh / Price includes labor and calibration",
};

// vi: "Báo giá 3: Đã từ chối" / en: "Quote 3: Rejected"
export const QUOTE_REJECTED: SeedQuote = {
  serviceRequestKey: "REQUEST_QUOTED",
  status: "rejected",
  amount: 8500000, // 8.5M VND (too expensive, rejected)
  currency: "VND",
  validUntil: NOW + WEEK_MS,
  notes: "Giá quá cao so với ngân sách / Price exceeds budget",
};

// vi: "Báo giá 4: Đã hết hạn" / en: "Quote 4: Expired"
export const QUOTE_EXPIRED: SeedQuote = {
  serviceRequestKey: "REQUEST_DISPUTED",
  status: "expired",
  amount: 4200000, // 4.2M VND
  currency: "VND",
  validUntil: NOW - MONTH_MS, // Expired 1 month ago
  notes:
    "Báo giá đã hết hạn, cần thương lượng lại / Quote expired, renegotiation required",
};

export const ALL_SEED_QUOTES: SeedQuote[] = [
  QUOTE_PENDING,
  QUOTE_ACCEPTED,
  QUOTE_REJECTED,
  QUOTE_EXPIRED,
];
