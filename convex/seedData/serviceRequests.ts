/**
 * Seed data constants for provider profile, service requests, quotes.
 * vi: "Dữ liệu mẫu cho nhà cung cấp, yêu cầu dịch vụ và báo giá"
 * en: "Seed data for provider profile, service requests, and quotes"
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1700000000000; // Fixed reference timestamp for reproducible seeds (~Nov 2023)

// ---------------------------------------------------------------------------
// Provider profile
// ---------------------------------------------------------------------------

export const TECHMED_PROFILE = {
  nameVi: "TechMed Dịch vụ Thiết bị Y tế",
  nameEn: "TechMed Medical Equipment Services",
  companyName: "Công ty TNHH TechMed Việt Nam",
  descriptionVi:
    "Chuyên cung cấp dịch vụ sửa chữa, bảo trì và hiệu chỉnh thiết bị y tế tại TP. Hồ Chí Minh và các tỉnh lân cận",
  descriptionEn:
    "Specialist in medical equipment repair, maintenance, and calibration services in Ho Chi Minh City and surrounding provinces",
  status: "active" as const,
  verificationStatus: "verified" as const,
  contactEmail: "service@techmed.vn",
  contactPhone: "+84-28-3456-7890",
  address: "123 Đường Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh",
  averageRating: 4.7,
  totalRatings: 38,
  completedServices: 124,
};

// ---------------------------------------------------------------------------
// Service offerings (3 total)
// ---------------------------------------------------------------------------

interface SeedOffering {
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
  descriptionVi: string;
  descriptionEn: string;
  priceEstimate: number;
  turnaroundDays: number;
}

export const ALL_SEED_OFFERINGS: SeedOffering[] = [
  {
    specialty: "general_repair",
    descriptionVi:
      "Sửa chữa các loại thiết bị y tế bao gồm chẩn đoán hình ảnh, thiết bị theo dõi và phẫu thuật",
    descriptionEn:
      "Repair of all types of medical equipment including imaging, monitoring, and surgical devices",
    priceEstimate: 2500000,
    turnaroundDays: 5,
  },
  {
    specialty: "calibration",
    descriptionVi:
      "Hiệu chỉnh và kiểm định thiết bị y tế theo tiêu chuẩn ISO và quy định của Bộ Y tế",
    descriptionEn:
      "Medical equipment calibration and certification per ISO standards and Ministry of Health regulations",
    priceEstimate: 1200000,
    turnaroundDays: 3,
  },
  {
    specialty: "preventive_maint",
    descriptionVi:
      "Bảo trì định kỳ thiết bị y tế theo lịch trình để đảm bảo hoạt động ổn định và kéo dài tuổi thọ",
    descriptionEn:
      "Scheduled preventive maintenance of medical equipment to ensure stable operation and extend lifespan",
    priceEstimate: 800000,
    turnaroundDays: 2,
  },
];

// ---------------------------------------------------------------------------
// Certifications (2 total — 1 valid, 1 expired for edge case coverage)
// ---------------------------------------------------------------------------

interface SeedCertification {
  nameVi: string;
  nameEn: string;
  issuingBody: string;
  issuedAt: number;
  expiresAt: number;
  documentUrl: string;
}

export const ALL_SEED_CERTIFICATIONS: SeedCertification[] = [
  {
    nameVi: "Chứng nhận ISO 13485:2016 — Hệ thống quản lý chất lượng thiết bị y tế",
    nameEn: "ISO 13485:2016 — Medical Devices Quality Management System",
    issuingBody: "Bureau Veritas Vietnam",
    issuedAt: NOW - 365 * ONE_DAY_MS,
    expiresAt: NOW + 2 * 365 * ONE_DAY_MS, // valid
    documentUrl: "https://storage.techmed.vn/certs/iso-13485-2016.pdf",
  },
  {
    nameVi: "Giấy phép sửa chữa thiết bị y tế — Bộ Y tế Việt Nam",
    nameEn: "Medical Equipment Repair License — Vietnam Ministry of Health",
    issuingBody: "Bộ Y tế Việt Nam / Vietnam Ministry of Health",
    issuedAt: NOW - 3 * 365 * ONE_DAY_MS,
    expiresAt: NOW - 30 * ONE_DAY_MS, // expired — for edge case coverage
    documentUrl: "https://storage.techmed.vn/certs/moh-repair-license.pdf",
  },
];

// ---------------------------------------------------------------------------
// Coverage areas (2 total)
// ---------------------------------------------------------------------------

interface SeedCoverageArea {
  region: string;
  district: string;
  isActive: boolean;
}

export const ALL_SEED_COVERAGE_AREAS: SeedCoverageArea[] = [
  {
    region: "TP. Hồ Chí Minh",
    district: "Quận 1, 3, 5, 10, Bình Thạnh, Thủ Đức",
    isActive: true,
  },
  {
    region: "Bình Dương",
    district: "Thủ Dầu Một, Dĩ An, Thuận An",
    isActive: true,
  },
];

// ---------------------------------------------------------------------------
// Service requests (6 — one per status variant)
// equipmentKey matches keys in equipmentKeyToIndex map in seed.ts
// requestedByKey matches keys in userKeyMap in seed.ts
// ---------------------------------------------------------------------------

interface SeedServiceRequest {
  equipmentKey: string;
  requestedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  hasProvider: boolean;
  type: "repair" | "maintenance" | "calibration" | "inspection" | "installation" | "other";
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
  descriptionEn: string;
  scheduledAt?: number;
  completedAt?: number;
}

export const ALL_SEED_SERVICE_REQUESTS: SeedServiceRequest[] = [
  // REQUEST_PENDING (index 0)
  {
    equipmentKey: "EQUIPMENT_ULTRASOUND",
    requestedByKey: "hospital_staff_1",
    hasProvider: false,
    type: "calibration",
    status: "pending",
    priority: "medium",
    descriptionVi: "Máy siêu âm cần hiệu chỉnh định kỳ — Hình ảnh có nhiễu nhẹ",
    descriptionEn: "Ultrasound machine requires periodic calibration — Slight image noise detected",
    scheduledAt: NOW + 7 * ONE_DAY_MS,
  },
  // REQUEST_QUOTED (index 1)
  {
    equipmentKey: "EQUIPMENT_ECG",
    requestedByKey: "hospital_owner",
    hasProvider: true,
    type: "repair",
    status: "quoted",
    priority: "high",
    descriptionVi: "Máy điện tim gặp lỗi kết nối — Chuyển đạo V3 không hoạt động",
    descriptionEn: "ECG machine connection error — Lead V3 not functioning",
    scheduledAt: NOW + 3 * ONE_DAY_MS,
  },
  // REQUEST_ACCEPTED (index 2)
  {
    equipmentKey: "EQUIPMENT_PULSE_OXIMETER",
    requestedByKey: "hospital_staff_2",
    hasProvider: true,
    type: "repair",
    status: "accepted",
    priority: "high",
    descriptionVi: "Máy đo SpO2 hiển thị giá trị không ổn định — Cần kiểm tra cảm biến",
    descriptionEn:
      "Pulse oximeter shows unstable readings — Sensor inspection required",
    scheduledAt: NOW + 2 * ONE_DAY_MS,
  },
  // REQUEST_IN_PROGRESS (index 3)
  {
    equipmentKey: "EQUIPMENT_PATIENT_MONITOR",
    requestedByKey: "hospital_owner",
    hasProvider: true,
    type: "repair",
    status: "in_progress",
    priority: "critical",
    descriptionVi:
      "Màn hình theo dõi ICU tắt đột ngột — Cần sửa chữa khẩn cấp",
    descriptionEn:
      "ICU patient monitor suddenly shutting down — Urgent repair needed",
    scheduledAt: NOW - ONE_DAY_MS,
  },
  // REQUEST_COMPLETED (index 4)
  {
    equipmentKey: "EQUIPMENT_DEFIBRILLATOR",
    requestedByKey: "hospital_owner",
    hasProvider: true,
    type: "maintenance",
    status: "completed",
    priority: "medium",
    descriptionVi: "Bảo trì định kỳ máy sốc điện tim — Kiểm tra pin và bộ sạc",
    descriptionEn:
      "Periodic maintenance of defibrillator — Battery and charger inspection",
    scheduledAt: NOW - 10 * ONE_DAY_MS,
    completedAt: NOW - 7 * ONE_DAY_MS,
  },
  // REQUEST_DISPUTED (index 5)
  {
    equipmentKey: "EQUIPMENT_PATIENT_MONITOR",
    requestedByKey: "hospital_owner",
    hasProvider: true,
    type: "repair",
    status: "disputed",
    priority: "critical",
    descriptionVi:
      "Tranh chấp chất lượng sửa chữa — Monitor vẫn bị lỗi sau khi sửa",
    descriptionEn:
      "Quality dispute — Patient monitor still malfunctions after repair",
    scheduledAt: NOW - 20 * ONE_DAY_MS,
    completedAt: NOW - 14 * ONE_DAY_MS,
  },
];

// ---------------------------------------------------------------------------
// Quotes (4 total — one per quote status variant)
// serviceRequestKey maps to requestKeyToIndex in seed.ts
// ---------------------------------------------------------------------------

interface SeedQuote {
  serviceRequestKey: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  amount: number;
  currency: string;
  validUntil: number;
  notes: string;
}

export const ALL_SEED_QUOTES: SeedQuote[] = [
  // For REQUEST_QUOTED — quote is pending hospital decision
  {
    serviceRequestKey: "REQUEST_QUOTED",
    status: "pending",
    amount: 1800000,
    currency: "VND",
    validUntil: NOW + 14 * ONE_DAY_MS,
    notes:
      "Báo giá bao gồm thay thế cáp kết nối chuyển đạo V3 và kiểm tra toàn bộ hệ thống / Quote includes V3 lead cable replacement and full system check",
  },
  // For REQUEST_ACCEPTED — quote accepted by hospital
  {
    serviceRequestKey: "REQUEST_ACCEPTED",
    status: "accepted",
    amount: 950000,
    currency: "VND",
    validUntil: NOW + 7 * ONE_DAY_MS,
    notes:
      "Kiểm tra và thay thế cảm biến SpO2 nếu cần thiết / Inspect and replace SpO2 sensor if necessary",
  },
  // For REQUEST_QUOTED — rejected alternative quote (edge case)
  {
    serviceRequestKey: "REQUEST_IN_PROGRESS",
    status: "rejected",
    amount: 5000000,
    currency: "VND",
    validUntil: NOW - 5 * ONE_DAY_MS,
    notes:
      "Báo giá ban đầu quá cao — Đã từ chối và đàm phán lại / Initial quote too high — Rejected and renegotiated",
  },
  // For REQUEST_COMPLETED — expired quote for history
  {
    serviceRequestKey: "REQUEST_COMPLETED",
    status: "expired",
    amount: 1200000,
    currency: "VND",
    validUntil: NOW - 20 * ONE_DAY_MS,
    notes:
      "Báo giá bảo trì định kỳ — Đã hết hạn sau khi hoàn thành dịch vụ / Periodic maintenance quote — Expired after service completion",
  },
];
